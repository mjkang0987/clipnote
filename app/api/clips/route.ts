import { NextResponse } from "next/server";
import { clipStore } from "@/lib/store";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 내 클립 목록(로그인 사용자). 비로그인은 빈 목록(게스트는 localStorage 사용).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ clips: [] });

  const clips = await clipStore.listByUser(user.id);
  return NextResponse.json({ clips });
}
