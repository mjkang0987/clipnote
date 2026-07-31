import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { LOCALE_HEADER } from "@/lib/i18n/localeHeader";
import { stripLocale } from "@/lib/i18n/locales";

/**
 * 요청 경로에서 읽은 로케일을 **요청 헤더**로 실어 보낸다.
 *
 * `app/layout.tsx` 는 서버 컴포넌트라 pathname 을 알 수 없다. 그래서 `<html lang>` 을
 * 로케일에 맞추거나 푸터에 사전을 내려주려면 다른 경로가 필요하다. 미들웨어는 URL 을 보므로
 * 여기서 헤더에 담아 주면 레이아웃이 `headers()` 로 읽을 수 있다.
 *
 * 대안(클라이언트에서 `document.documentElement.lang` 만 고치기)은 SSR HTML 이 계속 `ko` 라
 * 크롤러·초기 렌더가 틀린 언어로 남는다.
 */
function withLocaleHeader(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, stripLocale(request.nextUrl.pathname).locale);
  return headers;
}

// 매 요청마다 Supabase 세션 쿠키를 갱신(만료 토큰 자동 리프레시).
// 인증 환경변수가 없으면(아직 미설정) 세션 갱신만 건너뛴다 — 로케일 헤더는 항상 붙인다.
export async function middleware(request: NextRequest) {
  const headers = withLocaleHeader(request);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next({ request: { headers } });

  let response = NextResponse.next({ request: { headers } });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        // `{ request }` 로 다시 만들면 위에서 붙인 로케일 헤더가 사라진다 —
        // 쿠키가 갱신되는 요청에서만 로케일이 유실되는 버그가 된다.
        response = NextResponse.next({ request: { headers } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // 세션 갱신 트리거(반환값은 미사용)
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // 정적 자산·OG 이미지·폰트 등은 제외
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/og|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
