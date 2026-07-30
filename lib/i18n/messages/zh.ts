// 중국어(간체) 사전 — 번역된 키만 담는다. 빠진 키는 한국어로 폴백한다(`lib/i18n/types.ts` 참고).
//
// 버튼 라벨은 짧게 잡는다(모바일 2열 + `whitespace-nowrap` — en.ts 주석 참고).

import type { PartialMessages } from "../types";

const zh: PartialMessages = {
  common: {
    myClips: "我的剪藏",
    login: "登录",
    logout: "退出登录",
    settings: "设置",
    privacy: "隐私政策",
    homeAria: "ClipNote 首页",
    cancel: "取消",
    delete: "删除",
    save: "保存",
  },

  clips: {
    guestNote: "这些剪藏保存在此浏览器中。登录后可在任何设备查看和分享。",
    accountNote: "这些剪藏已保存到你的账号。",
    newClip: "+ 新建剪藏",
    select: "选择",
    allTags: "全部",
    loading: "加载中…",
    loadFailed: "无法加载列表。已保存的剪藏并没有丢失。",
    retry: "重试",
    empty: "还没有保存任何剪藏。",
    emptyCta: "创建第一个剪藏",
    emptyForTag: "没有带「{tag}」标签的剪藏。",
    selectedCount: "已选 {count} 个",
    applyTags: "应用标签",
    selectAria: "选择 {title}",
    edit: "编辑",
    copyShareLink: "复制分享链接",
    createShareLink: "创建分享链接",
    creatingShareLink: "创建中…",
    copied: "已复制 ✓",
    openOriginal: "打开",

    deleteTitle: "要删除这个剪藏吗?",
    deleteBody: "将删除「{title}」。此操作无法撤销。",

    migrateTitle: "要迁移此设备上的剪藏吗?",
    migrateBody:
      "把此设备上保存的{count}迁移到账号后，在其他设备也能查看和整理。迁移后的剪藏会变成「已保存到我的剪藏」状态。",
    migrateConfirm: "迁移{count}",
    migrating: "迁移中…",

    discardTitle: "要删除此浏览器中的剪藏吗?",
    discardBody:
      "如果不迁移，此浏览器中保存的{count}将全部删除。这些剪藏只存在于此浏览器，所以{irreversible}",
    discardIrreversible: "无法撤销。",

    editTitle: "编辑剪藏",
    editTitleLabel: "标题",
    editTagsLabel: "标签",
    editTagsNote: "(用逗号分隔，最多 6 个)",
    editTagsPlaceholder: "开发, 设计",
    savingEdit: "保存中…",

    bulkTagTitle: "批量应用标签",
    bulkTagBody: "将应用于{count}。",
    bulkTagPlaceholder: "输入标签 (用逗号分隔)",
    bulkTagAria: "要应用的标签",
    bulkTagModeAdd: "在现有标签上{emphasis}",
    bulkTagModeAddEmphasis: "追加",
    bulkTagModeReplace: "把现有标签{emphasis}",
    bulkTagModeReplaceEmphasis: "替换为此",
    bulkTagApply: "应用",
    bulkTagApplying: "应用中…",

    bulkDeleteTitle: "要删除所选的{count}吗?",
    irreversible: "此操作无法撤销。",
    deleting: "删除中…",

    countUnit: "{count} 个",
  },

  home: {
    hero: {
      title: "把普通链接变成{accent}",
      titleAccent: "一张卡片",
      subtitle:
        "一步生成带标题和封面图的卡片和短链接。在聊天工具和社交平台上都清爽好看。",
    },
    form: {
      label: "创建剪藏",
      urlLabel: "URL",
      urlPlaceholder: "粘贴要分享的链接",
      urlHint: "粘贴链接后会自动加载预览。",
      titleLabel: "标题",
      titleNote: "(留空会自动填充)",
      titlePlaceholder: "卡片上显示的标题",
      tagsLabel: "标签",
      tagsNote: "(可选 · 用逗号分隔)",
      tagsPlaceholder: "开发, 设计, 稍后读",
      tagsHint: "加上标签后就能在{clips}里按相同标签集中查看。用逗号(,)分隔，最多 6 个。",
      frequentTags: "常用标签:",
    },
    preview: {
      titlePlaceholder: "标题将显示在这里",
    },
    cardPreview: {
      sectionAria: "分享卡片预览",
      title: "分享卡片",
      loading: "加载中",
      note: "分享链接后会这样显示",
      caption:
        "这是实际分享时显示的图片。有原始封面图时用作背景，没有时会根据标题生成渐变填充。",
    },
    clipPreview: {
      sectionAria: "我的剪藏保存预览",
      title: "保存到我的剪藏后",
      note: "在列表中会这样显示",
      caption: "左侧缩略图是原页面的封面图。没有时会用渐变填充。",
    },
    result: {
      title: "分享链接已生成 🎉",
      body: "复制链接分享出去。打开后会先显示分享卡片，然后跳转到原页面。",
      urlAria: "分享链接",
      open: "打开",
      close: "关闭",
      savedToClips: "已保存到我的剪藏 ✓",
      alreadyInClips: "已添加 ✓",
    },
    clearInputAria: "清空输入",
    errors: {
      metaFailed: "无法加载内容。请稍后再试。",
      titleRequiredForLink: "创建分享链接需要标题，请先填写。",
      linkCreateFailed: "创建分享链接失败。",
      linkCreateError: "创建分享链接时出现问题。",
      titleRequiredForClip: "添加剪藏需要标题，请先填写。",
      clipAddFailed: "添加剪藏失败。",
      clipAddError: "添加剪藏时出现问题。",
      titleRequiredForSave: "保存需要标题。",
    },
  },

  login: {
    title: "登录",
    subtitleWithKakao: "用 Google 或 Kakao 账号快速开始。",
    subtitleGoogleOnly: "用 Google 账号快速开始。",
    consent:
      "我同意在登录时为识别会员而收集社交账号信息(唯一标识符、邮箱、昵称与头像)。我已阅读{privacy}。",
    continueWith: "使用 {provider} 继续",
    redirecting: "跳转中…",
    recent: "最近使用",
    or: "或",
    continueAsGuest: "以访客身份继续",

    errorIncomplete: "登录未完成。请重试。",
    errorConsent: "需要同意隐私政策才能登录。",
    errorStart: "无法开始登录。请稍后再试。",
    errorGeneric: "登录时出现问题。",

    compareTitle: "登录 / 访客模式说明",
    signedInTitle: "登录后",
    signedInShortLink: "可以生成{emphasis}，发送到聊天工具和社交平台。",
    signedInShortLinkEmphasis: "短分享链接",
    signedInPreview: "分享的链接会显示为带标题和图片的预览卡片。",
    signedInSync: "剪藏会保存在账号里，{emphasis}也能照样查看，并按标签整理。",
    signedInSyncEmphasis: "在其他设备上",

    guestTitle: "不登录也可以",
    guestPreview: "粘贴网址即可生成预览卡片。",
    guestSave: "把剪藏保存在此浏览器，之后在「{clips}」中再查看。",
    guestLimit: "但保存只会留在{device}，而且{noLink}",
    guestLimitDevice: "此设备上",
    guestLimitNoLink: "无法生成短分享链接。",
  },

  settings: {
    title: "账号设置",
    subtitle: "管理登录信息和账号。",
    loading: "加载中…",
    signedInWith: "已使用 {provider} 账号登录",
    accountLabel: "{provider} 账号",
    providerUnknown: "社交",
    viewLink: "查看 ›",
    contact: "联系我们",
    contactAction: "发送邮件 ›",
    contactNote: "如需报告问题或提出功能建议，请发送至 {email}。",

    dangerTitle: "删除账号",
    dangerBody: "注销后账号以及保存的所有剪藏和分享链接将被永久删除，无法恢复。",
    withdraw: "注销账号",

    withdrawTitle: "确定要注销吗?",
    withdrawBody: "以下信息将被永久删除，无法恢复。",
    withdrawItemAccount: "账号信息(登录标识符·邮箱·个人资料)",
    withdrawItemClips: "保存的所有剪藏和分享链接",
    withdrawAgree: "我已阅读以上内容并同意删除。",
    withdrawing: "注销中…",
    withdrawFailed: "注销失败。请稍后再试。",
    withdrawError: "注销过程中出现问题。",
  },

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
    guestHint: "{login}后即可生成预览卡片和短链接。",
  },

  about: {
    titleSuffix: "是什么?",
    body1: "ClipNote 是把链接变成分享卡片的免费服务。",
    body2:
      "粘贴链接后会自动读取标题、说明和封面图，生成在聊天工具和社交平台上一眼就能看懂的卡片，以及一个短网址。",
    body3: "像 Naver Cafe 帖子、Instagram Reels 这类不容易生成预览的链接也支持。",

    howTitle: "使用方法",
    how1: "粘贴要分享的链接。标题、说明和封面图会自动填入。",
    how2:
      "点击「{createLink}」会生成一个先显示分享卡片的短网址。生成后同一个位置会变成「{copyLink}」。",
    how3: "只想发网址、不需要卡片时用「{copyOriginal}」— 会一起复制标题和原始网址。",
    how4:
      "「{saveToClips}」之后可以按标签整理，随时回来查看。登录前用「{saveHere}」只会留在此设备。",

    guestTitle: "不登录也可以",
    guestItem1: "粘贴链接就能立刻生成预览卡片。",
    guestItem2: "把剪藏保存在此浏览器，之后在「{clips}」中再查看。",
    guestItem3: "但保存只会留在{device}，而且{noLink}",
    guestItem3Device: "此设备上",
    guestItem3NoLink: "无法生成短分享链接。",

    signedInTitle: "登录后",
    signedInItem1: "可以用{emphasis}直接发送到聊天工具和社交平台。",
    signedInItem1Emphasis: "短分享链接",
    signedInItem2: "分享的链接会显示为带标题和图片的预览卡片。",
    signedInItem3: "剪藏会保存在账号里，{emphasis}都能照样查看，并按标签整理得很清楚。",
    signedInItem3Emphasis: "在任何设备上",
  },

  faq: {
    title: "常见问题",
    q1: "「{copyLink}」和「{copyOriginal}」有什么区别?",
    a1: "「{copyLink}」是 ClipNote 生成的短网址。打开后会先显示分享卡片，然后跳转到原页面。「{copyOriginal}」不经过卡片，直接复制标题和原始网址。短网址需要登录才能生成。",
    q2: "标签怎么用?",
    a2: "创建剪藏时在标签栏用逗号(,)分隔，最多可加 6 个。在「{clips}」页面点击标签可只看带该标签的剪藏，用过的标签下次会作为「常用标签」推荐，一次就能加上。",
    q3: "不登录也能用吗?",
    a3: "可以。不登录也能把链接保存到此浏览器。但生成短分享链接需要用 Google 或 Kakao 登录。",
    q4: "Naver Cafe 和 Instagram 的链接也支持吗?",
    a4: "支持。专用提取功能可以获取 Naver Cafe 帖子标题以及 Instagram Reels、帖子的信息。非公开和仅成员可见的内容可能受限。",
    q5: "打开分享链接会怎样?",
    a5: "点击后会短暂显示预览卡片，然后自然跳转到原页面。",
    q6: "是免费的吗?",
    a6: "是的，可以免费使用。",
  },

  language: {
    label: "语言",
    koreanOnlyNotice: "本文件仅提供韩文版本。",
  },
};

export default zh;
