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

  const m = getMessages(locale);

  return (
    // 화면이 쓰는 namespace 만 골라 넘긴다. 사전을 통째로 넘기면 그 화면이 쓰지 않는
    // 문구까지 RSC 페이로드에 실려 나간다(예: 내 클립 응답에 FAQ 문구가 들어갔다).
    <HomeClient
      messages={{
        common: m.common,
        home: m.home,
        homeActions: m.homeActions,
        about: m.about,
        faq: m.faq,
      }}
      initialLoggedIn={initialLoggedIn}
    />
  );
}
