"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Messages } from "@/lib/i18n";

/** 설정 화면이 쓰는 사전 조각(RSC 페이로드를 화면 단위로 좁힌다) */
type SettingsMessages = Pick<Messages, "common" | "settings">;
import { interpolate } from "@/lib/i18n/interpolate";
import { useLocalizedPath } from "@/lib/i18n/useLocale";
import Header from "@/app/_components/Header";
import RunningDino from "@/app/_components/RunningDino";

// 계정 설정 페이지: 로그인 정보 확인 · 로그아웃 · 회원 탈퇴.
// 사전은 서버(`SettingsPage`)에서 골라 받는다.
const CONTACT_EMAIL = "pikaworks.help@gmail.com";

export default function SettingsClient({ messages }: { messages: SettingsMessages }) {
  const t = messages.settings;
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [confirming, setConfirming] = useState(false);
  // 이동 경로도 현재 로케일을 유지한다 — `/en/settings` 에서 로그아웃하면 `/en` 으로.
  const path = useLocalizedPath();

  useEffect(() => {
    // 인증 env 가 없으면(게스트 전용 빌드) 로그인 페이지로.
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      window.location.replace(path("/login"));
      return;
    }
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        // 비로그인: 로그인 페이지로 보냄
        window.location.replace(path("/login"));
        return;
      }
      setUser(data.user);
      setReady(true);
    });
  }, [path]);

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
    window.location.href = path("/");
  }

  if (!ready || !user) {
    return (
      <div className="flex flex-1 flex-col">
        <Header messages={messages} />
        <main className="mx-auto w-full max-w-lg flex-1 px-5 py-12">
          {/* 인증 왕복을 기다리는 구간 — 라우트 대기(`loading.tsx`)가 끝난 뒤에도 여기서 한 번 더 기다린다. */}
          <RunningDino />
          <p role="status" className="mt-10 text-center text-sm text-fg-muted">
            {t.loading}
          </p>
        </main>
      </div>
    );
  }

  const { label: accountLabel, provider } = describeAccount(user, t);

  return (
    <div className="flex flex-1 flex-col">
      <Header messages={messages} />

      <main className="mx-auto w-full max-w-lg flex-1 px-5 py-10">
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t.title}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t.subtitle}</p>

        {/* 계정 정보 + 로그아웃 */}
        <section className="mt-6 border-t border-border py-5">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-fg">{accountLabel}</p>
              <p className="truncate text-sm text-fg-muted">
                {interpolate(t.signedInWith, { provider })}
              </p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="shrink-0 text-sm font-semibold text-fg-muted transition hover:text-fg"
            >
              {messages.common.logout}
            </button>
          </div>
        </section>

        {/* 개인정보처리방침 */}
        <section className="mt-1 border-t border-border py-4">
          <a
            href={path("/privacy")}
            className="flex items-center justify-between text-sm font-semibold text-fg transition hover:text-brand-strong"
          >
            <span>{messages.common.privacy}</span>
            <span className="text-fg-muted" aria-hidden>
              {t.viewLink}
            </span>
          </a>
        </section>

        {/* 문의 */}
        <section className="mt-1 border-t border-border py-4">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="flex items-center justify-between text-sm font-semibold text-fg transition hover:text-brand-strong"
          >
            <span>{t.contact}</span>
            <span className="text-fg-muted" aria-hidden>
              {t.contactAction}
            </span>
          </a>
          <p className="mt-1 text-xs text-fg-muted">
            {interpolate(t.contactNote, { email: CONTACT_EMAIL })}
          </p>
        </section>

        {/* 위험 구역: 회원 탈퇴 */}
        <section className="mt-4 rounded-2xl border border-danger/30 bg-danger/5 p-5">
          <h2 className="text-sm font-semibold text-danger">{t.dangerTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t.dangerBody}</p>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-3 text-sm font-semibold text-danger underline underline-offset-2 transition hover:opacity-80"
          >
            {t.withdraw}
          </button>
        </section>
      </main>

      {confirming && (
        <WithdrawConfirmLayer
          messages={messages}
          onCancel={() => setConfirming(false)}
          onDone={() => {
            window.location.href = path("/");
          }}
        />
      )}
    </div>
  );
}

/** 탈퇴 확인 모달: 동의 체크 후에만 삭제 실행. */
function WithdrawConfirmLayer({
  messages,
  onCancel,
  onDone,
}: {
  messages: SettingsMessages;
  onCancel: () => void;
  onDone: () => void;
}) {
  const t = messages.settings;
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
        setError(t.withdrawFailed);
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
      setError(t.withdrawError);
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
          {t.withdrawTitle}
        </h2>
        <p id="withdraw-desc" className="mt-2 text-sm leading-relaxed text-fg-muted">
          {t.withdrawBody}
        </p>
        <ul className="mt-3 flex flex-col gap-1 rounded-xl bg-bg p-4 text-sm text-fg">
          <li>· {t.withdrawItemAccount}</li>
          <li>· {t.withdrawItemClips}</li>
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
            {t.withdrawAgree}
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
            {messages.common.cancel}
          </button>
          <button
            type="button"
            onClick={withdraw}
            disabled={!agreed || busy}
            className="h-12 flex-1 rounded-xl bg-danger text-base font-semibold text-white transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-danger/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? t.withdrawing : t.withdraw}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 표시용 계정 라벨과 공급자 이름. 네이버는 내부 식별 이메일을 숨긴다. */
function describeAccount(
  user: User,
  t: Messages["settings"],
): { label: string; provider: string } {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
  const rawProvider =
    (typeof meta.provider === "string" && meta.provider) ||
    (typeof appMeta.provider === "string" && appMeta.provider) ||
    "";

  const provider =
    PROVIDER_NAMES[rawProvider] ??
    (user.email?.endsWith("@naver.invalid") ? "Naver" : t.providerUnknown);

  // 네이버는 내부 식별 이메일(@naver.invalid)을 노출하지 않고 닉네임/공급자로 표기.
  const email = user.email ?? "";
  const label =
    email && !email.endsWith("@naver.invalid")
      ? email
      : (typeof meta.name === "string" && meta.name) ||
        interpolate(t.accountLabel, { provider });

  return { label, provider };
}

const PROVIDER_NAMES: Record<string, string> = {
  google: "Google",
  // 공급자 이름은 어느 언어에서도 라틴 표기로 통일한다 — 언어별 표기 분기가 사라진다.
  kakao: "Kakao",
  naver: "Naver",
};
