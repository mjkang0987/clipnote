import type { Metadata } from "next";

import PrivacyPage from "@/app/_components/PrivacyPage";

// 중국어(간체) 로케일. **본문은 한국어로 유지**하고 안내문만 이 언어로 보여준다
// (법적 문서라 기계 번역 게시가 위험 — `PrivacyPage` 주석 참고).
//
// 판본이 하나뿐이므로 이 경로는 색인 대상이 아니다. canonical 로 한국어 원문을
// 가리켜 중복 콘텐츠로 잡히는 것도 막는다. 번역이 채워진 뒤에도 이 상태를 유지한다.
export const metadata: Metadata = {
  // 본문이 한국어이므로 제목도 한국어 — 사이트 기본 제목(홈)으로 폴백하지 않게 명시한다.
  title: "개인정보처리방침",
  alternates: { canonical: "/privacy" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <PrivacyPage locale="zh" />;
}
