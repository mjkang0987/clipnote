# ClipNote — index.md

> 프로젝트 구조와 현재 상태의 source of truth. 작업 완료 시 갱신한다.

## 프로젝트 정보

- **이름**: ClipNote
- **도메인**: clipnote.co.kr
- **저장소**: https://github.com/mjkang0987/clipnote.git
- **스택**: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase(Postgres) · @vercel/og
- **배포**: Vercel (예정)

## 현재 상태

- 단계: **MVP 핵심 완성 — 메타 파싱 + 슬러그 발급 + 공유 페이지 + 동적 OG 이미지 동작. 저장소는 메모리(임시), Supabase 미연결**
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
├── lib/
│   ├── gradients.ts   # 그라디언트 프리셋 + 결정적 선택 (구현됨)
│   ├── metadata.ts    # 어댑터→OG→HTML 단계별 폴백 (구현됨)
│   ├── slug.ts        # base-57 슬러그 생성 (구현됨)
│   ├── store.ts       # ClipStore 인터페이스 + 메모리 구현(임시) (구현됨)
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
- 2026-06-18: 동적 OG 이미지(`/api/og`, next/og) — 그라디언트+제목+설명 카드, Pretendard woff 서브셋 번들(한글 렌더 확인). 슬러그(`lib/slug.ts`)·메모리 저장소(`lib/store.ts`)·생성 API(`/api/clip`)·공유 페이지(`/[slug]`, OG 주입+스마트 리다이렉트) 구현. E2E(생성→공유→OG메타→404) 검증 완료.
  - ⚠️ 저장소가 메모리라 서버 재시작 시 클립 사라짐 → Supabase 연동 시 교체 필요.
  - ⚠️ og:image 가 metadataBase(clipnote.co.kr) 기준 절대 URL → 로컬에선 이미지 미리보기는 `/api/og` 직접 호출로 확인.
