import { NextResponse } from "next/server";
import { clipStore } from "@/lib/store";
import { getCurrentUser } from "@/lib/supabase/server";
import { truncateGraphemes } from "@/lib/text";
import { readJsonObject, withErrors } from "@/lib/apiError";

export const runtime = "nodejs";

// 본인 클립 한 건 변경/삭제. 로그인 + 소유자 확인.
// PATCH { title?, tags?, saved?, shared? } → 온 필드만 수정(편집/담기·빼기/공유 켜기)
// DELETE → 클립 삭제

export const PATCH = withErrors(async (
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { slug } = await params;

  const body = await readJsonObject(request);
  if (body instanceof NextResponse) return body;

  const patch: {
    title?: string;
    tags?: string[];
    saved?: boolean;
    shared?: boolean;
  } = {};

  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (!t) {
      return NextResponse.json({ error: "제목은 비울 수 없어요." }, { status: 400 });
    }
    // 저장 경로와 같은 규칙 — 코드유닛으로 자르면 반쪼가리 이모지가 남는다.
    patch.title = truncateGraphemes(t, 120);
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

  if (typeof body.shared === "boolean") {
    patch.shared = body.shared;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "수정할 내용이 없어요." }, { status: 400 });
  }

  const updated = await clipStore.update(slug, user.id, patch);
  if (!updated) {
    return NextResponse.json({ error: "클립을 찾을 수 없어요." }, { status: 404 });
  }
  return NextResponse.json({ clip: updated });
});

export const DELETE = withErrors(async (
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) => {
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
});
