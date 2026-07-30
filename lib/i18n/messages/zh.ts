// 중국어(간체) 사전 — 번역된 키만 담는다. 빠진 키는 한국어로 폴백한다(`lib/i18n/types.ts` 참고).

import type { PartialMessages } from "../types";

const zh: PartialMessages = {
  language: {
    label: "语言",
    koreanOnlyNotice: "本文件仅提供韩文版本。",
  },
};

export default zh;
