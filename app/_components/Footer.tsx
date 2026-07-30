import Link from "next/link";

// 전역 푸터 — 모든 페이지 하단에 항상 노출(RootLayout 에서 렌더).
export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-5 py-5 text-center text-xs text-fg-muted sm:py-6">
        <span>© 2026 PIKAWORKS</span>
        <span aria-hidden>·</span>
        <Link href="/privacy" className="font-semibold hover:text-fg">
          개인정보처리방침
        </Link>
      </div>
    </footer>
  );
}
