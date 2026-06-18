import { createBrowserClient } from "@supabase/ssr";

// 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트.
// 공개(anon/publishable) 키만 사용 — 노출돼도 안전.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
