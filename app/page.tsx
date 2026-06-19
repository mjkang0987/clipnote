"use client";

import { useEffect, useMemo, useState } from "react";
import { gradientCss, pickGradient } from "@/lib/gradients";
import type { ClipMetadata } from "@/lib/metadata";
import AuthNav from "@/app/_components/AuthNav";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { addLocalClip, getKnownTags, recordTags } from "@/lib/local-clips";

export default function Home() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tagInput, setTagInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<ClipMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 클립에 추가(내 클립 목록에 담기)
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // 로그인 상태: null=확인중, true/false
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [savedLocal, setSavedLocal] = useState(false);

  // 태그 자동완성: 과거에 쓴 태그
  const [knownTags, setKnownTags] = useState<string[]>([]);
  useEffect(() => {
    setKnownTags(getKnownTags());
  }, []);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setIsLoggedIn(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(Boolean(data.user)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setIsLoggedIn(Boolean(session?.user)),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const tags = useMemo(
    () =>
      tagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 6),
    [tagInput],
  );

  // 추천 태그: 과거 태그 중 아직 안 넣은 것
  const tagSuggestions = useMemo(
    () => knownTags.filter((t) => !tags.includes(t)).slice(0, 8),
    [knownTags, tags],
  );

  function addTag(tag: string) {
    if (tags.includes(tag)) return;
    setTagInput((cur) => {
      const t = cur.trim();
      if (!t) return tag;
      return t.endsWith(",") ? `${t} ${tag}` : `${t}, ${tag}`;
    });
  }

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
    setShareSlug(null);
    setAdded(false);
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
      const data = (await res.json()) as {
        slug?: string;
        shareUrl?: string;
        error?: string;
      };
      if (!res.ok || !data.shareUrl) {
        setError(data.error ?? "공유 링크 생성에 실패했어요.");
        return;
      }
      setShareUrl(data.shareUrl);
      setShareSlug(data.slug ?? null);
      recordTags(tags);
      setKnownTags(getKnownTags());
    } catch {
      setError("공유 링크 생성 중 문제가 발생했어요.");
    } finally {
      setCreating(false);
    }
  }

  // 로그인: 내 클립 목록에 담기. 공유 링크를 이미 만들었으면 그 클립을 담고,
  // 아니면 새로 만들어 담는다(공유 링크 없이도 가능).
  async function handleAddClip() {
    const sendTitle = title.trim() || meta?.title || (url ? prettyHost(url) : "");
    if (!sendTitle) {
      setError("클립을 추가하려면 제목이 필요해요. 제목을 입력해 주세요.");
      return;
    }
    setAdding(true);
    setError(null);
    setAdded(false);
    try {
      if (shareSlug) {
        const res = await fetch(`/api/clip/${shareSlug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ saved: true }),
        });
        if (!res.ok) {
          const d = (await res.json().catch(() => ({}))) as { error?: string };
          setError(d.error ?? "클립 추가에 실패했어요.");
          return;
        }
      } else {
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
            save: true,
          }),
        });
        const data = (await res.json()) as { slug?: string; error?: string };
        if (!res.ok || !data.slug) {
          setError(data.error ?? "클립 추가에 실패했어요.");
          return;
        }
        setShareSlug(data.slug);
      }
      recordTags(tags);
      setKnownTags(getKnownTags());
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    } catch {
      setError("클립 추가 중 문제가 발생했어요.");
    } finally {
      setAdding(false);
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

  // 비로그인: 이 브라우저(localStorage)에만 저장
  function handleSaveLocal() {
    const saveTitle = title.trim() || meta?.title || (url ? prettyHost(url) : "");
    if (!saveTitle) {
      setError("저장하려면 제목이 필요해요.");
      return;
    }
    addLocalClip({
      url: url.trim(),
      title: saveTitle,
      description: meta?.description ?? null,
      image: meta?.image ?? null,
      siteName: meta?.siteName ?? null,
      gradient: gradient.name,
      tags,
    });
    recordTags(tags);
    setKnownTags(getKnownTags());
    setSavedLocal(true);
    setTimeout(() => setSavedLocal(false), 1800);
  }

  const noMeta = meta?.source === "none";

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <nav className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <a
            href="/"
            className="text-lg font-bold tracking-tight text-fg"
            aria-label="ClipNote 홈"
          >
            Clip<span className="text-brand">Note</span>
          </a>
          <div className="flex items-center gap-3">
            <a
              href="/clips"
              className="text-sm font-semibold text-fg-muted transition hover:text-fg"
            >
              내 클립
            </a>
            <AuthNav />
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:py-16">
        <section className="text-center">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-fg sm:text-4xl">
            URL을 <span className="text-brand">예쁜 공유 카드</span>로
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-fg-muted">
            링크만 붙여넣으면 제목·설명·이미지를 자동으로 읽어와 예쁜 공유 카드를
            만들어요. 제목은 직접 고쳐도 돼요.
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
              <ClearableInput
                id="clip-url"
                name="url"
                type="url"
                required
                inputMode="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onClear={() => setUrl("")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="clip-title" className="text-sm font-medium text-fg">
                제목{" "}
                <span className="font-normal text-fg-muted">
                  (안 쓰면 자동으로 채워져요)
                </span>
              </label>
              <ClearableInput
                id="clip-title"
                name="title"
                type="text"
                maxLength={80}
                placeholder="공유 카드에 보일 제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onClear={() => setTitle("")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="clip-tags" className="text-sm font-medium text-fg">
                태그{" "}
                <span className="font-normal text-fg-muted">(선택 · 쉼표로 구분)</span>
              </label>
              <ClearableInput
                id="clip-tags"
                name="tags"
                type="text"
                placeholder="개발, 디자인, 읽을거리"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onClear={() => setTagInput("")}
              />
              <p className="text-xs leading-relaxed text-fg-muted">
                태그를 달아두면 <a href="/clips" className="font-semibold text-brand-strong underline">내 클립</a>에서
                같은 태그끼리 모아 볼 수 있어요. 쉼표(,)로 여러 개, 최대 6개까지요.
              </p>
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

              {tagSuggestions.length > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-fg-muted">자주 쓴 태그:</span>
                  {tagSuggestions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="rounded-full border border-border bg-bg px-2.5 py-1 text-xs font-medium text-fg-muted transition hover:border-brand hover:text-brand-strong"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!hasInput || loading}
              className="h-12 rounded-xl bg-brand px-5 text-base font-semibold text-white transition hover:bg-brand-strong focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "미리보기 만드는 중…" : "미리보기 만들기"}
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
            {meta && meta.source !== "none" ? " · 제목·설명을 자동으로 가져왔어요" : ""}
          </p>
        </section>

        <section className="mt-8" aria-label="저장 및 공유">
          {isLoggedIn === false ? (
            // 비로그인: 이 브라우저에 저장만 (공유 불가)
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSaveLocal}
                disabled={!hasInput}
                className="h-12 w-full rounded-xl border border-brand bg-brand-soft px-5 text-base font-semibold text-brand-strong transition hover:bg-brand hover:text-white focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savedLocal ? "저장됨 ✓" : "이 브라우저에 저장"}
              </button>

              {/* 로그인 전(게스트)에 쓸 수 있는 기능 안내 */}
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-sm font-semibold text-fg">
                  로그인 안 해도 이만큼 돼요
                </p>
                <ul className="mt-2 flex flex-col gap-1.5 text-sm leading-relaxed text-fg-muted">
                  <li>· 링크를 붙여넣어 미리보기 카드를 만들 수 있어요.</li>
                  <li>
                    · 만든 카드를 이 브라우저에 저장하고{" "}
                    <a href="/clips" className="font-semibold text-brand-strong underline">
                      내 클립
                    </a>
                    에서 다시 볼 수 있어요.
                  </li>
                  <li>
                    · 단, 저장한 클립은 이 기기에만 남고, 짧은 공유 링크는 만들 수
                    없어요.
                  </li>
                </ul>
                <p className="mt-3 text-sm text-fg-muted">
                  공유 링크를 만들고 어디서나 보려면{" "}
                  <a href="/login" className="font-semibold text-brand-strong underline">
                    로그인
                  </a>
                  하세요.
                </p>
              </div>
            </div>
          ) : (
            // 로그인(또는 확인 중): 공유 링크 만들기 / 내 클립에 추가 (분리)
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleCreateShare}
                disabled={!hasInput || creating || isLoggedIn === null}
                className="h-12 w-full rounded-xl border border-brand bg-brand-soft px-5 text-base font-semibold text-brand-strong transition hover:bg-brand hover:text-white focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? "만드는 중…" : "공유 링크 만들기"}
              </button>
              <button
                type="button"
                onClick={handleAddClip}
                disabled={!hasInput || adding || isLoggedIn === null}
                className="h-12 w-full rounded-xl border border-border bg-bg px-5 text-base font-semibold text-fg transition hover:bg-surface focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adding ? "추가 중…" : added ? "추가됨 ✓" : "내 클립에 추가"}
              </button>
            </div>
          )}

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

        {/* SEO/GEO: 소개·기능·FAQ */}
        <section
          className="mt-16 border-t border-border pt-10"
          aria-labelledby="about-heading"
        >
          <h2 id="about-heading" className="text-xl font-bold text-fg">
            ClipNote란?
          </h2>
          <p className="mt-3 leading-relaxed text-fg-muted">
            ClipNote(클립노트)는 긴 URL을 공유하기 좋은 형태로 바꿔 주는 무료 웹
            서비스예요. 링크를 붙여넣으면 페이지의 제목·설명·대표 이미지를 자동으로
            읽어와 카드 미리보기를 만들고, 카카오톡이나 SNS에 공유했을 때 보기 좋은
            이미지와 짧은 링크를 제공합니다. 네이버 카페 게시글, 인스타그램 릴처럼
            일반적으로 미리보기가 잘 안 잡히는 링크도 지원해요.
          </p>

          <h2 className="mt-10 text-xl font-bold text-fg">이렇게 동작해요</h2>
          <ol className="mt-3 flex flex-col gap-2 leading-relaxed text-fg-muted">
            <li>1. 공유하고 싶은 URL을 붙여넣어요.</li>
            <li>2. 제목·설명·대표 이미지를 자동으로 읽어와 카드를 만들어요.</li>
            <li>3. 로그인하면 짧은 공유 링크가 생기고, 공유 시 예쁜 카드로 떠요.</li>
          </ol>

          <h2 className="mt-10 text-xl font-bold text-fg">자주 묻는 질문</h2>
          <dl className="mt-3 flex flex-col gap-4">
            <div>
              <dt className="font-semibold text-fg">태그는 어떻게 쓰나요?</dt>
              <dd className="mt-1 leading-relaxed text-fg-muted">
                클립을 만들 때 태그 칸에 쉼표(,)로 구분해 최대 6개까지 달 수
                있어요. ‘내 클립’ 화면에서 태그를 누르면 같은 태그의 클립만 모아
                볼 수 있고, 한 번 쓴 태그는 다음에 ‘자주 쓴 태그’로 추천돼 한 번에
                넣을 수 있어요.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-fg">로그인 없이도 쓸 수 있나요?</dt>
              <dd className="mt-1 leading-relaxed text-fg-muted">
                네. 비로그인 상태에서도 URL을 이 브라우저에 저장할 수 있어요. 다만
                공유 링크 생성은 로그인(Google·Kakao)이 필요합니다.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-fg">
                네이버 카페·인스타그램 링크도 되나요?
              </dt>
              <dd className="mt-1 leading-relaxed text-fg-muted">
                네. 전용 추출 기능으로 네이버 카페 게시글 제목, 인스타그램 릴·게시물
                정보까지 가져옵니다. (비공개·멤버 전용 글은 제한될 수 있어요.)
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-fg">공유 링크를 열면 어떻게 되나요?</dt>
              <dd className="mt-1 leading-relaxed text-fg-muted">
                예쁜 미리보기 카드가 잠깐 보인 뒤 원본 페이지로 자연스럽게 이동해요.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-fg">무료인가요?</dt>
              <dd className="mt-1 leading-relaxed text-fg-muted">네, 무료로 사용할 수 있어요.</dd>
            </div>
          </dl>
        </section>

        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-5 py-6 text-center text-xs text-fg-muted">
          <span>© 2026 ClipNote</span>
          <span aria-hidden>·</span>
          <a href="/privacy" className="font-semibold hover:text-fg">
            개인정보처리방침
          </a>
        </div>
      </footer>
    </div>
  );
}

/**
 * 오른쪽에 지우기(×) 버튼이 달린 입력칸. 값이 있을 때만 버튼이 보인다.
 * 모바일에서 길게 눌러 전체 선택→삭제할 필요 없이 한 번에 비울 수 있다.
 */
function ClearableInput({
  value,
  onClear,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> & {
  onClear: () => void;
}) {
  const hasValue = String(value ?? "").length > 0;
  return (
    <div className="relative">
      <input
        {...props}
        value={value}
        className="h-12 w-full rounded-xl border border-border bg-bg pl-4 pr-12 text-base text-fg outline-none transition focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/40"
      />
      {hasValue && (
        <button
          type="button"
          onClick={onClear}
          aria-label="입력 지우기"
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-fg-muted transition hover:bg-border hover:text-fg active:scale-90"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
            <path
              d="M6 6l8 8M14 6l-8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

// FAQ 구조화 데이터 — 검색·생성형 AI 가 질문/답을 이해하도록
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "태그는 어떻게 쓰나요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "클립을 만들 때 태그 칸에 쉼표(,)로 구분해 최대 6개까지 달 수 있어요. ‘내 클립’ 화면에서 태그를 누르면 같은 태그의 클립만 모아 볼 수 있고, 한 번 쓴 태그는 다음에 ‘자주 쓴 태그’로 추천됩니다.",
      },
    },
    {
      "@type": "Question",
      name: "로그인 없이도 쓸 수 있나요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "네. 비로그인 상태에서도 URL을 이 브라우저에 저장할 수 있어요. 공유 링크 생성은 로그인(Google·Kakao)이 필요합니다.",
      },
    },
    {
      "@type": "Question",
      name: "네이버 카페·인스타그램 링크도 되나요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "네. 전용 추출 기능으로 네이버 카페 게시글 제목, 인스타그램 릴·게시물 정보까지 가져옵니다. 비공개·멤버 전용 글은 제한될 수 있어요.",
      },
    },
    {
      "@type": "Question",
      name: "공유 링크를 열면 어떻게 되나요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "예쁜 미리보기 카드가 잠깐 보인 뒤 원본 페이지로 자연스럽게 이동해요.",
      },
    },
    {
      "@type": "Question",
      name: "무료인가요?",
      acceptedAnswer: { "@type": "Answer", text: "네, 무료로 사용할 수 있어요." },
    },
  ],
};

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
