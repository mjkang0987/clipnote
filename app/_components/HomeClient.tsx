"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { gradientCss, pickGradient } from "@/lib/gradients";
import type { ClipMetadata } from "@/lib/metadata";
import { buildShareText } from "@/lib/shareText";
import type { Messages } from "@/lib/i18n";

import { useLocalizedPath } from "@/lib/i18n/useLocale";
import { interpolate, interpolateNode } from "@/lib/i18n/interpolate";
import Header from "@/app/_components/Header";
import Brand from "@/app/_components/Brand";
import CompareBoxes from "@/app/_components/CompareBoxes";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { addLocalClip, getKnownTags, recordTags } from "@/lib/local-clips";

/** 홈이 쓰는 사전 조각 — clips·settings·login namespace 는 이 화면에 필요 없다. */
type HomeMessages = Pick<
  Messages,
  "common" | "compare" | "home" | "homeActions" | "about" | "faq"
>;

/**
 * 주 입력장치가 터치인지 — 데스크톱(마우스/트랙패드)과 모바일을 가르는 기준.
 * macOS 의 Safari·Chrome 도 Web Share API 를 지원하기 때문에 `navigator.share` 만으로는
 * 데스크톱을 걸러낼 수 없다.
 */
const COARSE_POINTER = "(pointer: coarse)";

// 액션 버튼 스타일. 모바일에서도 좌우로 나란히 놓으므로 폭이 좁다 →
// 글자를 한 단계 줄이고(sm 이상에서 원래 크기) 줄바꿈을 막아 라벨이 잘리지 않게 한다.
//
// 폭은 `flex-1` 이 아니라 `w-full` 로 준다. `flex-1`(= flex:1 1 0%)은 세로 flex 컨테이너에서
// **높이**에 적용돼 h-12 를 덮어써 버튼이 납작해진다. `w-full` 은 가로 줄에서 균등 분할되고
// 세로에서는 높이가 그대로 유지된다.
//
// 색 규칙: **저장이 보라색 채움**(그 화면의 주 동작), 링크·복사·공유는 테두리+연보라.
const BUTTON_BASE =
  "h-12 w-full whitespace-nowrap rounded-[8px] px-4 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed sm:px-5 sm:text-base";
/** 저장(내 클립에 저장·이 브라우저에 저장) — 보라 채움 */
const PRIMARY_BUTTON = `${BUTTON_BASE} bg-brand text-white hover:bg-brand-strong disabled:opacity-50`;
/** 링크·복사·공유(링크 만들기·링크 복사·원본 복사·공유하기) — 테두리 + 연보라 */
const SECONDARY_BUTTON = `${BUTTON_BASE} border border-brand bg-brand-soft text-brand-strong hover:bg-brand hover:text-white disabled:opacity-60`;

