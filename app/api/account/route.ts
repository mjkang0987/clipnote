import { NextResponse } from "next/server";
import { clipStore } from "@/lib/store";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabase";

export const runtime = "nodejs";

// 회원 탈퇴: 본인 계정과 저장된 모든 클립·공유 링크를 영구 삭제한다.
//  1) 사용자의 모든 클립 삭제(공유 링크 포함)
//  2) Supabase auth 사용자 삭제(service_role) — 되돌릴 수 없음
//  3) 쿠키 세션 정리(로그아웃)
// 삭제 후 클라이언트가 홈으로 이동한다.
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  try {
    // 1) 클립 먼저 제거(계정 삭제의 cascade 와 별개로 명시적으로 정리).
    await clipStore.removeAllByUser(user.id);

    // 2) 인증 계정 삭제(Supabase 환경일 때만 — 메모리 폴백엔 auth 가 없음).
    if (hasSupabaseEnv()) {
      const admin = getSupabaseAdmin();
      const { error } = await admin.auth.admin.deleteUser(user.id);
      if (error) {
        return NextResponse.json(
          { error: "계정 삭제에 실패했어요. 잠시 후 다시 시도해 주세요." },
          { status: 500 },
        );
      }
    }
  } catch {
    return NextResponse.json(
      { error: "계정 삭제 중 문제가 발생했어요." },
      { status: 500 },
    );
  }

  // 3) 쿠키 세션 정리(이미 무효화됐지만 쿠키를 깨끗이 지움).
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // 세션 정리 실패는 무시 — 계정은 이미 삭제됨, 클라이언트가 로그아웃 처리.
  }

  return NextResponse.json({ deleted: true });
}
