// Supabase(Postgres) 기반 ClipStore 구현.
// 환경변수가 설정돼 있을 때만 사용된다(lib/store.ts 의 팩토리에서 선택).

import type { Clip, ClipStore, NewClip } from "./store";
import { generateSlug } from "./slug";
import { getSupabaseAdmin } from "./supabase";

const TABLE = "clips";

// DB(snake_case) ↔ 앱(camelCase) 매핑
type Row = {
  slug: string;
  url: string;
  title: string;
  description: string | null;
  image: string | null;
  site_name: string | null;
  gradient: string;
  tags: string[] | null;
  user_id: string | null;
  saved: boolean | null;
  view_count: number;
  created_at: string;
};

function rowToClip(row: Row): Clip {
  return {
    slug: row.slug,
    url: row.url,
    title: row.title,
    description: row.description,
    image: row.image,
    siteName: row.site_name,
    gradient: row.gradient,
    tags: row.tags ?? [],
    userId: row.user_id,
    saved: row.saved ?? false,
    viewCount: row.view_count,
    createdAt: row.created_at,
  };
}

export function createSupabaseStore(): ClipStore {
  return {
    async create(data: NewClip): Promise<Clip> {
      const supabase = getSupabaseAdmin();

      // 슬러그 충돌 시 재시도(고유 제약 위반 코드 23505)
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const slug = generateSlug();
        const { data: inserted, error } = await supabase
          .from(TABLE)
          .insert({
            slug,
            url: data.url,
            title: data.title,
            description: data.description,
            image: data.image,
            site_name: data.siteName,
            gradient: data.gradient,
            tags: data.tags,
            user_id: data.userId,
            saved: data.saved,
          })
          .select()
          .single();

        if (!error && inserted) return rowToClip(inserted as Row);
        if (error && error.code !== "23505") {
          throw new Error(`클립 저장 실패: ${error.message}`);
        }
        // 23505(중복 슬러그)면 새 슬러그로 재시도
      }
      throw new Error("슬러그 생성 재시도 한도를 초과했습니다.");
    },

    async get(slug: string): Promise<Clip | null> {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from(TABLE)
        .select()
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw new Error(`클립 조회 실패: ${error.message}`);
      return data ? rowToClip(data as Row) : null;
    },

    async incrementView(slug: string): Promise<void> {
      const supabase = getSupabaseAdmin();
      // 원자적 증가용 RPC (schema.sql 의 increment_clip_view 함수)
      const { error } = await supabase.rpc("increment_clip_view", {
        target_slug: slug,
      });
      // 조회수 증가 실패는 치명적이지 않으므로 조용히 무시(로그만)
      if (error) console.warn("조회수 증가 실패:", error.message);
    },

    async list(): Promise<Clip[]> {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from(TABLE)
        .select()
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw new Error(`목록 조회 실패: ${error.message}`);
      return (data as Row[]).map(rowToClip);
    },

    async listByUser(userId: string): Promise<Clip[]> {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from(TABLE)
        .select()
        .eq("user_id", userId)
        .eq("saved", true)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw new Error(`목록 조회 실패: ${error.message}`);
      return (data as Row[]).map(rowToClip);
    },

    async setSaved(slug: string, userId: string, saved: boolean): Promise<boolean> {
      const supabase = getSupabaseAdmin();
      // 본인(user_id) 소유만 변경 — 일치하는 행이 없으면 빈 결과
      const { data, error } = await supabase
        .from(TABLE)
        .update({ saved })
        .eq("slug", slug)
        .eq("user_id", userId)
        .select("slug");
      if (error) throw new Error(`클립 저장 상태 변경 실패: ${error.message}`);
      return (data?.length ?? 0) > 0;
    },

    async remove(slug: string, userId: string): Promise<boolean> {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from(TABLE)
        .delete()
        .eq("slug", slug)
        .eq("user_id", userId)
        .select("slug");
      if (error) throw new Error(`클립 삭제 실패: ${error.message}`);
      return (data?.length ?? 0) > 0;
    },
  };
}
