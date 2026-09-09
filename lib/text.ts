// 문자열을 사람이 세는 "한 글자"(그래핌 클러스터) 단위로 다루는 유틸.
//
// `slice`(UTF-16 코드유닛)나 `Array.from`(코드포인트)으로 자르면 이모지가 반쪼가리로 남는다.
// 그 문자열은 유효한 유니코드가 아닌데, `JSON.stringify` 가 `\udXXX` 이스케이프로
// 내보내므로 JS 안에서는 끝까지 멀쩡해 보인다 — 거부하는 건 받는 쪽 파서다.
// (PostgREST 가 PGRST102 로 거부해 클립 저장이 통째로 깨졌다 — plan.md 18장.)
//
// 여기서는 **자르기만** 한다. 이미 깨져서 들어온 문자열의 복구는 저장 직전
// (`lib/store-supabase.ts` 의 `wellFormedRow`)에서 컬럼 구분 없이 한 번에 한다.

// 모듈 스코프에 둔다. 불변·무상태 ICU 래퍼고 `segment()` 가 매번 새 이터레이터를
// 주므로 요청 간에 공유해도 안전하다.
const SEGMENTER =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

/**
 * 글자를 하나씩 흘려 준다. 호출부가 필요한 만큼만 받고 멈출 수 있도록 이터레이터다 —
 * 카페 본문(최대 512KB)을 160자로 줄이는 경로가 있어서 입력 전체를 배열로 만들면
 * O(입력)이 된다. `Intl.Segmenter` 가 없으면 코드포인트로 폴백한다(자릿수만 달라진다).
 */
function* segments(value: string): Generator<string> {
  if (!SEGMENTER) {
    yield* Array.from(value);
    return;
  }
  for (const { segment } of SEGMENTER.segment(value)) yield segment;
}

/**
 * `max` 글자로 줄인다. 글자를 반으로 자르지 않는다.
 *
 * 빠른 경로: 그래핌 수는 코드유닛 수를 넘을 수 없으므로, 코드유닛 길이가 이미
 * `max` 이하면 자를 것이 없다.
 */
export function truncateGraphemes(value: string, max: number): string {
  if (value.length <= max) return value;
  let out = "";
  let count = 0;
  for (const segment of segments(value)) {
    if (count >= max) break;
    out += segment;
    count += 1;
  }
  return out;
}

/**
 * `max` 글자를 넘으면 `…` 를 붙여 줄인다(`…` 도 한 글자로 친다).
 *
 * 길이 판정과 절단을 **둘 다 그래핌으로** 한다. 한쪽만 코드유닛으로 재면,
 * 이모지가 섞인 문자열에서 "판정은 길다, 자를 건 없다"가 되어 아무것도 줄지
 * 않은 채 `…` 만 붙는다.
 *
 * `max` 번째 글자를 만나는 순간이 곧 "더 있다"는 뜻이므로 한 번만 훑는다.
 */
export function truncateWithEllipsis(value: string, max: number): string {
  if (max < 1 || value.length <= max) return value;
  let head = ""; // 앞에서 max-1 글자 (`…` 가 한 글자를 차지한다)
  let count = 0;
  for (const segment of segments(value)) {
    if (count >= max) return `${head.trimEnd()}…`;
    if (count < max - 1) head += segment;
    count += 1;
  }
  return value; // 그래핌 기준으론 max 이하였다 — 자를 것이 없다
}
