# ClipNote — index.md

> 프로젝트 구조와 현재 상태의 source of truth. 작업 완료 시 갱신한다.

## 프로젝트 정보

- **이름**: ClipNote
- **도메인**: clipnote.co.kr
- **저장소**: https://github.com/mjkang0987/clipnote.git
- **스택**: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase(Postgres) · @vercel/og
- **배포**: Vercel (예정)

## 현재 상태

- 단계: **구글·카카오 로그인 활성화(`KAKAO_ENABLED=true`). 카카오 동의항목(이메일·닉네임·프로필) 설정 완료 후 Supabase 기본 scope 그대로 사용. 카카오 로그인 시 이메일 수집 → 약관 반영함.**
  - 로그인 → 공유 링크(DB, user_id). 비로그인 → 브라우저 localStorage 저장(공유 X).
  - ⚠️ 게스트(localStorage) 클립은 로그인 시 화면에 안 보임(DB 모드). 자동 이전(마이그레이션) 미구현 — 후속 검토.
- 브랜치 전략: 작업은 `feat/*` 브랜치 → push. 이슈/PR 은 환경상 GitHub API 차단으로 plan.md 작업보드에서 추적.
- 미해결: Naver 로그인은 Supabase 미지원 → 별도 커스텀 브랜치 예정.
- 저장소: 클론 완료, 리모트 연결됨 (아직 커밋/푸시 전 — Mac에서 수행 필요, plan.md 참고)
- 문서: `plan.md`, `index.md`, `design-guide.md` 작성 완료
- 코드: Next.js 16 + TS + Tailwind v4. 디자인 토큰(globals.css), 랜딩 폼 + 공유 카드 미리보기 구현
- 검증: `npm run build` 통과 (경고 0)

## 디렉터리 구조

```
clipnote/
├── plan.md            # 작업/향후 계획
├── index.md           # 프로젝트 구조·상태 (이 문서)
├── design-guide.md    # 디자인 시스템
├── app/
│   ├── layout.tsx     # 루트 레이아웃 (메타·lang=ko)
│   ├── globals.css    # 디자인 토큰 + Tailwind 테마
│   ├── page.tsx       # 메인 폼 + 메타 조회 + 미리보기 + 공유링크 생성 (구현됨)
│   ├── [slug]/
│   │   ├── page.tsx        # 공유 페이지: OG 주입 + 카드 표시 (구현됨)
│   │   └── SmartRedirect.tsx # 원본으로 JS 리다이렉트 (구현됨)
│   └── api/
│       ├── metadata/  # URL 메타 파싱 GET (구현됨)
│       ├── clip/      # 클립 생성 POST → slug (구현됨)
│       └── og/        # 동적 OG 이미지 (구현됨)
├── middleware.ts      # Supabase 세션 갱신 (auth)
├── app/robots.ts      # /robots.txt (SEO)
├── app/sitemap.ts     # /sitemap.xml (SEO)
├── public/llms.txt    # 생성형 AI 크롤러용 사이트 설명 (GEO)
├── supabase/schema.sql # clips 테이블(user_id 포함)·함수·RLS·GRANT
├── .env.example       # 환경변수 예시 (서버 키 + NEXT_PUBLIC anon 키)
├── app/
│   ├── login/         # 로그인 페이지 (Google·Kakao·게스트)
│   ├── clips/         # 내 클립 목록 (게스트=localStorage, 로그인=DB)
│   ├── auth/callback/ # OAuth 콜백
│   ├── auth/signout/  # 로그아웃
│   ├── api/clips/     # 내 클립 목록 GET (로그인)
│   └── _components/AuthNav.tsx # 헤더 로그인 상태
├── lib/
│   ├── supabase/client.ts  # 브라우저 클라이언트 (auth)
│   ├── supabase/server.ts  # 서버 클라이언트 + getCurrentUser (auth)
│   ├── local-clips.ts      # 비로그인 localStorage 저장
│   ├── gradients.ts   # 그라디언트 프리셋 + 결정적 선택 (구현됨)
│   ├── metadata.ts    # 어댑터→OG→HTML 단계별 폴백 (구현됨)
│   ├── slug.ts        # base-57 슬러그 생성 (구현됨)
│   ├── store.ts       # ClipStore — env 있으면 Supabase, 없으면 메모리 (구현됨)
│   ├── store-supabase.ts # Supabase 구현 (feat/supabase-store)
│   ├── supabase.ts    # 서버 전용 Supabase 클라이언트 (feat/supabase-store)
│   └── adapters/
│       ├── naver-cafe.ts  # 네이버 카페 게시글 제목 추출 (구현됨·Mac 동작 확인)
│       └── instagram.ts   # 인스타 릴/게시물 og 추출 best-effort (구현됨·Mac 동작 확인)
├── public/fonts/      # Pretendard Bold/Regular woff 서브셋 (OG 이미지용)
└── ...
```

## 다음 할 일

`plan.md` 참고. 우선: ① Mac에서 초기 커밋·푸시 → ② 메타 파싱 API(`/api/clip`) + 동적 OG(`/api/og`) → ③ Supabase 연결.

