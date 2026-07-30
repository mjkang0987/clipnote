// 영어 사전 — 번역된 키만 담는다. 빠진 키는 한국어로 폴백한다(`lib/i18n/types.ts` 참고).
//
// 버튼 라벨은 **짧게** 잡는다. 버튼이 모바일에서 좌우 2열이고 `whitespace-nowrap` 이라
// 라벨이 길면 버튼 밖으로 넘친다(예: "Save to My Clips" 대신 "Save to Clips").

import type { PartialMessages } from "../types";

const en: PartialMessages = {
  common: {
    myClips: "My Clips",
    login: "Sign in",
    logout: "Sign out",
    settings: "Settings",
    privacy: "Privacy Policy",
    homeAria: "ClipNote home",
    cancel: "Cancel",
    delete: "Delete",
    save: "Save",
  },

  clips: {
    guestNote:
      "These clips are saved in this browser. Sign in to see and share them anywhere.",
    accountNote: "These clips are saved to your account.",
    newClip: "+ New clip",
    select: "Select",
    allTags: "All",
    loading: "Loading…",
    loadFailed: "Couldn't load the list. Your saved clips are still there.",
    retry: "Try again",
    empty: "No clips saved yet.",
    emptyCta: "Create your first clip",
    emptyForTag: "No clips tagged \u2018{tag}\u2019.",
    selectedCount: "{count} selected",
    applyTags: "Apply tags",
    selectAria: "Select {title}",
    edit: "Edit",
    copyShareLink: "Copy share link",
    createShareLink: "Create share link",
    creatingShareLink: "Creating…",
    copied: "Copied ✓",
    openOriginal: "Open",

    deleteTitle: "Delete this clip?",
    deleteBody: "\u2018{title}\u2019 will be deleted. This can't be undone.",

    migrateTitle: "Move clips from this device?",
    migrateBody:
      "Move the {count} saved on this device to your account and you'll see them anywhere. Moved clips become saved to My Clips.",
    migrateConfirm: "Move {count}",
    migrating: "Moving…",

    discardTitle: "Delete the clips in this browser?",
    discardBody:
      "If you don't move them, all {count} saved in this browser will be deleted. They exist only in this browser, so {irreversible}",
    discardIrreversible: "this can't be undone.",

    editTitle: "Edit clip",
    editTitleLabel: "Title",
    editTagsLabel: "Tags",
    editTagsNote: "(comma-separated, up to 6)",
    editTagsPlaceholder: "dev, design",
    savingEdit: "Saving…",

    bulkTagTitle: "Apply tags in bulk",
    bulkTagBody: "Applies to {count}.",
    bulkTagPlaceholder: "Enter tags (comma-separated)",
    bulkTagAria: "Tags to apply",
    bulkTagModeAdd: "{emphasis} to existing tags",
    bulkTagModeAddEmphasis: "Add",
    bulkTagModeReplace: "{emphasis} existing tags",
    bulkTagModeReplaceEmphasis: "Replace",
    bulkTagApply: "Apply",
    bulkTagApplying: "Applying…",

    bulkDeleteTitle: "Delete the {count} selected?",
    irreversible: "This can't be undone.",
    deleting: "Deleting…",

    countUnit: "{count} clips",
  },

  home: {
    hero: {
      title: "Turn a plain link into {accent}",
      titleAccent: "a card",
      subtitle:
        "A card with the title and cover image, plus a short link — in one step. Looks clean on messengers and social.",
    },
    form: {
      label: "Create a clip",
      urlLabel: "URL",
      urlPlaceholder: "Paste a link to share",
      urlHint: "Paste a link and we'll load the preview automatically.",
      titleLabel: "Title",
      titleNote: "(filled in automatically if left blank)",
      titlePlaceholder: "Title shown on the card",
      tagsLabel: "Tags",
      tagsNote: "(optional · comma-separated)",
      tagsPlaceholder: "dev, design, to read",
      tagsHint:
        "Tag a clip and you can browse it with others of the same tag in {clips}. Separate with commas, up to 6.",
      frequentTags: "Recent tags:",
    },
    preview: {
      titlePlaceholder: "The title will appear here",
    },
    errors: {
      metaFailed: "Couldn't load the content. Please try again in a moment.",
      titleRequiredForLink: "A title is required to create a share link. Please enter one.",
      linkCreateFailed: "Couldn't create the share link.",
      linkCreateError: "Something went wrong while creating the share link.",
      titleRequiredForClip: "A title is required to add a clip. Please enter one.",
      clipAddFailed: "Couldn't add the clip.",
      clipAddError: "Something went wrong while adding the clip.",
      titleRequiredForSave: "A title is required to save.",
    },
  },

  settings: {
    title: "Account settings",
    subtitle: "Manage your sign-in details and account.",
    loading: "Loading…",
    signedInWith: "Signed in with {provider}",
    accountLabel: "{provider} account",
    providerUnknown: "social",
    viewLink: "View ›",
    contact: "Contact us",
    contactAction: "Send email ›",
    contactNote: "Report bugs or request features at {email}.",

    dangerTitle: "Delete account",
    dangerBody:
      "Deleting your account permanently removes it along with every saved clip and share link. This can't be recovered.",
    withdraw: "Delete account",

    withdrawTitle: "Delete your account?",
    withdrawBody: "The following will be permanently deleted and can't be recovered.",
    withdrawItemAccount: "Account details (sign-in identifier, email, profile)",
    withdrawItemClips: "Every saved clip and share link",
    withdrawAgree: "I've read the above and agree to the deletion.",
    withdrawing: "Deleting…",
    withdrawFailed: "Couldn't delete the account. Please try again in a moment.",
    withdrawError: "Something went wrong while deleting the account.",
  },

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
    guestHint: "{login} to create preview cards and short links.",
  },

  language: {
    label: "Language",
    koreanOnlyNotice: "This document is provided in Korean only.",
  },
};

export default en;
