import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// 로그아웃: 세션 종료 후 홈으로.
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
