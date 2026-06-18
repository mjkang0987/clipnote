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

function save(list: LocalClip[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // 용량 초과 등은 조용히 무시
  }
}
