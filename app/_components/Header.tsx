"use client";

import AuthNav from "@/app/_components/AuthNav";
import Brand from "@/app/_components/Brand";
import type { Messages } from "@/lib/i18n";
import { useLocalizedPath } from "@/lib/i18n/useLocale";

// 페이지 공통 헤더. 모든 페이지에서 동일한 높이·동작(sticky)을 갖도록 한 곳에서 관리.
// showClipsLink: 우측 '내 클립' 링크 노출 여부(클립 목록 페이지에선 숨김).
//
// "use client" 인 이유: 링크를 현재 로케일(`/en/…`)로 맞추려면 pathname 이 필요하고,
// 이 컴포넌트를 렌더하는 화면 대부분이 이미 클라이언트 컴포넌트다.
// 문자열은 서버에서 고른 사전을 prop 으로 받는다 — 4개 언어 사전을 번들에 싣지 않기 위해서다.
export default function Header({
  messages,
  showClipsLink = true,
}: {
  messages: Messages;
  showClipsLink?: boolean;
}) {
  const c = messages.common;
  const path = useLocalizedPath();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/60 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
        <a
          href={path("/")}
          className="flex items-center text-lg font-bold tracking-tight text-fg"
          aria-label={c.homeAria}
        >
          <Brand />
        </a>
        <div className="flex items-center gap-3">
          {showClipsLink && (
            <a
              href={path("/clips")}
              className="text-sm font-semibold text-fg-muted transition hover:text-fg"
            >
              {c.myClips}
            </a>
          )}
          <AuthNav messages={messages} />
        </div>
      </nav>
    </header>
  );
}
