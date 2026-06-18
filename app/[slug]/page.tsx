import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { clipStore } from "@/lib/store";
import { gradientCss, pickGradient } from "@/lib/gradients";
import SmartRedirect from "./SmartRedirect";

type Params = { params: Promise<{ slug: string }> };

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
  const clip = await clipStore.get(slug);
  if (!clip) return { title: "찾을 수 없는 링크 · ClipNote" };

  const image = ogImageUrl(clip);
  const description = clip.description ?? `${clip.siteName ?? "ClipNote"} 공유 링크`;

  return {
    title: clip.title,
    description,
    // 공유 페이지는 원본으로 넘기는 기능성 페이지 → 검색 인덱싱 제외(follow 는 허용)
    robots: { index: false, follow: true },
    openGraph: {
      title: clip.title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: clip.title,
      description,
      images: [image],
    },
  };
}

export default async function SharePage({ params }: Params) {
  const { slug } = await params;
  const clip = await clipStore.get(slug);
  if (!clip) notFound();

  await clipStore.incrementView(slug);
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
