# ClipNote

링크를 공유 카드로 바꿔 주는 서비스. URL 을 붙여넣으면 제목·설명·대표 이미지를 자동으로
읽어와 미리보기 카드와 짧은 링크를 만든다. 네이버 카페·인스타그램처럼 미리보기가 잘 잡히지
않는 링크도 전용 어댑터로 처리한다.

- 운영: <https://clipnote.co.kr>
- iOS 앱: [`mjkang0987/clipnote-ios`](https://github.com/mjkang0987/clipnote-ios)
  — 공유 텍스트 규칙·다국어 문구를 이 저장소와 맞춘다. **한쪽만 바꾸지 않는다.**

## 문서

이 README 는 진입점일 뿐이고, 실제 내용은 아래가 source of truth 다.

| 문서 | 내용 |
|---|---|
| [`index.md`](./index.md) | 프로젝트 구조·현재 상태 |
| [`plan.md`](./plan.md) | 작업 계획·결정 사항·변경 이력 |
| [`design-guide.md`](./design-guide.md) | 디자인 시스템 |
| [`CLAUDE.md`](./CLAUDE.md) | 작업 규약(브랜치·커밋·검증·위험 명령 금지) |

## 개발

```bash
pnpm install
pnpm dev          # http://localhost:4000
```

환경변수는 `.env.example` 참고. Supabase 키가 없으면 인증이 꺼진 상태로 동작한다
(게스트 모드 — 클립은 브라우저 localStorage 에만 저장된다).

```bash
npx tsc --noEmit  # 타입
npx eslint        # 린트
pnpm build        # 프로덕션 빌드
```

## 스택

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase(Postgres) ·
`@vercel/og` · Vercel 배포.

## 다국어

한국어(원본)·영어·일본어·중국어 간체. 경로로 나눈다 — `/` `/en` `/ja` `/zh`.

로케일의 진실은 **URL** 이다. 쿠키·localStorage 를 두지 않으며, 서버는 미들웨어가 넘긴 요청
헤더로, 클라이언트는 `usePathname()` 으로 같은 URL 을 읽는다. 문구는 `lib/i18n/messages/`
에 있고, 번역이 없는 키는 한국어로 폴백한다.

자세한 내용은 `plan.md` 14장.

## 브랜치

`main`(운영) ← `feature/*`. 작업 브랜치는 **`main` 최신본에서 딴다.**

`main` 머지는 **지시자 승인이 있을 때만** 한다 — `main` 푸시가 곧 Vercel 프로덕션 배포다.
PR 직전 `origin/main`을 다시 병합해 검증을 통과시킨다(브랜치를 딴 뒤 `main`이 움직였으면 검증 기준이 낡은 것).

`develop`은 더 이상 배포 경로가 아니다. 상세 규약은 `CLAUDE.md`.
