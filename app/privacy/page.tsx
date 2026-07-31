import type { Metadata } from "next";

import PrivacyPage from "@/app/_components/PrivacyPage";

/**
 * 개인정보처리방침 — **한국어 판본만 존재한다**(본문을 번역하지 않기로 했다).
 *
 * 그래서 hreflang 상호 참조를 두지 않는다. 다른 언어 경로(`/en/privacy` 등)는
 * 같은 한국어 본문을 보여주는 편의 경로이고 canonical 로 이 페이지를 가리킨다.
 */
export const metadata: Metadata = {
  title: "개인정보처리방침",
  description:
    "ClipNote가 수집하는 개인정보 항목, 이용 목적, 보유 기간, 처리위탁(국외 이전), 이용자 권리를 안내합니다.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <PrivacyPage locale="ko" />;
}
