import { Fragment, type ReactNode } from "react";

const TOKEN = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;

/**
 * 번역문 안의 `{key}` 를 문자열·숫자로 바꾼다. 노드가 아니라 평문이 필요한 곳
 * (aria-label, 단순 문장)에서 쓴다. 값이 없는 토큰은 그대로 남긴다.
 *
 *   interpolate(t.selectedCount, { count: 3 })  →  "3개 선택됨"
 */
export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(TOKEN, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  );
}

/**
 * 번역문 안의 `{key}` 를 React 노드로 바꾼다. 문장 중간에 링크·강조가 들어가는 문구용.
 *
 * 문장을 `앞부분 / 링크 / 뒷부분` 3개 키로 쪼개지 않는 이유: 어순이 언어마다 달라서
 * 조각으로 나누면 번역이 불가능해진다. 한국어는 "…{clips}에서 모아 볼 수 있어요",
 * 영어는 "…browse them together in {clips}." 로 링크 위치가 반대다.
 *
 *   interpolateNode(t.tagsHint, { clips: <a href="/clips">내 클립</a> })
 *
 * 값이 없는 토큰은 그대로 남긴다 — 번역이 덜 채워졌을 때 문장이 사라지는 것보다 낫다.
 */
export function interpolateNode(
  template: string,
  values: Record<string, ReactNode>,
): ReactNode {
  return template.split(/(\{[a-zA-Z][a-zA-Z0-9]*\})/g).map((part, index) => {
    const match = /^\{([a-zA-Z][a-zA-Z0-9]*)\}$/.exec(part);
    const value = match ? values[match[1]] : undefined;
    return <Fragment key={index}>{value === undefined ? part : value}</Fragment>;
  });
}
