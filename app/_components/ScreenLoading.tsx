import Header from "@/app/_components/Header";
import RunningDino from "@/app/_components/RunningDino";
import { getMessages } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n/server";

/**
 * 서버가 화면을 채우는 동안 보여 줄 화면. `app/loading.tsx` 하나가 모든 라우트에 건다.
 *
 * 기다릴 경계가 없으면 Next 는 응답이 다 올 때까지 이전 화면을 붙들고 있어서, 누른 사람은
 * 클릭이 먹었는지 알 수 없다(plan.md 15장). 반대로 **빨리 끝나는 화면에는 이 fallback 이
 * 아예 나가지 않는다** — 기다림이 없는 곳에 깜빡임이 생기지 않는다.
 *
 * 화면 이름을 적지 않는다. 한 파일이 모든 라우트를 덮으므로 여기서 아는 건 로케일뿐이고,
 * 어느 화면으로 가는지는 브라우저 탭 제목이 이미 말한다.
 *
 * `Header` 는 레이아웃이 아니라 각 화면 안에 있어서, 여기서 안 그리면 기다리는 동안 사라진다.
 */
export default async function ScreenLoading() {
  const m = getMessages(await getRequestLocale());

  return (
    <div className="flex flex-1 flex-col">
      <Header messages={{ common: m.common }} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        <RunningDino />

        {/* 공룡은 `aria-hidden` 이라 화면을 못 보는 사용자에겐 이 문구가 유일한 신호다. */}
        <p role="status" className="mt-10 text-center text-sm text-fg-muted">
          {m.clips.loading}
        </p>
      </main>
    </div>
  );
}
