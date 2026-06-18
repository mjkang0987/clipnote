// 클립 저장소
//
// 환경변수(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)가 있으면 Supabase 사용,
// 없으면 메모리 저장소로 폴백한다.
// ⚠️ 메모리 저장소는 서버 재시작/서버리스에서 데이터가 사라진다(개발·임시용).

import { generateSlug } from "./slug";
import { hasSupabaseEnv } from "./supabase";
import { createSupabaseStore } from "./store-supabase";

export type Clip = {
  slug: string;
  url: string; // 원본 URL
  title: string;
  description: string | null;
  image: string | null; // 원본 대표 이미지
  siteName: string | null;
  gradient: string; // 그라디언트 이름 (lib/gradients)
  tags: string[];
  userId: string | null; // 작성자(로그인 사용자). 공유 클립은 항상 존재
  createdAt: string; // ISO
  viewCount: number;
};

export type NewClip = Omit<Clip, "slug" | "createdAt" | "viewCount">;

export interface ClipStore {
  create(data: NewClip): Promise<Clip>;
  get(slug: string): Promise<Clip | null>;
  incrementView(slug: string): Promise<void>;
  list(): Promise<Clip[]>;
}

function createMemoryStore(): ClipStore {
  const clips = new Map<string, Clip>();

  return {
    async create(data) {
      let slug = generateSlug();
      // 충돌 시 재생성
      for (let tries = 0; clips.has(slug) && tries < 5; tries += 1) {
        slug = generateSlug();
      }
      const clip: Clip = {
        ...data,
        slug,
        createdAt: new Date().toISOString(),
        viewCount: 0,
      };
      clips.set(slug, clip);
      return clip;
    },

    async get(slug) {
      return clips.get(slug) ?? null;
    },

    async incrementView(slug) {
      const clip = clips.get(slug);
      if (clip) clip.viewCount += 1;
    },

    async list() {
      return [...clips.values()].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      );
    },
  };
}

function createStore(): ClipStore {
  if (hasSupabaseEnv()) return createSupabaseStore();
  return createMemoryStore();
}

// 개발 모드 HMR 에서도 데이터가 유지되도록 globalThis 에 싱글톤 보관.
const globalForStore = globalThis as unknown as { __clipStore?: ClipStore };
export const clipStore: ClipStore =
  globalForStore.__clipStore ?? (globalForStore.__clipStore = createStore());
