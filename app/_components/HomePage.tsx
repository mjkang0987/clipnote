import HomeClient from "@/app/_components/HomeClient";
import { getMessages, type Locale } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 홈 화면의 서버 부분 — 로케일별 라우트(`/`, `/en`, `/ja`, `/zh`)가 공유한다.
 *
 * 로케일마다 얇은 라우트 파일만 두고 로직은 여기 한 곳에 둔다. 루트에 이미 동적 세그먼트
 * `app/[slug]`(공유 링크)가 있어 `app/[locale]` 을 쓸 수 없기 때문이다(plan.md 14장).
 *
 * 사전은 서버에서 골라 props 로 내린다 — 클라이언트 번들에 모든 언어 사전이 실리지 않는다.
 */
export default async function HomePage({ locale }: { locale: Locale }) {
  let initialLoggedIn = false;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getSession();
    initialLoggedIn = Boolean(data.session?.user);
  }

  return (
    // 내부 링크(`/clips`·`/login`)의 로케일 반영은 그 페이지들의 로케일 라우트가 생기는
    // 다음 단계에서 함께 붙인다 — 지금 붙이면 없는 경로로 404 가 된다.
    <HomeClient messages={getMessages(locale)} initialLoggedIn={initialLoggedIn} />
  );
}
