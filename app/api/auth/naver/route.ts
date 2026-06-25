import { NextResponse } from "next/server";

export const runtime = "nodejs";

// 네이버 로그인 시작: 네이버 인증 페이지로 리다이렉트.
// 네이버는 Supabase 기본 공급자가 아니라 커스텀 OAuth 로 처리한다.
const NAVER_AUTHORIZE = "https://nid.naver.com/oauth2.0/authorize";

export async function GET(request: Request) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const { origin } = new URL(request.url);

  if (!clientId) {
    return NextResponse.redirect(`${origin}/login?error=naver_config`);
  }

  // CSRF 방지용 state — httpOnly 쿠키에 저장 후 콜백에서 대조.
  const state = crypto.randomUUID();
  const redirectUri = `${origin}/api/auth/naver/callback`;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });

  const res = NextResponse.redirect(`${NAVER_AUTHORIZE}?${params.toString()}`);
  res.cookies.set("naver_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10분
  });
  return res;
}
