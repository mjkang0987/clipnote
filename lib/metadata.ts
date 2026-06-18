// URL 메타데이터 추출 (plan.md §8 — 단계별 폴백)
// 0) 사이트별 어댑터(예: 네이버 카페) → 1) OG 태그 → 2) HTML <title>/<meta> → (수동은 상위 레이어)

import { fetchNaverCafeMetadata, parseNaverCafe } from "./adapters/naver-cafe";
import { fetchInstagramMetadata, parseInstagram } from "./adapters/instagram";

export type ClipMetadata = {
  url: string; // 정규화된 최종 URL
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  /** 메타 출처: adapter(사이트 전용) | og | html | none */
  source: "adapter" | "og" | "html" | "none";
  /** 본문/메타를 못 가져온 경우 사유(사용자 안내용) */
  reason?: string;
};

const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 512 * 1024; // 512KB 까지만 파싱

/** 사용자가 스킴 없이 입력해도 https 로 보정. */
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export async function fetchMetadata(rawUrl: string): Promise<ClipMetadata> {
  let url: string;
  try {
    url = new URL(normalizeUrl(rawUrl)).toString();
  } catch {
    return blank(rawUrl, "올바른 URL 형식이 아니에요.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  // 0) 사이트별 어댑터 우선 (네이버 카페, 인스타그램 등). 성공 시 바로 반환.
  try {
    const u = new URL(url);

    const cafe = parseNaverCafe(u);
    if (cafe) {
      const adapted = await fetchNaverCafeMetadata(url, cafe, controller.signal);
      if (adapted?.title) {
        clearTimeout(timer);
        return adapted;
      }
    }

    const ig = parseInstagram(u);
    if (ig) {
      const adapted = await fetchInstagramMetadata(
        url,
        ig.shortcode,
        controller.signal,
      );
      if (adapted?.title) {
        clearTimeout(timer);
        return adapted;
      }
    }
  } catch {
    // 어댑터 실패는 무시하고 일반 경로로 폴백
  }

  let html = "";
  let finalUrl = url;
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        // 일반 브라우저처럼 요청해 실제 HTML 을 받도록
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      },
    });
    finalUrl = res.url || url;

    const contentType = res.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml|application\/xml/i.test(contentType)) {
      return blank(finalUrl, "HTML 페이지가 아니라 내용을 읽을 수 없어요.");
    }

    html = await readCapped(res, MAX_HTML_BYTES);
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return blank(
      finalUrl,
      aborted ? "페이지 응답이 너무 느려 시간이 초과됐어요." : "페이지에 접근하지 못했어요.",
    );
  } finally {
    clearTimeout(timer);
  }

  return parseHtml(finalUrl, html);
}

/** 응답 본문을 최대 maxBytes 까지만 읽어 문자열로. */
async function readCapped(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return await res.text();
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.length;
      if (received >= maxBytes) {
        await reader.cancel();
        break;
      }
    }
  }
  const merged = new Uint8Array(received);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c.subarray(0, Math.min(c.length, maxBytes - offset)), offset);
    offset += c.length;
    if (offset >= maxBytes) break;
  }
  return new TextDecoder("utf-8").decode(merged);
}

function parseHtml(url: string, html: string): ClipMetadata {
  const metas = extractMetaTags(html);

  const og = (key: string) => metas.get(`og:${key}`) ?? null;
  const tw = (key: string) => metas.get(`twitter:${key}`) ?? null;
  const named = (key: string) => metas.get(key) ?? null;

  const ogTitle = og("title");
  const ogDesc = og("description");
  const ogImage = absolutize(url, og("image") ?? tw("image"));
  const siteName = og("site_name");

  if (ogTitle || ogDesc || ogImage) {
    return {
      url,
      title: ogTitle ?? extractTitle(html),
      description: ogDesc ?? tw("description") ?? named("description"),
      image: ogImage,
      siteName,
      source: "og",
    };
  }

  // OG 가 없으면 HTML 기본값
  const htmlTitle = extractTitle(html);
  const htmlDesc = named("description") ?? tw("description");
  if (htmlTitle || htmlDesc) {
    return {
      url,
      title: htmlTitle,
      description: htmlDesc,
      image: absolutize(url, tw("image")),
      siteName,
      source: "html",
    };
  }

  return blank(
    url,
    "이 페이지는 제목·설명을 자동으로 읽을 수 없어요(로그인이 필요하거나 자바스크립트로 그려지는 페이지). 제목을 직접 입력해 주세요.",
  );
}

/** <meta property|name=... content=...> 를 모두 추출해 key→content 맵으로. */
function extractMetaTags(html: string): Map<string, string> {
  const head = html.slice(0, MAX_HTML_BYTES);
  const map = new Map<string, string>();
  const metaRe = /<meta\b[^>]*>/gi;
  const matches = head.match(metaRe) ?? [];
  for (const tag of matches) {
    const key =
      attr(tag, "property") ?? attr(tag, "name") ?? attr(tag, "itemprop");
    const content = attr(tag, "content");
    if (key && content != null && !map.has(key.toLowerCase())) {
      map.set(key.toLowerCase(), decodeEntities(content).trim());
    }
  }
  return map;
}

function attr(tag: string, name: string): string | null {
  const re = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s">]+))`, "i");
  const m = tag.match(re);
  if (!m) return null;
  return m[2] ?? m[3] ?? m[4] ?? "";
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  const t = decodeEntities(m[1]).replace(/\s+/g, " ").trim();
  return t || null;
}

/** 상대 경로 이미지 URL 을 절대 경로로. */
function absolutize(base: string, maybe: string | null): string | null {
  if (!maybe) return null;
  try {
    return new URL(maybe, base).toString();
  } catch {
    return maybe;
  }
}

function decodeEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&#x27;/gi, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, d) => safeFromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeFromCodePoint(parseInt(h, 16)));
}

function safeFromCodePoint(code: number): string {
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}

function blank(url: string, reason: string): ClipMetadata {
  return {
    url,
    title: null,
    description: null,
    image: null,
    siteName: null,
    source: "none",
    reason,
  };
}
