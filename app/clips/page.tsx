"use client";

import { useEffect, useMemo, useState } from "react";
import type { Clip } from "@/lib/store";
import { gradientCss, pickGradient } from "@/lib/gradients";
import {
  getLocalClips,
  removeLocalClip,
  type LocalClip,
} from "@/lib/local-clips";
import AuthNav from "@/app/_components/AuthNav";

type Item = {
  key: string;
  title: string;
  url: string;
  host: string;
  slug: string | null; // DB(로그인)만 공유 슬러그 존재
  shared: boolean; // 공개 브릿지 링크(/[slug])가 켜졌는지. 저장만 한 클립은 false
  image: string | null; // 원본 대표이미지(있으면 썸네일)
  tags: string[];
  gradient: string;
  date: string;
  local: boolean;
};

export default function ClipsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);

  // 편집(A) / 선택·일괄(B·C) — 로그인(DB) 클립만 대상
  const [editing, setEditing] = useState<Item | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkTagOpen, setBulkTagOpen] = useState(false);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const hasAuth = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

      // 인증 미설정: 게스트 전용(localStorage) — 네트워크 불필요.
      if (!hasAuth) {
        if (!active) return;
        setLoggedIn(false);
        setItems(getLocalClips().map(localToItem));
        setLoading(false);
        return;
      }

      // 단일 요청으로 로그인 여부 + 목록을 함께 수신(별도 auth.getUser() 왕복 제거).
      try {
        const res = await fetch("/api/clips");
        const json = (await res.json()) as { loggedIn: boolean; clips: Clip[] };
        if (!active) return;
        setLoggedIn(json.loggedIn);
        setItems(
          json.loggedIn
            ? json.clips.map(dbToItem)
            : getLocalClips().map(localToItem),
        );
      } catch {
        // 네트워크 실패: 게스트 폴백
        if (!active) return;
        setLoggedIn(false);
        setItems(getLocalClips().map(localToItem));
      }
      if (active) setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  // 태그 목록(빈도순) + 활성 태그로 필터 → 날짜 그룹
  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const it of items)
      for (const t of it.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [items]);

  const filtered = useMemo(
    () => (activeTag ? items.filter((i) => i.tags.includes(activeTag)) : items),
    [items, activeTag],
  );

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  async function confirmDelete() {
    const target = pendingDelete;
    if (!target) return;
    setPendingDelete(null);

    if (target.local) {
      // 게스트: localStorage 에서 제거
      setItems(removeLocalClip(target.url).map(localToItem));
      return;
    }

    // 로그인(DB): 서버에서 삭제 후 목록에서 제거
    if (!target.slug) return;
    try {
      const res = await fetch(`/api/clip/${target.slug}`, { method: "DELETE" });
      if (res.ok) {
        setItems((cur) => cur.filter((i) => i.key !== target.key));
      }
    } catch {
      // 네트워크 실패 시 목록 유지(사용자가 재시도)
    }
  }

  // A: 단건 편집 저장(제목·태그) → PATCH
  async function saveEdit(title: string, tags: string[]) {
    const target = editing;
    if (!target?.slug) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/clip/${target.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, tags }),
      });
      const json = (await res.json()) as { clip?: Clip };
      if (res.ok && json.clip) {
        const next = dbToItem(json.clip);
        setItems((cur) => cur.map((i) => (i.key === target.key ? next : i)));
        setEditing(null);
      }
    } catch {
      // 무시(모달 유지)
    } finally {
      setBusy(false);
    }
  }

  function toggleSelect(key: string) {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function exitSelect() {
    setSelectMode(false);
    setSelected(new Set());
  }

  const selectedSlugs = useMemo(
    () =>
      items
        .filter((i) => selected.has(i.key) && i.slug)
        .map((i) => i.slug as string),
    [items, selected],
  );

  // B: 선택 일괄 삭제
  async function bulkDelete() {
    setPendingBulkDelete(false);
    if (selectedSlugs.length === 0) return;
    setBusy(true);
    try {
      await Promise.all(
        selectedSlugs.map((slug) =>
          fetch(`/api/clip/${slug}`, { method: "DELETE" }).catch(() => null),
        ),
      );
      const removed = new Set(selectedSlugs);
      setItems((cur) => cur.filter((i) => !(i.slug && removed.has(i.slug))));
      exitSelect();
    } finally {
      setBusy(false);
    }
  }

  // C: 선택 클립에 태그 일괄 적용(추가) 또는 교체
  async function bulkTags(tags: string[], mode: "add" | "replace") {
    setBulkTagOpen(false);
    const targets = items.filter((i) => selected.has(i.key) && i.slug);
    if (targets.length === 0) return;
    setBusy(true);
    try {
      const results = await Promise.all(
        targets.map(async (it) => {
          const nextTags =
            mode === "replace"
              ? tags.slice(0, 6)
              : [...new Set([...it.tags, ...tags])].slice(0, 6);
          const res = await fetch(`/api/clip/${it.slug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tags: nextTags }),
          }).catch(() => null);
          if (res && res.ok) {
            const json = (await res.json()) as { clip?: Clip };
            return json.clip ? dbToItem(json.clip) : null;
          }
          return null;
        }),
      );
      const byKey = new Map(results.filter(Boolean).map((c) => [c!.key, c!]));
      setItems((cur) => cur.map((i) => byKey.get(i.key) ?? i));
      exitSelect();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <nav className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <a href="/" className="text-lg font-bold tracking-tight text-fg">
            Clip<span className="text-brand">Note</span>
          </a>
          <AuthNav />
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-fg">내 클립</h1>
          <a href="/" className="text-sm font-semibold text-brand-strong hover:underline">
            + 새 클립
          </a>
        </div>
        <p className="mt-1 text-sm text-fg-muted">
          {loggedIn === false
            ? "이 브라우저에 저장된 클립이에요. 로그인하면 어디서나 보고 공유할 수 있어요."
            : "내 계정에 저장된 클립이에요."}
        </p>

        {/* 선택/일괄 도구 (로그인 클립만) */}
        {loggedIn && items.length > 0 && (
          <div className="mt-4 flex min-h-9 items-center justify-between gap-2">
            {selectMode ? (
              <>
                <span className="text-sm font-medium text-fg">
                  {selected.size}개 선택됨
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={selected.size === 0 || busy}
                    onClick={() => setBulkTagOpen(true)}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-fg transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    태그 적용
                  </button>
                  <button
                    type="button"
                    disabled={selected.size === 0 || busy}
                    onClick={() => setPendingBulkDelete(true)}
                    className="rounded-lg border border-danger/40 px-3 py-1.5 text-sm font-semibold text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    삭제
                  </button>
                  <button
                    type="button"
                    onClick={exitSelect}
                    className="rounded-lg px-3 py-1.5 text-sm font-semibold text-fg-muted transition hover:bg-surface"
                  >
                    취소
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setSelectMode(true)}
                className="ml-auto rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-fg transition hover:bg-surface"
              >
                선택
              </button>
            )}
          </div>
        )}

        {/* 태그 필터 */}
        {allTags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className={chipClass(activeTag === null)}
            >
              전체
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTag((cur) => (cur === t ? null : t))}
                className={chipClass(activeTag === t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="mt-10 text-center text-sm text-fg-muted">불러오는 중…</p>
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
            <p className="text-sm text-fg-muted">아직 저장한 클립이 없어요.</p>
            <a
              href="/"
              className="mt-3 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong"
            >
              첫 클립 만들기
            </a>
          </div>
        ) : filtered.length === 0 ? (
          <p className="mt-10 text-center text-sm text-fg-muted">
            ‘{activeTag}’ 태그의 클립이 없어요.
          </p>
        ) : (
          <div className="mt-6 flex flex-col gap-8">
            {groups.map((group) => (
              <section key={group.label}>
                <h2 className="mb-3 text-sm font-semibold text-fg-muted">
                  {group.label}
                </h2>
                <ul className="flex flex-col gap-3">
                  {group.items.map((item) => (
                    <ClipCard
                      key={item.key}
                      item={item}
                      onRequestDelete={setPendingDelete}
                      onEdit={() => setEditing(item)}
                      onShareMade={() =>
                        setItems((cur) =>
                          cur.map((i) =>
                            i.key === item.key ? { ...i, shared: true } : i,
                          ),
                        )
                      }
                      selectMode={selectMode}
                      selected={selected.has(item.key)}
                      onToggleSelect={() => toggleSelect(item.key)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>

      {pendingDelete && (
        <DeleteConfirmLayer
          item={pendingDelete}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}

      {editing && (
        <EditClipLayer
          item={editing}
          busy={busy}
          onCancel={() => setEditing(null)}
          onSave={saveEdit}
        />
      )}

      {bulkTagOpen && (
        <BulkTagLayer
          count={selectedSlugs.length}
          busy={busy}
          onCancel={() => setBulkTagOpen(false)}
          onApply={bulkTags}
        />
      )}

      {pendingBulkDelete && (
        <BulkDeleteConfirm
          count={selectedSlugs.length}
          busy={busy}
          onCancel={() => setPendingBulkDelete(false)}
          onConfirm={bulkDelete}
        />
      )}
    </div>
  );
}

/** 삭제 확인 레이어. 모바일은 하단 시트, 데스크톱은 가운데 모달. */
function DeleteConfirmLayer({
  item,
  onCancel,
  onConfirm,
}: {
  item: Item;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onCancel]);

  return (
    <div
      role="presentation"
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        aria-describedby="delete-desc"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-t-2xl bg-surface p-6 shadow-soft sm:rounded-2xl"
      >
        <h2 id="delete-title" className="text-lg font-bold text-fg">
          클립을 삭제할까요?
        </h2>
        <p id="delete-desc" className="mt-2 text-sm leading-relaxed text-fg-muted">
          ‘<span className="font-medium text-fg">{item.title}</span>’ 클립을
          삭제합니다. 이 작업은 되돌릴 수 없어요.
        </p>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 flex-1 rounded-xl border border-border bg-bg text-base font-semibold text-fg transition hover:bg-border/40"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className="h-12 flex-1 rounded-xl bg-danger text-base font-semibold text-white transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-danger/50"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

function ClipCard({
  item,
  onRequestDelete,
  onEdit,
  onShareMade,
  selectMode,
  selected,
  onToggleSelect,
}: {
  item: Item;
  onRequestDelete: (item: Item) => void;
  onEdit: () => void;
  onShareMade: () => void;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [sharing, setSharing] = useState(false);
  // 선택 모드는 공유 슬러그가 있는 로그인 클립만 대상
  const selectable = selectMode && Boolean(item.slug);

  async function copyShare() {
    if (!item.slug) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${item.slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 접근 실패는 무시
    }
  }

  // 브릿지 없던 클립에 공개 공유 링크를 켜고, 곧바로 복사까지.
  async function makeShare() {
    if (!item.slug || sharing) return;
    setSharing(true);
    try {
      const res = await fetch(`/api/clip/${item.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shared: true }),
      });
      if (!res.ok) return;
      onShareMade();
      await navigator.clipboard
        .writeText(`${window.location.origin}/${item.slug}`)
        .catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 실패는 무시
    } finally {
      setSharing(false);
    }
  }

  async function copyOriginal() {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedOriginal(true);
      setTimeout(() => setCopiedOriginal(false), 1500);
    } catch {
      // 클립보드 접근 실패는 무시
    }
  }

  return (
    <li
      className={`flex gap-3 rounded-2xl border bg-surface p-4 transition ${
        selected ? "border-brand ring-2 ring-brand/30" : "border-border"
      }`}
    >
      {selectable && (
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={`${item.title} 선택`}
          className="mt-1 h-4 w-4 shrink-0 accent-brand"
        />
      )}
      <div
        className="h-16 w-16 shrink-0 overflow-hidden rounded-xl"
        style={{ background: gradientCss(pickGradient(item.gradient)) }}
        aria-hidden
      >
        {item.image && (
          // 원본 썸네일. 실패하면 숨겨져 그라디언트 노출
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate font-semibold text-fg">{item.title}</p>
        <p className="truncate text-sm text-fg-muted">{item.host}</p>
        {item.tags.length > 0 && (
          <ul className="mt-1 flex flex-wrap gap-1">
            {item.tags.map((t) => (
              <li
                key={t}
                className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-strong"
              >
                {t}
              </li>
            ))}
          </ul>
        )}
        {/* 선택 모드에선 액션 숨김(체크박스로 선택만) */}
        {!selectMode && (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-fg-muted">{formatDate(item.date)}</span>
            {item.slug ? (
              item.shared ? (
                <button
                  type="button"
                  onClick={copyShare}
                  className="font-semibold text-brand-strong hover:underline"
                >
                  {copied ? "복사됨 ✓" : "공유 링크 복사"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={makeShare}
                  disabled={sharing}
                  className="font-semibold text-brand-strong hover:underline disabled:opacity-60"
                >
                  {sharing ? "만드는 중…" : copied ? "복사됨 ✓" : "공유 링크 만들기"}
                </button>
              )
            ) : null}
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-fg hover:underline"
            >
              바로가기
            </a>
            <button
              type="button"
              onClick={copyOriginal}
              className="font-semibold text-fg hover:underline"
            >
              {copiedOriginal ? "복사됨 ✓" : "원본 링크 복사"}
            </button>
            {item.slug ? (
              <button
                type="button"
                onClick={onEdit}
                className="font-semibold text-fg hover:underline"
              >
                편집
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onRequestDelete(item)}
              className="font-semibold text-danger hover:underline"
            >
              삭제
            </button>
          </div>
        )}
        {selectMode && (
          <span className="mt-2 text-xs text-fg-muted">{formatDate(item.date)}</span>
        )}
      </div>
    </li>
  );
}

function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6);
}

/** 모달 공통 래퍼: 배경 클릭/Esc 닫기 + 스크롤 잠금. */
function ModalShell({
  labelledBy,
  onClose,
  children,
}: {
  labelledBy: string;
  onClose: () => void;
  children: React.ReactNode;
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

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-t-2xl bg-surface p-6 shadow-soft sm:rounded-2xl"
      >
        {children}
      </div>
    </div>
  );
}

/** A: 단건 편집(제목·태그) */
function EditClipLayer({
  item,
  busy,
  onCancel,
  onSave,
}: {
  item: Item;
  busy: boolean;
  onCancel: () => void;
  onSave: (title: string, tags: string[]) => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [tagInput, setTagInput] = useState(item.tags.join(", "));
  const canSave = title.trim().length > 0 && !busy;

  return (
    <ModalShell labelledBy="edit-title" onClose={onCancel}>
      <h2 id="edit-title" className="text-lg font-bold text-fg">
        클립 편집
      </h2>
      <label htmlFor="edit-title-input" className="mt-4 block text-sm font-medium text-fg">
        제목
      </label>
      <input
        id="edit-title-input"
        value={title}
        maxLength={80}
        onChange={(e) => setTitle(e.target.value)}
        className="mt-1 h-11 w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/40"
      />
      <label htmlFor="edit-tags-input" className="mt-3 block text-sm font-medium text-fg">
        태그 <span className="font-normal text-fg-muted">(쉼표로 구분, 최대 6개)</span>
      </label>
      <input
        id="edit-tags-input"
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        placeholder="개발, 디자인"
        className="mt-1 h-11 w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/40"
      />
      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 flex-1 rounded-xl border border-border bg-bg text-base font-semibold text-fg transition hover:bg-border/40"
        >
          취소
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={() => onSave(title.trim().slice(0, 80), parseTags(tagInput))}
          className="h-12 flex-1 rounded-xl bg-brand text-base font-semibold text-white transition hover:bg-brand-strong focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "저장 중…" : "저장"}
        </button>
      </div>
    </ModalShell>
  );
}

/** C: 선택 클립 태그 일괄 적용/교체 */
function BulkTagLayer({
  count,
  busy,
  onCancel,
  onApply,
}: {
  count: number;
  busy: boolean;
  onCancel: () => void;
  onApply: (tags: string[], mode: "add" | "replace") => void;
}) {
  const [tagInput, setTagInput] = useState("");
  const [mode, setMode] = useState<"add" | "replace">("add");
  const tags = parseTags(tagInput);
  const canApply = tags.length > 0 && !busy;

  return (
    <ModalShell labelledBy="bulktag-title" onClose={onCancel}>
      <h2 id="bulktag-title" className="text-lg font-bold text-fg">
        태그 일괄 적용
      </h2>
      <p className="mt-1 text-sm text-fg-muted">{count}개 클립에 적용해요.</p>
      <input
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        placeholder="태그 입력 (쉼표로 구분)"
        aria-label="적용할 태그"
        className="mt-4 h-11 w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/40"
      />
      <fieldset className="mt-3 flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-fg">
          <input
            type="radio"
            name="bulktag-mode"
            checked={mode === "add"}
            onChange={() => setMode("add")}
            className="h-4 w-4 accent-brand"
          />
          기존 태그에 <span className="font-semibold">추가</span>
        </label>
        <label className="flex items-center gap-2 text-sm text-fg">
          <input
            type="radio"
            name="bulktag-mode"
            checked={mode === "replace"}
            onChange={() => setMode("replace")}
            className="h-4 w-4 accent-brand"
          />
          기존 태그를 <span className="font-semibold">이걸로 교체</span>
        </label>
      </fieldset>
      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 flex-1 rounded-xl border border-border bg-bg text-base font-semibold text-fg transition hover:bg-border/40"
        >
          취소
        </button>
        <button
          type="button"
          disabled={!canApply}
          onClick={() => onApply(tags, mode)}
          className="h-12 flex-1 rounded-xl bg-brand text-base font-semibold text-white transition hover:bg-brand-strong focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "적용 중…" : "적용"}
        </button>
      </div>
    </ModalShell>
  );
}

/** B: 선택 일괄 삭제 확인 */
function BulkDeleteConfirm({
  count,
  busy,
  onCancel,
  onConfirm,
}: {
  count: number;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell labelledBy="bulkdel-title" onClose={onCancel}>
      <h2 id="bulkdel-title" className="text-lg font-bold text-fg">
        선택한 {count}개 클립을 삭제할까요?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">
        이 작업은 되돌릴 수 없어요.
      </p>
      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 flex-1 rounded-xl border border-border bg-bg text-base font-semibold text-fg transition hover:bg-border/40"
        >
          취소
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className="h-12 flex-1 rounded-xl bg-danger text-base font-semibold text-white transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-danger/50 disabled:opacity-50"
        >
          {busy ? "삭제 중…" : "삭제"}
        </button>
      </div>
    </ModalShell>
  );
}

function chipClass(active: boolean): string {
  return active
    ? "rounded-full bg-brand px-3 py-1 text-sm font-semibold text-white"
    : "rounded-full border border-border bg-bg px-3 py-1 text-sm font-medium text-fg-muted transition hover:text-fg";
}

/* ── 날짜 그룹 ─────────────────────────────────────────────── */

function groupByDate(items: Item[]): { label: string; items: Item[] }[] {
  const now = new Date();
  const groups = new Map<string, Item[]>();
  const order: string[] = [];
  for (const item of items) {
    const label = dateGroupLabel(new Date(item.date), now);
    if (!groups.has(label)) {
      groups.set(label, []);
      order.push(label);
    }
    groups.get(label)!.push(item);
  }
  return order.map((label) => ({ label, items: groups.get(label)! }));
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function dateGroupLabel(d: Date, now: Date): string {
  const diffDays = Math.floor((startOfDay(now) - startOfDay(d)) / 86400000);
  if (diffDays <= 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return "이번 주";
  if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth())
    return "이번 달";
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

/* ── 매핑·유틸 ─────────────────────────────────────────────── */

function dbToItem(c: Clip): Item {
  return {
    key: c.slug,
    title: c.title,
    url: c.url,
    host: prettyHost(c.url),
    slug: c.slug,
    shared: c.shared,
    image: c.image,
    tags: c.tags,
    gradient: c.gradient,
    date: c.createdAt,
    local: false,
  };
}

function localToItem(c: LocalClip): Item {
  return {
    key: c.url,
    title: c.title,
    url: c.url,
    host: prettyHost(c.url),
    slug: null,
    shared: false, // 로컬(브라우저) 클립은 공개 브릿지 없음
    image: c.image,
    tags: c.tags,
    gradient: c.gradient,
    date: c.savedAt,
    local: true,
  };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function prettyHost(raw: string): string {
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return u.hostname.replace(/^www\./, "") + (u.pathname !== "/" ? u.pathname : "");
  } catch {
    return raw;
  }
}
