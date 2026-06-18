// 공유 카드 배경 그라디언트 프리셋 (design-guide.md §3)
// 슬러그/문자열 기반 결정적 선택 — 같은 입력은 항상 같은 색.

export type Gradient = {
  name: string;
  from: string;
  to: string;
};

export const GRADIENTS: Gradient[] = [
  { name: "sunset", from: "#FF6B6B", to: "#FFA94D" },
  { name: "ocean", from: "#4F8DFD", to: "#6FE0C9" },
  { name: "grape", from: "#7C5CFC", to: "#E879F9" },
  { name: "forest", from: "#0EA5E9", to: "#22C55E" },
  { name: "peach", from: "#FB7185", to: "#FDBA74" },
  { name: "midnight", from: "#4338CA", to: "#7C3AED" },
  { name: "mint", from: "#06B6D4", to: "#34D399" },
  { name: "rose", from: "#EC4899", to: "#8B5CF6" },
];

/** 문자열을 안정적인 32bit 해시로 변환 (djb2). */
function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return hash >>> 0;
}

/** 시드 문자열로 그라디언트를 결정적으로 선택. */
export function pickGradient(seed: string): Gradient {
  const index = hashString(seed || "clipnote") % GRADIENTS.length;
  return GRADIENTS[index];
}

/** CSS linear-gradient 문자열 생성. */
export function gradientCss(gradient: Gradient, angle = 135): string {
  return `linear-gradient(${angle}deg, ${gradient.from}, ${gradient.to})`;
}
