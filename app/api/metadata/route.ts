import { NextRequest, NextResponse } from "next/server";
import { fetchMetadata } from "@/lib/metadata";
import pkg from "@/package.json";

// URL 메타데이터 조회: GET /api/metadata?url=...
// 서버에서 외부 URL 을 받아오므로 항상 동적 실행.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json(
      { error: "url 쿼리 파라미터가 필요합니다." },
      { status: 400 },
    );
  }

  // fetchMetadata 는 실패 시에도 source:"none" 구조를 반환(throw 안 함)하므로
  // 클라이언트는 항상 동일한 형태로 처리 가능.
  const data = await fetchMetadata(url);
  // version: 어떤 배포가 응답했는지 바로 확인할 수 있게 응답에 박는다(배포 확인용).
  return NextResponse.json(
    { ...data, version: pkg.version },
    {
      headers: {
        "Cache-Control": "public, max-age=300",
        "x-clipnote-version": pkg.version,
      },
    },
  );
}
