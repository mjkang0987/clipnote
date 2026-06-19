# ClipNote — plan.md

> 현재 작업과 향후 작업의 source of truth. 구현 범위가 바뀌면 이 문서를 먼저 갱신한다.

## 1. 제품 개요

`clipnote.co.kr` — URL을 입력하면 **공유용 스마트 링크 + 공유 이미지**를 만들어 주는 웹 서비스.

핵심 흐름:

1. 사용자가 URL 입력
2. 해당 페이지의 메타데이터(title, description, 대표 이미지) 추출
3. 짧은 슬러그 발급 → `clipnote.co.kr/{slug}`
4. 공유 시 예쁜 OG 카드(제목 + 설명 + 랜덤 그라디언트 배경) 노출 후, 원본으로 이동
5. 입력한 URL들을 날짜·태그로 정리
6. 수익화: 사용량 제한 + 보존기간 제한

## 2. 결정 사항

- **스택**: Next.js 16 (App Router) + React + TypeScript + Tailwind CSS
- **DB**: Supabase (Postgres) — 무료 시작, 인증까지 한 번에
- **공유 이미지**: `@vercel/og` (Satori) — 동적 OG 이미지 생성
- **배포**: Vercel (도메인 `clipnote.co.kr` 연결)
- **슬러그**: `nanoid` 6~8자, 충돌 시 재생성

### 리다이렉트 방향 (조정됨)
원래 요청은 "리다이렉트를 최대한 눈치 못 채게". 단, 목적지를 완전히 숨기는 **링크 클로킹은 피싱으로 악용되어 카카오·메타·구글에서 스팸 차단**되기 쉬움.
→ **스마트 링크 방식 채택**: 공유 페이지에서 OG 카드를 먼저 보여주고 원본으로 자연스럽게 이동(meta refresh / JS redirect). Bitly·linktr.ee와 같은 정상 패턴.

### 정리 방향 (#3, 추천 채택)
고정 카테고리 대신 **날짜 자동 기록 + 사용자 다중 태그**. 추후 "북마크 폴더" 추가 가능.

## 3. 범위 (MVP vs 후순위)

### MVP (1차 목표)
- [x] URL 입력 폼 (`/`) — URL + 선택 제목 + 선택 태그
- [x] 메타 파싱 API (단계별 폴백, 아래 8장) + 네이버 카페·인스타 어댑터
- [x] 사용자 지정 제목 (비우면 자동: 파싱 title → 도메인 기본값)
- [x] 슬러그 생성 + 저장 (※ 현재 메모리 임시저장, Supabase 교체 예정)
- [x] 공유 페이지 `/{slug}` — OG 카드 노출 후 원본 리다이렉트(스마트 링크)
- [x] 동적 OG 이미지 (`/api/og`) — 제목 + 설명 + 그라디언트 (한글 렌더 OK)
- [ ] 목록 조회 (날짜순) + 태그 표시  ← Supabase 연동 후

### 후순위 (2차 이후)
- [~] Supabase 영구 저장 — **코드 완료(`feat/supabase-store`), 키 입력 시 활성화**
- [ ] 목록 페이지(/clips) — 날짜순 + 태그 필터
- [ ] 계정/인증 (Supabase Auth)
- [ ] 수익화: 익명 N개 제한 + 보존 30일, 가입 시 확대/영구
- [ ] LLM 본문 요약 (비용 검토 후)
- [ ] 페이지 내 영상/이미지 분석 요약 (가장 후순위)

### 작업 보드 (GitHub Issues 대용 — 샌드박스에서 API 접근 불가하여 여기서 추적)
- [x] #branch `feat/supabase-store` — Supabase 저장소 구현·연동·검증 완료. push 완료, PR 대기.
- [~] #branch `feat/auth-google-kakao` — 로그인(Google+Kakao) + 분기 (코드 완료, OAuth 등록 대기)
  - [x] @supabase/ssr 도입, 서버/클라이언트 Supabase 클라이언트 + 세션 미들웨어
  - [x] 로그인 페이지(Google·Kakao 버튼) + OAuth 콜백 라우트 + 로그아웃 + 헤더 상태
  - [x] `clips.user_id` 컬럼 추가 (스키마)
  - [x] "공유 링크 만들기"를 로그인 게이트 (로그인 시 DB 저장 + user_id)
  - [x] 비로그인 저장 → localStorage 기반 저장(lib/local-clips)
  - [x] 로그인 화면 "게스트로 계속" 버튼
  - [ ] **사용자 할 일: Google Cloud·Kakao OAuth 앱 등록 → Supabase provider 설정** (테스트 전제)
