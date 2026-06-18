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
- [x] #branch `feat/supabase-store` — Supabase 저장소 구현·연동·검증 완료. 서버 재시작 후에도 클립 영속 확인. (push 대기 — 토큰 필요)
- [ ] 다음: 목록 페이지(/clips), 보존기간/사용량 제한(수익화)

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

### 익명 허용 (확정)
MVP는 **로그인 없이 익명 입력·공유 허용**. 계정/인증은 후순위. 익명 식별은 추후 필요 시 쿠키/브라우저 ID로 보완.

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
