# CLAUDE.md

> 이 저장소에서 Claude가 항상 따라야 할 지시사항. 세션 시작 시 `index.md`·`plan.md`와 함께 읽는다.

## Priority Order
1. Core Principles
2. Session Startup Rules
3. Development Workflow
4. Work Request Flow
5. Front-End Standards
6. Documentation Maintenance

## Core Principles
- If unsure, say so instead of guessing.
- Point out problems with my approach directly.
- If something fails, investigate the root cause before retrying.

## Session Startup Rules
- 새 세션 시작 시 `index.md`·`plan.md`를 먼저 읽는다.
- `index.md`는 프로젝트 구조·현재 상태의 source of truth, `plan.md`는 현재/향후 작업의 source of truth.
- 문서와 구현이 다르면 불일치를 보고하고 확인받은 뒤 진행한다.

## Development Workflow
- 작업 전에 `plan.md`에 요구사항·구현 방식·영향 파일·기대 결과를 적고 확정한 뒤 코드를 만진다.
- 스코프가 바뀌면 `plan.md`를 갱신한다.
- **버전은 수동으로 올리지 않는다.** `main` 푸시 시 `release-please`가 **Conventional Commits**를 읽어 버전·CHANGELOG·태그를 자동 반영한다(릴리스 PR 머지). 따라서 커밋 prefix가 곧 버전 규칙: `feat:`→minor, `fix:`/`perf:`→patch, `feat!:`/`BREAKING CHANGE`→major.

## Work Request Flow (업무 처리 절차)
> 사용자가 업무를 요청하면 아래 순서를 따른다.

**세부 규약:**
- **이슈당 브랜치 · 이슈당 PR.** 브랜치명 `claude/issue-<번호>-<짧은슬러그>`, **`develop`에서 분기 · `develop`으로 PR**(기능 통합 브랜치). `main`엔 직접 작업하지 않는다.
- **자동 머지.** 8단계(코드검증·자동리뷰·CI)가 그린이면 사용자 승인 없이 `develop`으로 머지.
- **라벨**: `feature`/`fix`/`chore`/`refactor`/`docs`(없으면 생성). 하위 작업 3개 이상이면 상위(에픽) 이슈 + 서브이슈.
- **검증 범위**: 항상 빌드/타입체크. 런타임 변경은 `/verify`로 구동. 문서·설정만이면 빌드만.

1. **업무 요청 접수** — 모호하면 먼저 질문해 범위를 확정한다(추측 금지).
2. **이슈 분할·생성** — 작업을 단위로 쪼개 GitHub 이슈를 만든다(배경·작업 체크리스트·완료 조건·관련 파일). 큰 기능은 에픽+서브이슈.
3. **작업** — `develop`에서 이슈당 브랜치를 만들어 구현. 커밋은 최소 단위·한국어·**Conventional Commits**(`On Commit` 준수).
4. **검증** — `/verify`로 빌드(`pnpm build`) + 실제 동작 확인.
5. **코드리뷰** — `/code-review`로 diff 리뷰.
   1. **리팩토링** — 지적 반영 + `/simplify`.
6. **재검증** — 리팩토링 후 다시 빌드·검증.
7. **PR 생성** — `develop` 대상, 본문에 `Closes #<이슈>`. PR 생성 시 자동 CI(`.github/workflows/pr-review.yml`)가 실행된다.
8. **코드 검증** — PR 상태에서 최종 검증(`/verify`) + CI 결과 확인. 지적이 있으면 4~6 반복.
9. **머지** — 그린이면 `develop`으로 자동 머지. 이슈 자동 종료, `index.md`·`plan.md` 갱신. **버전 범프는 하지 않는다**(release-please 자동).
10. **릴리스·배포** — `develop`을 `main`으로 승격하면 `release-please`가 릴리스 PR(버전·CHANGELOG)을 생성/갱신하고, 그 PR 머지 시 태그가 찍히며 **Vercel이 자동 배포**한다.

## Front-End Standards
- 웹 표준·접근성(WCAG) 준수, 시맨틱 HTML 우선.
- 네이티브 폼 요소(radio/checkbox/select/button)를 커스텀 구현보다 우선 사용한다.
- 불필요하게 브라우저 기본 기능을 대체하는 커스텀 UI를 만들지 않는다.

## Documentation Maintenance
- 작업 완료 후 `index.md`·`plan.md`를 갱신한다.

## On Commit
- 커밋은 최소 단위로 나눈다.
- 커밋 메시지는 한국어.
- **Conventional Commits 필수**(`feat:`/`fix:`/`perf:`/`refactor:`/`docs:`/`chore:`/`style:`) — release-please가 이를 읽어 버전을 계산한다.
- 커밋 후 항상 push.
