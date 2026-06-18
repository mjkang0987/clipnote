"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Provider = "google" | "kakao";

export default function LoginPage() {
  const [loading, setLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(provider: Provider) {
    setLoading(provider);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setError("로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
        setLoading(null);
      }
      // 성공 시 브라우저가 공급자 페이지로 이동
    } catch {
      setError("로그인 중 문제가 발생했어요.");
      setLoading(null);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-16">
      <h1 className="text-center text-2xl font-bold tracking-tight text-fg">
        Clip<span className="text-brand">Note</span> 로그인
      </h1>
      <p className="mt-2 text-center text-sm text-fg-muted">
        로그인하면 공유 링크를 만들고 어디서나 내 클립을 볼 수 있어요.
      </p>

      {/* 로그인하면 좋은 점 안내 */}
      <div className="mt-6 rounded-xl border border-border bg-surface p-4">
        <p className="text-sm font-semibold text-fg">로그인하면 이런 게 좋아요</p>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm leading-relaxed text-fg-muted">
          <li>· 짧은 공유 링크를 만들어 카카오톡·SNS에 보낼 수 있어요.</li>
          <li>· 공유한 링크는 예쁜 미리보기 카드로 떠요.</li>
          <li>· 저장한 클립이 계정에 쌓여 다른 기기에서도 그대로 보여요.</li>
          <li>· 태그로 정리하고 모아 보기가 편해져요.</li>
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-fg-muted">
          Google·카카오 계정으로 간편하게 시작해요. 비밀번호는 따로 만들지 않아도
          돼요.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => signIn("google")}
          disabled={loading !== null}
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-bg px-4 text-base font-semibold text-fg transition hover:bg-surface focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50"
        >
          {loading === "google" ? "이동 중…" : "Google로 계속하기"}
        </button>

        <button
          type="button"
          onClick={() => signIn("kakao")}
          disabled={loading !== null}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-4 text-base font-semibold text-[#191600] transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50"
        >
          {loading === "kakao" ? "이동 중…" : "카카오로 계속하기"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-center text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-fg-muted">또는</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <a
        href="/"
        className="mt-4 flex h-12 items-center justify-center rounded-xl px-4 text-base font-semibold text-fg-muted transition hover:bg-surface focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        게스트로 계속하기
      </a>
      <p className="mt-2 text-center text-xs text-fg-muted">
        게스트로 쓰면 저장한 링크가 이 기기에만 남아요. 공유 링크를 만들려면
        로그인이 필요해요.
      </p>
    </main>
  );
}
