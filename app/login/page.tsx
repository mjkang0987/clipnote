"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Header from "@/app/_components/Header";

type Provider = "google" | "kakao";

// 마지막으로 사용한 로그인 수단(이 브라우저 기준)을 기억해 "최근 로그인" 배지로 보여준다.
const LAST_PROVIDER_KEY = "clipnote:last-login-provider";

export default function LoginPage() {
  const [loading, setLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [lastProvider, setLastProvider] = useState<Provider | null>(null);

  // 카카오 로그인 활성화. 카카오 동의항목(이메일·닉네임·프로필) 설정 완료 후 켬.
  // Supabase 기본 scope(account_email·profile_image·profile_nickname)를 그대로 사용한다.
  const KAKAO_ENABLED = true;

  // 콜백에서 로그인 실패로 돌아온 경우(/login?error=...) 안내 + 최근 로그인 수단 읽기
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error")) {
      setError("로그인이 완료되지 않았어요. 다시 시도해 주세요.");
    }
    try {
      const v = localStorage.getItem(LAST_PROVIDER_KEY);
      if (v === "google" || v === "kakao") setLastProvider(v);
    } catch {
      // localStorage 미사용 환경이면 무시
    }
  }, []);

  async function signIn(provider: Provider) {
    if (!agreed) {
      setError("개인정보처리방침에 동의하셔야 로그인할 수 있어요.");
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
    <div className="flex flex-1 flex-col">
      <Header showClipsLink={false} />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col px-5 py-12">
      {/* ── 로그인 화면(실제 동작 영역) ── */}
      <h1 className="text-center text-2xl font-bold tracking-tight text-fg">
        Clip<span className="text-brand">Note</span> 로그인
      </h1>
      <p className="mt-2 text-center text-sm text-fg-muted">
        {KAKAO_ENABLED
          ? "Google·카카오 계정으로 간편하게 시작하세요."
          : "Google 계정으로 간편하게 시작하세요."}
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
          로그인 시 회원 식별을 위해 소셜 계정 정보(고유 식별자, 이메일, 프로필
          닉네임·이미지)가 수집되는 데 동의합니다.{" "}
          <a
            href="/privacy"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-brand-strong underline"
          >
            개인정보처리방침
          </a>
          을 확인했어요.
        </span>
      </label>

      <div className="mt-4 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => signIn("google")}
          disabled={loading !== null || !agreed}
          className="relative flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-bg px-4 text-base font-semibold text-fg transition hover:bg-surface focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "google" ? "이동 중…" : "Google로 계속하기"}
          {lastProvider === "google" && <RecentBadge />}
        </button>

        {KAKAO_ENABLED && (
          <button
            type="button"
            onClick={() => signIn("kakao")}
            disabled={loading !== null || !agreed}
            className="relative flex h-12 items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-4 text-base font-semibold text-[#191600] transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading === "kakao" ? "이동 중…" : "카카오로 계속하기"}
            {lastProvider === "kakao" && <RecentBadge />}
          </button>
        )}
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

      {/* ── 안내 영역(로그인 화면과 명확히 구분) ── */}
      <section className="mt-12 border-t border-border pt-8">
        <h2 className="text-center text-xs font-semibold uppercase tracking-wider text-fg-muted">
          로그인 / 게스트 모드 안내
        </h2>

        <div className="mt-4 flex flex-col gap-3">
          {/* 로그인 하면 (메인 '이렇게 동작해요'와 동일 텍스트·강조) */}
          <div className="rounded-xl border border-brand/30 bg-brand-soft p-4">
            <p className="text-sm font-semibold text-brand-strong">로그인 하면</p>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm leading-relaxed text-fg-muted">
              <li>
                · <strong className="font-semibold text-brand-strong">짧은 공유 링크</strong>를 만들어 카카오톡·SNS에 보낼 수 있어요.
              </li>
              <li>· 공유한 링크가 예쁜 미리보기 카드로 떠요.</li>
              <li>
                · 클립이 계정에 쌓여 <strong className="font-semibold text-brand-strong">다른 기기에서도</strong> 그대로 보이고, 태그로 정리돼요.
              </li>
            </ul>
          </div>

          {/* 로그인 안 해도 (게스트) */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm font-semibold text-fg">로그인 안 해도</p>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm leading-relaxed text-fg-muted">
              <li>· URL을 붙여넣어 미리보기 카드를 만들 수 있어요.</li>
              <li>· 만든 클립을 이 브라우저에 저장하고 ‘내 클립’에서 다시 봐요.</li>
              <li>
                · 단, 저장은 <strong className="font-semibold text-fg">이 기기에만</strong> 남고{" "}
                <strong className="font-semibold text-fg">짧은 공유 링크는 못 만들어요.</strong>
              </li>
            </ul>
          </div>
        </div>
      </section>
      </main>
    </div>
  );
}

// "최근 로그인" 배지 — 버튼 우상단에 표시(버튼에 relative 필요).
function RecentBadge() {
  return (
    <span className="absolute -top-2 right-3 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white shadow-soft">
      최근 로그인
    </span>
  );
}
