import AuthNav from "@/app/_components/AuthNav";

// 페이지 공통 헤더. 모든 페이지에서 동일한 높이·동작(sticky)을 갖도록 한 곳에서 관리.
// showClipsLink: 우측 '내 클립' 링크 노출 여부(클립 목록 페이지에선 숨김).
export default function Header({
  showClipsLink = true,
}: {
  showClipsLink?: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/60 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
        <a
          href="/"
          className="text-lg font-bold tracking-tight text-fg"
          aria-label="ClipNote 홈"
        >
          Clip<span className="text-brand">Note</span>
        </a>
        <div className="flex items-center gap-3">
          {showClipsLink && (
            <a
              href="/clips"
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
