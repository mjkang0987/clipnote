import type { Metadata } from "next";

import PrivacyPage from "@/app/_components/PrivacyPage";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description:
    "ClipNote가 수집하는 개인정보 항목, 이용 목적, 보유 기간, 처리위탁(국외 이전), 이용자 권리를 안내합니다.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

/** 한국어(원본). 본문은 `PrivacyPage` 에 있고 이 파일은 로케일과 메타데이터만 지정한다. */
export default function Page() {
  return <PrivacyPage locale="ko" />;
}
