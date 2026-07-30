// 중국어(간체) 사전 — 번역된 키만 담는다. 빠진 키는 한국어로 폴백한다(`lib/i18n/types.ts` 참고).
//
// 버튼 라벨은 짧게 잡는다(모바일 2열 + `whitespace-nowrap` — en.ts 주석 참고).

import type { PartialMessages } from "../types";

const zh: PartialMessages = {
  homeActions: {
    createLink: "创建链接",
    creating: "创建中…",
    loadingMeta: "加载中…",
    copyLink: "复制链接",
    copyOriginal: "复制原链接",
    share: "分享",
    copied: "已复制 ✓",
    saveToClips: "保存到剪藏",
    saving: "保存中…",
    saved: "已保存 ✓",
    alreadySaved: "已存在 ✓",
    saveHere: "保存到浏览器",
    hintBeforeLink:
      "「创建链接」会生成一个先显示预览卡片的短链接，「复制原链接」会复制标题和原始网址。",
    hintAfterLink:
      "「复制链接」复制刚生成的短链接，「复制原链接」复制标题和原始网址。",
    guestHint: "登录后即可生成预览卡片和短链接。",
  },

  language: {
    label: "语言",
    koreanOnlyNotice: "本文件仅提供韩文版本。",
  },
};

export default zh;
