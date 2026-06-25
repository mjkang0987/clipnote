-- ClipNote — Supabase 스키마
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행.

create table if not exists public.clips (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  url         text not null,
  title       text not null,
  description text,
  image       text,
  site_name   text,
  gradient    text not null default 'grape',
  tags        text[] not null default '{}',
  view_count  integer not null default 0,
  user_id     uuid references auth.users(id) on delete cascade,  -- 작성자(로그인). 공유=로그인 전용
  saved       boolean not null default false,  -- 내 클립 목록에 담을지(공유만 만든 건 false)
  created_at  timestamptz not null default now(),
  expires_at  timestamptz            -- 보존기간(수익화) — 향후 사용
);

-- 기존 테이블에 컬럼이 없으면 추가 (재실행 안전)
alter table public.clips add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.clips add column if not exists saved boolean not null default false;
-- 정규화 URL: 중복 검사를 전체 스캔 없이 인덱스 조회로 처리하기 위함.
-- 옛 행은 null → findByUserUrl 의 레거시 폴백(JS 정규화)이 처리.
alter table public.clips add column if not exists canonical_url text;

-- 공개 브릿지 링크(/[slug]) on/off. 신규 행은 기본 false(저장만 하면 브릿지 없음).
-- 컬럼을 "처음 추가하는 순간에만" 기존 행을 true 로 백필 — 옛 클립은 전부
-- 공개 브릿지가 살아있었으므로. (스키마 재실행 시 저장만 한 클립을 덮어쓰지 않도록 DO 가드)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clips' and column_name = 'shared'
  ) then
    alter table public.clips add column shared boolean not null default false;
    update public.clips set shared = true;
  end if;
end $$;

create index if not exists clips_created_at_idx on public.clips (created_at desc);
create index if not exists clips_user_id_idx on public.clips (user_id);
create index if not exists clips_user_canonical_idx on public.clips (user_id, canonical_url);

-- 조회수 원자적 증가 함수
create or replace function public.increment_clip_view(target_slug text)
returns void
language sql
as $$
  update public.clips set view_count = view_count + 1 where slug = target_slug;
$$;

-- RLS: 서버(service_role)만 접근. 익명/공개 클라이언트 직접 접근 차단.
-- (앱은 서버 라우트에서 service_role 키로만 접근하므로 정책 없이 RLS 활성화로 충분)
alter table public.clips enable row level security;

-- service_role(서버 전용)에 권한 명시 부여.
-- "새 테이블 자동 노출"을 끄면 자동 GRANT 가 안 되므로 직접 부여한다.
-- (anon/authenticated 에는 부여하지 않아 공개 클라이언트 직접 접근은 차단 유지)
grant all privileges on table public.clips to service_role;
grant execute on function public.increment_clip_view(text) to service_role;
