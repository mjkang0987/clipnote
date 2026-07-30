import ClipsClient from "@/app/_components/ClipsClient";
import type { Clip } from "@/lib/store";
import { clipStore } from "@/lib/store";
import { getCurrentUser } from "@/lib/supabase/server";

/**
 * 내 클립 라우트 — 로그인 여부와 목록을 **서버에서 미리 채워** 본문으로 넘긴다.
 *
 * 이전에는 화면 전체가 클라이언트 컴포넌트라 이런 순서로 돌았다:
 *   HTML(데이터 0) → JS 번들 로드 → 마운트 → useEffect → fetch /api/clips
 *   → Supabase Auth 왕복 → Supabase DB 왕복 → 렌더
 * 브라우저가 JS 를 받아 실행할 때까지 아무 데이터도 없어서 목록이 늦게 떴다.
 *
 * 서버에서 DB 를 직접 읽으면 자기 API 로 한 번 더 왕복하는 것(`/api/clips`)도 사라진다.
 * 사용자 식별은 `getCurrentUser()` — 쿠키 세션을 인증 서버에서 검증한다. 여기서는
 * 그 id 로 남의 클립을 읽을 수 있으므로 서명 검증 없는 `getSession()` 을 쓰면 안 된다.
 */
export default async function Page() {
  let initialLoggedIn = false;
  let initialClips: Clip[] = [];

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const user = await getCurrentUser();
    if (user) {
      initialLoggedIn = true;
      try {
        initialClips = await clipStore.listByUser(user.id);
      } catch {
        // 조회 실패는 빈 목록으로 — 본문에서 다시 불러올 수 있다.
      }
    }
  }

  return <ClipsClient initialLoggedIn={initialLoggedIn} initialClips={initialClips} />;
}
