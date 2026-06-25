import { NextResponse } from "next/server";
import { clipStore } from "@/lib/store";
import { pickGradient } from "@/lib/gradients";
import { canonicalizeUrl } from "@/lib/metadata";
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

  // save=true 면 내 클립에 저장만(브릿지 링크 없음). 그 외(기본)는 공유 링크 만들기.
  const save = body.save === true;
  const shared = !save; // 공유 요청이면 공개 브릿지(/[slug]) 켜기, 저장만이면 끔
  const normalizedUrl = canonicalizeUrl(url);
  const origin = new URL(request.url).origin;

  // 중복 방지: 같은 사용자의 같은 URL 클립이 이미 있으면 새로 만들지 않고 재사용.
  const existing = await clipStore.findByUserUrl(user.id, normalizedUrl);
  if (existing) {
    const alreadySaved = existing.saved;
    // 저장만 한 클립을 공유하거나, 공유만 한 클립을 저장 — 필요한 플래그만 켠다.
    if (save && !existing.saved) {
      await clipStore.setSaved(existing.slug, user.id, true);
    }
    if (shared && !existing.shared) {
      await clipStore.update(existing.slug, user.id, { shared: true });
    }
    const nowShared = existing.shared || shared;
    return NextResponse.json({
      slug: existing.slug,
      shareUrl: nowShared ? `${origin}/${existing.slug}` : null,
      saved: save || existing.saved,
      shared: nowShared,
      existed: true,
      alreadySaved: save && alreadySaved, // 이미 내 클립에 있던 경우
    });
  }

  const clip = await clipStore.create({
    url: normalizedUrl,
    title: title.slice(0, 120),
    description:
      typeof body.description === "string" ? body.description.slice(0, 300) : null,
    image: typeof body.image === "string" ? body.image : null,
    siteName: typeof body.siteName === "string" ? body.siteName : null,
    gradient,
    tags,
    userId: user.id,
    saved: save,
    shared,
  });

  return NextResponse.json({
    slug: clip.slug,
    shareUrl: clip.shared ? `${origin}/${clip.slug}` : null,
    saved: clip.saved,
    shared: clip.shared,
  });
}
