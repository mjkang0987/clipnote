// 사이트 기본 URL — 환경변수 우선, 없으면 운영 도메인.
// 로컬은 .env.local 에 NEXT_PUBLIC_SITE_URL=http://localhost:4000
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://clipnote.co.kr"
).replace(/\/$/, "");

export const SITE_NAME = "ClipNote";
export const SITE_DESCRIPTION =
  "URL을 입력하면 제목·설명을 자동으로 읽어와 깔끔한 공유 카드와 짧은 링크를 만들어 드려요. 네이버 카페·인스타그램도 지원합니다.";

/** OG 이미지 URL (동적 생성). 상대경로 — metadataBase 기준으로 절대화됨. */
export function ogImagePath(params: {
  title: string;
  desc?: string;
  site?: string;
  g?: string;
}): string {
  const q = new URLSearchParams({ title: params.title, g: params.g ?? "grape" });
  if (params.desc) q.set("desc", params.desc);
  if (params.site) q.set("site", params.site);
  return `/api/og?${q.toString()}`;
}
