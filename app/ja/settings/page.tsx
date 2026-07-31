import SettingsPage from "@/app/_components/SettingsPage";
import { getMessages } from "@/lib/i18n";
import { localePageMetadata } from "@/lib/i18n/pageMetadata";

// 일본어 로케일. canonical 과 hreflang 상호 참조는 localePageMetadata 가 만든다.
export const metadata = localePageMetadata("ja", "/settings", {
  title: getMessages("ja").settings.title,
  index: false,
});

export default function Page() {
  return <SettingsPage locale="ja" />;
}
