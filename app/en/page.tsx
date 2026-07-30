import HomePage from "@/app/_components/HomePage";

// 사전이 아직 한국어로 폴백하므로 본문도 한국어다 — 번역 전까지 색인 제외(`_pending.ts` 참고).
export { EN_PENDING_METADATA as metadata } from "@/app/en/_pending";

/** 영어. 로직은 `HomePage` 에 있고 이 파일은 로케일만 지정한다. */
export default function Page() {
  return <HomePage locale="en" />;
}
