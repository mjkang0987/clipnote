"use client";

import { useEffect, useState } from "react";
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
  tags: string[];
  gradient: string;
  date: string;
  local: boolean;
};

export default function ClipsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

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
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {items.map((item) => (
              <li
                key={item.key}
                className="flex gap-4 rounded-2xl border border-border bg-surface p-4"
              >
                <div
                  className="h-16 w-16 shrink-0 rounded-xl"
                  style={{ background: gradientCss(pickGradient(item.gradient)) }}
                  aria-hidden
                />
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
                        onClick={() => handleDeleteLocal(item.url)}
                        className="font-semibold text-danger hover:underline"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function dbToItem(c: Clip): Item {
  return {
    key: c.slug,
    title: c.title,
    url: c.url,
    host: prettyHost(c.url),
    slug: c.slug,
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
