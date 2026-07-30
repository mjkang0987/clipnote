// 지원 로케일과 경로 규칙.
// iOS 앱(`clipnote-ios` 의 `AppLanguage`)과 **같은 목록·같은 순서**를 유지한다. 한쪽만 늘리지 않는다.

export const LOCALES = ["ko", "en", "ja", "zh"] as const;
export type Locale = (typeof LOCALES)[number];

/** 원본 언어. 이 언어만 경로 prefix 가 없다(기존 URL 보존 — plan.md 14장). */
export const DEFAULT_LOCALE: Locale = "ko";

/** 각 언어를 그 언어로 표기 — 영어만 아는 사용자가 "영어"를 못 찾는 일을 막는다. */
export const LOCALE_LABELS: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "简体中文",
};

/** `<html lang>` 과 hreflang 에 쓰는 BCP 47 태그. 경로 세그먼트(`zh`)와 다르다. */
export const LOCALE_TAGS: Record<Locale, string> = {
  ko: "ko-KR",
  en: "en",
  ja: "ja",
  zh: "zh-Hans",
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * 기본 언어 기준 경로를 해당 로케일 경로로 바꾼다.
 *
 *   localizePath("/clips", "en") → "/en/clips"
 *   localizePath("/clips", "ko") → "/clips"      (기본 언어는 prefix 없음)
 *   localizePath("/", "ja")      → "/ja"
 *
 * 공유 링크(`/{slug}`)에는 쓰지 않는다 — 로케일과 무관하게 하나의 URL 을 유지한다.
 */
export function localizePath(path: string, locale: Locale): string {
  const clean = stripLocale(path).path;
  const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  if (clean === "/") return prefix || "/";
  return `${prefix}${clean}`;
}

/**
 * 경로에서 로케일 prefix 를 떼어낸다 — `localizePath` 의 역함수.
 *
 *   stripLocale("/en/clips") → { locale: "en", path: "/clips" }
 *   stripLocale("/ja")       → { locale: "ja", path: "/" }
 *   stripLocale("/clips")    → { locale: "ko", path: "/clips" }
 *   stripLocale("/aB3xY9")   → { locale: "ko", path: "/aB3xY9" }   (슬러그는 7자라 로케일과 겹치지 않음)
 *
 * 언어 선택 UI 가 "현재 경로를 다른 로케일로" 바꾸려면 먼저 이걸로 떼어내야 한다.
 * 그러지 않으면 `/en/clips` 에서 일본어를 고를 때 `/ja/en/clips` 가 된다.
 */
export function stripLocale(path: string): { locale: Locale; path: string } {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const [, first = "", ...rest] = clean.split("/");
  if (!isLocale(first) || first === DEFAULT_LOCALE) {
    return { locale: DEFAULT_LOCALE, path: clean };
  }
  const remainder = rest.join("/");
  return { locale: first, path: remainder ? `/${remainder}` : "/" };
}
