"use client";

import { useEffect, useMemo, useState } from "react";
import type { Clip } from "@/lib/store";
import { gradientCss, pickGradient } from "@/lib/gradients";
import { buildShareText } from "@/lib/shareText";
import {
  clearLocalClips,
  getLocalClips,
  removeLocalClip,
  updateLocalClip,
  type LocalClip,
} from "@/lib/local-clips";
import { useLocalizedPath } from "@/lib/i18n/useLocale";
import type { Messages } from "@/lib/i18n";
import { interpolate } from "@/lib/i18n/interpolate";
import Header from "@/app/_components/Header";

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

/**
 * 내 클립 본문. 로그인 여부와 목록은 **서버에서 채워 받는다**(`app/clips/page.tsx`).
 * 마운트 후 fetch 를 기다리지 않으므로 로그인 사용자는 첫 렌더에 목록이 이미 있다.
 */
export default function ClipsClient({
  messages,
  initialLoggedIn,
  initialClips,
  initialLoadFailed,
}: {
  /** 서버에서 고른 사전 — 클라이언트 번들에 모든 언어가 실리지 않게 props 로 받는다. */
  messages: Messages;
  initialLoggedIn: boolean;
  initialClips: Clip[];
  /** 서버에서 목록 조회가 실패했는지 — 빈 목록과 구분해 재시도를 제안한다. */
  initialLoadFailed: boolean;
}) {
  const t = messages.clips;
  const c = messages.common;
  // 내부 링크는 현재 로케일을 유지한다(`/en/clips` 에서 홈으로 나갈 때 `/en` 으로).
  const path = useLocalizedPath();
  // 게스트 목록은 localStorage 라 서버에서 알 수 없다 → 마운트 후 채운다.
  const [items, setItems] = useState<Item[]>(() =>
    initialLoggedIn ? initialClips.map(dbToItem) : [],
  );
  // 서버 판정값이 그대로 유지된다(이 화면에서 로그인 상태가 바뀔 일이 없다).
  const loggedIn = initialLoggedIn;
  const [loading, setLoading] = useState(!initialLoggedIn);
  const [loadFailed, setLoadFailed] = useState(initialLoadFailed);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);

  // 편집(A) / 선택·일괄(B·C) — 로그인(DB) 클립만 대상
  const [editing, setEditing] = useState<Item | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkTagOpen, setBulkTagOpen] = useState(false);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  // 게스트→로그인 시 계정으로 옮길 로컬 클립(있으면 배너 노출)
  const [localPending, setLocalPending] = useState<LocalClip[]>([]);
  const [migrating, setMigrating] = useState(false);
  // 클립 옮기기 레이어 단계: 옮길지 묻기 → (거절 시) 삭제 경고. 경고에서 취소하면 다시 offer.
  const [migrateStep, setMigrateStep] = useState<"offer" | "discard">("offer");

  // 서버가 목록을 이미 채워줬으므로 여기서는 localStorage 만 읽는다(서버가 알 수 없는 값).
  //  - 로그인: 옮길 로컬 클립이 남아 있는지 확인 → 옮기기 레이어
  //  - 게스트: 목록 자체가 localStorage
  useEffect(() => {
    let active = true;
    // async 로 감싸 효과 본문에서 동기 setState 하지 않는다(cascading render 경고 회피).
    async function loadLocal() {
      if (initialLoggedIn) {
        const locals = getLocalClips();
        if (active && locals.length > 0) setLocalPending(locals);
        return;
      }
      if (!active) return;
      setItems(getLocalClips().map(localToItem));
      setLoading(false);
    }
    loadLocal();
    return () => {
      active = false;
    };
  }, [initialLoggedIn]);

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

  // A: 단건 편집 저장(제목·태그). 로그인=PATCH, 게스트=localStorage 갱신.
  async function saveEdit(title: string, tags: string[]) {
    const target = editing;
    if (!target) return;

    // 게스트(로컬) 클립: 서버 없이 localStorage 만 갱신
    if (!target.slug) {
      updateLocalClip(target.url, { title, tags });
      setItems((cur) =>
        cur.map((i) => (i.key === target.key ? { ...i, title, tags } : i)),
      );
      setEditing(null);
      return;
    }

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

  // 게스트 로컬 클립을 계정(DB)으로 업로드 후 로컬에서 제거.
  async function migrateLocal() {
    if (migrating || localPending.length === 0) return;
    setMigrating(true);
    const moved: string[] = [];
    for (const c of localPending) {
      try {
        const res = await fetch("/api/clip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: c.url,
            title: c.title,
            description: c.description,
            image: c.image,
            siteName: c.siteName,
            tags: c.tags,
            gradient: c.gradient,
            save: true, // 내 클립에 저장만(공개 브릿지 없음)
          }),
        });
        if (res.ok) moved.push(c.url);
      } catch {
        // 개별 실패는 건너뜀(다음 방문 때 다시 제안)
      }
    }
    moved.forEach((url) => removeLocalClip(url));
    setLocalPending(getLocalClips());
    // 업로드 결과를 반영해 DB 목록 새로고침
    try {
      const res = await fetch("/api/clips");
      const json = (await res.json()) as { loggedIn: boolean; clips: Clip[] };
      if (json.loggedIn) setItems(json.clips.map(dbToItem));
    } catch {
      // 무시(다음 로드 때 반영)
    }
    setMigrating(false);
  }

  /** 서버 렌더에서 목록 조회가 실패했을 때의 재시도 — 기존 API 경로를 그대로 쓴다. */
  async function retryLoad() {
    setLoading(true);
    try {
      const res = await fetch("/api/clips");
      const json = (await res.json()) as { loggedIn: boolean; clips: Clip[] };
      if (json.loggedIn) {
        setItems(json.clips.map(dbToItem));
        setLoadFailed(false);
      }
    } catch {
      // 실패하면 재시도 안내를 유지한다.
    } finally {
      setLoading(false);
    }
  }

  // 옮기기를 거절하면 로컬 클립은 남겨둘 곳이 없다(로그인 목록은 DB 를 보여준다) →
  // 삭제 경고를 먼저 띄우고, 거기서 취소하면 옮기기 레이어로 되돌아간다.
  function askDiscardLocal() {
    setMigrateStep("discard");
  }

  /**
   * 확인·취소를 누르지 않고 그냥 닫은 경우(배경 클릭·ESC) — 결정을 미룬 것으로 본다.
   * 로컬 클립은 그대로 두므로 다음 접속 때 목록을 읽어 레이어가 다시 뜬다.
   */
  function deferMigrate() {
    setLocalPending([]);
    setMigrateStep("offer");
  }

  /** 경고에서 확인 — 이 브라우저의 클립을 전부 지운다. 되돌릴 수 없다(서버 사본 없음). */
  function discardLocal() {
    clearLocalClips();
    setLocalPending([]);
    setMigrateStep("offer");
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
      <Header showClipsLink={false} />

      <main
        className={`mx-auto w-full max-w-3xl flex-1 px-5 py-10 ${
          selectMode ? "pb-28" : ""
        }`}
      >
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-fg">{c.myClips}</h1>
          <a href={path("/")} className="text-sm font-semibold text-brand-strong hover:underline">
            {t.newClip}
          </a>
        </div>
        <p className="mt-1 text-sm text-fg-muted">
          {loggedIn === false
            ? t.guestNote
            : t.accountNote}
        </p>

        {/* 선택 모드 진입 버튼(상단). 선택 시 도구는 하단 고정바로. */}
        {loggedIn && items.length > 0 && !selectMode && (
          <div className="mt-4 flex min-h-9 items-center justify-end">
            <button
              type="button"
              onClick={() => setSelectMode(true)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-fg transition hover:bg-surface"
            >
              {t.select}
            </button>
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
              {t.allTags}
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
          <p className="mt-10 text-center text-sm text-fg-muted">{t.loading}</p>
        ) : loadFailed ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
            <p className="text-sm text-fg-muted">
              {t.loadFailed}
            </p>
            <button
              type="button"
              onClick={retryLoad}
              disabled={loading}
              className="mt-3 inline-block rounded-[8px] bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-60"
            >
              {t.retry}
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
            <p className="text-sm text-fg-muted">{t.empty}</p>
            <a
              href={path("/")}
              className="mt-3 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong"
            >
              {t.emptyCta}
            </a>
          </div>
        ) : filtered.length === 0 ? (
          <p className="mt-10 text-center text-sm text-fg-muted">
            {interpolate(t.emptyForTag, { tag: activeTag ?? "" })}
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
                      messages={messages}
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

      {/* 선택 모드 하단 고정 도구바 — 스크롤해도 항상 보이게 */}
      {selectMode && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-5 py-3">
            <span className="text-sm font-medium text-fg">
              {interpolate(t.selectedCount, { count: selected.size })}
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={selected.size === 0 || busy}
                onClick={() => setBulkTagOpen(true)}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-fg transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.applyTags}
              </button>
              <button
                type="button"
                disabled={selected.size === 0 || busy}
                onClick={() => setPendingBulkDelete(true)}
                className="rounded-lg border border-danger/40 px-3 py-1.5 text-sm font-semibold text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {c.delete}
              </button>
              <button
                type="button"
                onClick={exitSelect}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-fg-muted transition hover:bg-surface"
              >
                {c.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {loggedIn && localPending.length > 0 && migrateStep === "offer" && (
        <MigrateLocalLayer
          count={localPending.length}
          migrating={migrating}
          onMigrate={migrateLocal}
          onDismiss={askDiscardLocal}
          onClose={deferMigrate}
        />
      )}

      {loggedIn && localPending.length > 0 && migrateStep === "discard" && (
        <DiscardLocalLayer
          count={localPending.length}
          onDiscard={discardLocal}
          onBack={() => setMigrateStep("offer")}
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
  messages,
  item,
  onRequestDelete,
  onEdit,
  onShareMade,
  selectMode,
  selected,
  onToggleSelect,
}: {
  messages: Messages;
  item: Item;
  onRequestDelete: (item: Item) => void;
  onEdit: () => void;
  onShareMade: () => void;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const t = messages.clips;
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  // 선택 모드는 공유 슬러그가 있는 로그인 클립만 대상
  const selectable = selectMode && Boolean(item.slug);

  // 복사 텍스트: 제목 + 링크(빈 값은 줄에서 제외). 설명은 길어서 제외.
  // 제목 길이 제한·말줄임은 `lib/shareText.ts`가 담당(웹·앱 공통 규약).
  function shareText() {
    const url = `${window.location.origin}/${item.slug}`;
    return buildShareText(item.title, url);
  }

  async function copyShare() {
    if (!item.slug) return;
    try {
      await navigator.clipboard.writeText(shareText());
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
      await navigator.clipboard.writeText(shareText()).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 실패는 무시
    } finally {
      setSharing(false);
    }
  }

  return (
    <li
      className={`overflow-hidden rounded-2xl border bg-surface transition ${
        selected ? "border-brand ring-2 ring-brand/30" : "border-border"
      }`}
    >
      {/* 상단: 썸네일 + 제목·호스트·태그 + (편집/삭제) */}
      <div className="flex items-center gap-3 p-4">
        {selectable && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            aria-label={interpolate(t.selectAria, { title: item.title })}
            className="h-4 w-4 shrink-0 accent-brand"
          />
        )}
        <div
          className="h-16 w-16 shrink-0 overflow-hidden rounded-xl"
          style={{ background: gradientCss(pickGradient(item.gradient)) }}
          aria-hidden
        >
          {item.image && (
            // 원본 썸네일. 실패하면 숨겨져 그라디언트 노출.
            // lazy/async 필수 — 목록은 최대 200개라 즉시 로드하면 외부 호스트 수백 곳에
            // 동시에 요청이 나가고, 느린(또는 hotlink 를 막는) 원본 하나가 전체 렌더를 붙든다.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="line-clamp-2 font-semibold text-fg sm:line-clamp-1">
            {item.title}
          </p>
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
        </div>
        {/* 편집·삭제는 우측 상단에 작게 나란히 */}
        {!selectMode && (
          <div className="flex shrink-0 items-center gap-3 self-start text-xs">
            <button
              type="button"
              onClick={onEdit}
              className="font-medium text-fg-muted transition hover:text-fg"
            >
              {t.edit}
            </button>
            <button
              type="button"
              onClick={() => onRequestDelete(item)}
              className="font-medium text-danger/80 transition hover:text-danger"
            >
              {messages.common.delete}
            </button>
          </div>
        )}
      </div>

      {/* 하단: 구분선으로 나뉜 액션 버튼바 (이미지 레이아웃) */}
      {!selectMode && (
        <div className="border-t border-border text-sm font-semibold">
          {/* 공유 링크(복사/만들기) · 바로가기. 게스트(로컬)는 바로가기만. */}
          {/* 공유 링크 관련 버튼만 보라색, 나머지(바로가기)는 기본색. */}
          <div className="flex items-stretch text-fg">
            {item.slug && (
              <>
                {item.shared ? (
                  <button
                    type="button"
                    onClick={copyShare}
                    className="flex-1 py-3 text-center text-brand-strong transition hover:bg-bg"
                  >
                    {copied ? t.copied : t.copyShareLink}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={makeShare}
                    disabled={sharing}
                    className="flex-1 py-3 text-center text-brand-strong transition hover:bg-bg disabled:opacity-60"
                  >
                    {sharing ? t.creatingShareLink : copied ? t.copied : t.createShareLink}
                  </button>
                )}
                <span className="w-px bg-border" aria-hidden />
              </>
            )}
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-3 text-center transition hover:bg-bg"
            >
              {t.openOriginal}
            </a>
          </div>
        </div>
      )}

      {selectMode && (
        <div className="px-4 pb-3 pl-[6.5rem]">
          <span className="text-xs text-fg-muted">{formatDate(item.date)}</span>
        </div>
      )}
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

/** 게스트 로컬 클립을 계정으로 옮길지 묻는 레이어 */
function MigrateLocalLayer({
  count,
  migrating,
  onMigrate,
  onDismiss,
  onClose,
}: {
  count: number;
  migrating: boolean;
  onMigrate: () => void;
  /** `취소` 버튼 — 옮기지 않겠다는 의사 표시 → 삭제 확인으로 넘어간다. */
  onDismiss: () => void;
  /** 배경 클릭·ESC — 결정을 미룬 것으로 보고 그냥 닫는다(로컬 클립 유지, 다음 접속 때 다시 뜸). */
  onClose: () => void;
}) {
  return (
    <ModalShell labelledBy="migrate-title" onClose={migrating ? () => {} : onClose}>
      <h2 id="migrate-title" className="text-lg font-bold text-fg">
        이 기기의 클립을 옮길까요?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">
        이 기기에 저장된{" "}
        <strong className="font-semibold text-brand-strong">{count}개</strong> 클립을
        계정으로 옮기면 다른 기기에서도 보이고 정리돼요. 옮긴 클립은 ‘내 클립에
        저장’ 상태가 돼요.
      </p>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onMigrate}
          disabled={migrating}
          className="h-11 flex-1 rounded-[8px] bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {migrating ? "옮기는 중…" : `${count}개 옮기기`}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={migrating}
          className="h-11 flex-1 rounded-[8px] border border-border px-4 text-sm font-semibold text-fg transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          취소
        </button>
      </div>
    </ModalShell>
  );
}

/**
 * 옮기기를 거절했을 때의 삭제 경고.
 *
 * 로그인 목록은 DB 를 보여주므로 옮기지 않은 로컬 클립은 볼 방법이 없다 → 남겨둘 자리가 없어
 * 삭제를 확인받는다. **되돌릴 수 없다**(로컬 클립은 이 브라우저에만 있고 서버 사본이 없음)
 * → 기본 동작은 '취소'(옮기기 레이어로 복귀)이고, 삭제 버튼만 위험 색으로 구분한다.
 */
function DiscardLocalLayer({
  count,
  onDiscard,
  onBack,
}: {
  count: number;
  onDiscard: () => void;
  onBack: () => void;
}) {
  return (
    <ModalShell labelledBy="discard-title" onClose={onBack}>
      <h2 id="discard-title" className="text-lg font-bold text-fg">
        이 브라우저의 클립을 삭제할까요?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">
        옮기지 않으면 이 브라우저에 저장된{" "}
        <strong className="font-semibold text-fg">{count}개</strong> 클립이 모두
        삭제됩니다. 이 클립은 이 브라우저에만 있어서{" "}
        <strong className="font-semibold text-fg">되돌릴 수 없어요.</strong>
      </p>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="h-11 flex-1 rounded-[8px] bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-strong"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="h-11 flex-1 rounded-[8px] border border-danger px-4 text-sm font-semibold text-danger transition hover:bg-danger hover:text-white"
        >
          삭제
        </button>
      </div>
    </ModalShell>
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
