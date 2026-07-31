// 공유/복사 텍스트 생성 — 웹·앱 공통 규약(제목 + 링크, 설명 제외).
// iOS는 `ClipNote/Util/ShareText.swift`가 같은 규칙을 구현한다. 한쪽만 바꾸지 않는다.

/** 공유 텍스트 제목의 최대 길이(말줄임표 `…` 포함). */
export const SHARE_TITLE_MAX = 80;

/**
 * 공백·줄바꿈을 한 칸으로 정리한다.
 * 인스타 캡션처럼 개행이 섞인 제목을 그대로 쓰면 `제목\nURL` 포맷이 깨져
 * 링크가 어느 줄에 있는지 알 수 없게 된다.
 */
function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * 사람이 세는 "한 글자" 단위(그래핌 클러스터)로 쪼갠다.
 *
 * `Array.from`은 코드포인트 단위라 `☕️`(U+2615 + VS16)나 ZWJ 이모지가 반쪼가리로 잘린다.
 * iOS는 `String`이 그래핌 단위라, 파리티를 맞추려면 웹도 `Intl.Segmenter`를 써야 한다.
 * (미지원 런타임은 코드포인트로 폴백 — 자릿수만 조금 달라지고 동작은 같다.)
 */
function graphemes(value: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });
    return Array.from(segmenter.segment(value), (s) => s.segment);
  }
  return Array.from(value);
}

/**
 * 제목을 `max`자(말줄임표 포함)로 줄인다.
 *
 * 인스타 어댑터는 `og:title`을 제목으로 쓰는데(`lib/adapters/instagram.ts`) 인스타는
 * 여기에 캡션 전문을 넣는다. 자르지 않으면 공유문이 캡션 통째로 길어진다.
 */
export function truncateShareTitle(
  value: string,
  max = SHARE_TITLE_MAX,
): string {
  const title = collapseWhitespace(value);
  if (max < 1) return title;
  const chars = graphemes(title);
  if (chars.length <= max) return title;
  // 말줄임표가 한 자를 차지하므로 본문은 max-1자까지. 잘린 끝의 공백은 떼낸다.
  return `${chars.slice(0, max - 1).join("").trimEnd()}…`;
}

/** 공유/복사 텍스트: `제목\nURL`. 빈 값은 줄에서 제외하고, 설명은 길어서 넣지 않는다. */
export function buildShareText(title: string, url: string): string {
  return [truncateShareTitle(title), url].filter(Boolean).join("\n");
}
