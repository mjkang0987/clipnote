"use client";

import AuthNav from "@/app/_components/AuthNav";
import Brand from "@/app/_components/Brand";
import { useLocalizedPath } from "@/lib/i18n/useLocale";

// 페이지 공통 헤더. 모든 페이지에서 동일한 높이·동작(sticky)을 갖도록 한 곳에서 관리.
// showClipsLink: 우측 '내 클립' 링크 노출 여부(클립 목록 페이지에선 숨김).
//
// "use client" 인 이유: 링크를 현재 로케일(`/en/…`)로 맞추려면 pathname 이 필요하다.
// 로케일을 prop 으로 내리는 방법은 못 쓴다 — `app/en/*` 가 한국어 페이지를 그대로 재export 해서
// 페이지 자신이 자기 로케일을 모른다. 마크업은 정적이고 이미 AuthNav(클라이언트)를 품고 있다.
export default function Header({
  showClipsLink = true,
}: {
  showClipsLink?: boolean;
}) {
  const path = useLocalizedPath();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/60 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
        <a
          href={path("/")}
          className="flex items-center text-lg font-bold tracking-tight text-fg"
          aria-label="ClipNote 홈"
        >
          <Brand />
        </a>
        <div className="flex items-center gap-3">
          {showClipsLink && (
            <a
              href={path("/clips")}
              className="text-sm font-semibold text-fg-muted transition hover:text-fg"
            >
              내 클립
            </a>
          )}
          <AuthNav />
        </div>
      </nav>
    </header>
  );
}
