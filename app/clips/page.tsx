import ClipsPage from "@/app/_components/ClipsPage";
import { getMessages } from "@/lib/i18n";
import { localePageMetadata } from "@/lib/i18n/pageMetadata";

// 한국어(원본) 로케일. canonical 과 hreflang 상호 참조는 localePageMetadata 가 만든다.
export const metadata = localePageMetadata("ko", "/clips", {
  title: getMessages("ko").common.myClips,
});

export default function Page() {
  return <ClipsPage locale="ko" />;
}
