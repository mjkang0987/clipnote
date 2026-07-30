// 한국어(원본) 사전. 다른 언어 사전은 이 구조의 **부분집합**을 담고, 빠진 키는 여기로 폴백한다
// (`Messages` 타입이 여기서 파생되므로, 없는 키를 쓰면 타입 오류로 잡힌다).
//
// 키 이름은 iOS 앱의 문자열 카탈로그와 맞춘다 — 같은 문구를 두 곳에서 다르게 부르지 않는다.
//
// `as const` 를 붙이지 않는다 — 붙이면 값이 리터럴 타입으로 좁혀져서 다른 언어 사전이
// "같은 문자열"만 쓸 수 있게 된다(번역이 타입 오류가 된다).

const ko = {
  /** 여러 화면에서 같은 뜻으로 쓰는 이름 — 화면마다 다르게 부르지 않는다. */
  common: {
    /** 내 클립 화면 이름. 링크 라벨로도 쓴다. */
    myClips: "내 클립",
    login: "로그인",
    logout: "로그아웃",
    settings: "설정",
    privacy: "개인정보처리방침",
    /** 브랜드 로고 링크의 aria-label */
    homeAria: "ClipNote 홈",
    /** 여러 레이어에서 반복되는 버튼 라벨 */
    cancel: "취소",
    delete: "삭제",
    save: "저장",
  },

  /** 내 클립 화면 */
  clips: {
    /** 로그인 상태별 부제 */
    guestNote: "이 브라우저에 저장된 클립이에요. 로그인하면 어디서나 보고 공유할 수 있어요.",
    accountNote: "내 계정에 저장된 클립이에요.",
    newClip: "+ 새 클립",
    select: "선택",
    allTags: "전체",
    loading: "불러오는 중…",
    loadFailed: "목록을 불러오지 못했어요. 저장된 클립이 사라진 건 아니에요.",
    retry: "다시 시도",
    empty: "아직 저장한 클립이 없어요.",
    emptyCta: "첫 클립 만들기",
    /** `{tag}` 는 선택된 태그 이름 */
    emptyForTag: "‘{tag}’ 태그의 클립이 없어요.",
    /** `{count}` 는 선택된 클립 수 */
    selectedCount: "{count}개 선택됨",
    applyTags: "태그 적용",
    /** `{title}` 은 클립 제목 — 체크박스 aria-label */
    selectAria: "{title} 선택",
    edit: "편집",
    copyShareLink: "공유 링크 복사",
    createShareLink: "공유 링크 만들기",
    creatingShareLink: "만드는 중…",
    copied: "복사됨 ✓",
    openOriginal: "바로가기",

    /** 클립 하나 삭제 확인 레이어. `{title}` 은 클립 제목(강조 표시) */
    deleteTitle: "클립을 삭제할까요?",
    deleteBody: "‘{title}’ 클립을 삭제합니다. 이 작업은 되돌릴 수 없어요.",

    /** 로컬 클립 → 계정 옮기기. `{count}` 는 클립 수(강조 표시) */
    migrateTitle: "이 기기의 클립을 옮길까요?",
    migrateBody:
      "이 기기에 저장된 {count} 클립을 계정으로 옮기면 다른 기기에서도 보이고 정리돼요. 옮긴 클립은 ‘내 클립에 저장’ 상태가 돼요.",
    migrateConfirm: "{count} 옮기기",
    migrating: "옮기는 중…",

    /** 옮기기를 취소했을 때 — 로컬 클립을 지우는 되돌릴 수 없는 단계 */
    discardTitle: "이 브라우저의 클립을 삭제할까요?",
    discardBody:
      "옮기지 않으면 이 브라우저에 저장된 {count} 클립이 모두 삭제됩니다. 이 클립은 이 브라우저에만 있어서 {irreversible}",
    discardIrreversible: "되돌릴 수 없어요.",

    /** 클립 편집 레이어 */
    editTitle: "클립 편집",
    editTitleLabel: "제목",
    editTagsLabel: "태그",
    editTagsNote: "(쉼표로 구분, 최대 6개)",
    editTagsPlaceholder: "개발, 디자인",
    savingEdit: "저장 중…",

    /** 선택한 클립에 태그 일괄 적용 */
    bulkTagTitle: "태그 일괄 적용",
    bulkTagBody: "{count} 클립에 적용해요.",
    bulkTagPlaceholder: "태그 입력 (쉼표로 구분)",
    bulkTagAria: "적용할 태그",
    /** `{emphasis}` 는 강조되는 낱말 */
    bulkTagModeAdd: "기존 태그에 {emphasis}",
    bulkTagModeAddEmphasis: "추가",
    bulkTagModeReplace: "기존 태그를 {emphasis}",
    bulkTagModeReplaceEmphasis: "이걸로 교체",
    bulkTagApply: "적용",
    bulkTagApplying: "적용 중…",

    /** 선택한 클립 일괄 삭제 */
    bulkDeleteTitle: "선택한 {count} 클립을 삭제할까요?",
    irreversible: "이 작업은 되돌릴 수 없어요.",
    deleting: "삭제 중…",

    /** `{count}` 자리에 들어가는 수량 표기 — 언어마다 단위 위치가 달라 분리한다 */
    countUnit: "{count}개",
  },

  /** 홈 화면 */
  home: {
    hero: {
      /** `{accent}` 는 브랜드 색으로 강조되는 부분 */
      title: "밋밋한 링크를 {accent}",
      titleAccent: "카드 한 장으로",
      subtitle:
        "제목·대표 이미지가 담긴 카드와 짧은 링크를 한 번에. 카카오톡·SNS에서 깔끔하게 보여요.",
    },
    form: {
      /** 폼 전체의 aria-label */
      label: "클립 만들기",
      urlLabel: "URL",
      urlPlaceholder: "공유할 링크 붙여넣기",
      urlHint: "링크를 붙여넣으면 미리보기를 자동으로 불러와요.",
      titleLabel: "제목",
      titleNote: "(안 쓰면 자동으로 채워져요)",
      titlePlaceholder: "공유 카드에 보일 제목",
      tagsLabel: "태그",
      tagsNote: "(선택 · 쉼표로 구분)",
      /** 예시 태그 — 번역할 때 그 언어에서 자연스러운 예로 바꾼다 */
      tagsPlaceholder: "개발, 디자인, 읽을거리",
      /** `{clips}` 는 내 클립 링크 */
      tagsHint:
        "태그를 달아두면 {clips}에서 같은 태그끼리 모아 볼 수 있어요. 쉼표(,)로 여러 개, 최대 6개까지요.",
      frequentTags: "자주 쓴 태그:",
    },
    /** 미리보기 자리표시 문구 */
    preview: {
      titlePlaceholder: "여기에 제목이 표시됩니다",
    },
    errors: {
      metaFailed: "내용을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
      titleRequiredForLink: "공유 링크를 만들려면 제목이 필요해요. 제목을 입력해 주세요.",
      linkCreateFailed: "공유 링크 생성에 실패했어요.",
      linkCreateError: "공유 링크 생성 중 문제가 발생했어요.",
      titleRequiredForClip: "클립을 추가하려면 제목이 필요해요. 제목을 입력해 주세요.",
      clipAddFailed: "클립 추가에 실패했어요.",
      clipAddError: "클립 추가 중 문제가 발생했어요.",
      titleRequiredForSave: "저장하려면 제목이 필요해요.",
    },
  },

  /** 로그인 화면 */
  login: {
    title: "로그인",
    /** 공급자 이름은 라틴 표기로 고정 — 번역하지 않는다 */
    subtitleWithKakao: "Google·Kakao 계정으로 간편하게 시작하세요.",
    subtitleGoogleOnly: "Google 계정으로 간편하게 시작하세요.",
    /** `{privacy}` 는 개인정보처리방침 링크 */
    consent:
      "로그인 시 회원 식별을 위해 소셜 계정 정보(고유 식별자, 이메일, 프로필 닉네임·이미지)가 수집되는 데 동의합니다. {privacy}을 확인했어요.",
    /** `{provider}` 는 Google·Kakao·Naver */
    continueWith: "{provider}로 계속하기",
    redirecting: "이동 중…",
    recent: "최근 로그인",
    or: "또는",
    continueAsGuest: "게스트로 계속하기",

    errorIncomplete: "로그인이 완료되지 않았어요. 다시 시도해 주세요.",
    errorConsent: "개인정보처리방침에 동의하셔야 로그인할 수 있어요.",
    errorStart: "로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.",
    errorGeneric: "로그인 중 문제가 발생했어요.",

    compareTitle: "로그인 / 게스트 모드 안내",
    signedInTitle: "로그인 하면",
    /** `{emphasis}` 는 강조되는 낱말 */
    signedInShortLink: "{emphasis}를 만들어 카카오톡·SNS에 보낼 수 있어요.",
    signedInShortLinkEmphasis: "짧은 공유 링크",
    signedInPreview: "공유한 링크가 제목·이미지가 담긴 미리보기 카드로 떠요.",
    signedInSync: "클립이 계정에 쌓여 {emphasis} 그대로 보이고, 태그로 정리돼요.",
    signedInSyncEmphasis: "다른 기기에서도",

    guestTitle: "로그인 안 해도",
    guestPreview: "URL을 붙여넣어 미리보기 카드를 만들 수 있어요.",
    /** `{clips}` 는 내 클립 화면 이름 */
    guestSave: "만든 클립을 이 브라우저에 저장하고 ‘{clips}’에서 다시 봐요.",
    guestLimit: "단, 저장은 {device} 남고 {noLink}",
    guestLimitDevice: "이 기기에만",
    guestLimitNoLink: "짧은 공유 링크는 못 만들어요.",
  },

  /** 계정 설정 화면 */
  settings: {
    title: "계정 설정",
    subtitle: "로그인 정보와 계정을 관리합니다.",
    loading: "불러오는 중…",
    /** `{provider}` 는 Google·Kakao·Naver 같은 공급자 이름(번역하지 않음) */
    signedInWith: "{provider} 계정으로 로그인됨",
    /** 이메일을 표시하지 않는 공급자(네이버)에서 쓰는 계정 라벨 */
    accountLabel: "{provider} 계정",
    /** 공급자를 알 수 없을 때 */
    providerUnknown: "소셜",
    viewLink: "보기 ›",
    contact: "문의하기",
    contactAction: "메일 보내기 ›",
    /** `{email}` 은 문의 메일 주소 */
    contactNote: "오류 제보·기능 요청은 {email} 로 보내 주세요.",

    dangerTitle: "계정 삭제",
    dangerBody:
      "탈퇴하면 계정과 저장된 모든 클립·공유 링크가 영구 삭제되며 복구할 수 없어요.",
    withdraw: "회원 탈퇴",

    withdrawTitle: "정말 탈퇴할까요?",
    withdrawBody: "아래 정보가 영구적으로 삭제되며 복구할 수 없어요.",
    withdrawItemAccount: "계정 정보(로그인 식별자·이메일·프로필)",
    withdrawItemClips: "저장한 모든 클립과 공유 링크",
    withdrawAgree: "위 내용을 확인했으며 삭제에 동의합니다.",
    withdrawing: "탈퇴 중…",
    withdrawFailed: "탈퇴 처리에 실패했어요. 잠시 후 다시 시도해 주세요.",
    withdrawError: "탈퇴 처리 중 문제가 발생했어요.",
  },

  /** 홈 하단 1차 액션 버튼과 그 안내문 */
  homeActions: {
    createLink: "링크 만들기",
    creating: "만드는 중…",
    loadingMeta: "불러오는 중…",
    copyLink: "링크 복사",
    copyOriginal: "원본 복사",
    share: "공유하기",
    copied: "복사됨 ✓",
    saveToClips: "내 클립에 저장",
    saving: "저장 중…",
    saved: "저장됨 ✓",
    alreadySaved: "이미 있음 ✓",
    saveHere: "이 브라우저에 저장",
    /** 링크가 아직 없을 때: 두 버튼의 차이를 설명 */
    hintBeforeLink:
      "링크 만들기는 공유 카드가 먼저 보이는 짧은 주소를 만들고, 원본 복사는 제목과 원본 주소를 복사해요.",
    /** 링크를 만든 뒤: 두 복사 버튼의 차이를 설명 */
    hintAfterLink:
      "링크 복사는 방금 만든 짧은 주소를, 원본 복사는 제목과 원본 주소를 복사해요.",
    /** `{login}` 은 로그인 링크 */
    guestHint: "공유 카드·짧은 링크는 {login}하면 만들어져요.",
  },

  /** 언어 선택 */
  language: {
    label: "언어",
    /** 번역하지 않는 화면에 붙이는 안내 (개인정보 처리방침 등) */
    koreanOnlyNotice: "이 문서는 한국어로만 제공됩니다.",
  },
};

export default ko;
