import { NextResponse } from "next/server";
import { clipStore } from "@/lib/store";
import { pickGradient } from "@/lib/gradients";
import { normalizeUrl } from "@/lib/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

// 클립 생성(=공유 링크): POST /api/clip — 로그인 사용자만.
// body: { url, title, description?, image?, siteName?, tags?, gradient? }
// → 저장 후 { slug, shareUrl } 반환
export async function POST(request: Request) {
  // 공유 링크 생성은 로그인 전용
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "공유 링크는 로그인 후 만들 수 있어요." },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!url) {
    return NextResponse.json({ error: "url 은 필수입니다." }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "제목이 필요합니다." }, { status: 400 });
  }

  const seed = title || url;
  const gradient =
    typeof body.gradient === "string" ? body.gradient : pickGradient(seed).name;

  const tags = Array.isArray(body.tags)
    ? body.tags
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 6)
    : [];

  const clip = await clipStore.create({
    url: normalizeUrl(url),
    title: title.slice(0, 120),
    description:
      typeof body.description === "string" ? body.description.slice(0, 300) : null,
    image: typeof body.image === "string" ? body.image : null,
    siteName: typeof body.siteName === "string" ? body.siteName : null,
    gradient,
    tags,
    userId: user.id,
  });

  const origin = new URL(request.url).origin;
  return NextResponse.json({
    slug: clip.slug,
    shareUrl: `${origin}/${clip.slug}`,
  });
}