- [~] #branch `feat/clips-list` — /clips 목록 페이지(게스트=localStorage, 로그인=DB). 코드 완료.
  - 게스트 저장이 화면에 보이게 됨(검증 가능). 로그인 목록은 OAuth 후 검증.
- [ ] #branch `feat/auth-naver` — Naver 로그인 (커스텀 OAuth, Supabase 미지원이라 별도 구현)
- [x] #branch `feat/pwa` — 기본 설치형 PWA (2026-06-19): `app/manifest.ts`(standalone, theme #7c5cfc) + 아이콘(북마크 마크, 192·512·apple·maskable) + 최소 서비스워커(`public/sw.js`) + 등록 컴포넌트 + layout themeColor/apple 메타. 코드 완료, tsc 통과. 오프라인/공유타깃은 후순위.
- [~] #branch `feat/clip-save-share-split` — 공유 생성 / 클립 저장 분리 + 로그인 클립 삭제 (코드 완료, 10장). 남은 사용자 할 일: Supabase `saved` 컬럼 SQL 실행 + 푸시/배포.
- [ ] 이후: 보존기간/사용량 제한(수익화)

## 10. 계획: 공유 생성 / 클립 저장 분리 + 삭제 (2026-06-19)

### 배경/문제
- 현재 로그인 상태에서 "공유 링크 만들기" = 무조건 DB 저장 = 내 클립에 영구히 남음. 저장 안 함 선택지 없음.
- 로그인(DB) 클립은 **삭제 기능이 없음**(삭제는 게스트 localStorage 만 구현). 한 번 만들면 못 지우고 누적.

### 요구사항
1. 메인 폼(로그인 시): 버튼 2개로 분리 — **공유 링크 만들기**(링크만 발급, 목록엔 안 남김) / **클립에 추가**(내 클립 목록에 저장).
2. 내 클립(로그인=DB)에서 **삭제** 가능.
3. 게스트(localStorage) 동작은 기존 유지(이 브라우저에 저장 / 로컬 삭제).

### 설계
- **DB**: `clips` 에 `saved boolean not null default false` 추가(idempotent). 목록 `listByUser` 는 `saved=true` 만 반환.
  - 공유 링크 만들기 → `saved=false` row 생성(슬러그 발급, 공유 동작 O, 목록 X).
  - 클립에 추가 → 방금 만든 공유 slug 가 있으면 그 row `saved=true` 로 업데이트, 없으면 `saved=true` 로 새 row 생성.
- **API**
  - `POST /api/clip`: body 에 `save?: boolean`(기본 false) 추가 → 그 값으로 저장.
  - `PATCH /api/clip/[slug]`: 본인 클립 `saved` 토글(=클립에 추가).
  - `DELETE /api/clip/[slug]`: 본인 클립 삭제.
- **store** (`lib/store.ts` 인터페이스 + memory, `lib/store-supabase.ts`): `setSaved(slug,userId,saved)`, `remove(slug,userId)` 추가. `listByUser` 에 `saved=true` 필터.
- **UI**
  - `app/page.tsx`(로그인): 버튼 2개 + `handleAddClip`. 게스트는 기존 "이 브라우저에 저장" 유지.
  - `app/clips/page.tsx`: 로그인 클립 삭제 버튼 → `DELETE` 호출 후 목록에서 제거. 게스트는 기존 로컬 삭제 유지.

### 영향 파일
`supabase/schema.sql`, `lib/store.ts`, `lib/store-supabase.ts`, `app/api/clip/route.ts`, `app/api/clip/[slug]/route.ts`(신규), `app/page.tsx`, `app/clips/page.tsx`.

