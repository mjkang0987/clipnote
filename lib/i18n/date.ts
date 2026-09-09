// 날짜를 로케일·타임존에 맞춰 사람이 읽는 문자열로 바꾼다.
//
// **타임존을 인자로 받는 이유** — `getFullYear`·`toLocaleDateString` 류는 실행 환경의
// 로컬 타임존을 쓴다. 서버는 UTC, 브라우저는 사용자 로컬이라 같은 시각이 서로 다른
// 날로 계산되고, SSR 과 하이드레이션의 결과가 갈린다(plan.md 19장).

import { LOCALE_TAGS, type Locale } from "./locales";

type CalendarDate = { year: number; month: number; day: number };

function calendarDate(
  formatter: Intl.DateTimeFormat,
  d: Date,
): CalendarDate {
  const parts = formatter.formatToParts(d);
  const value = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: value("year"), month: value("month"), day: value("day") };
}

/** 날짜 차이를 재기 위한 일(day) 번호. 같은 타임존끼리만 빼야 의미가 있다. */
function dayNumber({ year, month, day }: CalendarDate): number {
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

/**
 * 목록 하나를 묶는 동안 쓸 날짜 그룹 라벨 생성기.
 *
 *   오늘 / 어제 / 이번 주 / 이번 달  → RelativeTimeFormat(numeric: "auto")
 *   2026년 7월                      → DateTimeFormat(year, month: "long")
 *
 * 라벨을 직접 번역하지 않는 이유 — 문구 4개 × 언어 3개도 문제지만, `2026년 7월` 같은
 * 연월 **형식**이 언어마다 달라(en `July 2026`, ja `2026年7月`) 사전으로 표현할 수 없다.
 *
 * 포맷터와 `now` 쪽 값은 항목마다 같으므로 여기서 한 번만 만든다. 목록이 200개까지
 * 오는데 항목마다 `Intl.*Format` 을 새로 만들면 그 생성 비용이 전체를 지배한다.
 */
export function createDateGrouper(
  locale: Locale,
  now: Date,
  timeZone?: string,
): (d: Date) => string {
  const tag = LOCALE_TAGS[locale];
  const calendar = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const relative = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });
  const monthly = new Intl.DateTimeFormat(tag, {
    timeZone,
    year: "numeric",
    month: "long",
  });

  const today = calendarDate(calendar, now);
  const todayNumber = dayNumber(today);

  return (d) => {
    const date = calendarDate(calendar, d);
    const diffDays = todayNumber - dayNumber(date);
    if (diffDays <= 0) return relative.format(0, "day");
    if (diffDays === 1) return relative.format(-1, "day");
    if (diffDays < 7) return relative.format(0, "week");
    if (date.year === today.year && date.month === today.month)
      return relative.format(0, "month");
    return monthly.format(d);
  };
}
