import LoginClient from "@/app/_components/LoginClient";
import { getMessages, type Locale } from "@/lib/i18n";

/**
 * Login 화면의 서버 부분 — 로케일별 라우트가 공유한다.
 *
 * 서버 데이터는 없고 **사전을 골라 내리는 역할만** 한다. 그래도 서버 컴포넌트로 두는 이유:
 * 클라이언트에서 사전을 고르면 4개 언어가 전부 번들에 실린다.
 */
export default function LoginPage({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  // 화면이 쓰는 namespace 만 골라 넘긴다. 사전을 통째로 넘기면 그 화면이 쓰지 않는
  // 문구까지 RSC 페이로드에 실려 나간다(예: 내 클립 응답에 FAQ 문구가 들어갔다).
  return (
    <LoginClient
      messages={{ common: m.common, compare: m.compare, login: m.login }}
    />
  );
}