### 사용자 할 일
- Supabase SQL Editor: `alter table public.clips add column if not exists saved boolean not null default false;`
- 커밋·푸시(Mac) → Vercel 재배포.

### 기대 결과
- 공유 링크를 만들어도 내 클립엔 자동으로 안 쌓임. 원할 때만 "클립에 추가".
- 내 클립에서 불필요한 클립 삭제 가능.

### 구현 메모 (2026-06-19)
- `clips.saved` 추가, `listByUser` 는 `saved=true` 만. 공유 생성=`saved:false`, 클립 추가=`saved:true`.
- "내 클립에 추가"는 방금 만든 공유 slug 가 있으면 `PATCH /api/clip/[slug] {saved:true}`, 없으면 `POST /api/clip {save:true}` 로 새로 저장(공유 링크 없이도 가능).
- 삭제: `DELETE /api/clip/[slug]`(소유자 확인). 내 클립 카드 삭제 버튼이 게스트뿐 아니라 로그인 클립에도 노출되도록 수정(기존엔 `item.local` 일 때만 보였음).
- 검증: `tsc --noEmit` 통과, 신규/수정 코드 ESLint 클린(기존 a-link 경고는 무관, Next16은 build 시 lint 미실행).
- ⚠️ 메모리 저장소(키 없을 때)는 서버 재시작 시 saved 상태도 사라짐 — 운영은 Supabase 기준.

> 인증 메모: Supabase Auth 네이티브 = Google·Kakao 가능, **Naver 미지원**(커스텀 OAuth 필요).
> OAuth 앱 등록·키 설정은 사용자 영역(코드는 클로드).

> 메모: service_role 권한 — "새 테이블 자동 노출 OFF" 환경에선 신규 테이블에 자동 GRANT 가 안 되므로
> schema.sql 에서 `grant ... to service_role` 명시 필요(anon 엔 미부여 = 서버 전용 유지).

## 4. 라우트 / 아키텍처

| 경로 | 역할 |
|------|------|
| `/` | URL 입력 폼, 결과(슬러그·공유링크·이미지) 표시 |
| `/api/clip` (POST) | URL 받아 메타 파싱 → 슬러그 생성 → DB 저장 |
| `/[slug]` | 공유 페이지. `generateMetadata`로 OG 주입 후 원본 리다이렉트 |
| `/api/og` | 동적 OG 이미지 (제목/설명/그라디언트) |
| `/dashboard` (후순위) | 내 클립 목록·태그 필터 |

## 5. 데이터 모델 (Postgres)

```
clips
  id          uuid pk
  slug        text unique         -- nanoid
  url         text                -- 원본 URL
  title       text                -- 사용자 지정 or 자동(파싱→도메인)
  custom_title boolean default false  -- 사용자가 직접 넣었는지
  description text
  image_url   text                -- 원본 OG 이미지
  gradient    text                -- 랜덤 그라디언트 시드/값
  meta_source text                -- 'og' | 'html' | 'llm' | 'manual' (출처 추적)
  view_count  int  default 0
  user_id     uuid null           -- 후순위(익명 허용)
  created_at  timestamptz default now()
  expires_at  timestamptz null    -- 보존기간(수익화)

tags                              -- MVP에 표시, 정리는 단계적
  id, clip_id fk, name
```

## 6. 기대 결과

- URL 입력 → 즉시 공유 가능한 짧은 링크 + 카드 이미지 발급
- 공유 링크 클릭 시 미리보기 카드 노출 후 원본 도달
- 입력 이력 날짜순 확인

### 로그인/비로그인 분기 (갱신 — 2026-06-18)
초기엔 익명 공유 허용이었으나, 아래로 변경:

- **비로그인(익명)**: 클립을 **브라우저 localStorage 에만 저장**(개인 북마크용). 서버/DB 미저장 → **공유 링크 생성·동작 불가**.
- **로그인**: 클립을 **Supabase(DB)에 user_id 와 함께 저장** → **공유 링크(`/{slug}`) 생성·동작**. 목록도 DB 기준.
- 인증: **Supabase Auth**. `clips.user_id` 추가, RLS 는 서버(service_role) 접근이라 그대로.

