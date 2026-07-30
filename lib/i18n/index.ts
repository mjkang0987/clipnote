// 사전 조회. 서버·클라이언트 양쪽에서 쓸 수 있게 React 의존을 두지 않는다.
//
// 라이브러리(next-intl 등)를 쓰지 않는 이유: 그런 도구는 `app/[locale]` 세그먼트 라우팅을
// 전제하는데, 이 저장소는 루트에 이미 동적 세그먼트 `app/[slug]`(공유 링크)가 있어 같은 레벨에
// `[locale]` 을 둘 수 없다(라우트 충돌). 정적 로케일 폴더 + 자체 사전이 구조에 맞다. plan.md 14장.

import ko from "./messages/ko";
import { DEFAULT_LOCALE, type Locale } from "./locales";

/** 사전 구조는 한국어 사전에서 파생 — 다른 언어에 키가 빠지면 타입 오류로 잡힌다. */
export type Messages = typeof ko;

// 번역이 아직 없는 언어는 한국어로 폴백한다. 화면에 키가 노출되는 것보다 원문이 낫고,
// 언어를 하나씩 채워 넣는 동안에도 앱이 정상 동작한다.
// (번역 파일이 준비되면 여기 매핑만 교체하면 된다.)
const DICTIONARIES: Record<Locale, Messages> = {
  ko,
  en: ko,
  ja: ko,
  zh: ko,
};

export function getMessages(locale: Locale = DEFAULT_LOCALE): Messages {
  return DICTIONARIES[locale] ?? ko;
}

export {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_LABELS,
  LOCALE_TAGS,
  isLocale,
  localizePath,
  stripLocale,
} from "./locales";
export type { Locale } from "./locales";
