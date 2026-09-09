// 문자열을 사람이 세는 "한 글자" 단위로 다루는 유틸.
//
// `slice`(UTF-16 코드유닛)나 `Array.from`(코드포인트)으로 자르면 이모지가 반쪼가리로 남고,
// 그 문자열은 유효한 유니코드가 아니다. `JSON.stringify` 는 그걸 `\udXXX` 이스케이프로
// 내보내므로 JS 안에서는 끝까지 멀쩡해 보이지만, 받는 쪽 파서가 거부한다.
// (실제로 PostgREST 가 PGRST102 로 거부해 클립 저장이 깨졌다 — plan.md 18장.)

/**
 * 그래핌 클러스터(사람이 세는 한 글자) 단위로 쪼갠다.
 *
 * `Array.from` 은 코드포인트 단위라 `☕️`(U+2615 + VS16)나 ZWJ 이모지가 쪼개진다.
 * iOS 는 `String` 이 그래핌 단위라, 파리티를 맞추려면 웹도 `Intl.Segmenter` 를 써야 한다.
 * (미지원 런타임은 코드포인트로 폴백 — 자릿수만 조금 달라지고 동작은 같다.)
 */
export function graphemes(value: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });
    return Array.from(segmenter.segment(value), (s) => s.segment);
  }
  return Array.from(value);
}

/**
 * `max` 글자로 줄인다. 글자를 반으로 자르지 않는다.
 *
 * 그래핌 수는 코드유닛 수를 넘을 수 없으므로, 코드유닛 길이가 이미 `max` 이하면
 * 자를 필요가 없다 — 대부분의 입력에서 Segmenter 를 만들지 않고 끝난다.
 */
export function truncateGraphemes(value: string, max: number): string {
  if (value.length <= max) return value;
  return graphemes(value).slice(0, max).join("");
}
