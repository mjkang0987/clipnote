"use client";

import { useMemo, useState } from "react";
import { gradientCss, pickGradient } from "@/lib/gradients";
import type { ClipMetadata } from "@/lib/metadata";

export default function Home() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tagInput, setTagInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<ClipMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const tags = useMemo(
    () =>
      tagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 6),
    [tagInput],
  );

  // 미리보기 값: 사용자 입력 우선 → 가져온 메타 → 호스트
  const effectiveTitle =
    title.trim() || meta?.title || (url ? prettyHost(url) : "여기에 제목이 표시됩니다");
  const description = meta?.description ?? null;
  const image = meta?.image ?? null;

  const seed = title.trim() || meta?.title || url || "clipnote";
  const gradient = useMemo(() => pickGradient(seed), [seed]);

  const hasInput = url.trim().length > 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasInput || loading) return;

    setLoading(true);
    setError(null);
    setMeta(null);
    setShareUrl(null);
    try {
      const res = await fetch(`/api/metadata?url=${encodeURIComponent(url.trim())}`);
      const data = (await res.json()) as ClipMetadata;
      setMeta(data);
      // 제목을 비워뒀고 자동으로 가져온 제목이 있으면 입력란에 채워줌(편집 가능)
      if (!title.trim() && data.title) setTitle(data.title);
    } catch {
      setError("내용을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateShare() {
    const sendTitle = title.trim() || meta?.title || "";
    if (!sendTitle) {
      setError("공유 링크를 만들려면 제목이 필요해요. 제목을 입력해 주세요.");
      return;
    }
    setCreating(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch("/api/clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          title: sendTitle,
          description: meta?.description ?? null,
          image: meta?.image ?? null,
          siteName: meta?.siteName ?? null,
          tags,
          gradient: gradient.name,
        }),
      });
      const data = (await res.json()) as { shareUrl?: string; error?: string };
      if (!res.ok || !data.shareUrl) {
        setError(data.error ?? "공유 링크 생성에 실패했어요.");
        return;
      }
      setShareUrl(data.shareUrl);
    } catch {
      setError("공유 링크 생성 중 문제가 발생했어요.");
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  const noMeta = meta?.source === "none";

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <nav className="mx-auto flex h-16 max-w-3xl items-center px-5">
          <a
            href="/"
            className="text-lg font-bold tracking-tight text-fg"
            aria-label="ClipNote 홈"
          >
            Clip<span className="text-brand">Note</span>
          </a>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:py-16">
        <section className="text-center">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-fg sm:text-4xl">
            URL을 <span className="text-brand">예쁜 공유 카드</span>로
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-fg-muted">
            링크를 넣으면 내용을 읽어와 공유 카드를 만들어 드려요. 제목을 직접
            정하거나 자동으로 채울 수 있어요.
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className="mt-10 rounded-2xl border border-border bg-surface p-5 shadow-soft sm:p-6"
          aria-label="클립 만들기"
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="clip-url" className="text-sm font-medium text-fg">
                URL <span className="text-danger">*</span>
              </label>
              <input
                id="clip-url"
                name="url"
                type="url"
                required
                inputMode="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-12 rounded-xl border border-border bg-bg px-4 text-base text-fg outline-none transition focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/40"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="clip-title" className="text-sm font-medium text-fg">
                제목{" "}
                <span className="font-normal text-fg-muted">(선택 · 비우면 자동)</span>
              </label>
              <input
                id="clip-title"
                name="title"
                type="text"
                maxLength={80}
                placeholder="공유 카드에 보일 제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12 rounded-xl border border-border bg-bg px-4 text-base text-fg outline-none transition focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/40"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="clip-tags" className="text-sm font-medium text-fg">
                태그{" "}
                <span className="font-normal text-fg-muted">(선택 · 쉼표로 구분)</span>
              </label>
              <input
                id="clip-tags"
                name="tags"
                type="text"
                placeholder="개발, 디자인, 읽을거리"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="h-12 rounded-xl border border-border bg-bg px-4 text-base text-fg outline-none transition focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/40"
              />
              {tags.length > 0 && (
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-strong"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="submit"
              disabled={!hasInput || loading}
              className="h-12 rounded-xl bg-brand px-5 text-base font-semibold text-white transition hover:bg-brand-strong focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "내용 불러오는 중…" : "내용 가져오기"}
            </button>
          </div>
        </form>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        )}

        {noMeta && meta?.reason && (
          <p
            role="status"
            className="mt-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-fg"
          >
            ⚠️ {meta.reason}
          </p>
        )}

        <section className="mt-10" aria-label="공유 카드 미리보기">
          <h2 className="mb-3 text-sm font-medium text-fg-muted">미리보기</h2>
          <div
            className="flex aspect-[1200/630] w-full flex-col justify-end rounded-2xl p-6 shadow-soft sm:p-8"
            style={{ background: gradientCss(gradient) }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
              {meta?.siteName ?? "ClipNote"}
            </p>
            <p className="mt-2 line-clamp-2 text-2xl font-bold leading-tight text-white drop-shadow-sm sm:text-3xl">
              {effectiveTitle}
            </p>
            {description && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/90">
                {description}
              </p>
            )}
            {url && (
              <p className="mt-2 truncate text-sm text-white/80">{prettyHost(url)}</p>
            )}
          </div>

          {image && (
            <figure className="mt-4 overflow-hidden rounded-xl border border-border">
              {/* 원본 대표 이미지 (외부 호스트). 로드 실패 시 자동 숨김 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={`${effectiveTitle} 대표 이미지`}
                className="max-h-72 w-full object-cover"
                onError={(e) => {
                  (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                }}
              />
            </figure>
          )}

          <p className="mt-3 text-center text-xs text-fg-muted">
            배경색은 제목에 따라 자동으로 정해져요
            {meta && meta.source !== "none" ? ` · 내용 출처: ${sourceLabel(meta.source)}` : ""}
          </p>
        </section>

        <section className="mt-8" aria-label="공유 링크 만들기">
          <button
            type="button"
            onClick={handleCreateShare}
            disabled={!hasInput || creating}
            className="h-12 w-full rounded-xl border border-brand bg-brand-soft px-5 text-base font-semibold text-brand-strong transition hover:bg-brand hover:text-white focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "만드는 중…" : "공유 링크 만들기"}
          </button>

          {shareUrl && (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
              <p className="text-sm font-medium text-fg">공유 링크가 만들어졌어요 🎉</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="share-url"
                  readOnly
                  value={shareUrl}
                  aria-label="공유 링크"
                  className="h-11 flex-1 rounded-lg border border-border bg-bg px-3 text-sm text-fg outline-none"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-strong"
                  >
                    {copied ? "복사됨" : "복사"}
                  </button>
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold text-fg transition hover:bg-bg"
                  >
                    열기
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-3xl px-5 py-6 text-center text-xs text-fg-muted">
          © 2026 ClipNote
        </div>
      </footer>
    </div>
  );
}

/** 메타 출처를 사람이 읽기 좋은 라벨로. */
function sourceLabel(source: ClipMetadata["source"]): string {
  switch (source) {
    case "adapter":
      return "사이트 전용 추출";
    case "og":
      return "OG 태그";
    case "html":
      return "HTML";
    default:
      return "없음";
  }
}

/** URL에서 보기 좋은 호스트+경로 일부 추출. 실패 시 원문 반환. */
function prettyHost(raw: string): string {
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return (
      u.hostname.replace(/^www\./, "") + (u.pathname !== "/" ? u.pathname : "")
    );
  } catch {
    return raw;
  }
}
