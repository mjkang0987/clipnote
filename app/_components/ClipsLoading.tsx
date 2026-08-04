import Header from "@/app/_components/Header";
import RunningDino from "@/app/_components/RunningDino";
import { getMessages, type Locale } from "@/lib/i18n";

/**
 * 내 클립 화면이 서버에서 채워지는 동안 보여 줄 화면 — 로케일별 `loading.tsx` 가 공유한다.
 *
 * ## 왜 필요한가
 *
 * `ClipsPage` 는 인증 왕복과 DB 조회를 **직렬로 기다린 뒤에야** 첫 바이트를 낸다. 기다릴
 * 경계(Suspense)가 없으면 Next 는 그 응답이 다 올 때까지 **이전 화면을 그대로 둔다** —
 * 주소도 바뀌지 않아서 사용자는 클릭이 먹었는지 알 수 없다. `loading.tsx` 가 그 경계를
 * 만들어 주므로 클릭 즉시 주소가 바뀌고 이 화면이 뜬다.
 *
 * 공룡이 여기 있는 이유도 같다. `ClipsClient` 의 `loading` 은 비로그인일 때만 켜져서,
 * localStorage 만 읽는 **빠른** 경로에서만 공룡이 돌고 네트워크를 두 번 타는 **느린**
 * 로그인 경로에서는 아무것도 뜨지 않았다. 기다림이 실제로 생기는 자리가 여기다.
 *
 * ## 왜 헤더를 다시 그리는가
 *
 * `Header` 는 레이아웃이 아니라 각 화면 안에 있다. fallback 이 화면 자리를 통째로 대신
 * 하므로 여기서 그리지 않으면 기다리는 동안 헤더가 사라졌다가 되돌아온다.
 */
export default function ClipsLoading({ locale }: { locale: Locale }) {
  const m = getMessages(locale);

  return (
    <div className="flex flex-1 flex-col">
      {/* 화면이 쓰는 namespace 만 넘긴다 — 사전을 통째로 넘기면 RSC 페이로드에 안 쓰는
          문구까지 실린다. */}
      <Header messages={{ common: m.common }} showClipsLink={false} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        {/* 공룡은 창 전체를 돈다(`fixed`) — 여기 두는 건 로딩 상태를 아는 자리라서다. */}
        <RunningDino />

        <h1 className="text-2xl font-bold tracking-tight text-fg">{m.common.myClips}</h1>
        {/* 공룡은 `aria-hidden` 이라 화면을 못 보는 사용자에게는 이 문구가 유일한 신호다. */}
        <p role="status" className="mt-10 text-center text-sm text-fg-muted">
          {m.clips.loading}
        </p>
      </main>
    </div>
  );
}
