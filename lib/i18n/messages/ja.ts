// 일본어 사전 — 번역된 키만 담는다. 빠진 키는 한국어로 폴백한다(`lib/i18n/types.ts` 참고).
//
// 버튼 라벨은 짧게 잡는다(모바일 2열 + `whitespace-nowrap` — en.ts 주석 참고).

import type { PartialMessages } from "../types";

const ja: PartialMessages = {
  common: {
    myClips: "マイクリップ",
    login: "ログイン",
    logout: "ログアウト",
    settings: "設定",
    privacy: "プライバシーポリシー",
    homeAria: "ClipNote ホーム",
    cancel: "キャンセル",
    delete: "削除",
    save: "保存",
  },

  compare: {
    guestTitle: "ログインしなくても",
    guestItem1: "リンクを貼り付けてプレビューカードをすぐ作れます。",
    guestItem2:
      "作ったクリップをこのブラウザに保存して「{clips}」で見返せます。",
    guestItem3: "ただし保存は{device}残り、{noLink}",
    guestItem3Device: "この端末にだけ",
    guestItem3NoLink: "短い共有リンクは作れません。",

    signedInTitle: "ログインすると",
    signedInItem1: "{emphasis}でメッセンジャーやSNSにそのまま送れます。",
    signedInItem1Emphasis: "短い共有リンク",
    signedInItem2:
      "共有したリンクがタイトルと画像入りのプレビューカードで表示されます。",
    signedInItem3:
      "クリップがアカウントに溜まり、{emphasis}そのまま見られてタグで整理できます。",
    signedInItem3Emphasis: "どの端末でも",
  },

  clips: {
    guestNote:
      "このブラウザに保存されたクリップです。ログインするとどこからでも見て共有できます。",
    accountNote: "アカウントに保存されたクリップです。",
    newClip: "+ 新しいクリップ",
    select: "選択",
    allTags: "すべて",
    loading: "読み込み中…",
    loadFailed:
      "一覧を読み込めませんでした。保存したクリップが消えたわけではありません。",
    retry: "再試行",
    empty: "まだ保存したクリップがありません。",
    emptyCta: "最初のクリップを作成",
    emptyForTag: "「{tag}」タグのクリップがありません。",
    selectedCount: "{count}件選択中",
    applyTags: "タグを適用",
    selectAria: "{title} を選択",
    edit: "編集",
    copyShareLink: "共有リンクをコピー",
    createShareLink: "共有リンクを作成",
    creatingShareLink: "作成中…",
    copied: "コピーしました ✓",
    openOriginal: "開く",

    deleteTitle: "このクリップを削除しますか?",
    deleteBody: "「{title}」を削除します。この操作は取り消せません。",

    migrateTitle: "この端末のクリップを移動しますか?",
    migrateBody:
      "この端末に保存された{count}をアカウントに移動すると、他の端末でも見られて整理できます。移動したクリップは「マイクリップに保存」の状態になります。",
    migrateConfirm: "{count}を移動",
    migrating: "移動中…",

    discardTitle: "このブラウザのクリップを削除しますか?",
    discardBody:
      "移動しない場合、このブラウザに保存された{count}すべてが削除されます。このクリップはこのブラウザにしかないため{irreversible}",
    discardIrreversible: "取り消せません。",

    editTitle: "クリップを編集",
    editTitleLabel: "タイトル",
    editTagsLabel: "タグ",
    editTagsNote: "(カンマ区切り、最大6個)",
    editTagsPlaceholder: "開発, デザイン",
    savingEdit: "保存中…",

    bulkTagTitle: "タグを一括適用",
    bulkTagBody: "{count}に適用します。",
    bulkTagPlaceholder: "タグを入力 (カンマ区切り)",
    bulkTagAria: "適用するタグ",
    bulkTagModeAdd: "既存のタグに{emphasis}",
    bulkTagModeAddEmphasis: "追加",
    bulkTagModeReplace: "既存のタグを{emphasis}",
    bulkTagModeReplaceEmphasis: "これに置き換え",
    bulkTagApply: "適用",
    bulkTagApplying: "適用中…",

    bulkDeleteTitle: "選択した{count}を削除しますか?",
    irreversible: "この操作は取り消せません。",
    deleting: "削除中…",

    countUnit: "{count}件",
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
    cardPreview: {
      sectionAria: "共有カードのプレビュー",
      title: "共有カード",
      loading: "読み込み中",
      note: "リンクを共有するとこう表示されます",
      caption:
        "実際の共有時に表示される画像です。元のカバー画像があれば背景に使い、なければタイトルに合わせたグラデーションで埋めます。",
    },
    clipPreview: {
      sectionAria: "マイクリップ保存時のプレビュー",
      title: "マイクリップに保存すると",
      note: "一覧ではこう表示されます",
      caption:
        "左のサムネイルは元ページのカバー画像です。ない場合はグラデーションで埋まります。",
    },
    result: {
      title: "共有リンクができました 🎉",
      body: "リンクをコピーして共有してください。開くと共有カードが表示されたあと元のページへ移動します。",
      urlAria: "共有リンク",
      open: "開く",
      close: "閉じる",
      savedToClips: "マイクリップに保存しました ✓",
      alreadyInClips: "すでに追加済み ✓",
    },
    clearInputAria: "入力をクリア",
    errors: {
      metaFailed:
        "内容を読み込めませんでした。しばらくしてからもう一度お試しください。",
      titleRequiredForLink:
        "共有リンクを作るにはタイトルが必要です。入力してください。",
      linkCreateFailed: "共有リンクの作成に失敗しました。",
      linkCreateError: "共有リンクの作成中に問題が発生しました。",
      titleRequiredForClip:
        "クリップを追加するにはタイトルが必要です。入力してください。",
      clipAddFailed: "クリップの追加に失敗しました。",
      clipAddError: "クリップの追加中に問題が発生しました。",
      titleRequiredForSave: "保存するにはタイトルが必要です。",
    },
  },

  login: {
    title: "ログイン",
    subtitleWithKakao: "Google・Kakao アカウントで手軽に始められます。",
    subtitleGoogleOnly: "Google アカウントで手軽に始められます。",
    consent:
      "ログイン時に会員識別のためソーシャルアカウント情報(固有識別子、メール、プロフィールのニックネーム・画像)が収集されることに同意します。{privacy}を確認しました。",
    continueWith: "{provider} で続ける",
    redirecting: "移動中…",
    recent: "前回利用",
    or: "または",
    continueAsGuest: "ゲストとして続ける",

    errorIncomplete: "ログインが完了しませんでした。もう一度お試しください。",
    errorConsent: "プライバシーポリシーに同意しないとログインできません。",
    errorStart:
      "ログインを開始できませんでした。しばらくしてからお試しください。",
    errorGeneric: "ログイン中に問題が発生しました。",

    compareTitle: "ログイン / ゲストモードについて",
  },

  settings: {
    title: "アカウント設定",
    subtitle: "ログイン情報とアカウントを管理します。",
    loading: "読み込み中…",
    signedInWith: "{provider} アカウントでログイン中",
    accountLabel: "{provider} アカウント",
    providerUnknown: "ソーシャル",
    viewLink: "表示 ›",
    contact: "お問い合わせ",
    contactAction: "メールを送る ›",
    contactNote: "不具合の報告・機能のご要望は {email} までお送りください。",

    dangerTitle: "アカウント削除",
    dangerBody:
      "退会するとアカウントと保存されたすべてのクリップ・共有リンクが永久に削除され、復元できません。",
    withdraw: "退会する",

    withdrawTitle: "本当に退会しますか?",
    withdrawBody: "以下の情報が永久に削除され、復元できません。",
    withdrawItemAccount: "アカウント情報(ログイン識別子・メール・プロフィール)",
    withdrawItemClips: "保存したすべてのクリップと共有リンク",
    withdrawAgree: "上記を確認し、削除に同意します。",
    withdrawing: "退会処理中…",
    withdrawFailed:
      "退会処理に失敗しました。しばらくしてからもう一度お試しください。",
    withdrawError: "退会処理中に問題が発生しました。",
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

  about: {
    titleSuffix: "とは?",
    body1: "ClipNote はリンクを共有カードに変える無料サービスです。",
    body2:
      "リンクを貼り付けるとタイトル・説明・カバー画像を自動で読み取り、メッセンジャーやSNSで一目で分かるカードと短いURLを作ります。",
    body3:
      "ネイバーカフェの投稿やInstagramのリールのように、プレビューが出にくいリンクにも対応します。",

    howTitle: "使い方",
    how1: "共有したいリンクを貼り付けます。タイトル・説明・カバー画像は自動で入ります。",
    how2: "「{createLink}」を押すと、共有カードが先に表示される短いURLができます。作成後は同じ場所が「{copyLink}」に変わります。",
    how3: "カードなしでURLだけ送りたいときは「{copyOriginal}」— タイトルと元のURLをまとめてコピーします。",
    how4: "「{saveToClips}」しておくと、あとでタグごとに整理して見返せます。ログイン前は「{saveHere}」でこの端末にだけ残ります。",
  },

  faq: {
    title: "よくある質問",
    q1: "「{copyLink}」と「{copyOriginal}」の違いは?",
    a1: "「{copyLink}」は ClipNote が作った短いURLです。開くと共有カードが表示されたあと元のページへ移動します。「{copyOriginal}」はカードを経由せず、タイトルと元のURLをそのままコピーします。短いURLはログインが必要です。",
    q2: "タグはどう使いますか?",
    a2: "クリップを作るとき、タグ欄にカンマ(,)区切りで最大6個まで付けられます。「{clips}」画面でタグを押すと同じタグのクリップだけまとめて見られ、一度使ったタグは次回「よく使うタグ」として提案されます。",
    q3: "ログインしなくても使えますか?",
    a3: "はい。ログインしなくてもリンクをこのブラウザに保存できます。ただし短い共有リンクの作成には Google または Kakao でのログインが必要です。",
    q4: "ネイバーカフェやInstagramのリンクも使えますか?",
    a4: "はい。専用の抽出機能でネイバーカフェの投稿タイトルや Instagram のリール・投稿情報まで取得します。非公開・メンバー限定の投稿は制限される場合があります。",
    q5: "共有リンクを開くとどうなりますか?",
    a5: "クリックするとプレビューカードが少し表示され、元のページへ自然に移動します。",
    q6: "無料ですか?",
    a6: "はい、無料でご利用いただけます。",
  },

  meta: {
    siteTitle: "ClipNote — URLをきれいな共有カードに",
    siteDescription:
      "URLを入力するとタイトルと説明を自動で読み取り、きれいな共有カードと短いリンクを作ります。ネイバーカフェやInstagramのリンクにも対応します。",
    ogTitle: "URLをきれいな共有カードに",
    ogDescription: "リンク1つで共有カードと短いURLを作成",
  },

  language: {
    label: "言語",
    koreanOnlyNotice: "この文書は韓国語でのみ提供されます。",
  },
};

export default ja;