## 변경 이력

- 2026-06-18: 최초 작성.
- 2026-06-18: 스캐폴딩, 디자인가이드·토큰, 랜딩 페이지 UI(폼+미리보기) 구현. 빌드 통과.
- 2026-06-18: pnpm `minimumReleaseAge` 정책 충돌 해결 — `pnpm-workspace.yaml`에 `baseline-browser-mapping` 예외 추가(next@16/browserslist가 쓰는 매일 배포 패키지).
- 2026-06-18: dev 포트 4000 고정. native 빌드 승인(`allowBuilds: sharp, unrs-resolver = true`).
- 2026-06-18: 메타 파싱 구현 — `lib/metadata.ts`(OG→HTML 폴백, 8초 타임아웃, 512KB 제한), `GET /api/metadata`, 폼에서 "내용 가져오기" → 제목·설명·대표이미지 미리보기. GitHub URL로 파서 검증 완료.
- 2026-06-18: 네이버 카페 어댑터(`lib/adapters/naver-cafe.ts`) — 내부 article API로 게시글 subject 추출, 어댑터→OG→HTML 순 폴백. Mac에서 실제 게시글 제목 정상 추출 확인. (비공식 API·멤버 전용 글은 한계)
- 2026-06-18: 인스타그램 어댑터(`lib/adapters/instagram.ts`) — 크롤러 UA(facebookexternalhit)로 og 추출 best-effort. Mac에서 릴 동작 확인. (로그인 벽·비공개는 한계)
- 2026-06-18: SEO/GEO(`feat/seo-geo`) — metadataBase env화(`lib/site.ts`), 홈 메타·OG·트위터, robots.ts, sitemap.ts, 전역 JSON-LD(WebSite/WebApplication)+홈 FAQPage, 공유 페이지 noindex, public/llms.txt, 홈 소개·기능·FAQ 콘텐츠. 빌드·스모크 검증.
- 2026-06-18: 동적 OG 이미지(`/api/og`, next/og) — 그라디언트+제목+설명 카드, Pretendard woff 서브셋 번들(한글 렌더 확인). 슬러그(`lib/slug.ts`)·메모리 저장소(`lib/store.ts`)·생성 API(`/api/clip`)·공유 페이지(`/[slug]`, OG 주입+스마트 리다이렉트) 구현. E2E(생성→공유→OG메타→404) 검증 완료.
  - ⚠️ 저장소가 메모리라 서버 재시작 시 클립 사라짐 → Supabase 연동 시 교체 필요.
  - ⚠️ og:image 가 metadataBase(clipnote.co.kr) 기준 절대 URL → 로컬에선 이미지 미리보기는 `/api/og` 직접 호출로 확인.
- 2026-06-19: 구글 로그인 출시. 카카오는 `KAKAO_ENABLED=false`(Supabase 한계로 비활성, 비즈앱 결정 시 재활성).
- 2026-06-19: 버튼 커서 공통 추가 — globals.css base 에 `button:not(:disabled){cursor:pointer}`(Tailwind v4 preflight 대응).
- 2026-06-19: 로그인 화면 "최근 로그인" 배지 — 마지막에 쓴 수단을 localStorage(`clipnote:last-login-provider`)에 기록, 다음 방문 시 해당 버튼 우상단에 표시. (현재 구글만 노출, 카카오 복귀 시 자동 적용)
- 2026-06-19: 개인정보처리방침 갱신 — 책임자 pikaworks 운영자 / 이메일 pikaworks.help@gmail.com, 시행일 2026-06-19, Supabase 저장 위치를 대한민국(서울 리전)으로 명시(국외 이전 → 국내 저장), 초안 문구 정리.
- 2026-06-19: 카카오 로그인 재활성화(`KAKAO_ENABLED=true`) — 카카오 동의항목 설정 완료. Supabase 기본 scope 사용(이메일·닉네임·프로필 수집). 로그인 동의 문구 + 약관 수집항목(이메일·프로필 추가) 갱신.
- 2026-06-19: 개인정보처리방침 헤더 로그인 상태 반영(AuthNav).
- 2026-06-19: 기본 설치형 PWA(`feat/pwa`) — `app/manifest.ts`(standalone, theme #7c5cfc), 아이콘 public/icon-192·512·apple-icon-180·icon-maskable-512(북마크 마크), `public/sw.js`(최소 SW) + `app/_components/ServiceWorkerRegister.tsx`, layout viewport themeColor·appleWebApp·icons. tsc 통과.
- 2026-06-19: 공유 생성/클립 저장 분리 + 로그인 클립 삭제(`feat/clip-save-share-split`). `clips.saved` 컬럼 추가(목록은 saved=true만). 메인 폼 로그인 시 버튼 2개("공유 링크 만들기"=saved:false / "내 클립에 추가"=saved:true). `PATCH/DELETE /api/clip/[slug]` 신규(소유자 확인). 내 클립 카드 삭제 버튼을 로그인(DB) 클립에도 노출. tsc 통과. **사용자 할 일: Supabase에 `alter table public.clips add column if not exists saved boolean not null default false;` 실행 + 푸시/배포.**
