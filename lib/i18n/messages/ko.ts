// 한국어(원본) 사전. 다른 언어 사전은 이 객체의 구조를 그대로 따른다
// (`Messages` 타입이 여기서 파생되므로, 키가 빠지면 타입 오류로 잡힌다).
//
// 키 이름은 iOS 앱의 문자열 카탈로그와 맞춘다 — 같은 문구를 두 곳에서 다르게 부르지 않는다.

const ko = {
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
    guestHint: "공유 카드·짧은 링크는 로그인하면 만들어져요.",
  },

  /** 언어 선택 */
  language: {
    label: "언어",
    /** 번역하지 않는 화면에 붙이는 안내 (개인정보 처리방침 등) */
    koreanOnlyNotice: "이 문서는 한국어로만 제공됩니다.",
  },
} as const;

export default ko;
