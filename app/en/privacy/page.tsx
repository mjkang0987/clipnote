// 영어 로케일 라우트 — 구조만 먼저 세운다(plan.md 14장 3단계).
// 문자열 사전화와 내부 링크 로컬라이즈는 다음 슬라이스에서 붙인다. 그때까지 내용은 한국어다.
//
// `app/privacy/page.tsx` 의 `metadata`(제목·설명)는 default 재export 로 따라오지 않는다.
// 지금은 색인 제외 상태라 문제 없고, 로케일별 메타데이터는 4단계에서 한 번에 붙인다.
export { PENDING_TRANSLATION_METADATA as metadata } from "@/lib/i18n/pendingMetadata";
export { default } from "@/app/privacy/page";
