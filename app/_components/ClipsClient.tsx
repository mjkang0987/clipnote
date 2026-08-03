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
// 값(LOCALE_TAGS)은 배럴이 아니라 `locales` 에서 직접 가져온다 — 배럴(`@/lib/i18n`)은
// 4개 언어 사전을 로드·병합하므로, 클라이언트 컴포넌트가 값을 가져오면 사전 전체가
// 클라이언트 번들에 실린다. 타입은 지워지므로 배럴에서 가져와도 무방하다.
import { LOCALE_TAGS, type Locale } from "@/lib/i18n/locales";
import type { Messages } from "@/lib/i18n";

/** 내 클립 화면이 쓰는 사전 조각 */
type ClipsMessages = Pick<Messages, "common" | "clips">;
import { interpolate, interpolateNode } from "@/lib/i18n/interpolate";
import Header from "@/app/_components/Header";
import RunningDino from "@/app/_components/RunningDino";

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
 * 내 클립 본문. 로그인 여부와 목록은 **서버에서 채워 받는다**(`app/_components/ClipsPage.tsx`).
 * 마운트 후 fetch 를 기다리지 않으므로 로그인 사용자는 첫 렌더에 목록이 이미 있다.
 */
export default function ClipsClient({
  messages,
  locale,
  initialLoggedIn,
  initialClips,
  initialLoadFailed,
}: {
  /**
   * 서버에서 고른 사전 — **이 화면이 쓰는 namespace 만** 받는다.
   * 언어를 하나로 줄이는 것과 별개로, 화면이 안 쓰는 사전까지 넘기면 그만큼
   * RSC 페이로드가 커진다(요청마다 새로 오므로 캐시되지도 않는다).
   */
  messages: ClipsMessages;
  /** 날짜 그룹 라벨을 `Intl` 로 만들 때 쓴다(사전에 넣지 않는다 — 아래 dateGroupLabel 주석). */
  locale: Locale;
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
  // 이 브라우저에만 남은 로컬 클립. 로그인 상태에서 목록 위 진입 줄과 전용 화면이 쓴다.
  const [localClips, setLocalClips] = useState<LocalClip[]>([]);
  const [migrating, setMigrating] = useState(false);
  // 로그인 직후 한 번 권하는 옮기기 레이어. 닫으면 진입 줄로만 남는다.
  const [migrateOpen, setMigrateOpen] = useState(false);
  // 이 브라우저에 남은 클립 화면(계정 목록 대신 본문에 들어선다).
  const [localPanel, setLocalPanel] = useState(false);
  const [pendingLocalDeleteAll, setPendingLocalDeleteAll] = useState(false);

  // 서버가 목록을 이미 채워줬으므로 여기서는 localStorage 만 읽는다(서버가 알 수 없는 값).
  //  - 로그인: 이 브라우저에 남은 클립을 읽어 진입 줄에 쓰고, 있으면 한 번 옮기기를 권한다
  //  - 게스트: 목록 자체가 localStorage
  useEffect(() => {
    let active = true;
    // async 로 감싸 효과 본문에서 동기 setState 하지 않는다(cascading render 경고 회피).
    async function loadLocal() {
      if (initialLoggedIn) {
        const locals = getLocalClips();
        if (active && locals.length > 0) {
          setLocalClips(locals);
          setMigrateOpen(true);
        }
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

  const groups = useMemo(() => groupByDate(filtered, locale), [filtered, locale]);

  /** ‘이 브라우저에 남은 클립’ 화면이 그리는 목록 — 계정 목록과 같은 카드·같은 날짜 묶음. */
  const localGroups = useMemo(
    () => groupByDate(localClips.map(localToItem), locale),
    [localClips, locale],
  );

  /** 수량 표기(`3개`·`3 clips`) — 언어마다 단위 위치가 달라 문장에서 떼어 만든다. */
  function countUnit(count: number) {
    return interpolate(t.countUnit, { count });
  }

  async function confirmDelete() {
    const target = pendingDelete;
    if (!target) return;
    setPendingDelete(null);

    if (target.local) {
      // localStorage 에서 제거. 게스트는 목록 자체가 로컬이고, 로그인 상태에서는
      // ‘이 브라우저에 남은 클립’ 화면이 이 목록을 그린다 — 둘 다 갱신해야 한다.
      const rest = removeLocalClip(target.url);
      setLocalClips(rest);
      if (!loggedIn) setItems(rest.map(localToItem));
      else if (rest.length === 0) setLocalPanel(false);
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

  // 이 브라우저의 로컬 클립을 계정(DB)으로 업로드 후 로컬에서 제거.
  async function migrateLocal() {
    if (migrating || localClips.length === 0) return;
    setMigrating(true);
    const moved: string[] = [];
    for (const c of localClips) {
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
    const rest = getLocalClips();
    setLocalClips(rest);
    setMigrateOpen(false);
    // 전량 성공이면 볼 것이 없으니 계정 목록으로 돌아간다. 남았으면 그대로 두고 보여 준다.
    if (rest.length === 0) setLocalPanel(false);
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

  /**
   * 옮기기 레이어를 닫는다 — 취소·배경 클릭·ESC 모두 같다.
   *
   * **거절해도 잃는 게 없다.** 목록 위에 ‘이 브라우저에 남은 클립 3개’ 진입 줄이 서고,
   * 거기서 언제든 다시 옮기거나 지울 수 있다. 전에는 계정 목록이 DB 만 보여줘서 옮기지
   * 않은 클립은 볼 방법이 없어졌고 — 그래서 거절하면 "그럼 지울까?" 를 물어야 했다.
   * 묻지 않고 지우는 단계는 이제 없다.
   */
  function closeMigrate() {
    setMigrateOpen(false);
  }

  /** 이 브라우저의 클립을 전부 지운다. 되돌릴 수 없다(서버 사본이 없다). */
  function deleteAllLocal() {
    clearLocalClips();
    setLocalClips([]);
    setPendingLocalDeleteAll(false);
    setLocalPanel(false);
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
      <Header messages={messages} showClipsLink={false} />

      <main
        className={`mx-auto w-full max-w-3xl flex-1 px-5 py-10 ${
          selectMode ? "pb-28" : ""
        }`}
      >
        {/* 공룡은 창 전체를 돈다(`fixed`) — 여기 두는 건 로딩 상태를 아는 자리라서다. */}
        {loading && <RunningDino />}

        {localPanel ? (
          <LocalClipsPanel
            messages={messages}
            groups={localGroups}
            count={localClips.length}
            migrating={migrating}
            onBack={() => setLocalPanel(false)}
            onMove={() => setMigrateOpen(true)}
            onDeleteAll={() => setPendingLocalDeleteAll(true)}
            onRequestDelete={setPendingDelete}
            onEdit={setEditing}
          />
        ) : (
        <>
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

        {/* ‘이 브라우저에 남은 클립’ 진입 줄 — 옮기기를 거절했을 때 그 클립으로 가는
            **유일한 길**이다. 계정 목록이 비어 있어도 그린다(안 그리면 닿을 길이 없다).
            선택 모드에서는 감춘다 — 선택 대상이 아닌 줄이 섞이면 무엇이 선택되는지 흐려진다. */}
        {loggedIn && localClips.length > 0 && !selectMode && (
          <button
            type="button"
            onClick={() => setLocalPanel(true)}
            className="mt-4 flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-left transition hover:bg-border/40"
          >
            <span className="text-sm font-medium text-fg">
              {interpolate(t.localEntry, { count: countUnit(localClips.length) })}
            </span>
            <span aria-hidden className="text-sm text-fg-muted">
              ›
            </span>
          </button>
        )}

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
        </>
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
          messages={messages}
          item={pendingDelete}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}

      {editing && (
        <EditClipLayer
          messages={messages}
          item={editing}
          busy={busy}
          onCancel={() => setEditing(null)}
          onSave={saveEdit}
        />
      )}

      {loggedIn && migrateOpen && localClips.length > 0 && (
        <MigrateLocalLayer
          messages={messages}
          count={localClips.length}
          migrating={migrating}
          onMigrate={migrateLocal}
          onDismiss={closeMigrate}
          onClose={closeMigrate}
        />
      )}

      {loggedIn && pendingLocalDeleteAll && localClips.length > 0 && (
        <LocalDeleteAllLayer
          messages={messages}
          count={localClips.length}
          onDelete={deleteAllLocal}
          onCancel={() => setPendingLocalDeleteAll(false)}
        />
      )}

      {bulkTagOpen && (
        <BulkTagLayer
          messages={messages}
          count={selectedSlugs.length}
          busy={busy}
          onCancel={() => setBulkTagOpen(false)}
          onApply={bulkTags}
        />
      )}

      {pendingBulkDelete && (
        <BulkDeleteConfirm
          messages={messages}
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
  messages,
  item,
  onCancel,
  onConfirm,
}: {
  messages: ClipsMessages;
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
          {messages.clips.deleteTitle}
        </h2>
        <p id="delete-desc" className="mt-2 text-sm leading-relaxed text-fg-muted">
          {interpolateNode(messages.clips.deleteBody, {
            title: <span className="font-medium text-fg">{item.title}</span>,
          })}
        </p>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 flex-1 rounded-xl border border-border bg-bg text-base font-semibold text-fg transition hover:bg-border/40"
          >
            {messages.common.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className="h-12 flex-1 rounded-xl bg-danger text-base font-semibold text-white transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-danger/50"
          >
            {messages.common.delete}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 이 브라우저에만 남은 클립 — 계정 목록과 **자리를 나눠** 보여 준다.
 *
 * **왜 한 목록에 합치지 않나.** 성격이 달라서다. 계정 클립은 다른 기기에서도 보이고 공유 링크를
 * 만들 수 있지만, 이 브라우저 클립은 둘 다 못 한다(slug 가 없다). 배지 하나로 구분하기엔 차이가
 * 커서 — 눌러 보고 나서야 안 되는 걸 알게 된다 — 자리를 따로 두고, 여기서만 할 수 있는 일
 * (옮기기·모두 삭제)을 위에 모은다. 앱(`LocalClipsView`)과 같은 구성이다.
 *
 * 별도 라우트로 두지 않은 이유: 라우트는 언어마다 하나씩(`/clips`, `/en/clips`, …) 있어서
 * 화면 하나를 늘리면 파일이 네 개 는다. 본문만 바꿔 끼우면 네 언어가 그대로 따라온다.
 */
function LocalClipsPanel({
  messages,
  groups,
  count,
  migrating,
  onBack,
  onMove,
  onDeleteAll,
  onRequestDelete,
  onEdit,
}: {
  messages: ClipsMessages;
  groups: { label: string; items: Item[] }[];
  count: number;
  migrating: boolean;
  onBack: () => void;
  onMove: () => void;
  onDeleteAll: () => void;
  onRequestDelete: (item: Item) => void;
  onEdit: (item: Item) => void;
}) {
  const t = messages.clips;
  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-semibold text-brand-strong transition hover:underline"
      >
        {t.localBack}
      </button>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-fg">
        {t.localTitle}
      </h1>
      <p className="mt-1 text-sm leading-relaxed text-fg-muted">{t.localIntro}</p>

      {count > 0 && (
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onMove}
            disabled={migrating}
            className="h-11 flex-1 rounded-[8px] bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {migrating ? t.migrating : t.localMove}
          </button>
          <button
            type="button"
            onClick={onDeleteAll}
            disabled={migrating}
            className="h-11 flex-1 rounded-[8px] border border-border px-4 text-sm font-semibold text-fg transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t.localDeleteAll}
          </button>
        </div>
      )}

      {count === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm text-fg-muted">{t.localEmpty}</p>
        </div>
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
                    onRequestDelete={onRequestDelete}
                    onEdit={() => onEdit(item)}
                    // 로컬 클립은 slug 가 없어 공유 링크를 만들 수 없다 — 카드가 그 버튼을
                    // 아예 그리지 않으므로 이 콜백은 불리지 않는다.
                    onShareMade={() => {}}
                    selectMode={false}
                    selected={false}
                    onToggleSelect={() => {}}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
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
  messages: ClipsMessages;
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
  messages,
  count,
  migrating,
  onMigrate,
  onDismiss,
  onClose,
}: {
  messages: ClipsMessages;
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
        {messages.clips.migrateTitle}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">
        {interpolateNode(messages.clips.migrateBody, {
          count: (
            <strong className="font-semibold text-brand-strong">
              {interpolate(messages.clips.countUnit, { count })}
            </strong>
          ),
        })}
      </p>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onMigrate}
          disabled={migrating}
          className="h-11 flex-1 rounded-[8px] bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {migrating
            ? messages.clips.migrating
            : interpolate(messages.clips.migrateConfirm, {
                count: interpolate(messages.clips.countUnit, { count }),
              })}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={migrating}
          className="h-11 flex-1 rounded-[8px] border border-border px-4 text-sm font-semibold text-fg transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          {messages.common.cancel}
        </button>
      </div>
    </ModalShell>
  );
}

/**
 * 이 브라우저에 남은 클립을 **전부** 지우는 확인.
 *
 * 되돌릴 수 없다 — 로컬 클립은 이 브라우저에만 있고 서버 사본이 없다. 그래서 기본 동작은
 * ‘취소’ 쪽에 두지 않고, 확인 버튼만 위험 색으로 채워 무엇을 누르는지 분명히 한다.
 * (옮기기를 거절했다고 자동으로 이 확인이 뜨지는 않는다 — 사용자가 직접 부를 때만 뜬다.)
 */
function LocalDeleteAllLayer({
  messages,
  count,
  onDelete,
  onCancel,
}: {
  messages: ClipsMessages;
  count: number;
  onDelete: () => void;
  onCancel: () => void;
}) {
  return (
    <ModalShell labelledBy="local-delete-title" onClose={onCancel}>
      <h2 id="local-delete-title" className="text-lg font-bold text-fg">
        {messages.clips.localDeleteAllTitle}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">
        {interpolateNode(messages.clips.localDeleteAllBody, {
          count: (
            <strong className="font-semibold text-fg">
              {interpolate(messages.clips.countUnit, { count })}
            </strong>
          ),
        })}
      </p>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 flex-1 rounded-[8px] border border-border px-4 text-sm font-semibold text-fg transition hover:bg-surface"
        >
          {messages.common.cancel}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="h-11 flex-1 rounded-[8px] bg-danger px-4 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {messages.common.delete}
        </button>
      </div>
    </ModalShell>
  );
}

/** A: 단건 편집(제목·태그) */
function EditClipLayer({
  messages,
  item,
  busy,
  onCancel,
  onSave,
}: {
  messages: ClipsMessages;
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
        {messages.clips.editTitle}
      </h2>
      <label htmlFor="edit-title-input" className="mt-4 block text-sm font-medium text-fg">
        {messages.clips.editTitleLabel}
      </label>
      <input
        id="edit-title-input"
        value={title}
        maxLength={80}
        onChange={(e) => setTitle(e.target.value)}
        className="mt-1 h-11 w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/40"
      />
      <label htmlFor="edit-tags-input" className="mt-3 block text-sm font-medium text-fg">
        {messages.clips.editTagsLabel}{" "}
        <span className="font-normal text-fg-muted">{messages.clips.editTagsNote}</span>
      </label>
      <input
        id="edit-tags-input"
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        placeholder={messages.clips.editTagsPlaceholder}
        className="mt-1 h-11 w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/40"
      />
      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 flex-1 rounded-xl border border-border bg-bg text-base font-semibold text-fg transition hover:bg-border/40"
        >
          {messages.common.cancel}
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={() => onSave(title.trim().slice(0, 80), parseTags(tagInput))}
          className="h-12 flex-1 rounded-xl bg-brand text-base font-semibold text-white transition hover:bg-brand-strong focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? messages.clips.savingEdit : messages.common.save}
        </button>
      </div>
    </ModalShell>
  );
}

/** C: 선택 클립 태그 일괄 적용/교체 */
function BulkTagLayer({
  messages,
  count,
  busy,
  onCancel,
  onApply,
}: {
  messages: ClipsMessages;
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
        {messages.clips.bulkTagTitle}
      </h2>
      <p className="mt-1 text-sm text-fg-muted">
        {interpolate(messages.clips.bulkTagBody, {
          count: interpolate(messages.clips.countUnit, { count }),
        })}
      </p>
      <input
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        placeholder={messages.clips.bulkTagPlaceholder}
        aria-label={messages.clips.bulkTagAria}
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
          {interpolateNode(messages.clips.bulkTagModeAdd, {
            emphasis: (
              <span className="font-semibold">{messages.clips.bulkTagModeAddEmphasis}</span>
            ),
          })}
        </label>
        <label className="flex items-center gap-2 text-sm text-fg">
          <input
            type="radio"
            name="bulktag-mode"
            checked={mode === "replace"}
            onChange={() => setMode("replace")}
            className="h-4 w-4 accent-brand"
          />
          {interpolateNode(messages.clips.bulkTagModeReplace, {
            emphasis: (
              <span className="font-semibold">
                {messages.clips.bulkTagModeReplaceEmphasis}
              </span>
            ),
          })}
        </label>
      </fieldset>
      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 flex-1 rounded-xl border border-border bg-bg text-base font-semibold text-fg transition hover:bg-border/40"
        >
          {messages.common.cancel}
        </button>
        <button
          type="button"
          disabled={!canApply}
          onClick={() => onApply(tags, mode)}
          className="h-12 flex-1 rounded-xl bg-brand text-base font-semibold text-white transition hover:bg-brand-strong focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? messages.clips.bulkTagApplying : messages.clips.bulkTagApply}
        </button>
      </div>
    </ModalShell>
  );
}

/** B: 선택 일괄 삭제 확인 */
function BulkDeleteConfirm({
  messages,
  count,
  busy,
  onCancel,
  onConfirm,
}: {
  messages: ClipsMessages;
  count: number;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell labelledBy="bulkdel-title" onClose={onCancel}>
      <h2 id="bulkdel-title" className="text-lg font-bold text-fg">
        {interpolate(messages.clips.bulkDeleteTitle, {
          count: interpolate(messages.clips.countUnit, { count }),
        })}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">
        {messages.clips.irreversible}
      </p>
      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 flex-1 rounded-xl border border-border bg-bg text-base font-semibold text-fg transition hover:bg-border/40"
        >
          {messages.common.cancel}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className="h-12 flex-1 rounded-xl bg-danger text-base font-semibold text-white transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-danger/50 disabled:opacity-50"
        >
          {busy ? messages.clips.deleting : messages.common.delete}
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

function groupByDate(
  items: Item[],
  locale: Locale,
): { label: string; items: Item[] }[] {
  const now = new Date();
  const groups = new Map<string, Item[]>();
  const order: string[] = [];
  for (const item of items) {
    const label = dateGroupLabel(new Date(item.date), now, locale);
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

/**
 * 날짜 그룹 라벨. **사전에 넣지 않는다** — `Intl` 이 4개 언어를 다 만들어 준다.
 *
 *   오늘 / 어제 / 이번 주 / 이번 달  → RelativeTimeFormat(numeric: "auto")
 *   2026년 7월                      → DateTimeFormat(year, month: "long")
 *
 * 직접 번역하면 문구 4개 × 언어 3개에 "2026년 7월" 같은 연월 **형식**까지 언어마다
 * 달라서(en "July 2026", ja "2026年7月") 사전으로는 형식을 표현할 수 없다.
 */
function dateGroupLabel(d: Date, now: Date, locale: Locale): string {
  const tag = LOCALE_TAGS[locale];
  const diffDays = Math.floor((startOfDay(now) - startOfDay(d)) / 86400000);
  const relative = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });
  if (diffDays <= 0) return relative.format(0, "day");
  if (diffDays === 1) return relative.format(-1, "day");
  if (diffDays < 7) return relative.format(0, "week");
  if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth())
    return relative.format(0, "month");
  return new Intl.DateTimeFormat(tag, { year: "numeric", month: "long" }).format(d);
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
