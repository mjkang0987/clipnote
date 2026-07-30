import HomePage from "@/app/_components/HomePage";
import { localePageMetadata } from "@/lib/i18n/pageMetadata";

// 영어 로케일. canonical 과 hreflang 상호 참조는 localePageMetadata 가 만든다.
export const metadata = localePageMetadata("en", "/");

export default function Page() {
  return <HomePage locale="en" />;
}
