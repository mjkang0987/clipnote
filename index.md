# ClipNote — index.md

> 프로젝트 구조와 현재 상태의 source of truth. 작업 완료 시 갱신한다.

## 프로젝트 정보

- **이름**: ClipNote
- **도메인**: clipnote.co.kr
- **저장소**: https://github.com/mjkang0987/clipnote.git
- **스택**: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase(Postgres) · @vercel/og
- **배포**: Vercel (운영 중 · `main` 자동 배포)

## 현재 상태

- **배포**: Vercel. `main` = 운영, `develop` = 통합.
- **로그인**: Google · Kakao(`KAKAO_ENABLED=true`, 기본 scope) · Naver(Supabase 미지원 →
  `app/api/auth/naver/*` 커스텀 OAuth). 로그인 → DB 클립(공유 링크 발급 가능),
  비로그인 → 브라우저 localStorage(공유 링크 없음).
- **게스트 클립 이전**: 구현됨. 로그인 시 로컬 클립이 있으면 계정으로 옮길지 묻고,
  거절하면 삭제 확인 단계로 넘어간다. 그냥 닫으면 다음 접속에 다시 뜬다.
- **다국어**: 한국어(원본)·영어·일본어·중국어 간체. 경로 분리(`/`, `/en`, `/ja`, `/zh`),
  `/ko` 는 `/` 로 308. 로케일의 진실은 **URL** 이며 쿠키·저장소를 두지 않는다.
  서버는 미들웨어가 넘긴 요청 헤더로, 클라이언트는 `usePathname()` 으로 읽는다.
  개인정보처리방침 본문은 법적 문서라 **한국어만** 두고 비한국어 경로는 안내문만 번역한다.
- 브랜치 전략:
  - `main` = 안정/배포용 (직접 작업 X)
  - `develop` = 통합 브랜치 — 기능 작업은 여기로 머지
  - `feature/*` = 기능 브랜치, `develop` 최신본에서 분기 → `develop` 으로 머지
  - 릴리스 시 `develop → main` 승격 (**지시자 승인 필요**)
- **알려진 이슈**
  - eslint 오류 4건(`react-hooks/set-state-in-effect`) — 선재. `AuthNav`·`HomeClient`·`LoginClient`.
  - `middleware.ts` 가 Next 16 에서 deprecated(`proxy.ts` 로 이름 변경 권고).
  - `headers()` 사용으로 모든 페이지가 요청마다 렌더된다(`<html lang>` 을 로케일에 맞추기 위한
    선택). 홈·내 클립은 세션 쿠키를 읽어 원래도 동적이었다.

## 디렉터리 구조

```
clipnote/
├── plan.md · index.md · design-guide.md · CLAUDE.md · REVIEW.md
├── middleware.ts        # Supabase 세션 갱신 + 경로에서 읽은 로케일을 요청 헤더로 전달
├── app/
│   ├── layout.tsx       # 루트 레이아웃. generateMetadata 가 로케일별 title·OG·JSON-LD 생성
│   ├── globals.css      # 디자인 토큰 + Tailwind 테마
│   ├── robots.ts · sitemap.ts   # SEO (sitemap 은 로케일별 URL + hreflang)
│   ├── manifest.ts      # PWA (단일 파일이라 한국어 고정)
│   ├── page.tsx         # 한국어 홈 — 라우트는 로케일만 지정하고 본문은 _components 에
│   ├── {clips,settings,login,privacy}/page.tsx   # 한국어 라우트
│   ├── en/ · ja/ · zh/  # 로케일 라우트 (각 5개, 같은 본문 컴포넌트에 locale 전달)
│   ├── [slug]/          # 공유 페이지 — OG 주입 + 스마트 리다이렉트 (로케일 무관 단일 URL)
│   ├── auth/{callback,signout}/
│   ├── api/
│   │   ├── metadata/ clip/ clips/ og/ image/   # 메타 파싱 · 클립 CRUD · OG 이미지 · 이미지 프록시
│   │   └── auth/naver/                          # 네이버 커스텀 OAuth
│   └── _components/
│       ├── HomePage·ClipsPage·SettingsPage·LoginPage·PrivacyPage   # 서버: 로케일→사전 선택
│       ├── HomeClient·ClipsClient·SettingsClient·LoginClient        # 클라이언트: 화면 본문
│       ├── Header·Footer·AuthNav·Brand·CompareBoxes·LanguageSwitcher
│       └── ServiceWorkerRegister
├── lib/
│   ├── i18n/
│   │   ├── locales.ts        # 로케일 목록·태그·경로 helper (클라이언트가 값을 가져오는 곳)
│   │   ├── index.ts          # 사전 병합(부분 사전 → 한국어 폴백). **서버 전용으로 취급**
│   │   ├── types.ts          # Messages / PartialMessages
│   │   ├── messages/{ko,en,ja,zh}.ts
│   │   ├── server.ts         # getRequestLocale() — 미들웨어 헤더 읽기
│   │   ├── useLocale.ts      # 클라이언트: usePathname 기반 로케일·경로
│   │   ├── interpolate.tsx   # `{token}` → 문자열/React 노드
│   │   ├── pageMetadata.ts   # canonical · hreflang · OG
│   │   ├── ogLocale.ts · localeHeader.ts
│   ├── supabase/{client,server}.ts
│   ├── metadata.ts · adapters/{naver,naver-cafe,instagram}.ts   # 메타 추출 + 사이트별 어댑터
│   ├── local-clips.ts · store.ts · store-supabase.ts · slug.ts · gradients.ts
│   ├── shareText.ts     # 공유 텍스트 제목 80자 제한·말줄임 (iOS 와 같은 규칙)
│   └── site.ts
├── public/  fonts/ · app-ads.txt · ads.txt · llms.txt · sw.js · 아이콘
└── supabase/schema.sql
```

