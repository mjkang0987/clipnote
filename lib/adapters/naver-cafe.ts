// 네이버 카페 어댑터
// 카페 게시글은 og:title 에 "카페 이름"만 들어가서 일반 파싱으로는 게시글 제목을
// 못 가져온다. 네이버 카페 내부 article API 를 호출해 subject(제목)를 추출한다.
//
// ⚠️ 비공식 API라 네이버 변경 시 깨질 수 있고, 멤버 전용 글은 로그인 없이는 실패한다.
//    실패하면 null 을 반환해 상위(fetchMetadata)에서 일반 OG/수동 입력으로 폴백한다.

import type { ClipMetadata } from "../metadata";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export type NaverCafeIds = { cafeId: string; articleId: string };

/** cafe.naver.com 게시글 URL 에서 cafeId / articleId 추출. 해당 없으면 null. */
export function parseNaverCafe(u: URL): NaverCafeIds | null {
  if (!/(^|\.)cafe\.naver\.com$/i.test(u.hostname)) return null;

  // 신형 SPA: /f-e/cafes/{cafeId}/articles/{articleId}  또는  /cafes/{cafeId}/articles/{articleId}
  const path = u.pathname.match(/\/cafes\/(\d+)\/articles\/(\d+)/);
  if (path) return { cafeId: path[1], articleId: path[2] };

  // 구형: ArticleRead.nhn?clubid={cafeId}&articleid={articleId}
  const clubid = u.searchParams.get("clubid");
  const articleid = u.searchParams.get("articleid");
  if (clubid && articleid) return { cafeId: clubid, articleId: articleid };

  return null;
}

/** 네이버 카페 게시글 메타데이터 조회. 실패 시 null. */
export async function fetchNaverCafeMetadata(
  url: string,
  ids: NaverCafeIds,
  signal: AbortSignal,
): Promise<ClipMetadata | null> {
  const api =
    `https://apis.naver.com/cafe-web/cafe-articleapi/v2.1/cafes/${ids.cafeId}` +
    `/articles/${ids.articleId}?query=&useCafeId=true&requestFrom=A`;

  let json: unknown;
  try {
    const res = await fetch(api, {
      signal,
      headers: {
        "User-Agent": UA,
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "ko-KR,ko;q=0.9",
        Referer: "https://cafe.naver.com/",
      },
    });
    if (!res.ok) return null;
    json = await res.json();
  } catch {
    return null;
  }

  // 응답 구조가 버전에 따라 달라질 수 있어, 키 이름으로 깊이 탐색해 견고하게 추출.
  const subject = deepFindString(json, ["subject"]);
  if (!subject) return null; // 멤버 전용/비공개/구조 변경 → 폴백

  const contentHtml =
    deepFindString(json, ["contentHtml", "content"]) ?? null;
  const description = contentHtml ? summarize(stripTags(contentHtml)) : null;
  const image = firstImage(contentHtml);
  const cafeName =
    deepFindString(json, ["cafeName", "pcCafeName", "cafeUrl"]) ?? "네이버 카페";

  return {
    url,
    title: decodeEntities(subject).trim(),
    description,
    image,
    siteName: cafeName,
    source: "adapter",
  };
}

/* ── helpers ─────────────────────────────────────────────────────── */

/** 객체 트리에서 주어진 키 중 첫 번째로 발견되는 문자열 값을 반환. */
function deepFindString(node: unknown, keys: string[], depth = 0): string | null {
  if (node == null || depth > 6) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = deepFindString(item, keys, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    for (const key of keys) {
      const v = obj[key];
      if (typeof v === "string" && v.trim()) return v;
    }
    for (const v of Object.values(obj)) {
      const found = deepFindString(v, keys, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function stripTags(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function summarize(text: string, max = 160): string | null {
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function firstImage(html: string | null): string | null {
  if (!html) return null;
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function decodeEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&#x27;/gi, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, d) => safeCp(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeCp(parseInt(h, 16)));
}

function safeCp(code: number): string {
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}
