// 인스타그램 어댑터 (best-effort)
//
// 인스타는 일반 브라우저 요청에 로그인 벽을 주지만, "크롤러 UA"(카톡/페북이 미리보기를
// 만들 때 쓰는 방식)로 요청하면 공개 게시물의 og 태그(캡션·썸네일)를 내주는 경우가 있다.
//
// ⚠️ 한계: 인스타가 수시로 막아서 불안정하고, 비공개/멤버 한정은 불가능하다.
//    확실한 공식 경로는 Meta oEmbed/Graph API(앱+토큰)다. 실패 시 null → 일반/수동 폴백.

import type { ClipMetadata } from "../metadata";

// 페이스북 크롤러 UA — Meta 자사 서비스라 인스타가 og 를 잘 내주는 편.
const CRAWLER_UA =
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

/** instagram.com/(reel|p|tv|reels)/{shortcode} 에서 shortcode 추출. 해당 없으면 null. */
export function parseInstagram(u: URL): { shortcode: string } | null {
  if (!/(^|\.)instagram\.com$/i.test(u.hostname)) return null;
  const m = u.pathname.match(/\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/);
  return m ? { shortcode: m[1] } : null;
}

export async function fetchInstagramMetadata(
  url: string,
  shortcode: string,
  signal: AbortSignal,
): Promise<ClipMetadata | null> {
  // 캐노니컬 URL 로 요청(쿼리 제거 — 추적 파라미터가 응답을 흐릴 수 있음)
  const canonical = `https://www.instagram.com/reel/${shortcode}/`;

  let html = "";
  try {
    const res = await fetch(canonical, {
      signal,
      redirect: "follow",
      headers: {
        "User-Agent": CRAWLER_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
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

  // og 가 전혀 없으면 로그인 벽으로 판단 → 폴백
  if (!ogTitle && !ogDesc && !ogImage) return null;

  return {
    url,
    title: cleanTitle(ogTitle) ?? "인스타그램 릴",
    description: ogDesc ?? null,
    image: ogImage ?? null,
    siteName: "Instagram",
    source: "adapter",
  };
}

/* ── helpers ─────────────────────────────────────────────────────── */

/** property=og:* 또는 name=og:* 메타의 content 추출(속성 순서 무관). */
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

/** 인스타 og:title 은 보통 캡션이 그대로 들어옴. 과한 접미사만 정리. */
function cleanTitle(raw: string | null): string | null {
  if (!raw) return null;
  const t = raw.replace(/\s*•\s*Instagram.*$/i, "").trim();
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
