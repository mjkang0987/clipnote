// URL 메타데이터 추출 (plan.md §8 — 단계별 폴백)
// 0) 단축 링크 해제(naver.me) → 1) 사이트별 어댑터(네이버 카페·블로그, 인스타) →
// 2) OG 태그 → 3) script 동봉 데이터(JSON-LD/앱 상태) → 4) HTML <title>/<meta> →
// (메타가 없으면 같은 사이트 본문 iframe 1회 추적, 크롤러 UA 로 1회 재시도,
//  그래도 안 되면 수동 입력은 상위 레이어)

import { fetchNaverCafeMetadata, parseNaverCafe } from "./adapters/naver-cafe";
import {
  fetchInstagramMetadata,
  isInstagramStory,
  parseInstagram,
} from "./adapters/instagram";
import {
  fetchNaverBlogMetadata,
  isNaverShortLink,
  parseNaverBlog,
  resolveNaverShortLink,
} from "./adapters/naver";

export type ClipMetadata = {
  url: string; // 정규화된 최종 URL
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  /** 메타 출처: adapter(사이트 전용) | og | embedded(스크립트 동봉 데이터) | html | none */
  source: "adapter" | "og" | "embedded" | "html" | "none";
  /** 본문/메타를 못 가져온 경우 사유(사용자 안내용) */
  reason?: string;
};

const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 512 * 1024; // 512KB 까지만 파싱

// 일반 브라우저 UA — 평소엔 이걸로 실제 HTML 을 받는다.
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
// 공유 미리보기 크롤러 UA — 다수 사이트(네이버 공유 링크 등)가 이 UA 에는
// 서버에서 OG 를 미리 그려 내려준다. 일반 UA 로 메타를 못 얻었을 때만 재시도.
const CRAWLER_UA =
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

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

  // 0) naver.me 단축 링크는 먼저 실제 목적지로 해제해야 알맞은 어댑터(카페/블로그 등)가 매칭된다.
  url = await resolveShortLinks(url);

  // 인스타그램 스토리는 로그인 필요 + 24h 휘발성이라 서버 추출이 원천 불가 →
  // 헛된 요청 대신 명확한 안내를 준다.
  try {
    if (isInstagramStory(new URL(url))) {
      return blank(
        url,
        "인스타그램 스토리는 로그인이 필요하고 24시간 뒤 사라져서 미리보기를 만들 수 없어요. 제목을 직접 입력해 주세요.",
      );
    }
  } catch {
    // URL 파싱 실패는 무시하고 일반 흐름으로
  }

  // 1) 사이트별 어댑터 우선 (네이버 카페·블로그, 인스타그램 등). 성공 시 바로 반환.
  const adapted = await tryAdapters(url);
  if (adapted) return adapted;

  // 1) 일반 브라우저 UA 로 받아 파싱.
  let result = await fetchAndParse(url, BROWSER_UA);

  // 2) 메타를 못 얻으면(로그인 벽/JS 로 그리는 페이지 추정) 크롤러 UA 로 한 번 더.
  //    공유 미리보기용 OG 를 서버에서 내려주는 사이트를 노리는 폴백.
  if (result.source === "none") {
    const crawled = await fetchAndParse(url, CRAWLER_UA);
    if (crawled.source !== "none") result = crawled;
  }

  return result;
}

/** 알려진 단축 링크(naver.me 등)를 실제 목적지로 해제. 실패하면 원본 URL 유지. */
async function resolveShortLinks(url: string): Promise<string> {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url;
  }
  if (!isNaverShortLink(u)) return url;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const resolved = await resolveNaverShortLink(url, controller.signal);
    return resolved ?? url;
  } catch {
    return url;
  } finally {
    clearTimeout(timer);
  }
}

/** 카페 글 제목을 못 얻었을 때 나오는 일반 stub 제목인지("네이버 카페" 등). */
function isGenericCafeTitle(title: string): boolean {
  return /^\s*(네이버\s*카페|naver\s*cafe)\s*$/i.test(title);
}

