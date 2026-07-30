// 번역 대기 중인 로케일 라우트의 공통 메타데이터.
//
// `/en/*` 은 아직 한국어 본문을 그대로 내보낸다(사전이 한국어로 폴백). 같은 본문이 두 URL 로
// 색인되면 중복 콘텐츠로 취급될 수 있어, 번역이 붙기 전까지는 색인에서 제외한다.
// `follow: true` — 링크 추적은 막지 않는다(내부 링크 구조는 정상적으로 읽히게).
//
// 번역과 hreflang(plan.md 14장 4단계)이 들어오면 이 파일과 각 라우트의 `metadata` 를 지운다.

import type { Metadata } from "next";

export const EN_PENDING_METADATA: Metadata = {
  robots: { index: false, follow: true },
};
