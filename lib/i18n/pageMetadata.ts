// 로케일 라우트의 canonical · hreflang · Open Graph.
//
// 각 라우트 파일이 이걸 호출해 자기 로케일의 canonical 과 **모든 로케일의 상호 참조**를
// 선언한다. hreflang 은 상호 참조가 되어야 유효하다 — `/en` 이 `/ja` 를 가리키면
// `/ja` 도 `/en` 을 가리켜야 검색엔진이 같은 페이지의 다른 언어로 인정한다.
// 그래서 모든 라우트가 같은 목록(LOCALES 전체)을 내보낸다.
//
// ⚠️ Next 의 metadata 병합은 **얕다.** 라우트가 `openGraph` 를 일부만 지정하면
// 레이아웃의 `images`·`siteName` 까지 통째로 사라진다. 그래서 여기서 전체를 만들고
// 레이아웃도 같은 함수를 쓴다(값의 출처를 한 곳으로).

import type { Metadata } from "next";

import { SITE_NAME, SITE_URL, ogImagePath } from "@/lib/site";

import { getMessages } from "./index";
import { LOCALE_OG, otherOgLocales } from "./ogLocale";
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

/** `<title>` 과 같은 형태로 맞춘다 — 공유 카드와 검색 결과에 같은 제목이 나가게. */
function fullTitle(title: string | undefined, siteTitle: string): string {
  return title ? `${title} · ${SITE_NAME}` : siteTitle;
}

/**
 * 로케일·페이지에 맞는 Open Graph / Twitter 카드.
 *
 * `url` 은 **그 페이지의 주소**다. 예전에는 레이아웃이 홈 주소로 고정해서, `/en/login`
 * 을 공유해도 카드가 홈을 가리켰다.
 */
export function localeOpenGraph(
  locale: Locale,
  path: string,
  title?: string,
): { openGraph: Metadata["openGraph"]; twitter: Metadata["twitter"] } {
  const m = getMessages(locale).meta;
  const heading = fullTitle(title, m.siteTitle);
  const image = ogImagePath({
    title: m.ogTitle,
    desc: m.ogDescription,
    site: SITE_NAME,
    g: "grape",
  });

  return {
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: heading,
      description: m.siteDescription,
      url: `${SITE_URL}${localizePath(path, locale)}`,
      locale: LOCALE_OG[locale],
      alternateLocale: otherOgLocales(locale),
      images: [{ url: image, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: heading,
      description: m.siteDescription,
      images: [image],
    },
  };
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
    ...localeOpenGraph(locale, path, opts.title),
  };
}
