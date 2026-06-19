import { NextResponse } from "next/server";
import { clipStore } from "@/lib/store";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

// 본인 클립 한 건 변경/삭제. 로그인 + 소유자 확인.
// PATCH { saved: boolean } → 내 클립 담기/빼기 (공유만 만든 클립을 목록에 추가 등)
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

  if (typeof body.saved !== "boolean") {
    return NextResponse.json({ error: "saved(boolean) 가 필요합니다." }, { status: 400 });
  }

  const ok = await clipStore.setSaved(slug, user.id, body.saved);
  if (!ok) {
    return NextResponse.json({ error: "클립을 찾을 수 없어요." }, { status: 404 });
  }
  return NextResponse.json({ slug, saved: body.saved });
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
