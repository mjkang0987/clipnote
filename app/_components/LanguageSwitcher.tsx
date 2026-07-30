"use client";

import { usePathname } from "next/navigation";

import { LOCALES, LOCALE_LABELS, switchLocalePath, type Locale } from "@/lib/i18n";

/**
 * 언어 선택. 네이티브 `<select>` 를 쓴다(프로젝트 규약) — 기기 기본 선택 UI 가
 * 모바일에서 가장 다루기 쉽고, 목록이 4개뿐이라 커스텀 드롭다운을 만들 이유가 없다.
 *
 * **전체 페이지 이동(`location.assign`)을 쓴다.** 클라이언트 내비게이션은 루트 레이아웃을
 * 다시 렌더하지 않아서 `<html lang>`·metadata·OG 가 이전 언어로 남는다. 언어 전환은
 * 드문 동작이라 한 번의 전체 로드가 정확성을 지키는 값싼 대가다.
 *
 * 선택값은 따로 저장하지 않는다 — 로케일의 진실은 URL 이고, 저장소를 하나 더 두면
 * URL 과 어긋날 수 있다.
 */
export default function LanguageSwitcher({
  locale,
  label,
}: {
  locale: Locale;
  /** 스크린리더용 이름(`언어`/`Language`/…). 화면에는 선택된 언어명만 보인다. */
  label: string;
}) {
  const pathname = usePathname();

  return (
    <select
      aria-label={label}
      value={locale}
      onChange={(e) => {
        window.location.assign(
          switchLocalePath(pathname ?? "/", e.target.value as Locale),
        );
      }}
      className="cursor-pointer rounded-md border border-border bg-bg px-2 py-1 text-xs font-semibold text-fg-muted transition hover:text-fg focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {LOCALE_LABELS[l]}
        </option>
      ))}
    </select>
  );
}
