// 문자열을 사람이 세는 "한 글자"(그래핌 클러스터) 단위로 다루는 유틸.
//
// `slice`(UTF-16 코드유닛)나 `Array.from`(코드포인트)으로 자르면 이모지가 반쪼가리로 남는다.
// 그 문자열은 유효한 유니코드가 아닌데, `JSON.stringify` 가 `\udXXX` 이스케이프로
// 내보내므로 JS 안에서는 끝까지 멀쩡해 보인다 — 거부하는 건 받는 쪽 파서다.
// (PostgREST 가 PGRST102 로 거부해 클립 저장이 통째로 깨졌다 — plan.md 18장.)

// 모듈 스코프에 둔다. 불변·무상태 ICU 래퍼고 `segment()` 가 매번 새 이터레이터를
// 주므로 요청 간에 공유해도 안전하다.
const SEGMENTER =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

/**
 * 앞에서 `max` 글자를 가져온다. `more` 는 그 뒤에 더 있었는지.
 *
 * 입력 전체를 배열로 만들지 않고 `max` 에서 끊는다. 카페 본문처럼 큰 입력을
 * 160자로 줄이는 경로가 있어서, O(입력) 과 O(max) 의 차이가 실제로 크다.
 * (`Intl.Segmenter` 미지원 런타임은 코드포인트로 폴백 — 자릿수만 조금 달라진다.)
 */
function take(value: string, max: number): { text: string; more: boolean } {
  if (!SEGMENTER) {
    const points = Array.from(value);
    return { text: points.slice(0, max).join(""), more: points.length > max };
  }
  let text = "";
  let count = 0;
  for (const { segment } of SEGMENTER.segment(value)) {
    if (count >= max) return { text, more: true };
    text += segment;
    count += 1;
  }
  return { text, more: false };
}

/**
 * `max` 글자로 줄인다. 글자를 반으로 자르지 않는다.
 *
 * 빠른 경로: 그래핌 수는 코드유닛 수를 넘을 수 없으므로, 코드유닛 길이가 이미
 * `max` 이하면 자를 것이 없다.
 */
export function truncateGraphemes(value: string, max: number): string {
  if (value.length <= max) return value;
  return take(value, max).text;
}

/**
 * `max` 글자를 넘으면 `…` 를 붙여 줄인다(`…` 도 한 글자로 친다).
 *
 * 길이 판정과 절단을 **둘 다 그래핌으로** 한다. 한쪽만 코드유닛으로 재면,
 * 이모지가 섞인 문자열에서 "판정은 길다, 자를 건 없다"가 되어 아무것도 줄지
 * 않은 채 `…` 만 붙는다.
 */
export function truncateWithEllipsis(value: string, max: number): string {
  if (max < 1 || value.length <= max) return value;
  if (!take(value, max).more) return value;
  return `${take(value, max - 1).text.trimEnd()}…`;
}

/**
 * 저장용 절단. 자르고, 결과가 **유효한 유니코드임을 보장**한다.
 *
 * 안전한 절단 위치를 고르는 것만으로는 부족하다 — 상류에서 이미 코드유닛 단위로
 * 잘려 반쪼가리가 된 문자열은 대개 `max` 보다 짧아서 절단 자체를 건너뛴다.
 * 여기가 사용자 문자열이 DB 로 나가기 직전의 마지막 관문이고, 짝 잃은 서로게이트
 * 하나가 저장 전체를 무너뜨린다. 깨진 자리는 `�` 가 된다 — 글자 하나가 깨져
 * 보이는 편이 저장 실패보다 낫다.
 *
 * `toWellFormed` 는 Node 20+·Safari 17+ 라 **서버 경로에서만** 쓴다.
 * 브라우저에서 자를 일이 있으면 `truncateGraphemes` 를 쓰고 복구는 서버에 맡긴다.
 */
export function truncateForStorage(value: string, max: number): string {
  return truncateGraphemes(value, max).toWellFormed();
}
