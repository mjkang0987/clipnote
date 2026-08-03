import { DEFAULT_LOCALE, LOCALES, type Locale } from "./locales";

/**
 * `Accept-Language` 헤더에서 지원 로케일 하나를 고른다.
 *
 * **공유 링크(`/{slug}`)에만 쓴다.** 그 페이지는 로케일 판본이 없다 — 카톡·SNS 에 뿌려진
 * 링크가 하나로 유지돼야 하기 때문이다(plan.md 14장). 그래서 경로에서 언어를 알 수 없고,
 * 대신 **보는 사람의 브라우저 설정**을 따른다. 링크를 만든 사람이 아니라 받은 사람의 언어여야
 * 한다 — 한국어 사용자가 만든 링크를 영어권 지인이 여는 게 이 페이지의 정상 사용이다.
 *
 * 다른 페이지에는 쓰지 않는다. 거기서는 경로가 곧 로케일이고, `/` 를 브라우저 설정에 따라
 * 영어로 그리면 한국어 정본 URL 이 사라진다.
 */
export function matchAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const quality = params.find((p) => p.trim().startsWith("q="));
      const q = quality ? Number.parseFloat(quality.split("=")[1]) : 1;
      return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((entry) => entry.tag && entry.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    if (tag === "*") break;
    // `zh-Hant`·`zh-HK` 도 `zh`(간체) 로 받는다 — 지원이 간체 하나뿐이라 앱 `AppLanguage` 와 같은 결정.
    const base = tag.split("-")[0];
    const match = LOCALES.find((locale) => locale === base);
    if (match) return match;
  }
  return DEFAULT_LOCALE;
}
