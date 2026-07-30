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
    cardPreview: {
      sectionAria: "Share card preview",
      title: "Share card",
      loading: "Loading",
      note: "This is how the link will look when shared",
      caption:
        "This is the image people will see. The page's cover image is used as the background, or a gradient built from the title when there isn't one.",
    },
    clipPreview: {
      sectionAria: "My Clips preview",
      title: "Saved to My Clips",
      note: "This is how it looks in the list",
      caption:
        "The thumbnail on the left is the page's cover image. A gradient fills in when there isn't one.",
    },
    result: {
      title: "Your share link is ready 🎉",
      body: "Copy the link and share it. Opening it shows the share card first, then goes to the original.",
      urlAria: "Share link",
      open: "Open",
      close: "Close",
      savedToClips: "Saved to My Clips ✓",
      alreadyInClips: "Already added ✓",
    },
    clearInputAria: "Clear input",
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

  login: {
    title: "Sign in",
    subtitleWithKakao: "Get started quickly with your Google or Kakao account.",
    subtitleGoogleOnly: "Get started quickly with your Google account.",
    consent:
      "I agree that my social account details (unique identifier, email, profile nickname and image) are collected to identify me when signing in. I've read the {privacy}.",
    continueWith: "Continue with {provider}",
    redirecting: "Redirecting…",
    recent: "Last used",
    or: "or",
    continueAsGuest: "Continue as guest",

    errorIncomplete: "Sign-in didn't complete. Please try again.",
    errorConsent: "You need to agree to the privacy policy to sign in.",
    errorStart: "Couldn't start sign-in. Please try again in a moment.",
    errorGeneric: "Something went wrong while signing in.",

    compareTitle: "Signed in vs. guest",
    signedInTitle: "When you sign in",
    signedInShortLink: "Create a {emphasis} to send on messengers and social.",
    signedInShortLinkEmphasis: "short share link",
    signedInPreview: "Shared links show up as preview cards with a title and image.",
    signedInSync: "Clips collect in your account, stay visible {emphasis}, and sort by tag.",
    signedInSyncEmphasis: "on your other devices",

    guestTitle: "Without signing in",
    guestPreview: "Paste a URL to build a preview card.",
    guestSave: "Save clips in this browser and find them again in {clips}.",
    guestLimit: "But they stay {device}, and {noLink}",
    guestLimitDevice: "on this device only",
    guestLimitNoLink: "you can't create short share links.",
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

  about: {
    titleSuffix: " \u2014 what is it?",
    body1: "ClipNote is a free service that turns a link into a share card.",
    body2:
      "Paste a link and it reads the title, description, and cover image automatically, then builds a card that reads at a glance on messengers and social — plus a short URL.",
    body3:
      "It also handles links that usually don't preview well, like Naver Cafe posts and Instagram reels.",

    howTitle: "How it works",
    how1: "Paste the link you want to share. Title, description, and cover image fill in automatically.",
    how2:
      "Press \u201c{createLink}\u201d and you get a short URL that shows the share card first. After that, the same button becomes \u201c{copyLink}\u201d.",
    how3:
      "Just need the address without the card? \u201c{copyOriginal}\u201d copies the title and the original URL together.",
    how4:
      "\u201c{saveToClips}\u201d keeps it for later, sorted by tag. Before you sign in, \u201c{saveHere}\u201d keeps it on this device only.",

    guestTitle: "Without signing in",
    guestItem1: "Paste a link and build a preview card right away.",
    guestItem2: "Save clips in this browser and find them again in \u2018{clips}\u2019.",
    guestItem3: "But they stay {device}, and {noLink}",
    guestItem3Device: "on this device only",
    guestItem3NoLink: "you can't create short share links.",

    signedInTitle: "When you sign in",
    signedInItem1: "Send a {emphasis} straight to messengers and social.",
    signedInItem1Emphasis: "short share link",
    signedInItem2: "Shared links show up as preview cards with a title and image.",
    signedInItem3: "Clips collect in your account, stay visible {emphasis}, and sort neatly by tag.",
    signedInItem3Emphasis: "on any device",
  },

  faq: {
    title: "Frequently asked questions",
    q1: "What's the difference between \u201c{copyLink}\u201d and \u201c{copyOriginal}\u201d?",
    a1: "\u201c{copyLink}\u201d is the short URL ClipNote created. Opening it shows the share card first, then goes to the original. \u201c{copyOriginal}\u201d skips the card and copies the title and original URL as-is. Short URLs require signing in.",
    q2: "How do tags work?",
    a2: "When you create a clip, add up to 6 tags in the tag field, separated by commas. Tap a tag on the \u2018{clips}\u2019 screen to see only clips with that tag. Tags you've used before are suggested under \u201cRecent tags\u201d so you can add them in one tap.",
    q3: "Can I use it without signing in?",
    a3: "Yes. You can save links in this browser without an account. Creating short share links requires signing in with Google or Kakao.",
    q4: "Do Naver Cafe and Instagram links work?",
    a4: "Yes. Dedicated extractors pull Naver Cafe post titles and Instagram reel or post details. Private and members-only posts may be limited.",
    q5: "What happens when someone opens a share link?",
    a5: "The preview card appears briefly, then it moves on to the original page.",
    q6: "Is it free?",
    a6: "Yes, it's free to use.",
  },

  language: {
    label: "Language",
    koreanOnlyNotice: "This document is provided in Korean only.",
  },
};

export default en;
