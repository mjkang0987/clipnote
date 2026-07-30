// 영어 사전 — 번역된 키만 담는다. 빠진 키는 한국어로 폴백한다(`lib/i18n/types.ts` 참고).

import type { PartialMessages } from "../types";

const en: PartialMessages = {
  language: {
    label: "Language",
    koreanOnlyNotice: "This document is provided in Korean only.",
  },
};

export default en;
