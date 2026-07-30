"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Messages } from "@/lib/i18n";

/** 로그인 화면이 쓰는 사전 조각(RSC 페이로드를 화면 단위로 좁힌다) */
type LoginMessages = Pick<Messages, "common" | "compare" | "login">;
import { interpolate, interpolateNode } from "@/lib/i18n/interpolate";
import { useLocalizedPath } from "@/lib/i18n/useLocale";
import Header from "@/app/_components/Header";
import Brand from "@/app/_components/Brand";
import CompareBoxes from "@/app/_components/CompareBoxes";

type Provider = "google" | "kakao" | "naver";

// 마지막으로 사용한 로그인 수단(이 브라우저 기준)을 기억해 "최근 로그인" 배지로 보여준다.
const LAST_PROVIDER_KEY = "clipnote:last-login-provider";

// 사전은 서버(`LoginPage`)에서 골라 받는다.
export default function LoginClient({ messages }: { messages: LoginMessages }) {
  const t = messages.login;
  const [loading, setLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [lastProvider, setLastProvider] = useState<Provider | null>(null);
  // 처리방침·게스트 링크도 현재 로케일을 유지한다.
  const path = useLocalizedPath();

  // 카카오 로그인 활성화. 카카오 동의항목(이메일·닉네임·프로필) 설정 완료 후 켬.
  // Supabase 기본 scope(account_email·profile_image·profile_nickname)를 그대로 사용한다.
  const KAKAO_ENABLED = true;

  // 콜백에서 로그인 실패로 돌아온 경우(/login?error=...) 안내 + 최근 로그인 수단 읽기
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error")) {
      setError(t.errorIncomplete);
    }
    try {
      const v = localStorage.getItem(LAST_PROVIDER_KEY);
      if (v === "google" || v === "kakao" || v === "naver") setLastProvider(v);
    } catch {
      // localStorage 미사용 환경이면 무시
    }
  }, []);

  async function signIn(provider: Provider) {
    if (!agreed) {
      setError(t.errorConsent);
      return;
    }
    setLoading(provider);
    setError(null);
    // 이동 전에 선택한 수단 기록(다음 방문 시 "최근 로그인" 표시)
    try {
      localStorage.setItem(LAST_PROVIDER_KEY, provider);
    } catch {
      // 무시
    }
    // 네이버는 Supabase 미지원 — 커스텀 OAuth 서버 라우트로 전체 페이지 이동
    if (provider === "naver") {
      window.location.href = "/api/auth/naver";
      return;
    }
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setError(t.errorStart);
        setLoading(null);
      }
      // 성공 시 브라우저가 공급자 페이지로 이동
    } catch {
      setError(t.errorGeneric);
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header messages={messages} showClipsLink={false} />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col px-5 py-12">
        {/* ── 로그인 화면(실제 동작 영역) ── */}
        <h1 className="flex items-center justify-center gap-2 text-2xl font-bold tracking-tight text-fg">
          <Brand iconClassName="h-8 w-8" />
          <span>{t.title}</span>
        </h1>
        <p className="mt-2 text-center text-sm text-fg-muted">
          {KAKAO_ENABLED ? t.subtitleWithKakao : t.subtitleGoogleOnly}
        </p>

        {/* 개인정보 수집·이용 동의 */}
        <label className="mt-8 flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-bg p-3.5">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
          />
          <span className="text-sm leading-relaxed text-fg-muted">
            {interpolateNode(t.consent, {
              privacy: (
                <a
                  href={path("/privacy")}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-brand-strong underline"
                >
                  {messages.common.privacy}
                </a>
              ),
            })}
          </span>
        </label>

        <div className="mt-4 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => signIn("google")}
            disabled={loading !== null || !agreed}
            className="relative flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-bg px-4 text-base font-semibold text-fg transition hover:bg-surface focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading === "google"
              ? t.redirecting
              : interpolate(t.continueWith, { provider: "Google" })}
            {lastProvider === "google" && <RecentBadge label={t.recent} />}
          </button>

          {KAKAO_ENABLED && (
            <button
              type="button"
              onClick={() => signIn("kakao")}
              disabled={loading !== null || !agreed}
              className="relative flex h-12 items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-4 text-base font-semibold text-[#191600] transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading === "kakao"
                ? t.redirecting
                : interpolate(t.continueWith, { provider: "Kakao" })}
              {lastProvider === "kakao" && <RecentBadge label={t.recent} />}
            </button>
          )}

          <button
            type="button"
            onClick={() => signIn("naver")}
            disabled={loading !== null || !agreed}
            className="relative flex h-12 items-center justify-center gap-2 rounded-xl bg-[#03C75A] px-4 text-base font-semibold text-white transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading === "naver"
              ? t.redirecting
              : interpolate(t.continueWith, { provider: "Naver" })}
            {lastProvider === "naver" && <RecentBadge label={t.recent} />}
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-center text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs text-fg-muted">{t.or}</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <a
          href={path("/")}
          className="mt-4 flex h-12 items-center justify-center rounded-xl px-4 text-base font-semibold text-fg-muted transition hover:bg-surface focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {t.continueAsGuest}
        </a>

        {/* ── 안내 영역(로그인 화면과 명확히 구분) ── */}
        <section className="mt-12 border-t border-border pt-8">
          <h2 className="text-center text-xs font-semibold uppercase tracking-wider text-fg-muted">
            {t.compareTitle}
          </h2>

          {/* 홈 소개와 같은 컴포넌트·같은 문구. 여기서는 max-w-sm 이라 1열로 쌓는다. */}
          <CompareBoxes
            messages={messages}
            className="mt-4 flex flex-col gap-3"
          />
        </section>
      </main>
    </div>
  );
}

// "최근 로그인" 배지 — 버튼 우상단에 표시(버튼에 relative 필요).
function RecentBadge({ label }: { label: string }) {
  return (
    <span className="absolute -top-2 right-3 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white shadow-soft">
      {label}
    </span>
  );
}
