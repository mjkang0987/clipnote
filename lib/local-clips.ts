// 비로그인 사용자의 '내 클립' — 브라우저 localStorage 에만 보관(공유 X).
// 로그인 사용자는 DB(clips) 를 쓴다.

export type LocalClip = {
  url: string;
  title: string;
  description: string | null;
  image: string | null;
  siteName: string | null;
  gradient: string;
  tags: string[];
  savedAt: string; // ISO
};

const KEY = "clipnote.localClips.v1";
const MAX = 300;

export function getLocalClips(): LocalClip[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LocalClip[]) : [];
  } catch {
    return [];
  }
}

export function addLocalClip(clip: Omit<LocalClip, "savedAt">): LocalClip[] {
  const next: LocalClip = { ...clip, savedAt: new Date().toISOString() };
  // 같은 URL 은 최신으로 갱신(중복 방지)
  const rest = getLocalClips().filter((c) => c.url !== next.url);
  const list = [next, ...rest].slice(0, MAX);
  save(list);
  return list;
}

export function removeLocalClip(url: string): LocalClip[] {
  const list = getLocalClips().filter((c) => c.url !== url);
  save(list);
  return list;
}

/** 로컬 클립의 제목·태그 수정(게스트 편집). url 로 식별. */
export function updateLocalClip(
  url: string,
  patch: { title?: string; tags?: string[] },
): LocalClip[] {
  const list = getLocalClips().map((c) =>
    c.url === url
      ? {
          ...c,
          ...(patch.title !== undefined ? { title: patch.title } : {}),
          ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
        }
      : c,
  );
  save(list);
  return list;
}

function save(list: LocalClip[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // 용량 초과 등은 조용히 무시
  }
}

/* ── 태그 자동완성용: 사용자가 쓴 태그를 빈도로 기억 ───────────── */

const TAGS_KEY = "clipnote.knownTags.v1";

/** 자주 쓴 순으로 정렬된 과거 태그 목록. */
export function getKnownTags(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TAGS_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  } catch {
    return [];
  }
}

/** 저장·공유 시 사용한 태그를 빈도에 누적. */
export function recordTags(tags: string[]): void {
  if (typeof window === "undefined" || tags.length === 0) return;
  try {
    const raw = window.localStorage.getItem(TAGS_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    for (const t of tags) {
      const key = t.trim();
      if (key) map[key] = (map[key] ?? 0) + 1;
    }
    window.localStorage.setItem(TAGS_KEY, JSON.stringify(map));
  } catch {
    // 무시
  }
}
