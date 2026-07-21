"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Header from "@/app/_components/Header";

// 계정 설정 페이지: 로그인 정보 확인 · 로그아웃 · 회원 탈퇴.
export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    // 인증 env 가 없으면(게스트 전용 빌드) 로그인 페이지로.
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      window.location.replace("/login");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        // 비로그인: 로그인 페이지로 보냄
        window.location.replace("/login");
        return;
      }
      setUser(data.user);
      setReady(true);
    });
  }, []);

  async function signOut() {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // 무시 — 쿠키 세션은 서버 라우트가 정리
    }
    // 쿠키 기반 세션도 함께 종료
    try {
      await fetch("/auth/signout", { method: "POST" });
    } catch {
      // 무시
    }
    window.location.href = "/";
  }

  if (!ready || !user) {
    return (
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="mx-auto w-full max-w-lg flex-1 px-5 py-12">
          <p className="mt-10 text-center text-sm text-fg-muted">불러오는 중…</p>
        </main>
      </div>
    );
  }

  const { label: accountLabel, provider } = describeAccount(user);

  return (
    <div className="flex flex-1 flex-col">
      <Header />

      <main className="mx-auto w-full max-w-lg flex-1 px-5 py-10">
        <h1 className="text-2xl font-bold tracking-tight text-fg">계정 설정</h1>
        <p className="mt-1 text-sm text-fg-muted">로그인 정보와 계정을 관리합니다.</p>

        {/* 계정 정보 + 로그아웃 */}
        <section className="mt-6 border-t border-border py-5">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-fg">{accountLabel}</p>
              <p className="truncate text-sm text-fg-muted">
                {provider} 계정으로 로그인됨
              </p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="shrink-0 text-sm font-semibold text-fg-muted transition hover:text-fg"
            >
              로그아웃
            </button>
          </div>
        </section>

        {/* 개인정보처리방침 */}
        <section className="mt-1 border-t border-border py-4">
          <a
            href="/privacy"
            className="flex items-center justify-between text-sm font-semibold text-fg transition hover:text-brand-strong"
          >
            <span>개인정보처리방침</span>
            <span className="text-fg-muted" aria-hidden>
              보기 ›
            </span>
          </a>
        </section>

        {/* 위험 구역: 회원 탈퇴 */}
        <section className="mt-4 rounded-2xl border border-danger/30 bg-danger/5 p-5">
          <h2 className="text-sm font-semibold text-danger">계정 삭제</h2>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            탈퇴하면 계정과 저장된 모든 클립·공유 링크가 영구 삭제되며 복구할 수
            없어요.
          </p>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-3 text-sm font-semibold text-danger underline underline-offset-2 transition hover:opacity-80"
          >
            회원 탈퇴
          </button>
        </section>
      </main>

      {confirming && (
        <WithdrawConfirmLayer
          onCancel={() => setConfirming(false)}
          onDone={() => {
            window.location.href = "/";
          }}
        />
      )}
    </div>
  );
}

/** 탈퇴 확인 모달: 동의 체크 후에만 삭제 실행. */
function WithdrawConfirmLayer({
  onCancel,
  onDone,
}: {
  onCancel: () => void;
  onDone: () => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onCancel();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onCancel, busy]);

  async function withdraw() {
    if (!agreed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) {
        setError("탈퇴 처리에 실패했어요. 잠시 후 다시 시도해 주세요.");
        setBusy(false);
        return;
      }
      // 계정 삭제 완료 — 클라이언트 세션도 정리하고 홈으로.
      try {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
      } catch {
        // 무시
      }
      onDone();
    } catch {
      setError("탈퇴 처리 중 문제가 발생했어요.");
      setBusy(false);
    }
  }

  return (
    <div
      role="presentation"
      onClick={busy ? undefined : onCancel}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="withdraw-title"
        aria-describedby="withdraw-desc"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-t-2xl bg-surface p-6 shadow-soft sm:rounded-2xl"
      >
        <h2 id="withdraw-title" className="text-lg font-bold text-fg">
          정말 탈퇴할까요?
        </h2>
        <p id="withdraw-desc" className="mt-2 text-sm leading-relaxed text-fg-muted">
          아래 정보가 영구적으로 삭제되며 복구할 수 없어요.
        </p>
        <ul className="mt-3 flex flex-col gap-1 rounded-xl bg-bg p-4 text-sm text-fg">
          <li>· 계정 정보(로그인 식별자·이메일·프로필)</li>
          <li>· 저장한 모든 클립과 공유 링크</li>
        </ul>

        <label className="mt-4 flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            disabled={busy}
            className="mt-0.5 h-4 w-4 shrink-0 accent-danger"
          />
          <span className="text-sm leading-relaxed text-fg">
            위 내용을 확인했으며 삭제에 동의합니다.
          </span>
        </label>

        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-12 flex-1 rounded-xl border border-border bg-bg text-base font-semibold text-fg transition hover:bg-border/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={withdraw}
            disabled={!agreed || busy}
            className="h-12 flex-1 rounded-xl bg-danger text-base font-semibold text-white transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-danger/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "탈퇴 중…" : "회원 탈퇴"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 표시용 계정 라벨과 공급자 이름. 네이버는 내부 식별 이메일을 숨긴다. */
function describeAccount(user: User): { label: string; provider: string } {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
  const rawProvider =
    (typeof meta.provider === "string" && meta.provider) ||
    (typeof appMeta.provider === "string" && appMeta.provider) ||
    "";

  const provider =
    PROVIDER_NAMES[rawProvider] ??
    (user.email?.endsWith("@naver.invalid") ? "네이버" : "소셜");

  // 네이버는 내부 식별 이메일(@naver.invalid)을 노출하지 않고 닉네임/공급자로 표기.
  const email = user.email ?? "";
  const label =
    email && !email.endsWith("@naver.invalid")
      ? email
      : (typeof meta.name === "string" && meta.name) || `${provider} 계정`;

  return { label, provider };
}

const PROVIDER_NAMES: Record<string, string> = {
  google: "Google",
  kakao: "카카오",
  naver: "네이버",
};
