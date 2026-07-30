import LoginClient from "@/app/_components/LoginClient";
import { getMessages, type Locale } from "@/lib/i18n";

/**
 * Login 화면의 서버 부분 — 로케일별 라우트가 공유한다.
 *
 * 서버 데이터는 없고 **사전을 골라 내리는 역할만** 한다. 그래도 서버 컴포넌트로 두는 이유:
 * 클라이언트에서 사전을 고르면 4개 언어가 전부 번들에 실린다.
 */
export default function LoginPage({ locale }: { locale: Locale }) {
  return <LoginClient messages={getMessages(locale)} />;
}
