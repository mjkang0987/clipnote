"use client";

import { useEffect, useMemo, useState } from "react";
import type { Clip } from "@/lib/store";
import { gradientCss, pickGradient } from "@/lib/gradients";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
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

  useEffect(() => {
    let active = true;

    async function load() {
      const hasAuth = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
      let isUser = false;

      if (hasAuth) {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        isUser = Boolean(data.user);
      }
      if (!active) return;
      setLoggedIn(isUser);

      if (isUser) {
        try {
          const res = await fetch("/api/clips");
          const json = (await res.json()) as { clips: Clip[] };
          if (!active) return;
          setItems(json.clips.map(dbToItem));
        } catch {
          if (active) setItems([]);
        }
      } else {
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

  function handleDeleteLocal(url: string) {
    setItems(removeLocalClip(url).map(localToItem));
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
                      onDeleteLocal={handleDeleteLocal}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ClipCard({
  item,
  onDeleteLocal,
}: {
  item: Item;
  onDeleteLocal: (url: string) => void;
}) {
  return (
    <li className="flex gap-4 rounded-2xl border border-border bg-surface p-4">
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
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
          <span className="text-fg-muted">{formatDate(item.date)}</span>
          {item.slug ? (
            <a
              href={`/${item.slug}`}
              className="font-semibold text-brand-strong hover:underline"
            >
              공유 페이지
            </a>
          ) : null}
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-fg hover:underline"
          >
            원본 열기
          </a>
          {item.local && (
            <button
              type="button"
              onClick={() => onDeleteLocal(item.url)}
              className="font-semibold text-danger hover:underline"
            >
              삭제
            </button>
          )}
        </div>
      </div>
    </li>
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