/** 사이트별 어댑터 시도. 매칭/성공 시 메타 반환, 아니면 null(일반 경로로 폴백). */
async function tryAdapters(url: string): Promise<ClipMetadata | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const u = new URL(url);

    const cafe = parseNaverCafe(u);
    if (cafe) {
      const adapted = await fetchNaverCafeMetadata(url, cafe, controller.signal);
      if (adapted?.title) return adapted;
    }
    // 카페 호스트면(별칭 URL·API 차단 포함) 크롤러 UA 로 공개글 OG 를 시도한다.
    // 네이버는 크롤러에게 공개글의 실제 제목 OG 를 내려주는데, 모바일(m.cafe)·앱 공유
    // URL 은 generic stub("네이버 카페")만 주는 경우가 많다. 그래서 m.cafe 는 같은
    // 경로의 데스크톱 cafe.naver.com 으로 바꿔서 받는다(이쪽이 실제 제목 OG 를 준다).
    if (/(^|\.)cafe\.naver\.com$/i.test(u.hostname)) {
      const ogUrl = /^m\.cafe\.naver\.com$/i.test(u.hostname)
        ? `https://cafe.naver.com${u.pathname}?tc=shared_link`
        : url;
      const og = await fetchAndParse(ogUrl, CRAWLER_UA);
      // 저장 대상 URL 은 사용자가 연 원래 링크를 유지.
      if (og.title && !isGenericCafeTitle(og.title)) return { ...og, url };
    }

    const blog = parseNaverBlog(u);
    if (blog) {
      const adapted = await fetchNaverBlogMetadata(url, blog, controller.signal);
      if (adapted?.title) return adapted;
    }

    const ig = parseInstagram(u);
    if (ig) {
      const adapted = await fetchInstagramMetadata(
        url,
        ig.shortcode,
        controller.signal,
      );
      if (adapted?.title) return adapted;
    }
  } catch {
    // 어댑터 실패는 무시하고 일반 경로로 폴백
  } finally {
    clearTimeout(timer);
  }
  return null;
}

/** 주어진 UA 로 URL 을 받아 HTML 을 파싱. 실패 시 blank(throw 안 함).
 *  allowIframe: 메타를 못 얻었을 때 본문 iframe(같은 사이트)을 1회 따라간다. */
async function fetchAndParse(
  url: string,
  ua: string,
  allowIframe = true,
): Promise<ClipMetadata> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let finalUrl = url;
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": ua,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      },
    });
    finalUrl = res.url || url;

    const contentType = res.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml|application\/xml/i.test(contentType)) {
      return blank(finalUrl, "HTML 페이지가 아니라 내용을 읽을 수 없어요.");
    }

    const bytes = await readCapped(res, MAX_HTML_BYTES);
    const html = decodeHtml(bytes, charsetFromContentType(contentType));
    const result = parseHtml(finalUrl, html);
    if (result.source !== "none") return result;

    // 메타가 전혀 없으면, 본문을 iframe 으로 그리는 페이지(네이버 블로그류)일 수 있다.
    // 같은 사이트의 콘텐츠 프레임을 한 번만 따라가 본다(광고/외부 임베드는 제외).
    if (allowIframe) {
      const frame = findContentIframe(html, finalUrl);
      if (frame && frame !== finalUrl) {
        const inner = await fetchAndParse(frame, ua, false);
        if (inner.source !== "none") {
          // 저장 대상은 사용자가 연 바깥 페이지이므로 URL 은 바깥 것을 유지.
          return { ...inner, url: finalUrl };
        }
      }
    }
    return result;
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return blank(
      finalUrl,
      aborted ? "페이지 응답이 너무 느려 시간이 초과됐어요." : "페이지에 접근하지 못했어요.",
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 본문이 들어있을 법한 iframe 의 절대 URL 을 고른다. 없으면 null.
 * - 외부 광고/소셜 임베드 회피를 위해 같은 사이트(동일 등록 도메인)만 후보.
 * - id/name/class 에 main·content·post 등이 있으면 우선.
 */
function findContentIframe(html: string, baseUrl: string): string | null {
  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    return null;
  }

  const head = html.slice(0, MAX_HTML_BYTES);
  const tags = head.match(/<iframe\b[^>]*>/gi) ?? [];
  const candidates: { url: string; score: number }[] = [];
  for (const tag of tags) {
    const src = attr(tag, "src");
    if (!src) continue;
    let abs: URL;
    try {
      abs = new URL(src, base);
    } catch {
      continue;
    }
    if (abs.protocol !== "http:" && abs.protocol !== "https:") continue;
    if (!sameSite(abs.hostname, base.hostname)) continue;

    const hint =
      `${attr(tag, "id") ?? ""} ${attr(tag, "name") ?? ""} ${attr(tag, "class") ?? ""}`.toLowerCase();
    const score = /main|content|post|view|article|board|body/.test(hint) ? 2 : 1;
    candidates.push({ url: abs.toString(), score });
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].url;
}

