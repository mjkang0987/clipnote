import HomePage from "@/app/_components/HomePage";

/** 한국어(원본) — 루트 경로를 그대로 유지한다. 기존 URL·인덱싱 보존. */
export default function Page() {
  return <HomePage locale="ko" />;
}
