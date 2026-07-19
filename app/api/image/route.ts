import { NextRequest } from "next/server";

// 이미지 프록시: GET /api/image?url=...
// 원본 대표 이미지를 서버에서 받아 그대로 흘려보낸다.
// 미리보기 카드가 브라우저에서 직접 원본 이미지를 부르면 hotlink/referer 차단·
// 혼합콘텐츠(http)로 자주 실패하는데, 우리 도메인으로 감싸면 그 문제가 사라진다.
// (공유 시 OG 는 크롤러가 서버에서 받아가므로 잘 뜨지만, 페이지 안 미리보기는 아님)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIMEOUT_MS = 8000;
const MAX_BYTES = 8 * 1024 * 1024; // 8MB 까지만 중계
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** 이미지 호스트별로 붙일 Referer. 네이버 CDN 은 네이버 referer 를 요구한다. */
function refererFor(u: URL): string | undefined {
  const h = u.hostname.toLowerCase();
  if (/(^|\.)(pstatic\.net|naver\.net|naver\.com)$/.test(h)) {
    return "https://cafe.naver.com/";
  }
  return undefined;
}

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("url");
  if (!target) {
    return new Response("url 쿼리 파라미터가 필요합니다.", { status: 400 });
  }

  let u: URL;
  try {
    u = new URL(target);
  } catch {
    return new Response("올바른 이미지 주소가 아닙니다.", { status: 400 });
  }
  // http/https 만 허용(file:, data: 등 차단).
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return new Response("지원하지 않는 프로토콜입니다.", { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {
      "User-Agent": BROWSER_UA,
      Accept: "image/*,*/*;q=0.8",
    };
    // 네이버 이미지 CDN(pstatic.net 등)은 referer 가 네이버 도메인일 때만 내주는
    // hotlink 차단을 한다. 해당 호스트에는 네이버 referer 를 붙여 통과시킨다.
    // (그 외 호스트는 referer 없이 요청 → 오히려 외부 referer 차단을 피함)
    const referer = refererFor(u);
    if (referer) headers.Referer = referer;

    const res = await fetch(u.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers,
    });
    if (!res.ok) {
      return new Response("원본 이미지를 가져오지 못했습니다.", { status: 502 });
    }

    const type = res.headers.get("content-type") ?? "";
    // 이미지가 아니면 중계하지 않는다(오픈 프록시 남용 방지).
    if (!type.startsWith("image/")) {
      return new Response("이미지가 아닙니다.", { status: 415 });
    }

    const declaredLen = Number(res.headers.get("content-length") ?? "0");
    if (declaredLen && declaredLen > MAX_BYTES) {
      return new Response("이미지가 너무 큽니다.", { status: 413 });
    }

    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return new Response("이미지가 너무 큽니다.", { status: 413 });
    }

    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": type,
        // 원본 이미지는 잘 안 바뀌므로 오래 캐시(브라우저/CDN 모두).
        "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
      },
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return new Response(
      aborted ? "이미지 응답이 너무 느립니다." : "이미지를 가져오지 못했습니다.",
      { status: 502 },
    );
  } finally {
    clearTimeout(timer);
  }
}
