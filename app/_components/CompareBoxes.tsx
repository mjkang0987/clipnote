import type { Messages } from "@/lib/i18n";
import { interpolate, interpolateNode } from "@/lib/i18n/interpolate";

/**
 * 로그인 / 게스트 비교 박스 두 개 — 홈 소개와 `/login` 이 같은 컴포넌트를 쓴다.
 *
 * 전에는 같은 마크업이 두 화면에 각각 있었고, 문구도 따로 적혀 있어서 같은 뜻이
 * 갈라졌다(`바로` 유무, `링크`/`URL`, `어느 기기에서나`/`다른 기기에서도`).
 * 문구는 `messages.compare` 한 벌, 마크업은 이 파일 한 곳으로 모았다.
 *
 * 순서는 두 화면 모두 **로그인 → 게스트**다. 얻는 것을 먼저 보여준다.
 * 바깥 레이아웃만 화면이 정한다 — 홈은 넓어서 2열(`sm:grid-cols-2`), `/login` 은
 * `max-w-sm` 이라 2열이 들어가지 않아 1열로 쌓는다.
 */
export default function CompareBoxes({
  messages,
  className,
}: {
  messages: Pick<Messages, "common" | "compare">;
  /** 두 박스를 감싸는 컨테이너 클래스(열 수·여백) */
  className?: string;
}) {
  const t = messages.compare;
  const strongBrand = "font-semibold text-brand-strong";
  const strongFg = "font-semibold text-fg";

  return (
    <div className={className}>
      <div className="rounded-xl border border-brand/30 bg-brand-soft p-4">
        <p className="text-sm font-semibold text-brand-strong">
          {t.signedInTitle}
        </p>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm leading-relaxed text-fg-muted">
          <li>
            ·{" "}
            {interpolateNode(t.signedInItem1, {
              emphasis: (
                <strong className={strongBrand}>
                  {t.signedInItem1Emphasis}
                </strong>
              ),
            })}
          </li>
          <li>· {t.signedInItem2}</li>
          <li>
            ·{" "}
            {interpolateNode(t.signedInItem3, {
              emphasis: (
                <strong className={strongBrand}>
                  {t.signedInItem3Emphasis}
                </strong>
              ),
            })}
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-sm font-semibold text-fg">{t.guestTitle}</p>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm leading-relaxed text-fg-muted">
          <li>· {t.guestItem1}</li>
          <li>
            · {interpolate(t.guestItem2, { clips: messages.common.myClips })}
          </li>
          <li>
            ·{" "}
            {interpolateNode(t.guestItem3, {
              device: (
                <strong className={strongFg}>{t.guestItem3Device}</strong>
              ),
              noLink: (
                <strong className={strongFg}>{t.guestItem3NoLink}</strong>
              ),
            })}
          </li>
        </ul>
      </div>
    </div>
  );
}
