// 사전 타입. `index.ts` 와 각 언어 사전이 함께 참조하므로 별도 파일로 둔다
// (`index.ts` 에 두면 `messages/en.ts` → `index.ts` → `messages/en.ts` 순환이 된다).

/** 사전 구조는 한국어 사전에서 파생 — 다른 언어에 없는 키를 쓰면 타입 오류로 잡힌다. */
export type Messages = typeof import("./messages/ko").default;

/**
 * 번역이 채워진 만큼만 담는 부분 사전. 빠진 키는 한국어로 폴백한다.
 *
 * 언어별 사전을 통째로 채워야만 쓸 수 있게 하면, 한 문구를 번역하려고 350개를 다 번역해야 한다.
 * 그러면 번역이 끝날 때까지 어떤 언어도 못 켜고, 결국 전부 한국어로 남는다.
 */
export type PartialMessages = DeepPartial<Messages>;

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends string ? string : DeepPartial<T[K]>;
};
