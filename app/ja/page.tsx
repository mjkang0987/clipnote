import HomePage from "@/app/_components/HomePage";

// 사전이 아직 한국어로 폴백하므로 본문도 한국어다 — 번역 전까지 색인 제외(`pendingMetadata.ts` 참고).
export { PENDING_TRANSLATION_METADATA as metadata } from "@/lib/i18n/pendingMetadata";

/** 일본어. 로직은 `HomePage` 에 있고 이 파일은 로케일만 지정한다. */
export default function Page() {
  return <HomePage locale="ja" />;
}
