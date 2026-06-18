"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// 헤더 우측: 로그인 상태에 따라 "로그인" 링크 또는 사용자 + 로그아웃.
export default function AuthNav() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 인증 env 가 없으면 로그인 UI 자체를 숨김
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setReady(true);
      return;
    }
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <div className="h-9 w-16" aria-hidden />;

  if (!email) {
    return (
      <a
        href="/login"
        className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-fg transition hover:bg-surface"
      >
        로그인
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[12rem] truncate text-sm text-fg-muted sm:inline">
        {email}
      </span>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-fg transition hover:bg-surface"
        >
          로그아웃
        </button>
      </form>
    </div>
  );
}
