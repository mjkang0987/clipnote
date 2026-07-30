// 로케일 라우트의 canonical + hreflang.
//
// 각 라우트 파일이 이걸 호출해 자기 로케일의 canonical 과 **모든 로케일의 상호 참조**를
// 선언한다. hreflang 은 상호 참조가 되어야 유효하다 — `/en` 이 `/ja` 를 가리키면
// `/ja` 도 `/en` 을 가리켜야 검색엔진이 같은 페이지의 다른 언어로 인정한다.
// 그래서 모든 라우트가 같은 목록(LOCALES 전체)을 내보낸다.
//
// `pendingMetadata.ts` 를 대체한다 — 번역이 끝나 색인을 막을 이유가 없어졌다.

import type { Metadata } from "next";

import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_TAGS,
  localizePath,
  type Locale,
} from "./locales";

/**
 * `{ "ko-KR": "/clips", en: "/en/clips", … , "x-default": "/clips" }`
 *
 * `x-default` 는 "어느 언어도 맞지 않을 때 보낼 곳" — 원본인 한국어를 가리킨다.
 */
function languageAlternates(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const locale of LOCALES) {
    out[LOCALE_TAGS[locale]] = localizePath(path, locale);
  }
  out["x-default"] = localizePath(path, DEFAULT_LOCALE);
  return out;
}

/**
 * 로케일 라우트의 metadata. `title` 은 화면 이름(사전값)을 넘기고, 없으면 사이트 기본
 * 제목이 쓰인다(`layout.tsx` 의 `title.default`).
 */
export function localePageMetadata(
  locale: Locale,
  path: string,
  opts: {
    /** 화면 이름. 없으면 사이트 기본 제목이 쓰인다. */
    title?: string;
    /**
     * 색인 여부. 개인 페이지(설정)는 비로그인에게 `/login` 으로 리다이렉트되므로
     * 색인해도 검색 결과에 로그인 화면이 걸릴 뿐이다 → `false`.
     */
    index?: boolean;
  } = {},
): Metadata {
  return {
    ...(opts.title ? { title: opts.title } : {}),
    ...(opts.index === false ? { robots: { index: false, follow: true } } : {}),
    alternates: {
      canonical: localizePath(path, locale),
      languages: languageAlternates(path),
    },
  };
}
