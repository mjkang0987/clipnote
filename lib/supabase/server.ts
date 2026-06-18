import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

/** 현재 로그인한 사용자(없으면 null). */
export async function getCurrentUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