/** 두 호스트가 같은 사이트(동일 등록 도메인, 단순 휴리스틱)인지. */
function sameSite(a: string, b: string): boolean {
  if (a === b) return true;
  const reg = (h: string) => h.split(".").slice(-2).join(".");
  return reg(a) === reg(b);
}

/** 응답 본문을 최대 maxBytes 까지만 읽어 원시 바이트로. (디코딩은 charset 판별 후 별도) */
async function readCapped(res: Response, maxBytes: number): Promise<Uint8Array> {
  if (!res.body) return new Uint8Array(await res.arrayBuffer());
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
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
  return merged;
}

/** Content-Type 헤더의 charset 값. 없으면 null. */
function charsetFromContentType(contentType: string | null): string | null {
  if (!contentType) return null;
  const m = contentType.match(/charset=["']?\s*([\w-]+)/i);
  return m ? m[1] : null;
}

/**
 * HTML 바이트를 올바른 charset 으로 디코드.
 *
 * 핵심: 선언(meta/헤더)을 맹신하지 않는다. 네이버 일부 엔드포인트는 헤더/메타에
 * `euc-kr` 이라 적고 실제로는 UTF-8 본문을 내려준다. 선언을 믿으면 한글이 깨지므로,
 * 먼저 "실제 바이트가 UTF-8 로 깨끗이 읽히는지"를 본다.
 *
 * 1) UTF-8 로 디코딩해 대체문자(U+FFFD) 비율이 매우 낮으면 → UTF-8 확정.
 *    (정상 UTF-8 페이지. 잘못된 바이트 몇 개가 섞여 있어도 비율이 낮아 안전.)
 * 2) UTF-8 로 심하게 깨지면(=실제로 다른 인코딩) → 선언된 charset → euc-kr 순으로
 *    시도하고, UTF-8 보다 덜 깨지는 것을 채택.
 */
function decodeHtml(bytes: Uint8Array, headerCharset: string | null): string {
  const utf8 = tryDecode(bytes, "utf-8") ?? "";
  const utf8Bad = countReplacement(utf8);
  if (utf8Bad / Math.max(utf8.length, 1) < 0.005) return utf8;

  const declared = (sniffMetaCharset(bytes) ?? headerCharset)?.toLowerCase();
  for (const label of [declared, "euc-kr"]) {
    if (!label || label === "utf-8") continue;
    const text = tryDecode(bytes, label);
    if (text != null && countReplacement(text) < utf8Bad) return text;
  }
  return utf8;
}

/** 문서 앞부분의 <meta charset>/<meta ... content="...charset=..."> 선언을 찾는다. */
function sniffMetaCharset(bytes: Uint8Array): string | null {
  // 메타 선언은 ASCII 범위라 latin1 로 앞부분만 훑어도 안전하게 잡힌다.
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 4096));
  const m =
    head.match(/<meta[^>]+charset=["']?\s*([\w-]+)/i) ??
    head.match(/charset=["']?\s*([\w-]+)/i);
  return m ? m[1] : null;
}

function tryDecode(bytes: Uint8Array, label: string): string | null {
  try {
    return new TextDecoder(label).decode(bytes);
  } catch {
    return null;
  }
}

/** 디코딩 실패 시 나타나는 대체문자(U+FFFD) 개수 — 인코딩 오선택 판별용. */
function countReplacement(text: string): number {
  let n = 0;
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 0xfffd) n++;
  }
  return n;
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

  // OG 가 없으면: 초기 HTML 에 스크립트로 동봉된 구조화 데이터에서 시도.
  // SPA 가 메타 태그를 JS 로 늦게 그리더라도, 원본 데이터는 보통 <script>(JSON-LD /
  // __NEXT_DATA__ / __APOLLO_STATE__ 등) 안에 들어 있어 헤드리스 없이 읽을 수 있다.
  const embedded = parseEmbeddedData(html);
  if (embedded && (embedded.title || embedded.description)) {
    return {
      url,
      title: embedded.title ?? extractTitle(html),
      description: embedded.description,
      image: absolutize(url, embedded.image),
      siteName: siteName ?? embedded.siteName,
      source: "embedded",
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

type EmbeddedMeta = {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

/**
 * 초기 HTML 의 <script> 에 동봉된 구조화 데이터에서 메타를 추출.
 *  1) JSON-LD / Next.js  : <script type="application/(ld+)?json"> 본문 파싱
 *  2) 인라인 앱 상태       : window.__APOLLO_STATE__ / __NUXT__ 등 객체 리터럴 파싱
 * 어느 쪽도 못 찾으면 null.
 */
function parseEmbeddedData(html: string): EmbeddedMeta | null {
  const head = html.slice(0, MAX_HTML_BYTES);

  // 1) <script type="application/ld+json"> 또는 application/json (Next.js __NEXT_DATA__ 포함)
  const scriptRe =
    /<script\b[^>]*type=["']application\/(?:ld\+json|json)["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = scriptRe.exec(head))) {
    const obj = safeJsonParse(m[1].trim());
    if (!obj) continue;
    const meta = pickFromObject(obj);
    if (meta.title || meta.description) return meta;
  }

  // 2) 인라인 상태 객체(중첩 JSON 이라 중괄호 균형으로 추출).
  const stateKeys = [
    "__APOLLO_STATE__",
    "__NUXT__",
    "__INITIAL_STATE__",
    "__PRELOADED_STATE__",
  ];
  for (const key of stateKeys) {
    const at = head.indexOf(key);
    if (at < 0) continue;
    const brace = head.indexOf("{", at);
    if (brace < 0) continue;
    const json = extractBalancedJson(head, brace);
    const obj = json ? safeJsonParse(json) : null;
    if (!obj) continue;
    const meta = pickFromObject(obj);
    if (meta.title || meta.description) return meta;
  }

  return null;
}

/** s[open] 의 '{' 부터 짝이 맞는 '}' 까지의 부분 문자열. 문자열 리터럴·이스케이프 고려. */
function extractBalancedJson(s: string, open: number): string | null {
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = open; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') {
      inStr = true;
    } else if (c === "{") {
      depth++;
    } else if (c === "}") {
      if (--depth === 0) return s.slice(open, i + 1);
    }
  }
  return null; // 닫히기 전 잘림(512KB 한도 등) → 폴백
}

/** 임의 객체 트리에서 키 이름으로 메타 후보를 깊이 탐색해 모은다. */
function pickFromObject(root: unknown): EmbeddedMeta {
  const title = deepFindString(root, ["headline", "title", "name", "subject"]);
  const description = deepFindString(root, [
    "description",
    "summary",
    "desc",
  ]);
  const image = normalizeImage(
    deepFindValue(root, ["image", "thumbnailUrl", "thumbnail", "ogImage"]),
  );
  const siteName = deepFindString(root, ["siteName", "site_name"]);
  return {
    title: title ? clean(title) : null,
    description: description ? clean(description, 300) : null,
    image,
    siteName: siteName ? clean(siteName) : null,
  };
}

/** 키 목록 중 처음 발견되는 "문자열" 값. (깊이 제한 6) */
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

/** 키 목록 중 처음 발견되는 값(타입 무관). 이미지처럼 문자열/객체/배열 혼재 대응. */
function deepFindValue(node: unknown, keys: string[], depth = 0): unknown {
  if (node == null || depth > 6) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = deepFindValue(item, keys, depth + 1);
      if (found != null) return found;
    }
    return null;
  }
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    for (const key of keys) {
      if (obj[key] != null) return obj[key];
    }
    for (const v of Object.values(obj)) {
      const found = deepFindValue(v, keys, depth + 1);
      if (found != null) return found;
    }
  }
  return null;
}

/** 이미지 값(string | {url|contentUrl|src} | 배열)을 URL 문자열로 정규화. */
function normalizeImage(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === "string") return v.trim() || null;
  if (Array.isArray(v)) {
    for (const item of v) {
      const r = normalizeImage(item);
      if (r) return r;
    }
    return null;
  }
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    return normalizeImage(o.url ?? o.contentUrl ?? o.src ?? null);
  }
  return null;
}

function safeJsonParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/** 엔티티 디코드 + 공백 정리 + (옵션) 길이 제한. */
function clean(s: string, max?: number): string {
  const t = decodeEntities(s).replace(/\s+/g, " ").trim();
  if (max && t.length > max) return `${t.slice(0, max - 1)}…`;
  return t;
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
