import LoginPage from "@/app/_components/LoginPage";
import { getMessages } from "@/lib/i18n";
import { localePageMetadata } from "@/lib/i18n/pageMetadata";

// 중국어(간체) 로케일. canonical 과 hreflang 상호 참조는 localePageMetadata 가 만든다.
export const metadata = localePageMetadata("zh", "/login", {
  title: getMessages("zh").login.title,
});

export default function Page() {
  return <LoginPage locale="zh" />;
}
