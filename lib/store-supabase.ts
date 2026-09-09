// Supabase(Postgres) 기반 ClipStore 구현.
// 환경변수가 설정돼 있을 때만 사용된다(lib/store.ts 의 팩토리에서 선택).

import type { Clip, ClipPatch, ClipStore, NewClip } from "./store";
import { generateSlug } from "./slug";
import { getSupabaseAdmin } from "./supabase";
import { canonicalizeUrl } from "./metadata";

const TABLE = "clips";

// canonical_url 컬럼 존재 여부(마이그레이션 적용 전이면 없음).
// null=미확인. 한 번 감지하면 기억해 매 호출 재시도/추가왕복을 피한다.
let hasCanonicalColumn: boolean | null = null;

// supabase-js 가 돌려주는 에러 중 로그에 쓰는 부분만.
//
// 세 필드는 없거나 null 일 수 있다. 응답 본문이 JSON 이 아니면 supabase-js 는
// `{ message: body }` 만 채우고(PostgrestBuilder), Postgres 를 거치지 않은
// PostgREST 자체 에러(PGRST102 등)는 details·hint 가 null 이다.
// 라이브러리의 `PostgrestError` 는 셋을 필수 string 으로 선언해 이 현실과 다르다.
// (`QueryError` 라는 이름은 supabase-js 가 이미 export 하므로 쓰지 않는다.)
type LoggableError = {
  message: string;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
};

// PostgREST/Postgres 가 canonical_url 컬럼 부재로 내는 에러인지 판별.
// 42703=undefined_column(select/eq), PGRST204=schema cache 미발견(insert).
function isMissingCanonicalColumn(error: LoggableError | null): boolean {
  if (!error) return false;
  const byCode = error.code === "42703" || error.code === "PGRST204";
  return byCode && /canonical_url/i.test(error.message ?? "");
}

// message 만으론 원인 파악이 안 될 때가 많다 — code/details/hint 를 함께 남겨야
// Vercel 로그만으로 Postgres 쪽 근본 원인을 알 수 있다. 있는 것만 찍어야
// "필드가 없음"과 "값이 null"이 로그에서 구분된다.
// 원본 객체는 cause 로 매단다 — 문자열로 납작하게 만들면 구조가 영영 사라진다.
function withErrorDetail(
  prefix: string,
  error: LoggableError,
  ...extra: string[]
): Error {
  const parts = [`${prefix}: ${error.message}`];
  if (error.code != null) parts.push(`code=${error.code}`);
  if (error.details != null) parts.push(`details=${error.details}`);
  if (error.hint != null) parts.push(`hint=${error.hint}`);
  parts.push(...extra);
  return new Error(parts.join(" | "), { cause: error });
}

// PostgREST 는 요청 바디에 짝 잃은 서로게이트가 **하나라도** 있으면 바디 전체를
// 파싱하지 못하고 PGRST102 로 거절한다. 어느 컬럼인지는 상관없다.
//
// 그래서 복구는 필드별이 아니라 여기서 한다. 라우트에서 필드를 하나씩 챙기면
// 새 필드가 생길 때 빠진다 — 실제로 title·description 만 챙기고 siteName·tags 가
// 빠져 있었고, `&#55357;` 하나 든 페이지면 그대로 저장이 깨졌다(plan.md 18장).
// 여기가 문자열이 PostgREST 로 나가기 직전의 마지막 지점이다.
function wellFormedRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === "string") {
      out[key] = value.toWellFormed();
    } else if (Array.isArray(value)) {
      out[key] = value.map((v) => (typeof v === "string" ? v.toWellFormed() : v));
    } else {
      out[key] = value;
    }
  }
  return out;
}

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
  shared: boolean | null; // 공개 브릿지 링크 on/off. 마이그레이션 백필로 옛 행은 true
  canonical_url: string | null; // 옛 행은 null(레거시 폴백 대상)
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
    shared: row.shared ?? false,
    viewCount: row.view_count,
    createdAt: row.created_at,
  };
}

