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

  language: {
    label: "语言",
    koreanOnlyNotice: "本文件仅提供韩文版本。",
  },
};

export default zh;
