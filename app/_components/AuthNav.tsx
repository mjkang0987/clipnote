"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// 헤더 우측: 로그인 상태에 따라 "로그인" 링크 또는 로그아웃 버튼.
// 이메일 등 개인정보는 수집·표시하지 않고 로그인 여부만 본다.
export default function AuthNav() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 인증 env 가 없으면 로그인 UI 자체를 숨김
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setReady(true);
      return;
    }
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(Boolean(data.user));
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session?.user));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <div className="h-9 w-16" aria-hidden />;

  if (!loggedIn) {
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
    <div className="flex items-center gap-3">
      <a
        href="/settings"
        className="text-sm font-semibold text-fg-muted transition hover:text-fg"
      >
        설정
      </a>
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
