// 영어 사전 — 번역된 키만 담는다. 빠진 키는 한국어로 폴백한다(`lib/i18n/types.ts` 참고).
//
// 버튼 라벨은 **짧게** 잡는다. 버튼이 모바일에서 좌우 2열이고 `whitespace-nowrap` 이라
// 라벨이 길면 버튼 밖으로 넘친다(예: "Save to My Clips" 대신 "Save to Clips").

import type { PartialMessages } from "../types";

const en: PartialMessages = {
  homeActions: {
    createLink: "Create link",
    creating: "Creating…",
    loadingMeta: "Loading…",
    copyLink: "Copy link",
    copyOriginal: "Copy original",
    share: "Share",
    copied: "Copied ✓",
    saveToClips: "Save to Clips",
    saving: "Saving…",
    saved: "Saved ✓",
    alreadySaved: "Already saved ✓",
    saveHere: "Save in browser",
    hintBeforeLink:
      "Create link makes a short URL that shows a preview card first. Copy original copies the title and the original URL.",
    hintAfterLink:
      "Copy link copies the short URL you just made. Copy original copies the title and the original URL.",
    guestHint: "Sign in to create preview cards and short links.",
  },

  language: {
    label: "Language",
    koreanOnlyNotice: "This document is provided in Korean only.",
  },
};

export default en;
