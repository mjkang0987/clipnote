"use client";

import Link from "next/link";

import { useLocalizedPath } from "@/lib/i18n/useLocale";

// 전역 푸터 — 모든 페이지 하단에 항상 노출(RootLayout 에서 렌더).
// "use client": 처리방침 링크를 현재 로케일로 맞추려면 pathname 이 필요하다(Header.tsx 주석 참고).
// RootLayout 은 서버 컴포넌트라 pathname 을 알 수 없어 prop 으로 내릴 수도 없다.
export default function Footer() {
  const path = useLocalizedPath();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-5 py-5 text-center text-xs text-fg-muted sm:py-6">
        <span>© 2026 PIKAWORKS</span>
        <span aria-hidden>·</span>
        <Link href={path("/privacy")} className="font-semibold hover:text-fg">
          개인정보처리방침
        </Link>
      </div>
    </footer>
  );
}
