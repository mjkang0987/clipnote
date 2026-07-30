import type { MetadataRoute } from "next";
import { LOCALES, LOCALE_TAGS, localizePath } from "@/lib/i18n";
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

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // 각 항목에 alternates.languages 를 함께 넣는다 — sitemap 의 hreflang 은
  // 페이지의 `<link rel="alternate">` 와 같은 역할이고 둘이 일치해야 한다.
  const languagesFor = (path: string) =>
    Object.fromEntries(
      LOCALES.map((l) => [LOCALE_TAGS[l], `${SITE_URL}${localizePath(path, l)}`]),
    );

  const localized = LOCALIZED_PAGES.flatMap(({ path, changeFrequency, priority }) =>
    LOCALES.map((locale) => ({
      url: `${SITE_URL}${localizePath(path, locale)}`,
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
