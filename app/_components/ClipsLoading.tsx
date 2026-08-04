import Header from "@/app/_components/Header";
import RunningDino from "@/app/_components/RunningDino";
import { getMessages, type Locale } from "@/lib/i18n";

/**
 * 내 클립이 서버에서 채워지는 동안 보여 줄 화면 — 로케일별 `loading.tsx` 가 공유한다.
 * 기다릴 경계가 없으면 Next 는 응답이 다 올 때까지 이전 화면을 붙들고 있는다(plan.md 15장).
 * `Header` 는 레이아웃이 아니라 화면 안에 있어서, 여기서 안 그리면 기다리는 동안 사라진다.
 */
export default function ClipsLoading({ locale }: { locale: Locale }) {
  const m = getMessages(locale);

  return (
    <div className="flex flex-1 flex-col">
      <Header messages={{ common: m.common }} showClipsLink={false} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        <RunningDino />

        <h1 className="text-2xl font-bold tracking-tight text-fg">{m.common.myClips}</h1>
        {/* 공룡은 `aria-hidden` 이라 화면을 못 보는 사용자에겐 이 문구가 유일한 신호다. */}
        <p role="status" className="mt-10 text-center text-sm text-fg-muted">
          {m.clips.loading}
        </p>
      </main>
    </div>
  );
}
