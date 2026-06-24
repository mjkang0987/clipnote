import { NextResponse } from "next/server";
import { clipStore } from "@/lib/store";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

// 본인 클립 한 건 변경/삭제. 로그인 + 소유자 확인.
// PATCH { title?, tags?, saved? } → 온 필드만 수정(편집/담기·빼기)
// DELETE → 클립 삭제

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { slug } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const patch: { title?: string; tags?: string[]; saved?: boolean } = {};

  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (!t) {
      return NextResponse.json({ error: "제목은 비울 수 없어요." }, { status: 400 });
    }
    patch.title = t.slice(0, 120);
  }

  if (Array.isArray(body.tags)) {
    patch.tags = body.tags
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 6);
  }

  if (typeof body.saved === "boolean") {
    patch.saved = body.saved;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "수정할 내용이 없어요." }, { status: 400 });
  }

  const updated = await clipStore.update(slug, user.id, patch);
  if (!updated) {
    return NextResponse.json({ error: "클립을 찾을 수 없어요." }, { status: 404 });
  }
  return NextResponse.json({ clip: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { slug } = await params;
  const ok = await clipStore.remove(slug, user.id);
  if (!ok) {
    return NextResponse.json({ error: "클립을 찾을 수 없어요." }, { status: 404 });
  }
  return NextResponse.json({ slug, deleted: true });
}
