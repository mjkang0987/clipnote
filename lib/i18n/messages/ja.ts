// 일본어 사전 — 번역된 키만 담는다. 빠진 키는 한국어로 폴백한다(`lib/i18n/types.ts` 참고).
//
// 버튼 라벨은 짧게 잡는다(모바일 2열 + `whitespace-nowrap` — en.ts 주석 참고).

import type { PartialMessages } from "../types";

const ja: PartialMessages = {
  common: {
    myClips: "マイクリップ",
    login: "ログイン",
  },

  home: {
    hero: {
      // 他の言語と同じく1行に収まる長さにする(日本語は空白で折り返せないため長いと
      // 助詞が行頭に来て読みにくくなる)。
      title: "ただのリンクを{accent}",
      titleAccent: "1枚のカードに",
      subtitle:
        "タイトルとカバー画像が入ったカードと短いリンクを一度に。メッセンジャーやSNSでもきれいに表示されます。",
    },
    form: {
      label: "クリップを作成",
      urlLabel: "URL",
      urlPlaceholder: "共有するリンクを貼り付け",
      urlHint: "リンクを貼り付けるとプレビューを自動で読み込みます。",
      titleLabel: "タイトル",
      titleNote: "(未入力なら自動で入ります)",
      titlePlaceholder: "カードに表示するタイトル",
      tagsLabel: "タグ",
      tagsNote: "(任意 · カンマ区切り)",
      tagsPlaceholder: "開発, デザイン, あとで読む",
      tagsHint:
        "タグを付けると{clips}で同じタグごとにまとめて見られます。カンマ(,)で複数、最大6個までです。",
      frequentTags: "よく使うタグ:",
    },
    preview: {
      titlePlaceholder: "ここにタイトルが表示されます",
    },
    errors: {
      metaFailed: "内容を読み込めませんでした。しばらくしてからもう一度お試しください。",
      titleRequiredForLink: "共有リンクを作るにはタイトルが必要です。入力してください。",
      linkCreateFailed: "共有リンクの作成に失敗しました。",
      linkCreateError: "共有リンクの作成中に問題が発生しました。",
      titleRequiredForClip: "クリップを追加するにはタイトルが必要です。入力してください。",
      clipAddFailed: "クリップの追加に失敗しました。",
      clipAddError: "クリップの追加中に問題が発生しました。",
      titleRequiredForSave: "保存するにはタイトルが必要です。",
    },
  },

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
    guestHint: "プレビューカードと短いリンクは{login}すると作成できます。",
  },

  language: {
    label: "言語",
    koreanOnlyNotice: "この文書は韓国語でのみ提供されます。",
  },
};

export default ja;
