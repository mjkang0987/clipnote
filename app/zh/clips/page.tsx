import ClipsPage from "@/app/_components/ClipsPage";

// 중국어(간체) 로케일. 번역이 채워지기 전까지는 색인 제외(`lib/i18n/pendingMetadata.ts` 참고).
export { PENDING_TRANSLATION_METADATA as metadata } from "@/lib/i18n/pendingMetadata";

export default function Page() {
  return <ClipsPage locale="zh" />;
}