## 다음 할 일

`plan.md` 참고. 현재 대기: **`develop → main` 승격(지시자 승인 필요)**.

## 변경 이력

- 2026-07-31: **웹 다국어(한국어·영어·일본어·중국어)** — `lib/i18n/` 신설, `app/{en,ja,zh}/**` 로케일 라우트 15개, 전 화면 문자열 사전화 + 번역(189키). 미들웨어가 경로에서 읽은 로케일을 요청 헤더로 넘겨 `layout.tsx` 가 `<html lang>`·metadata·OG 를 맞춘다. 로케일별 canonical·hreflang(`x-default`=한국어)·sitemap, 푸터 언어 선택. 날짜 그룹은 사전 대신 `Intl`, FAQ 는 화면과 JSON-LD 가 같은 배열을 쓴다. 상세·검증 결과는 `plan.md` 14장.
- 2026-07-30: 홈·내 클립 진입 성능 — 로그인 판정과 클립 목록을 서버에서 채워 내려보내 클라이언트 워터폴과 버튼 깜빡임(CLS) 제거. 썸네일 지연 로드.
- 2026-07-30: 홈 액션 버튼 체계 정리(링크 만들기/링크 복사/원본 복사/공유하기/저장), 저장은 보라 채움·나머지는 테두리+연보라. 데스크톱은 `공유하기` 숨김(터치 기기 조건).
- 2026-07-30: 게스트 로컬 클립 → 계정 이전 2단계 레이어 구현(index.md 에 "미구현"으로 남아 있던 항목).
- 2026-07-30: 공유 텍스트 제목 80자 제한·말줄임(`lib/shareText.ts`) — iOS 와 같은 규칙. AdMob `public/app-ads.txt` 추가.
- 2026-07-30: 네이버 계열 메타 추출을 크롤러 UA 우선으로 전환.

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
- 2026-06-19: favicon(`app/favicon.ico`)을 북마크 아이콘으로 교체(16·32·48·64 다중 해상도, 풀블리드).
- 2026-06-19: 홈 화면 컴팩트화(`feat/home-compact`) — 미리보기 카드 1200:630 고정 제거→내용 높이, 히어로/폼/섹션 여백 축소, 대표이미지 높이 축소. PC·모바일에서 공유/저장 버튼까지 한 화면에 가깝게.
- 2026-06-19: 홈 미리보기 2블록 재구성 — ①공유 카드(공유 시 보이는 이미지) ②내 클립 저장 모습(목록 카드 형태, 왼쪽 썸네일=원본 대표이미지/그라디언트 폴백). 각 블록에 설명 캡션 추가로 "어떤 이미지인지" 명확화.
- 2026-06-19: 원본 대표이미지 검증(`lib/metadata.ts verifyImage`) — og:image 선언만 있고 실제 404 인 경우가 흔해, 파싱 시 실제 열리는지(200/206 + image 타입, 4s 타임아웃) 확인 후 아니면 null 처리. 깨진 썸네일/404 요청 방지(그라디언트 폴백).
- 2026-06-19: 버전 0.5.2 → 0.6.0 (오늘 기능 묶음: 공유/저장 분리·삭제, PWA, 중복 방지, 이미지 검증 등).
- 2026-06-19: 자동 버전닝 도입 — `.github/workflows/release-please.yml`(release-please, release-type node). main 푸시 시 커밋 컨벤션 읽어 릴리스 PR 자동 생성→머지하면 package.json/CHANGELOG/태그 자동. ⚠️ 사용자 할 일: GitHub repo Settings→Actions→Workflow permissions를 "Read and write"로.
- 2026-06-19: 공유 링크 생성 결과를 하단 인라인 → **모달 레이어**(`ShareResultLayer`)로 변경(복사·열기·닫기, Esc/배경클릭 닫기).
- 2026-06-19: 내 클립 카드에 "공유 링크 복사" 버튼 추가(slug 있는 로그인 클립만, 클립보드 복사+복사됨 피드백).
- 2026-06-19: 내 클립 편집/일괄 관리(`feat/clips-edit-bulk`, DB 클립) — A) 카드 "편집"→모달(제목·태그), B) "선택" 모드+체크박스→일괄 삭제, C) 선택 클립 태그 일괄 추가/교체. store `update`+`ClipPatch`, `PATCH /api/clip/[slug]` 확장(title/tags/saved), 모달 공통 `ModalShell`. tsc 통과.
- 2026-06-19: URL 정규화(`lib/metadata.ts canonicalizeUrl`) — 저장·중복비교 시 끝 슬래시/호스트 대소문자/추적 파라미터(utm_*·fbclid 등) 차이를 같은 URL로 처리(www는 미변경). 슬래시 차이로 중복되던 문제 해결. (기존 데이터는 옛 형식이라 신규부터 적용)
- 2026-06-19: 클립 중복 방지 — `POST /api/clip` 에서 같은 (user, URL) 클립이 있으면 새로 안 만들고 재사용. "내 클립에 추가" 시 이미 있으면 저장 처리만 하고 `alreadySaved` 응답 → 버튼에 "이미 추가됨 ✓" 표시. store에 `findByUserUrl` 추가. (홈의 미사용 `shareSlug` 상태 제거)
- 2026-06-19: 공유 생성/클립 저장 분리 + 로그인 클립 삭제(`feat/clip-save-share-split`). `clips.saved` 컬럼 추가(목록은 saved=true만). 메인 폼 로그인 시 버튼 2개("공유 링크 만들기"=saved:false / "내 클립에 추가"=saved:true). `PATCH/DELETE /api/clip/[slug]` 신규(소유자 확인). 내 클립 카드 삭제 버튼을 로그인(DB) 클립에도 노출. tsc 통과. **사용자 할 일: Supabase에 `alter table public.clips add column if not exists saved boolean not null default false;` 실행 + 푸시/배포.**
- 2026-06-24: 홈 입력 흐름 1클릭 재설계(`feat/home-autofetch-1click`, plan.md 13장) — URL 붙여넣기/입력 시 `/api/metadata` **자동 추출**(600ms 디바운스 + 붙여넣기 즉시, AbortController 로 직전 요청 취소·URL 변경 시 캐시 무효화). 버튼을 폼 안 **1차 1개**로 정리(로그인=공유 링크 만들기 / 비로그인=이 브라우저에 저장) — 기존 "미리보기 생성"·"미리보기+공유"·하단 "공유/추가" 4버튼 제거. `내 클립에 저장`은 결과 모달(`ShareResultLayer`)로 이동. 공유 카드 헤더에 로딩 스피너. 라이브 `/api/metadata` 검증(일반 사이트·네이버뉴스·카페 토큰링크 OK / 인스타·쿠팡 로그인벽은 폴백). tsc 통과, 신규 코드 ESLint 클린(기존 a-link·effect 경고는 무관, Next16 build 시 lint 미실행). **사용자 할 일(Mac): `pnpm dev` 로 동작 확인 → 빌드 → 푸시/배포.** (샌드박스는 linux-arm64 SWC 미설치로 `next build` 불가.)
- 2026-06-26: 랜딩 마케팅 카피 강화(`chore/landing-copy`) — 히어로(`app/page.tsx`) "붙여넣기 한 번, 클릭을 부르는 공유 카드", 소개 리드를 가치 우선 문장으로, 동작 3스텝·가치 박스(로그인 안 해도/하면) 표현 다듬기, FAQ "공유 링크를 열면" 1건 + `faqJsonLd` 동기화. 의미·사실·범위 불변(약관·동의·로그인 문구 제외). 네이티브 `clipnoteNative` `about.tsx`/`faq.tsx` 동일 톤 반영. web·native `tsc --noEmit` 통과.