> 의미: 공유 = 로그인 전용 기능. 비로그인은 "URL 모아두기"까지만(로컬).

## 7. 미해결 질문 (확인 필요)

1. 본문 요약에 LLM 사용 여부 — MVP는 폴백으로 수동 입력, LLM은 패스트팔로우 권장 (비용)
2. 수익화 구체 수치(익명 허용 개수, 보존 일수)

## 8. 메타데이터 추출 전략 (단계별 폴백)

URL마다 메타 품질이 천차만별. 아래 순서로 시도해 첫 성공값 사용:

1. **OG 태그** — `og:title`, `og:description`, `og:image`
2. **HTML 기본** — `<title>`, `<meta name="description">`, 첫 `<img>`
3. **LLM 요약** (패스트팔로우) — 본문 텍스트 추출 후 제목/요약 생성
4. **수동 입력** — 위 전부 실패 시 사용자가 직접 제목·설명 입력 (항상 가능한 안전망)

`meta_source` 컬럼에 출처 기록.

### 알려진 한계 (중요)
- **서버 fetch는 JS 렌더 페이지의 본문을 못 가져옴** → 인스타그램·네이버 카페 등은 빈/일반 HTML 반환.
- 인스타: OG 있으나 로그인·레이트리밋·이미지 핫링크 차단 잦음.
- 네이버 카페: 멤버 전용 글은 본문 접근 불가.
- → 이런 경우 **수동 입력으로 폴백**. 완전 자동화하려면 헤드리스 브라우저(느림·비용) 또는 공식 API 필요 — 후순위 검토.

## 9. 변경 이력

- 2026-06-18: 최초 작성. 스택 확정(Next.js+TS+Tailwind+Supabase), 리다이렉트=스마트링크, 정리=태그 방식.
- 2026-06-18: 익명 허용 확정. 사용자 지정 제목 추가. 메타 추출 단계별 폴백 전략(8장) 추가 — 인스타·네이버 카페 등 JS렌더/로그인월 한계 명시, 수동 입력 안전망.
- 2026-06-18: MVP 핵심 구현·검증·푸시 완료(main). 이후 작업은 `feat/*` 브랜치로 진행. GitHub Issues 는 환경상 API 차단되어 이 문서 "작업 보드"에서 추적.
- 2026-06-18: `feat/supabase-store` — Supabase 저장소 코드 구현(키 입력 시 메모리→Supabase 자동 전환). schema.sql, .env.example 추가.
- 2026-06-18: Supabase 실연동·검증 완료(서버 재시작 후 클립 영속 확인). schema.sql 에 service_role GRANT 추가(자동노출 OFF 환경 대응).
- 2026-06-19: 구글 로그인 실동작 확인(배포본). 카카오 로그인 — Supabase 기본 scope(account_email·profile_image·profile_nickname)가 동의항목 미설정으로 400. `openid` scope 추가를 시도했으나 **Supabase 가 카카오 기본 scope 를 강제 추가(대체 불가)** 라 효과 없음(에러에 openid 까지 4개로 늘어남). 확인 결과 **Supabase 알려진 한계(issue #36878): 카카오 account_email 을 항상 요청하는데 이는 카카오 "비즈앱" 전환 후에만 켤 수 있어 개인 앱에선 불가**. → 결정: **구글만 먼저 출시, 카카오는 비즈앱 결정 시 재활성화**. `app/login/page.tsx` 에 `KAKAO_ENABLED = false` 플래그로 카카오 버튼 숨김(openid 변경은 원복). 비즈앱 전환하면 true 로 복구.
- 2026-06-19(2): 카카오 재활성화 — 동의항목(이메일·닉네임·프로필) 설정 완료. `KAKAO_ENABLED=true`, Supabase 기본 scope 사용(이메일 수집). 로그인 동의 문구·개인정보처리방침 수집항목(이메일·프로필 추가) 갱신.
