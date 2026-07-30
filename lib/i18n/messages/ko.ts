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
