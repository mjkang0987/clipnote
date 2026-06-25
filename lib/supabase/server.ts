import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";

// 서버(서버 컴포넌트·라우트·액션)용 Supabase 클라이언트.
// 쿠키 기반 세션을 읽고 갱신한다. 공개 키 사용(사용자 세션 토큰은 쿠키에).
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // 서버 컴포넌트에서 호출되면 set 이 막힐 수 있음 — 미들웨어가 갱신 담당.
          }
        },
      },
    },
  );
}

/** 현재 로그인한 사용자(없으면 null).
 *  1) Authorization: Bearer 토큰(모바일 앱 등 비쿠키 클라이언트) 우선
 *  2) 없으면 쿠키 기반 세션(웹) */
export async function getCurrentUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  // 1) Bearer 토큰 — 앱(쿠키 미사용)에서 access_token 을 헤더로 전달.
  const headerStore = await headers();
  const authz =
    headerStore.get("authorization") ?? headerStore.get("Authorization");
  const token = authz?.toLowerCase().startsWith("bearer ")
    ? authz.slice(7).trim()
    : null;
  if (token) {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const {
      data: { user },
    } = await sb.auth.getUser(token);
    if (user) return user;
  }

  // 2) 쿠키 기반 세션(웹)
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