function subscribePointer(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const query = window.matchMedia(COARSE_POINTER);
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

/**
 * 네이티브 공유 시트를 노출할 환경인지 — 공유 API 지원 **그리고** 터치 기기.
 *
 * 서버에는 `navigator` 가 없어 렌더 중에 읽으면 하이드레이션이 어긋난다. 서버 스냅샷을
 * `false` 로 두고 클라이언트에서만 실제 값을 읽는다(`useSyncExternalStore` — 효과 안에서
 * setState 하지 않아도 되고 하이드레이션도 안전하다).
 */
function useCanShare(): boolean {
  return useSyncExternalStore(
    subscribePointer,
    () =>
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      window.matchMedia(COARSE_POINTER).matches,
    () => false,
  );
}

/**
 * 홈 화면 본문. 로그인 상태는 **서버에서 판정해 받는다**(`initialLoggedIn`).
 *
 * 클라이언트에서만 판정하면 첫 렌더에 상태를 몰라 버튼 구성과 안내문이 뒤늦게 끼어들면서
 * 화면이 밀린다(CLS). 서버가 쿠키로 먼저 판정하면 SSR 출력에 올바른 버튼이 처음부터 들어간다.
 */
export default function HomeClient({
  messages,
  initialLoggedIn,
}: {
  /** 서버에서 고른 사전 — 이 화면이 쓰는 namespace 만 받는다(ClipsClient 주석 참고). */
  messages: HomeMessages;
  initialLoggedIn: boolean;
}) {
  const t = messages.homeActions;
  const h = messages.home;
  const c = messages.common;
  const a = messages.about;
  const f = messages.faq;
  // FAQ 는 화면과 JSON-LD 가 같은 배열을 쓴다(문구가 어긋나지 않게).
  const faqs = useMemo(() => faqItems(messages), [messages]);
  // 본문 안내문의 내부 링크도 현재 로케일을 유지한다(`/en` 에서 한국어 페이지로 새지 않게).
  const path = useLocalizedPath();
  // 데스크톱 등 미지원 환경에서는 공유하기 버튼을 아예 노출하지 않는다(복사하기만 남는다).
  const canShare = useCanShare();
  // 게스트 버튼이 2개뿐인 경우(= 공유하기 미지원 = 사실상 데스크톱).
  // 이때만 넓은 화면에서 한 줄로 놓는다.
  const twoUp = !canShare;
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tagInput, setTagInput] = useState("");

  // 메타 자동 추출 진행 중
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<ClipMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  // 결과 레이어 표시 여부. `shareUrl` 과 분리한다 — 레이어를 닫아도 링크는 남아 있어야
  // 1차 버튼이 `링크 복사` 로 바뀔 수 있다(닫을 때 shareUrl 을 지우면 링크를 잃는다).
  const [layerOpen, setLayerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [plainCopied, setPlainCopied] = useState(false);

  // 클립에 추가(내 클립 목록에 담기)
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [alreadySaved, setAlreadySaved] = useState(false);

  // 로그인 상태 — 서버 판정값으로 시작하므로 "확인 중" 구간이 없다(자리표시 스켈레톤 불필요).
  const [isLoggedIn, setIsLoggedIn] = useState(initialLoggedIn);
  const [savedLocal, setSavedLocal] = useState(false);

  // 태그 자동완성: 과거에 쓴 태그
  const [knownTags, setKnownTags] = useState<string[]>([]);

  // 자동 추출 추적: 마지막으로 받은 URL, 진행 중 요청 취소용
  const fetchedUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setKnownTags(getKnownTags());
  }, []);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setIsLoggedIn(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    // getUser() 는 인증 서버에 왕복해 JWT 를 검증한다 → 그동안 isLoggedIn 이 null 로 남아
    // 버튼 영역이 자리표시로 비어 있고, 응답이 오는 순간 아래 안내문이 끼어들어 레이아웃이 밀렸다.
    // 여기서 필요한 건 "어떤 버튼을 보일지"라는 표시용 판단이라 로컬 세션으로 충분하다
    // (실제 권한 검사는 서버 API 라우트에서 한다). getSession() 은 저장된 세션을 즉시 준다.
    supabase.auth
      .getSession()
      .then(({ data }) => setIsLoggedIn(Boolean(data.session?.user)));
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
    title.trim() ||
    meta?.title ||
    (url ? prettyHost(url) : h.preview.titlePlaceholder);
  const description = meta?.description ?? null;
  const image = meta?.image ?? null;

  // 미리보기 썸네일은 원본 이미지를 브라우저가 직접 부르면 hotlink/referer·혼합콘텐츠로
  // 자주 막히므로, 우리 서버 프록시(/api/image)를 거쳐 불러온다.
  const proxiedImage = image
    ? `/api/image?url=${encodeURIComponent(image)}`
    : null;

  const seed = title.trim() || meta?.title || url || "clipnote";
  const gradient = useMemo(() => pickGradient(seed), [seed]);

  const hasInput = url.trim().length > 0;

  // 자동 추출 대상이 될 만한 URL 인지(파싱 통과 + 호스트에 점).
  function isFetchableUrl(raw: string): boolean {
    const t = raw.trim();
    if (!t) return false;
    try {
      const u = new URL(t.startsWith("http") ? t : `https://${t}`);
      return u.hostname.includes(".");
    } catch {
      return false;
    }
  }

  // 메타 추출(자동/수동 공용). 직전 진행 요청은 취소하고, 같은 URL 이면 캐시 재사용.
  // 반환: 받은 메타(또는 null) — 호출부에서 이어서 공유 생성에 사용.
  async function loadMeta(
    rawUrl: string,
    opts?: { force?: boolean },
  ): Promise<ClipMetadata | null> {
    const target = rawUrl.trim();
    if (!isFetchableUrl(target)) return null;
    if (!opts?.force && fetchedUrlRef.current === target && meta) return meta;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/metadata?url=${encodeURIComponent(target)}`,
        {
          signal: controller.signal,
        },
      );
      const data = (await res.json()) as ClipMetadata;
      if (controller.signal.aborted) return null;
      setMeta(data);
      fetchedUrlRef.current = target;
      // 입력란이 비어 있으면 자동 제목으로 채움(함수형 업데이트 → stale 클로저 회피).
      const fetchedTitle = data.title;
      if (fetchedTitle) setTitle((prev) => (prev.trim() ? prev : fetchedTitle));
      return data;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return null;
      setError(h.errors.metaFailed);
      return null;
    } finally {
      // 더 새로운 요청으로 교체된 경우 loading 은 그 요청이 관리
      if (abortRef.current === controller) setLoading(false);
    }
  }

  // URL 이 바뀌면 이전 메타 무효화 + 유효하면 디바운스(600ms) 후 자동 추출.
  useEffect(() => {
    const t = url.trim();
    if (fetchedUrlRef.current && fetchedUrlRef.current !== t) {
      fetchedUrlRef.current = null;
      setMeta(null);
      // URL 이 바뀌면 이전 링크는 더 이상 이 입력과 맞지 않으므로 버린다 → 1차 버튼이
      // `링크 복사` 에서 `링크 만들기` 로 되돌아간다.
      setShareUrl(null);
      setLayerOpen(false);
      setAdded(false);
      setTitle(""); // URL 바뀌면 제목 초기화 → 새 URL 제목으로 다시 채워짐
    }
    if (!isFetchableUrl(t) || fetchedUrlRef.current === t) return;
    const id = setTimeout(() => {
      void loadMeta(t);
    }, 600);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // 붙여넣기: 디바운스 기다리지 말고 즉시 추출(전체 URL 을 붙였을 때만).
  function handleUrlPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text");
    if (pasted && isFetchableUrl(pasted)) {
      e.preventDefault();
      setUrl(pasted);
      void loadMeta(pasted, { force: true });
    }
  }

  // 1차 액션. 로그인=공유 링크 생성(메타 없으면 먼저 추출), 비로그인=이 브라우저에 저장.
  async function handlePrimary() {
    if (!hasInput || creating || adding) return;
    if (isLoggedIn === false) {
      handleSaveLocal();
      return;
    }
    let m = meta;
    if (!m || fetchedUrlRef.current !== url.trim()) {
      m = await loadMeta(url.trim(), { force: !m });
    }
    await handleCreateShare(m ?? meta);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handlePrimary();
  }

  // m: 사용할 메타데이터(기본 state). 자동 추출 직후 호출 시 방금 받은 값을 직접 넘긴다.
  async function handleCreateShare(m: ClipMetadata | null = meta) {
    const sendTitle = title.trim() || m?.title || "";
    if (!sendTitle) {
      setError(h.errors.titleRequiredForLink);
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
          description: m?.description ?? null,
          image: m?.image ?? null,
          siteName: m?.siteName ?? null,
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
        setError(data.error ?? h.errors.linkCreateFailed);
        return;
      }
      setShareUrl(data.shareUrl);
      setLayerOpen(true);
      recordTags(tags);
      setKnownTags(getKnownTags());
    } catch {
      setError(h.errors.linkCreateError);
    } finally {
      setCreating(false);
    }
  }

  // 로그인: 내 클립 목록에 담기(폼의 '내 클립에 저장' 또는 결과 모달에서 호출).
  // m: 사용할 메타데이터(기본 state). 자동 추출 직후 호출 시 방금 받은 값을 직접 넘긴다.
  // 같은 URL 은 서버가 중복 없이 재사용.
  async function handleAddClip(m: ClipMetadata | null = meta) {
    const sendTitle = title.trim() || m?.title || (url ? prettyHost(url) : "");
    if (!sendTitle) {
      setError(h.errors.titleRequiredForClip);
      return;
    }
    setAdding(true);
    setError(null);
    setAdded(false);
    try {
      const res = await fetch("/api/clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          title: sendTitle,
          description: m?.description ?? null,
          image: m?.image ?? null,
          siteName: m?.siteName ?? null,
          tags,
          gradient: gradient.name,
          save: true,
        }),
      });
      const data = (await res.json()) as {
        slug?: string;
        error?: string;
        alreadySaved?: boolean;
      };
      if (!res.ok || !data.slug) {
        setError(data.error ?? h.errors.clipAddFailed);
        return;
      }
      recordTags(tags);
      setKnownTags(getKnownTags());
      setAlreadySaved(Boolean(data.alreadySaved));
      setAdded(true);
    } catch {
      setError(h.errors.clipAddError);
    } finally {
      setAdding(false);
    }
  }

  // 내 클립에 저장만: 공유 링크 모달 없이 바로 저장. 메타 없으면 먼저 추출.
  async function handleSaveToClips() {
    if (!hasInput || creating || adding) return;
    let m = meta;
    if (!m || fetchedUrlRef.current !== url.trim()) {
      m = await loadMeta(url.trim(), { force: !m });
    }
    await handleAddClip(m ?? meta);
  }

  async function handleCopy() {
    if (!shareUrl) return;
    // 제목 + 링크만 복사(빈 값은 줄에서 제외). 설명은 길어서 제외.
    // 제목 길이 제한·말줄임은 `lib/shareText.ts`가 담당(웹·앱 공통 규약).
    const copyTitle = title.trim() || meta?.title || "";
    const text = buildShareText(copyTitle, shareUrl);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  // 게스트 공유/복사 텍스트 — 카드 생성 없이 스크랩된 제목 + 원본 URL.
  function plainShareText() {
    const t = title.trim() || meta?.title || "";
    return buildShareText(t, url.trim());
  }

  async function handlePlainCopy() {
    if (!hasInput) return;
    try {
      await navigator.clipboard.writeText(plainShareText());
      setPlainCopied(true);
      setTimeout(() => setPlainCopied(false), 1500);
    } catch {
      setPlainCopied(false);
    }
  }

  async function handleNativeShare() {
    if (!hasInput) return;
    // 지원 기기: 네이티브 공유 시트. 미지원(주로 데스크톱): 복사로 폴백.
    if (navigator.share) {
      try {
        await navigator.share({ text: plainShareText() });
      } catch {
        // 사용자 취소 등은 무시
      }
      return;
    }
    await handlePlainCopy();
  }

  // 비로그인: 이 브라우저(localStorage)에만 저장
  function handleSaveLocal() {
    const saveTitle =
      title.trim() || meta?.title || (url ? prettyHost(url) : "");
    if (!saveTitle) {
      setError(h.errors.titleRequiredForSave);
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

  // 1차 버튼 라벨·비활성
  const primaryLabel =
    isLoggedIn === false
      ? savedLocal
        ? t.saved
        : t.saveHere
      : creating
        ? t.creating
        : loading
          ? t.loadingMeta
          : // "공유"를 빼서 짧게 — 링크 생성 후 바뀌는 `링크 복사` 와 어휘를 맞추고,
            // 모바일 좌우 배치의 좁은 폭에도 들어간다. 성격 설명은 버튼 아래 안내문에서 한다.
            t.createLink;
  const primaryDisabled = !hasInput || creating || adding || loading;
  // '내 클립에 저장' 버튼(로그인 사용자용) 라벨·비활성
  const saveClipLabel = adding
    ? t.saving
    : added
      ? alreadySaved
        ? t.alreadySaved
        : t.saved
      : t.saveToClips;
  const saveClipDisabled = primaryDisabled || added;

  return (
    <div className="flex flex-1 flex-col">
      <Header messages={messages} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-3 sm:px-5 sm:py-8">
        <section className="py-4 text-center sm:py-8">
          {/* text-balance: 언어마다 문장 길이가 달라 줄바꿈이 한 글자만 넘어가는 일이 생긴다
              (일본어에서 마지막 「に」만 다음 줄로 떨어졌다). 두 줄을 고르게 나눈다. */}
          <h1 className="text-balance text-2xl font-bold leading-tight tracking-tight text-fg sm:text-3xl">
            {interpolateNode(h.hero.title, {
              accent: <span className="text-brand">{h.hero.titleAccent}</span>,
            })}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-fg-muted sm:text-base">
            {h.hero.subtitle}
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className="mt-3 rounded-xl border border-border bg-surface p-3.5 shadow-soft sm:mt-5 sm:p-5"
          aria-label={h.form.label}
        >
          <div className="flex flex-col gap-3 sm:gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="clip-url" className="text-sm font-medium text-fg">
                {h.form.urlLabel} <span className="text-danger">*</span>
              </label>
              <ClearableInput
                id="clip-url"
                name="url"
                type="url"
                required
                inputMode="url"
                placeholder={h.form.urlPlaceholder}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onPaste={handleUrlPaste}
                onClear={() => setUrl("")}
                clearLabel={h.clearInputAria}
              />
              <p className="text-xs leading-relaxed text-fg-muted">
                {h.form.urlHint}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="clip-title"
                className="text-sm font-medium text-fg"
              >
                {h.form.titleLabel}{" "}
                <span className="font-normal text-fg-muted">
                  {h.form.titleNote}
                </span>
              </label>
              <ClearableInput
                id="clip-title"
                name="title"
                type="text"
                maxLength={80}
                placeholder={h.form.titlePlaceholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onClear={() => setTitle("")}
                clearLabel={h.clearInputAria}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="clip-tags"
                className="text-sm font-medium text-fg"
              >
                {h.form.tagsLabel}{" "}
                <span className="font-normal text-fg-muted">
                  {h.form.tagsNote}
                </span>
              </label>
              <ClearableInput
                id="clip-tags"
                name="tags"
                type="text"
                placeholder={h.form.tagsPlaceholder}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onClear={() => setTagInput("")}
                clearLabel={h.clearInputAria}
              />
              <p className="text-xs leading-relaxed text-fg-muted">
                {interpolateNode(h.form.tagsHint, {
                  clips: (
                    <a
                      href={path("/clips")}
                      className="font-semibold text-brand-strong underline"
                    >
                      {c.myClips}
                    </a>
                  ),
                })}
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
                  <span className="text-xs text-fg-muted">
                    {h.form.frequentTags}
                  </span>
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

            {/* 1차 액션. 로그인 상태는 서버에서 받아 첫 렌더부터 확정이라 자리표시가 없다. */}
            {isLoggedIn ? (
              // 버튼 3개 → 링크·복사를 한 줄에 묶고, 저장은 자기 줄을 전부 쓴다.
              // 1차: 링크가 없으면 `링크 만들기`, 있으면 `링크 복사`(짧은 주소).
              // `원본 복사`(제목+원본 URL)는 링크 유무와 무관하게 항상 노출.
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  {shareUrl ? (
                    <button
                      type="button"
                      onClick={handleCopy}
                      className={SECONDARY_BUTTON}
                    >
                      {copied ? t.copied : t.copyLink}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={primaryDisabled}
                      className={SECONDARY_BUTTON}
                    >
                      {primaryLabel}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handlePlainCopy}
                    disabled={!hasInput}
                    className={SECONDARY_BUTTON}
                  >
                    {plainCopied ? t.copied : t.copyOriginal}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSaveToClips}
                  disabled={saveClipDisabled}
                  className={PRIMARY_BUTTON}
                >
                  {saveClipLabel}
                </button>
              </div>
            ) : (
              // 게스트도 같은 구조 — 위 줄은 공유·복사, 저장은 항상 하단 한 줄.
              // `공유하기` 는 터치 기기에서만 붙으므로 데스크톱은 위 줄이 `원본 복사` 하나다.
              //
              // 버튼이 2개뿐일 때(= 공유하기가 없을 때)는 넓은 화면에서 한 줄로 놓는다.
              // 그러지 않으면 686px 짜리 버튼 두 개가 세로로 쌓여 화면을 낭비한다.
              // 3개일 때는 위 줄 2개 + 저장 한 줄이라는 기존 구조를 그대로 둔다.
              //
              // flex-row 가 아니라 grid 인 이유: flex 항목은 `min-width: auto` 라
              // min-content 아래로 줄지 않아 두 버튼 폭이 319/359 로 어긋났다.
              // `grid-cols-2`(= minmax(0,1fr) 2개)는 그 하한이 없어 정확히 반씩 나뉜다.
              <div
                className={`flex flex-col gap-2 ${twoUp ? "sm:grid sm:grid-cols-2" : ""}`}
              >
                <div className="flex w-full gap-2">
                  {canShare && (
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      disabled={!hasInput}
                      className={SECONDARY_BUTTON}
                    >
                      {t.share}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handlePlainCopy}
                    disabled={!hasInput}
                    className={SECONDARY_BUTTON}
                  >
                    {plainCopied ? t.copied : t.copyOriginal}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={primaryDisabled}
                  className={PRIMARY_BUTTON}
                >
                  {primaryLabel}
                </button>
              </div>
            )}
            {isLoggedIn === false && (
              <p className="text-center text-xs text-fg-muted">
                {interpolateNode(t.guestHint, {
                  login: (
                    <a
                      href={path("/login")}
                      className="font-semibold text-brand-strong underline"
                    >
                      {c.login}
                    </a>
                  ),
                })}
              </p>
            )}
            {/* 버튼 이름만으로는 두 동작의 차이를 알 수 없어 한 줄로 설명한다.
                링크를 만든 뒤에는 결과 레이어가 같은 설명을 담고 있어 반복하지 않는다. */}
            {isLoggedIn && (
              <p className="text-center text-xs leading-relaxed text-fg-muted">
                {shareUrl ? t.hintAfterLink : t.hintBeforeLink}
              </p>
            )}
          </div>
        </form>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-[8px] bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        )}

        {noMeta && meta?.reason && (
          <p
            role="status"
            className="mt-4 rounded-[8px] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-fg"
          >
            ⚠️ {meta.reason}
          </p>
        )}

        {/* URL 입력 전엔 빈 카드를 숨기고, 링크가 들어오면 두 미리보기를 보여준다. */}
        {hasInput && (
          <>
            {/* ① 공유 카드: 링크를 공유했을 때 보이는 이미지 */}
            <section
              className="mt-10 sm:mt-12"
              aria-label={h.cardPreview.sectionAria}
            >
              <div className="mb-2">
                <h2 className="flex items-center gap-2 text-base font-semibold text-fg">
                  {h.cardPreview.title}
                  {loading && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-strong">
                      <Spinner /> {h.cardPreview.loading}
                    </span>
                  )}
                </h2>
                <p className="mt-0.5 text-xs text-fg-muted">
                  {h.cardPreview.note}
                </p>
              </div>
              {/* 실제 OG(/api/og, 1200×630)의 비율·폰트·여백을 cqw 로 그대로 축소 복제 */}
              <div
                className="overflow-hidden rounded-xl shadow-soft"
                style={{ containerType: "inline-size" }}
              >
                <div
                  className="relative flex aspect-[1200/630] w-full flex-col justify-end"
                  style={{ background: gradientCss(gradient), padding: "6cqw" }}
                >
                  {/* 원본 대표 이미지가 있으면 배경으로 깔고, 로드 실패 시 숨겨 그라디언트가 보이게 함 */}
                  {proxiedImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={proxiedImage}
                      alt=""
                      aria-hidden
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                  {/* 원본 이미지가 있으면 실제 공유 시 그 이미지가 그대로 뜬다(ClipNote 텍스트 오버레이 없음).
                  이미지 위 텍스트는 가독성이 떨어지므로 이미지가 없을 때만 스크림·텍스트를 그린다. */}
                  {!image && (
                    <>
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%]"
                        style={{
                          backgroundImage:
                            "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.28))",
                        }}
                      />
                      {meta?.siteName && (
                        <p
                          className="relative truncate font-bold uppercase"
                          style={{
                            fontSize: "2.17cqw",
                            letterSpacing: "0.17cqw",
                            color: "rgba(255,255,255,0.92)",
                          }}
                        >
                          {meta.siteName}
                        </p>
                      )}
                      <p
                        className="relative line-clamp-3 font-bold text-white"
                        style={{
                          fontSize:
                            effectiveTitle.length > 40 ? "5cqw" : "6cqw",
                          lineHeight: 1.15,
                          marginTop: "1.5cqw",
                        }}
                      >
                        {effectiveTitle}
                      </p>
                      {description && (
                        <p
                          className="relative line-clamp-2"
                          style={{
                            fontSize: "2.5cqw",
                            lineHeight: 1.4,
                            marginTop: "1.83cqw",
                            color: "rgba(255,255,255,0.9)",
                          }}
                        >
                          {description}
                        </p>
                      )}
                      <p
                        className="relative font-bold"
                        style={{
                          fontSize: "2cqw",
                          marginTop: "2.5cqw",
                          color: "rgba(255,255,255,0.95)",
                        }}
                      >
                        ClipNote
                      </p>
                    </>
                  )}
                </div>
              </div>
              <p className="mt-1.5 text-xs text-fg-muted">
                {h.cardPreview.caption}
              </p>
            </section>

            {/* ② 내 클립 저장 모습: 목록에서 보이는 카드(왼쪽 썸네일 = 원본 이미지) */}
            <section
              className="mt-10 sm:mt-12"
              aria-label={h.clipPreview.sectionAria}
            >
              <div className="mb-2">
                <h2 className="text-base font-semibold text-fg">
                  {h.clipPreview.title}
                </h2>
                <p className="mt-0.5 text-xs text-fg-muted">
                  {h.clipPreview.note}
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 shadow-soft">
                <div
                  className="h-14 w-14 shrink-0 overflow-hidden rounded-[8px]"
                  style={{ background: gradientCss(gradient) }}
                  aria-hidden
                >
                  {proxiedImage && (
                    // 원본 대표 이미지 = 목록 썸네일. 로드 실패 시 그라디언트가 보임.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={proxiedImage}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate font-semibold text-fg">
                    {effectiveTitle}
                  </p>
                  {url && (
                    <p className="truncate text-sm text-fg-muted">
                      {prettyHost(url)}
                    </p>
                  )}
                  {tags.length > 0 && (
                    <ul className="mt-1 flex flex-wrap gap-1">
                      {tags.map((tag) => (
                        <li
                          key={tag}
                          className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-strong"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <p className="mt-1.5 text-xs text-fg-muted">
                {h.clipPreview.caption}
              </p>
            </section>
          </>
        )}

        {/* 게스트 안내는 버튼 아래 한 줄(`homeActions.guestHint`)과 아래 소개의
            `로그인 하면 / 안 해도` 비교로 충분하다 — 같은 내용을 세 번 보여주던 박스를 없앴다. */}

        {/* SEO/GEO: 소개·기능·FAQ */}
        <section
          className="mt-8 border-t border-border pt-6 sm:mt-16 sm:pt-10"
          aria-labelledby="about-heading"
        >
          <h2 id="about-heading" className="text-xl font-bold text-fg">
            <Brand iconClassName="h-6 w-6">{a.titleSuffix}</Brand>
          </h2>
          <p className="mt-3 leading-relaxed text-fg-muted">{a.body1}</p>
          <p className="mt-2 leading-relaxed text-fg-muted">{a.body2}</p>
          <p className="mt-2 leading-relaxed text-fg-muted">{a.body3}</p>

          <h2 className="mt-8 text-xl font-bold text-fg sm:mt-10">
            {a.howTitle}
          </h2>
          {/* 실제 버튼 이름을 사전에서 끌어와 넣는다 — 버튼 라벨을 바꾸면 사용법도 따라 바뀐다. */}
          <ol className="mt-3 flex flex-col gap-2 leading-relaxed text-fg-muted">
            <li>1. {a.how1}</li>
            <li>
              2.{" "}
              {interpolate(a.how2, {
                createLink: t.createLink,
                copyLink: t.copyLink,
              })}
            </li>
            <li>3. {interpolate(a.how3, { copyOriginal: t.copyOriginal })}</li>
            <li>
              4.{" "}
              {interpolate(a.how4, {
                saveToClips: t.saveToClips,
                saveHere: t.saveHere,
              })}
            </li>
          </ol>

          {/* 로그인/게스트 비교 — `/login` 과 같은 컴포넌트·같은 문구를 쓴다. */}
          <CompareBoxes
            messages={messages}
            className="mt-5 grid gap-3 sm:grid-cols-2"
          />

          <h2 className="mt-8 text-xl font-bold text-fg sm:mt-10">{f.title}</h2>
          {/* 질문·답변은 `faqItems()` 하나에서 나온다 — 아래 JSON-LD 도 같은 값을 쓴다. */}
          <dl className="mt-3 flex flex-col gap-4">
            {faqs.map((item) => (
              <div key={item.q}>
                <dt className="font-semibold text-fg">{item.q}</dt>
                <dd className="mt-1 leading-relaxed text-fg-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }}
        />
      </main>

      {shareUrl && layerOpen && (
        <ShareResultLayer
          messages={messages}
          url={shareUrl}
          copied={copied}
          onCopy={handleCopy}
          onSave={() => handleAddClip()}
          saving={adding}
          saved={added}
          alreadySaved={alreadySaved}
          onClose={() => {
            // 링크는 남긴다 — 레이어를 닫으면 1차 버튼이 `링크 복사` 로 바뀌어야 한다.
            // (URL 을 바꾸면 그때 shareUrl 을 버려 `링크 만들기` 로 되돌아간다.)
            setLayerOpen(false);
            setCopied(false);
          }}
        />
      )}
    </div>
  );
}

/** 공유 링크 생성 결과 레이어(모달). 링크 복사·열기·내 클립 저장·닫기. */
function ShareResultLayer({
  messages,
  url,
  copied,
  onCopy,
  onSave,
  saving,
  saved,
  alreadySaved,
  onClose,
}: {
  messages: Pick<Messages, "common" | "home" | "homeActions">;
  url: string;
  copied: boolean;
  onCopy: () => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  alreadySaved: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const t = messages.homeActions;
  const r = messages.home.result;
  const saveLabel = saved
    ? alreadySaved
      ? r.alreadyInClips
      : r.savedToClips
    : saving
      ? t.saving
      : t.saveToClips;

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-t-xl bg-surface p-6 shadow-soft sm:rounded-xl"
      >
        <h2 id="share-title" className="text-lg font-bold text-fg">
          {r.title}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-fg-muted">{r.body}</p>
        <input
          id="share-url"
          readOnly
          value={url}
          aria-label={r.urlAria}
          onFocus={(e) => e.currentTarget.select()}
          className="mt-4 h-11 w-full rounded-[8px] border border-border bg-bg px-3 text-sm text-fg outline-none"
        />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="h-11 flex-1 rounded-[8px] bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-strong focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            {copied ? t.copied : t.copyLink}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 items-center justify-center rounded-[8px] border border-border px-4 text-sm font-semibold text-fg transition hover:bg-bg"
          >
            {r.open}
          </a>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || saved}
          className="mt-2 h-11 w-full rounded-[8px] border border-brand bg-brand-soft px-4 text-sm font-semibold text-brand-strong transition hover:bg-brand hover:text-white focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saveLabel}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 h-11 w-full rounded-[8px] text-sm font-semibold text-fg-muted transition hover:bg-bg"
        >
          {r.close}
        </button>
      </div>
    </div>
  );
}

/** 작은 로딩 스피너(자동 추출 중 표시). */
function Spinner() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2"
      />
      <path
        d="M8 2a6 6 0 0 1 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * 오른쪽에 지우기(×) 버튼이 달린 입력칸. 값이 있을 때만 버튼이 보인다.
 * 모바일에서 길게 눌러 전체 선택→삭제할 필요 없이 한 번에 비울 수 있다.
 */
function ClearableInput({
  value,
  onClear,
  clearLabel,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> & {
  onClear: () => void;
  clearLabel: string;
}) {
  const hasValue = String(value ?? "").length > 0;
  return (
    <div className="relative">
      <input
        {...props}
        value={value}
        className="h-11 w-full rounded-[8px] border border-border bg-bg pl-3.5 pr-12 text-base text-fg outline-none transition focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/40 sm:h-12 sm:pl-4"
      />
      {hasValue && (
        <button
          type="button"
          onClick={onClear}
          aria-label={clearLabel}
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

/**
 * FAQ 항목 — 화면(`<dl>`)과 구조화 데이터가 **이 배열 하나**를 공유한다.
 * 전에는 양쪽에 문구가 따로 적혀 있어서 구글 리치 결과에 화면과 다른 문장이 나갔다.
 */
function faqItems(messages: HomeMessages): { q: string; a: string }[] {
  const f = messages.faq;
  const t = messages.homeActions;
  // 버튼 이름이 들어가는 문구는 사전이 아니라 실제 라벨에서 채운다.
  const buttons = { copyLink: t.copyLink, copyOriginal: t.copyOriginal };
  const clips = { clips: messages.common.myClips };
  return [
    { q: interpolate(f.q1, buttons), a: interpolate(f.a1, buttons) },
    { q: f.q2, a: interpolate(f.a2, clips) },
    { q: f.q3, a: f.a3 },
    { q: f.q4, a: f.a4 },
    { q: f.q5, a: f.a5 },
    { q: f.q6, a: f.a6 },
  ];
}

// FAQ 구조화 데이터 — 검색·생성형 AI 가 질문/답을 이해하도록
function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
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
