"use client";

// 현재 로케일을 URL 에서 읽는다. Context 를 두지 않는 이유: 로케일은 URL 이 곧 진실이고
// (`/en/clips` → en), Context 를 쓰면 서버 렌더 결과와 클라이언트 상태가 어긋날 여지가 생긴다.
//
// 이 파일은 "use client" 이므로 서버 컴포넌트에서 import 하지 않는다.
// 그래서 `lib/i18n/index.ts` 에서 re-export 하지 않는다 — index 는 서버에서도 써야 한다.

import { usePathname } from "next/navigation";
import { useCallback } from "react";

import { DEFAULT_LOCALE, localizePath, stripLocale, type Locale } from "./locales";

/** 현재 URL 의 로케일. `/en/clips` → "en", `/clips` → "ko". */
export function useLocale(): Locale {
  const pathname = usePathname();
  return pathname ? stripLocale(pathname).locale : DEFAULT_LOCALE;
}

/**
 * 기본 언어 기준 경로(`/clips`)를 현재 로케일 경로(`/en/clips`)로 바꾼다.
 *
 * 모든 내부 링크는 이걸 거친다. 그러지 않으면 `/en` 안에서 링크 한 번에 한국어 페이지로 새고,
 * 사용자는 자기가 언어를 바꿨다는 사실조차 모르게 된다.
 *
 * 공유 링크(`/{slug}`)에는 쓰지 않는다 — 로케일과 무관하게 하나의 URL 을 유지한다.
 */
export function useLocalizedPath(): (path: string) => string {
  const locale = useLocale();
  return useCallback((path: string) => localizePath(path, locale), [locale]);
}
