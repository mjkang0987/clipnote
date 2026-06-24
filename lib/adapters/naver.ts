// 네이버 공통 어댑터
//  1) naver.me 단축 링크 해제(리다이렉트 Location 추적) — 실제 목적지를 알아야
//     카페/블로그/지도 등 알맞은 처리로 넘길 수 있다.
//  2) 네이버 블로그: 게시글 본문이 iframe(m.blog PostView)으로 그려져 바깥 HTML 만으로는
//     제목을 못 얻는다. PostView URL 을 직접 받아 OG 를 파싱한다.
//
// ⚠️ 비공식 경로라 네이버 변경 시 깨질 수 있고, 비공개/멤버 전용은 실패한다.
//    실패하면 null 을 반환해 상위(fetchMetadata)의 일반 경로(크롤러 UA·script 동봉
//    데이터 파싱)로 폴백한다.

import type { ClipMetadata } from "../metadata";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/* ── 1) naver.me 단축 링크 해제 ──────────────────────────────────── */

export function isNaverShortLink(u: URL): boolean {
  return /^naver\.me$/i.test(u.hostname);
}

/**
 * naver.me 단축 URL 의 최종 목적지를 반환. 리다이렉트가 아니거나 실패 시 null.
 * 본문을 받지 않도록 redirect:"manual" 로 Location 만 따라간다(최대 5회).
 */
export async function resolveNaverShortLink(
  url: string,
  signal: AbortSignal,
): Promise<string | null> {
  let current = url;
  for (let i = 0; i < 5; i++) {
    let res: Response;
    try {
      res = await fetch(current, {
        signal,
        redirect: "manual",
        headers: { "User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9" },
      });
    } catch {
      return null;
    }
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      current = new URL(loc, current).toString();
      // 또 다른 단축 링크면 계속, 아니면 그게 최종 목적지.
      if (!isNaverShortLink(new URL(current))) return current;
      continue;
    }
    break; // 더 이상 리다이렉트 아님
  }
  return current !== url ? current : null;
}

/* ── 2) 네이버 블로그 ────────────────────────────────────────────── */

export type NaverBlogIds = { blogId: string; logNo: string };

/** blog.naver.com / m.blog.naver.com 게시글 URL 에서 blogId/logNo 추출. 해당 없으면 null. */
export function parseNaverBlog(u: URL): NaverBlogIds | null {
  if (!/(^|\.)blog\.naver\.com$/i.test(u.hostname)) return null;

  // PostView.naver?blogId=...&logNo=...
  const qBlogId = u.searchParams.get("blogId");
  const qLogNo = u.searchParams.get("logNo");
  if (qBlogId && qLogNo) return { blogId: qBlogId, logNo: qLogNo };

  // /{blogId}/{logNo}
  const m = u.pathname.match(/^\/([^/]+)\/(\d+)\/?$/);
  if (m && !m[1].endsWith(".naver")) return { blogId: m[1], logNo: m[2] };

  return null;
}

/** 네이버 블로그 게시글 메타데이터 조회. 실패 시 null. */
export async function fetchNaverBlogMetadata(
  url: string,
  ids: NaverBlogIds,
  signal: AbortSignal,
): Promise<ClipMetadata | null> {
  // 모바일 PostView 는 본문 기준 OG(제목·썸네일)를 서버에서 그려 내려준다.
  const target = `https://m.blog.naver.com/PostView.naver?blogId=${encodeURIComponent(ids.blogId)}&logNo=${encodeURIComponent(ids.logNo)}`;

  let html = "";
  try {
    const res = await fetch(target, {
      signal,
      redirect: "follow",
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9",
        Referer: "https://m.blog.naver.com/",
      },
    });
    if (!res.ok) return null;
    html = await res.text();
  } catch {
    return null;
  }

  const ogTitle = metaContent(html, "og:title");
  const ogDesc = metaContent(html, "og:description");
  const ogImage = metaContent(html, "og:image");

  // og 가 전혀 없으면 비공개/구조 변경 → 폴백
  if (!ogTitle && !ogDesc && !ogImage) return null;

  return {
    url, // 사용자가 입력한 원본(또는 해제된) URL 유지
    title: cleanTitle(ogTitle) ?? "네이버 블로그",
    description: ogDesc ?? null,
    image: ogImage ?? null,
    siteName: "네이버 블로그",
    source: "adapter",
  };
}

/* ── helpers ─────────────────────────────────────────────────────── */

/** property=key 또는 name=key 메타의 content 추출(속성 순서 무관). */
function metaContent(html: string, key: string): string | null {
  const head = html.slice(0, 512 * 1024);
  const tags = head.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const prop = (attr(tag, "property") ?? attr(tag, "name"))?.toLowerCase();
    if (prop === key) {
      const content = attr(tag, "content");
      if (content) return decodeEntities(content).trim();
    }
  }
  return null;
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s">]+))`, "i"),
  );
  return m ? (m[2] ?? m[3] ?? m[4] ?? "") : null;
}

/** 블로그 og:title 은 보통 "글제목 : 네이버 블로그" 형태 — 접미사 정리. */
function cleanTitle(raw: string | null): string | null {
  if (!raw) return null;
  const t = raw.replace(/\s*:\s*네이버 블로그\s*$/i, "").trim();
  return t || null;
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
