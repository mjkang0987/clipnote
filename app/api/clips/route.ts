import { NextResponse } from "next/server";
import { clipStore } from "@/lib/store";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 내 클립 목록(로그인 사용자). 비로그인은 빈 목록(게스트는 localStorage 사용).
// loggedIn 을 함께 반환 → 클라이언트가 별도 auth.getUser() 왕복 없이 로그인 여부 판별.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ loggedIn: false, clips: [] });

  const clips = await clipStore.listByUser(user.id);
  return NextResponse.json({ loggedIn: true, clips });
}
