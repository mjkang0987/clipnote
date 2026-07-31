import ClipsPage from "@/app/_components/ClipsPage";
import { getMessages } from "@/lib/i18n";
import { localePageMetadata } from "@/lib/i18n/pageMetadata";

// 일본어 로케일. canonical 과 hreflang 상호 참조는 localePageMetadata 가 만든다.
export const metadata = localePageMetadata("ja", "/clips", {
  title: getMessages("ja").common.myClips,
});

export default function Page() {
  return <ClipsPage locale="ja" />;
}
