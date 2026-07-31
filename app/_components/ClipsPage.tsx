import ClipsClient from "@/app/_components/ClipsClient";
import { getMessages, type Locale } from "@/lib/i18n";
import type { Clip } from "@/lib/store";
import { clipStore } from "@/lib/store";
import { getCurrentUser } from "@/lib/supabase/server";

/**
 * 내 클립 화면의 서버 부분 — 로케일별 라우트(`/clips`, `/en/clips`, …)가 공유한다.
 * 로그인 여부와 목록을 **서버에서 미리 채워** 본문으로 넘긴다.
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
export default async function ClipsPage({ locale }: { locale: Locale }) {
  let initialLoggedIn = false;
  let initialClips: Clip[] = [];
  // 조회 실패를 빈 목록과 구분해 넘긴다 — 구분하지 않으면 DB 에 클립이 있는데도
  // "아직 저장한 클립이 없어요" 로 보이고 재시도 경로도 없다.
  let initialLoadFailed = false;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const user = await getCurrentUser();
    if (user) {
      initialLoggedIn = true;
      try {
        initialClips = await clipStore.listByUser(user.id);
      } catch {
        initialLoadFailed = true;
      }
    }
  }

  const m = getMessages(locale);

  return (
    // 화면이 쓰는 namespace 만 골라 넘긴다. 사전을 통째로 넘기면 그 화면이 쓰지 않는
    // 문구까지 RSC 페이로드에 실려 나간다(예: 내 클립 응답에 FAQ 문구가 들어갔다).
    <ClipsClient
      messages={{ common: m.common, clips: m.clips }}
      locale={locale}
      initialLoggedIn={initialLoggedIn}
      initialClips={initialClips}
      initialLoadFailed={initialLoadFailed}
    />
  );
}
