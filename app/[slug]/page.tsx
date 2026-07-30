import { cache } from "react";
import type { Metadata } from "next";
import { after } from "next/server";
import { notFound } from "next/navigation";
import { clipStore } from "@/lib/store";
import { gradientCss, pickGradient } from "@/lib/gradients";
import SmartRedirect from "./SmartRedirect";

type Params = { params: Promise<{ slug: string }> };

// generateMetadata 와 SharePage 가 같은 slug 를 조회 — 요청 단위로 1회만 DB 왕복.
const getClip = cache((slug: string) => clipStore.get(slug));

/** OG 이미지 URL 구성(상대 경로 — metadataBase 기준으로 절대화됨). */
function ogImageUrl(p: {
  title: string;
  description: string | null;
  siteName: string | null;
  gradient: string;
}): string {
  const q = new URLSearchParams({
    title: p.title,
    g: p.gradient,
  });
  if (p.description) q.set("desc", p.description);
  if (p.siteName) q.set("site", p.siteName);
  return `/api/og?${q.toString()}`;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const clip = await getClip(slug);
  // 공유 안 된(저장만 한) 클립은 공개 브릿지 없음 — 없는 링크로 취급.
  if (!clip || !clip.shared) return { title: "찾을 수 없는 링크 · ClipNote" };

  // 원본 글에 대표 이미지가 있으면 그걸 그대로 OG 이미지로 쓰고,
  // 없을 때만 그라디언트 카드(/api/og)를 생성해서 쓴다.
  // 생성 카드는 1200×630 이 확정이라 크기를 명시하지만, 원본 이미지는
  // 실제 크기를 알 수 없으므로 크기를 붙이지 않는다(잘못 붙이면 미리보기가 깨질 수 있음).
  const image = clip.image
    ? { url: clip.image }
    : { url: ogImageUrl(clip), width: 1200, height: 630 };
  const description = clip.description ?? `${clip.siteName ?? "ClipNote"} 공유 링크`;

  return {
    title: clip.title,
    description,
    // 공유 페이지는 원본으로 넘기는 기능성 페이지 → 검색 인덱싱 제외(follow 는 허용)
    robots: { index: false, follow: true },
    openGraph: {
      title: clip.title,
      description,
      images: [image],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: clip.title,
      description,
      images: [image.url],
    },
  };
}

export default async function SharePage({ params }: Params) {
  const { slug } = await params;
  const clip = await getClip(slug);
  // 공유 안 된(저장만 한) 클립은 공개 브릿지 없음 — 404.
  if (!clip || !clip.shared) notFound();

  // 조회수 증가는 렌더를 막을 이유가 없음 — 응답 후 실행(after).
  // 서버리스에서도 함수가 살아있는 동안 실행이 보장됨(bare void 는 동결될 수 있음).
  after(() => clipStore.incrementView(slug));
  const gradient = pickGradient(clip.gradient);

  return (
    <main
      className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center"
      style={{ background: gradientCss(gradient) }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
        {clip.siteName ?? "ClipNote"}
      </p>
      <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight text-white drop-shadow-sm sm:text-4xl">
        {clip.title}
      </h1>
      {clip.description && (
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/90">
          {clip.description}
        </p>
      )}

      <p className="mt-8 text-sm text-white/80">원본 페이지로 이동 중…</p>
      <a
        href={clip.url}
        className="mt-3 rounded-xl bg-white/95 px-5 py-2.5 text-sm font-semibold text-fg shadow-soft transition hover:bg-white"
      >
        지금 이동하기
      </a>

      <SmartRedirect url={clip.url} />
    </main>
  );
}
