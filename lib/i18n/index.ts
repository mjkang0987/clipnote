// 사전 조회. 서버·클라이언트 양쪽에서 쓸 수 있게 React 의존을 두지 않는다.
//
// 라이브러리(next-intl 등)를 쓰지 않는 이유: 그런 도구는 `app/[locale]` 세그먼트 라우팅을
// 전제하는데, 이 저장소는 루트에 이미 동적 세그먼트 `app/[slug]`(공유 링크)가 있어 같은 레벨에
// `[locale]` 을 둘 수 없다(라우트 충돌). 정적 로케일 폴더 + 자체 사전이 구조에 맞다. plan.md 14장.

import ko from "./messages/ko";
import en from "./messages/en";
import ja from "./messages/ja";
import zh from "./messages/zh";
import { DEFAULT_LOCALE, type Locale } from "./locales";
import type { Messages, PartialMessages } from "./types";

/**
 * 번역된 키만 한국어 위에 덮는다. 키가 빠진 자리는 한국어가 그대로 남는다 —
 * 화면에 키 이름이 노출되는 것보다 원문이 낫고, 언어를 하나씩 채워 넣는 동안에도 앱이 동작한다.
 */
function overlay(base: Messages, override: PartialMessages): Messages {
  const out = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    const current = out[key];
    if (isPlainObject(current) && isPlainObject(value)) {
      out[key] = overlay(current as Messages, value as PartialMessages);
    } else {
      out[key] = value;
    }
  }
  return out as Messages;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// 요청마다 병합하지 않게 모듈 로드 시 한 번만 만든다.
const DICTIONARIES: Record<Locale, Messages> = {
  ko,
  en: overlay(ko, en),
  ja: overlay(ko, ja),
  zh: overlay(ko, zh),
};

export function getMessages(locale: Locale = DEFAULT_LOCALE): Messages {
  return DICTIONARIES[locale] ?? ko;
}

export type { Messages, PartialMessages } from "./types";
export {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_LABELS,
  LOCALE_TAGS,
  isLocale,
  localizePath,
  stripLocale,
  switchLocalePath,
} from "./locales";
export type { Locale } from "./locales";
