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
    /** 입력 후 보이는 두 미리보기 */
    cardPreview: {
      sectionAria: "공유 카드 미리보기",
      title: "공유 카드",
      loading: "불러오는 중",
      note: "링크를 공유하면 이렇게 보여요",
      caption:
        "실제 공유 시 뜨는 이미지예요. 원본 대표 이미지가 있으면 배경으로 쓰고, 없으면 제목에 맞춰 만든 그라디언트로 채워져요.",
    },
    clipPreview: {
      sectionAria: "내 클립 저장 미리보기",
      title: "내 클립에 저장하면",
      note: "목록에서 이렇게 보여요",
      caption: "왼쪽 썸네일은 원본 페이지의 대표 이미지예요. 없으면 그라디언트로 채워져요.",
    },
    /** 공유 링크 생성 결과 레이어 */
    result: {
      title: "공유 링크가 만들어졌어요 🎉",
      body: "링크를 복사해 공유하세요. 열면 공유 카드가 먼저 보인 뒤 원본으로 이동해요.",
      urlAria: "공유 링크",
      open: "열기",
      close: "닫기",
      savedToClips: "내 클립에 저장됨 ✓",
      alreadyInClips: "이미 추가됨 ✓",
    },
    clearInputAria: "입력 지우기",
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
  /** 홈 하단 소개·사용법·FAQ (SEO/GEO 대상 정적 콘텐츠) */
  about: {
    /** `<Brand>ClipNote</Brand>` 뒤에 붙는 말 — h2 전체가 "ClipNote란?" 이 된다 */
    titleSuffix: "란?",
    body1: "ClipNote(클립노트)는 링크를 공유 카드로 바꿔 주는 무료 서비스예요.",
    body2:
      "링크를 붙여넣으면 제목·설명·대표 이미지를 자동으로 읽어와, 카카오톡·SNS에서 한눈에 들어오는 카드와 짧은 주소를 만들어 드려요.",
    body3:
      "네이버 카페 게시글, 인스타그램 릴처럼 미리보기가 잘 안 잡히는 링크도 됩니다.",

    /** 사용법 — 실제 버튼 이름을 그대로 쓴다(`{createLink}` 등은 homeActions 값이 들어간다) */
    howTitle: "이렇게 동작해요",
    how1: "공유할 링크를 붙여넣어요. 제목·설명·대표 이미지는 자동으로 채워져요.",
    how2:
      "「{createLink}」를 누르면 공유 카드가 먼저 보이는 짧은 주소가 만들어져요. 만든 뒤에는 같은 자리가 「{copyLink}」로 바뀌어요.",
    how3:
      "카드 없이 주소만 보내고 싶으면 「{copyOriginal}」 — 제목과 원본 주소를 함께 복사해요.",
    how4:
      "「{saveToClips}」하면 나중에 태그로 정리해 다시 찾아볼 수 있어요. 로그인 전에는 「{saveHere}」 — 이 기기에만 남아요.",

    guestTitle: "로그인 안 해도",
    guestItem1: "링크를 붙여넣어 미리보기 카드를 바로 만들 수 있어요.",
    /** `{clips}` 는 내 클립 화면 이름 */
    guestItem2: "만든 클립을 이 브라우저에 저장하고 ‘{clips}’에서 다시 봐요.",
    /** `{device}`·`{noLink}` 는 강조되는 낱말 */
    guestItem3: "단, 저장은 {device} 남고 {noLink}",
    guestItem3Device: "이 기기에만",
    guestItem3NoLink: "짧은 공유 링크는 못 만들어요.",

    signedInTitle: "로그인 하면",
    signedInItem1: "{emphasis}로 카카오톡·SNS에 바로 보낼 수 있어요.",
    signedInItem1Emphasis: "짧은 공유 링크",
    signedInItem2: "공유한 링크가 제목·이미지가 담긴 미리보기 카드로 떠요.",
    signedInItem3: "클립이 계정에 쌓여 {emphasis} 그대로 보이고, 태그로 깔끔하게 정리돼요.",
    signedInItem3Emphasis: "어느 기기에서나",
  },

  /**
   * FAQ. 화면(`<dl>`)과 구조화 데이터(FAQPage JSON-LD)가 **이 값만** 쓴다.
   * 전에는 양쪽에 따로 적혀 있어서 구글 리치 결과에 화면과 다른 문장이 나갔다.
   */
  faq: {
    title: "자주 묻는 질문",
    q1: "「{copyLink}」와 「{copyOriginal}」는 뭐가 달라요?",
    a1: "「{copyLink}」는 ClipNote가 만든 짧은 주소예요. 열면 공유 카드가 먼저 보인 뒤 원본으로 넘어가요. 「{copyOriginal}」는 카드를 거치지 않고 제목과 원본 주소를 그대로 복사해요. 짧은 주소는 로그인해야 만들어져요.",
    q2: "태그는 어떻게 쓰나요?",
    a2: "클립을 만들 때 태그 칸에 쉼표(,)로 구분해 최대 6개까지 달 수 있어요. ‘{clips}’ 화면에서 태그를 누르면 같은 태그의 클립만 모아 볼 수 있고, 한 번 쓴 태그는 다음에 ‘자주 쓴 태그’로 추천돼 한 번에 넣을 수 있어요.",
    q3: "로그인 없이도 쓸 수 있나요?",
    a3: "네. 비로그인 상태에서도 링크를 이 브라우저에 저장할 수 있어요. 다만 짧은 공유 링크 생성은 로그인(Google·Kakao)이 필요합니다.",
    q4: "네이버 카페·인스타그램 링크도 되나요?",
    a4: "네. 전용 추출 기능으로 네이버 카페 게시글 제목, 인스타그램 릴·게시물 정보까지 가져옵니다. 비공개·멤버 전용 글은 제한될 수 있어요.",
    q5: "공유 링크를 열면 어떻게 되나요?",
    a5: "클릭하면 미리보기 카드가 잠깐 보였다가, 원본 페이지로 자연스럽게 넘어가요.",
    q6: "무료인가요?",
    a6: "네, 무료로 사용할 수 있어요.",
  },

  language: {
    label: "언어",
    /** 번역하지 않는 화면에 붙이는 안내 (개인정보 처리방침 등) */
    koreanOnlyNotice: "이 문서는 한국어로만 제공됩니다.",
  },
};

export default ko;
