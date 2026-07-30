import Link from "next/link";

import { getMessages, localizePath, type Locale } from "@/lib/i18n";

// 전역 푸터 — 모든 페이지 하단에 항상 노출(RootLayout 에서 렌더).
//
// 서버 컴포넌트다. 로케일은 RootLayout 이 미들웨어 헤더에서 읽어 prop 으로 내려준다
// (`lib/i18n/server.ts` 참고). 링크만 로케일에 맞추려고 클라이언트로 만들 필요가 없다.
export default function Footer({ locale }: { locale: Locale }) {
  const messages = getMessages(locale);

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-5 py-5 text-center text-xs text-fg-muted sm:py-6">
        <span>© 2026 PIKAWORKS</span>
        <span aria-hidden>·</span>
        <Link
          href={localizePath("/privacy", locale)}
          className="font-semibold hover:text-fg"
        >
          {messages.common.privacy}
        </Link>
      </div>
    </footer>
  );
}