export function createSupabaseStore(): ClipStore {
  return {
    async create(data: NewClip): Promise<Clip> {
      const supabase = getSupabaseAdmin();

      // 슬러그 충돌 시 재시도(고유 제약 위반 코드 23505)
      let lastConflict: LoggableError | null = null;
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const slug = generateSlug();
        const row: Record<string, unknown> = {
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
          shared: data.shared,
        };
        // 컬럼이 있을 때만 채움(마이그레이션 전이면 생략 → insert 가 깨지지 않음).
        // data.url 은 이미 정규화돼 들어오지만 멱등하므로 한 번 더 정규화해 저장.
        if (hasCanonicalColumn !== false) {
          row.canonical_url = canonicalizeUrl(data.url);
        }

        const { data: inserted, error, status } = await supabase
          .from(TABLE)
          .insert(wellFormedRow(row))
          .select()
          .single();

        if (!error && inserted) return rowToClip(inserted as Row);
        // canonical_url 컬럼이 없으면(마이그레이션 전) 컬럼 빼고 같은 루프에서 재시도.
        if (isMissingCanonicalColumn(error)) {
          hasCanonicalColumn = false;
          attempt -= 1; // 컬럼 부재는 슬러그 시도 횟수에서 제외
          continue;
        }
        if (error && error.code !== "23505") {
          // status 는 PostgREST 가 낸 에러(400)와 앞단이 끊은 것(413·502…)을 가른다.
          // bodyBytes 는 본문 크기 제한 가설을 확인할 유일한 값이다 — 캡션이 긴
          // 게시물에서만 저장이 깨지는 현상을 이것 없이는 확정도 기각도 못 한다.
          const bodyBytes = new TextEncoder().encode(JSON.stringify(row)).length;
          throw withErrorDetail(
            "클립 저장 실패",
            error,
            `status=${status}`,
            `bodyBytes=${bodyBytes}`,
          );
        }
        // 23505(중복 슬러그)면 새 슬러그로 재시도. 마지막 것은 아래에서 근거로 쓴다.
        if (error) lastConflict = error;
      }
      // 여기까지 오는 길은 둘이다 — 23505 6번, 그리고 error·inserted 가 모두 비어
      // 재시도로 처리된 경우. 후자는 슬러그와 무관하므로 원인을 단정하지 않는다.
      if (lastConflict) {
        throw withErrorDetail("슬러그 생성 재시도 한도 초과", lastConflict);
      }
      throw new Error(
        "클립 저장 실패: insert 가 행도 에러도 돌려주지 않아 재시도 한도를 넘겼습니다.",
      );
    },

    async get(slug: string): Promise<Clip | null> {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from(TABLE)
        .select()
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw withErrorDetail("클립 조회 실패", error);
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
      if (error) throw withErrorDetail("전체 목록 조회 실패", error);
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
      if (error) throw withErrorDetail("사용자 목록 조회 실패", error);
      return (data as Row[]).map(rowToClip);
    },

    async findByUserUrl(userId: string, url: string): Promise<Clip | null> {
      const supabase = getSupabaseAdmin();
      const target = canonicalizeUrl(url);

      // 1) 빠른 경로: canonical_url 인덱스 조회(신규 행은 항상 채워짐).
      //    컬럼이 있다고 알거나(true) 아직 모를 때(null)만 시도.
      if (hasCanonicalColumn !== false) {
        const { data: hit, error: hitErr } = await supabase
          .from(TABLE)
          .select()
          .eq("user_id", userId)
          .eq("canonical_url", target)
          .order("saved", { ascending: false }) // 저장된 것 우선
          .order("created_at", { ascending: false })
          .limit(1);

        if (isMissingCanonicalColumn(hitErr)) {
          // 마이그레이션 전 — 아래 레거시 전체 스캔으로 폴백.
          hasCanonicalColumn = false;
        } else if (hitErr) {
          throw withErrorDetail("중복 검사 실패(canonical)", hitErr);
        } else {
          hasCanonicalColumn = true;
          if (hit && hit.length > 0) return rowToClip(hit[0] as Row);

          // 2) 레거시 폴백: canonical_url 이 비어있는 옛 행만 받아 JS 로 정규화 비교.
          //    (정규화 도입 이전 데이터. 신규 행은 1)에서 끝나므로 이 집합은 늘지 않음.)
          const { data: legacy, error: legErr } = await supabase
            .from(TABLE)
            .select()
            .eq("user_id", userId)
            .is("canonical_url", null)
            .order("saved", { ascending: false })
            .order("created_at", { ascending: false });
          if (legErr) throw withErrorDetail("중복 검사 실패(레거시)", legErr);
          const match = (legacy as Row[] | null)?.find(
            (r) => canonicalizeUrl(r.url) === target,
          );
          return match ? rowToClip(match) : null;
        }
      }

      // 3) 컬럼 부재(마이그레이션 전): 사용자 클립 전체를 받아 JS 로 정규화 비교(기존 동작).
      const { data, error } = await supabase
        .from(TABLE)
        .select()
        .eq("user_id", userId)
        .order("saved", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw withErrorDetail("중복 검사 실패(전체 스캔)", error);
      const match = (data as Row[]).find(
        (r) => canonicalizeUrl(r.url) === target,
      );
      return match ? rowToClip(match) : null;
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
      if (error) throw withErrorDetail("클립 저장 상태 변경 실패", error);
      return (data?.length ?? 0) > 0;
    },

    async update(slug: string, userId: string, patch: ClipPatch): Promise<Clip | null> {
      const supabase = getSupabaseAdmin();
      // camelCase → DB 컬럼. 온 값만 반영.
      const row: Record<string, unknown> = {};
      if (patch.title !== undefined) row.title = patch.title;
      if (patch.description !== undefined) row.description = patch.description;
      if (patch.tags !== undefined) row.tags = patch.tags;
      if (patch.gradient !== undefined) row.gradient = patch.gradient;
      if (patch.saved !== undefined) row.saved = patch.saved;
      if (patch.shared !== undefined) row.shared = patch.shared;
      if (Object.keys(row).length === 0) {
        return this.get(slug); // 변경 없음
      }
      const { data, error } = await supabase
        .from(TABLE)
        .update(wellFormedRow(row))
        .eq("slug", slug)
        .eq("user_id", userId)
        .select()
        .maybeSingle();
      if (error) throw withErrorDetail("클립 수정 실패", error);
      return data ? rowToClip(data as Row) : null;
    },

    async remove(slug: string, userId: string): Promise<boolean> {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from(TABLE)
        .delete()
        .eq("slug", slug)
        .eq("user_id", userId)
        .select("slug");
      if (error) throw withErrorDetail("클립 삭제 실패", error);
      return (data?.length ?? 0) > 0;
    },

    async removeAllByUser(userId: string): Promise<number> {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from(TABLE)
        .delete()
        .eq("user_id", userId)
        .select("slug");
      if (error) throw withErrorDetail("클립 일괄 삭제 실패", error);
      return data?.length ?? 0;
    },
  };
}
