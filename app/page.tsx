import HomeClient from "@/app/_components/HomeClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 홈 라우트 — 로그인 상태를 서버에서 먼저 판정해 본문으로 넘긴다.
 *
 * 클라이언트에서만 판정하면 첫 렌더에 상태를 몰라 버튼 구성과 안내문이 뒤늦게 끼어들면서
 * 화면이 밀렸다(CLS). 쿠키를 읽으므로 이 라우트는 정적 프리렌더가 아니라 요청마다 렌더된다.
 *
 * `getUser()` 대신 `getSession()` 을 쓴다 — getUser 는 인증 서버에 왕복해 SSR 을 붙들어
 * TTFB 를 늘린다. 여기서 필요한 건 "어떤 버튼을 보일지"라는 표시용 판단이고, 실제 권한
 * 검사는 각 API 라우트에서 별도로 한다.
 */
export default async function Page() {
  let initialLoggedIn = false;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getSession();
    initialLoggedIn = Boolean(data.session?.user);
  }

  return <HomeClient initialLoggedIn={initialLoggedIn} />;
}
