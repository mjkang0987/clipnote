// OG(Open Graph) 의 `locale` 값. 경로 세그먼트(`zh`)나 `<html lang>` 태그(`zh-Hans`)와
// 또 다르다 — OG 는 `언어_지역` 형태(underscore)를 쓴다.

import { LOCALES, type Locale } from "./locales";

export const LOCALE_OG: Record<Locale, string> = {
  ko: "ko_KR",
  en: "en_US",
  ja: "ja_JP",
  zh: "zh_CN",
};

/** 현재 로케일을 뺀 나머지 — OG `alternateLocale` 용 */
export function otherOgLocales(locale: Locale): string[] {
  return LOCALES.filter((l) => l !== locale).map((l) => LOCALE_OG[l]);
}
