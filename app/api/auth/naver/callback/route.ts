import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 네이버 OAuth 콜백 (커스텀 — Supabase 미지원 provider).
// 네이버는 이메일을 주지 않으므로 고유 id 기반 내부 식별 이메일로 사용자를 식별한다
// (메일 발송·수집 없음). 결과:
//  - 웹(쿠키 state 일치): 서버에서 verifyOtp 로 세션 쿠키 설정 후 홈으로.
//  - 앱(state 에 returnUrl 딥링크): 딥링크로 token_hash 전달 → 앱이 verifyOtp.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const naverError = searchParams.get("error");

  const cookieStore = await cookies();
  const webState = cookieStore.get("naver_oauth_state")?.value;
  const isWeb = Boolean(webState && state && state === webState);

  // 앱 복귀 딥링크(state 에 JSON 으로 인코딩). 웹이면 사용 안 함.
  let returnUrl = "clipnote://auth/naver";
  if (!isWeb && state) {
    try {
      const parsed = JSON.parse(state) as { returnUrl?: string };
      if (parsed?.returnUrl) returnUrl = parsed.returnUrl;
    } catch {
      // 기본 returnUrl 사용
    }
  }

  const finishWeb = (path: string) => {
    cookieStore.delete("naver_oauth_state");
    return NextResponse.redirect(`${origin}${path}`);
  };
  const finishApp = (params: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    const sep = returnUrl.includes("?") ? "&" : "?";
    return new Response(null, {
      status: 302,
      headers: { Location: `${returnUrl}${sep}${q}` },
    });
  };
  const fail = (reason: string) =>
    isWeb ? finishWeb("/login?error=naver") : finishApp({ error: reason });

  if (naverError || !code) return fail("naver_denied");

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail("config");

  try {
    // 1) code → 네이버 access_token
    const tokenRes = await fetch(
      "https://nid.naver.com/oauth2.0/token?" +
        new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId,
          client_secret: clientSecret,
          code,
          state: state ?? "",
        }).toString(),
    );
    const tokenJson = (await tokenRes.json()) as { access_token?: string };
    if (!tokenJson.access_token) return fail("naver_token");

    // 2) 프로필 — 고유 id 만 사용(메일 미수집)
    const meRes = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    const meJson = (await meRes.json()) as {
      response?: { id?: string; nickname?: string; profile_image?: string };
    };
    const profile = meJson.response;
    const naverId = profile?.id;
    if (!naverId) return fail("no_profile");

    // 3) 네이버 id 기반 내부 식별 이메일(발송 안 함)로 사용자 보장
    const email = `naver_${naverId}@naver.invalid`;
    const admin = getSupabaseAdmin();
    await admin.auth.admin
      .createUser({
        email,
        email_confirm: true,
        user_metadata: {
          name: profile?.nickname,
          avatar_url: profile?.profile_image,
          provider: "naver",
          naver_id: naverId,
        },
      })
      .catch(() => {}); // 이미 있으면 무시

    // 4) magiclink hashed_token 발급(메일 발송 없이 서버에서 처리)
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const tokenHash = data?.properties?.hashed_token;
    if (error || !tokenHash) return fail("session");

    // 5) 웹=쿠키 세션 교환 후 홈 / 앱=딥링크로 token_hash 전달
    if (isWeb) {
      const supabase = await createSupabaseServerClient();
      const { error: otpErr } = await supabase.auth.verifyOtp({
        type: "magiclink",
        token_hash: tokenHash,
      });
      if (otpErr) return finishWeb("/login?error=naver");
      return finishWeb("/");
    }
    return finishApp({ token_hash: tokenHash, type: "magiclink" });
  } catch {
    return fail("server");
  }
}
