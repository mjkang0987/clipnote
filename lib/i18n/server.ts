// 서버 컴포넌트에서 현재 로케일을 읽는다. 클라이언트에서는 `useLocale()` 을 쓴다
// (둘 다 결국 URL 을 본다 — 미들웨어는 요청 경로에서, 훅은 `usePathname()` 에서. 어긋날 수 없다).
//
// ⚠️ `headers()` 를 읽는 라우트는 정적 생성에서 빠져 요청마다 렌더된다. `<html lang>` 을
// 로케일에 맞추려면 레이아웃이 이 값을 알아야 하므로 감수한다. 실제로 잃는 건 서버 데이터가
// 없는 페이지뿐이다 — 홈·내 클립은 쿠키(세션)를 읽어 이미 동적이다.

import { headers } from "next/headers";

import { LOCALE_HEADER } from "./localeHeader";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./locales";

/**
 * 미들웨어가 붙인 로케일 헤더를 읽는다. 없으면 기본 언어.
 *
 * 헤더가 없을 수 있는 경우: 미들웨어 matcher 에서 제외된 경로, 또는 미들웨어를 거치지 않는
 * 빌드 시점 렌더. 그때는 한국어가 맞는 기본값이다(로케일 경로는 모두 matcher 안에 있다).
 */
export async function getRequestLocale(): Promise<Locale> {
  const value = (await headers()).get(LOCALE_HEADER) ?? "";
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
