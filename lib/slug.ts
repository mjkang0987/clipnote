import { randomBytes } from "node:crypto";

// 슬러그: 혼동되는 글자(0/O/I/l/1) 제외한 base-57. 7자 ≈ 570억 조합.
const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateSlug(length = 7): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}
