import type { MetadataRoute } from "next";
import { LOCALES, LOCALE_TAGS, localizePath, type Locale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

// /sitemap.xml — 인덱싱 대상인 정적 페이지를 **로케일별로** 싣는다.
//
// 제외 대상:
//  - 공유 페이지(`/{슬러그}`) — noindex
//  - `/clips`·`/settings` — 로그인 상태에 따라 내용이 달라지거나 비어 있다
//  - `/privacy` 비한국어 경로 — 판본이 한국어 하나뿐이라 원문만 싣는다
const LOCALIZED_PAGES = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/login", changeFrequency: "monthly" as const, priority: 0.3 },
];

/**
 * 절대 URL. **페이지의 canonical 과 글자까지 같아야 한다.**
 *
 * 루트에서 `localizePath("/", "ko")` 는 `"/"` 를 주는데, Next 는 canonical 을
 * 만들 때 루트의 끝 슬래시를 떼어 `https://clipnote.co.kr` 로 낸다. 그대로 이어붙이면
 * sitemap 만 `…co.kr/` 이 되어 canonical 과 한 글자 어긋난다.
 */
function absoluteUrl(path: string, locale: Locale): string {
  const localized = localizePath(path, locale);
  return `${SITE_URL}${localized === "/" ? "" : localized}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // 각 항목에 alternates.languages 를 함께 넣는다 — sitemap 의 hreflang 은
  // 페이지의 `<link rel="alternate">` 와 같은 역할이고 둘이 일치해야 한다.
  const languagesFor = (path: string) =>
    Object.fromEntries(
      LOCALES.map((l) => [LOCALE_TAGS[l], absoluteUrl(path, l)]),
    );

  const localized = LOCALIZED_PAGES.flatMap(
    ({ path, changeFrequency, priority }) =>
      LOCALES.map((locale) => ({
        url: absoluteUrl(path, locale),
        lastModified,
        changeFrequency,
        priority,
        alternates: { languages: languagesFor(path) },
      })),
  );

  return [
    ...localized,
    {
      url: `${SITE_URL}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
