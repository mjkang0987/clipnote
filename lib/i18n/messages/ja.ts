// 일본어 사전 — 번역된 키만 담는다. 빠진 키는 한국어로 폴백한다(`lib/i18n/types.ts` 참고).
//
// 버튼 라벨은 짧게 잡는다(모바일 2열 + `whitespace-nowrap` — en.ts 주석 참고).

import type { PartialMessages } from "../types";

const ja: PartialMessages = {
  homeActions: {
    createLink: "リンクを作成",
    creating: "作成中…",
    loadingMeta: "読み込み中…",
    copyLink: "リンクをコピー",
    copyOriginal: "元URLをコピー",
    share: "共有",
    copied: "コピーしました ✓",
    saveToClips: "クリップに保存",
    saving: "保存中…",
    saved: "保存しました ✓",
    alreadySaved: "保存済み ✓",
    saveHere: "ブラウザに保存",
    hintBeforeLink:
      "「リンクを作成」はプレビューカードが先に表示される短いURLを作ります。「元URLをコピー」はタイトルと元のURLをコピーします。",
    hintAfterLink:
      "「リンクをコピー」は今作った短いURLを、「元URLをコピー」はタイトルと元のURLをコピーします。",
    guestHint: "プレビューカードと短いリンクはログインすると作成できます。",
  },

  language: {
    label: "言語",
    koreanOnlyNotice: "この文書は韓国語でのみ提供されます。",
  },
};

export default ja;
