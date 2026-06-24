import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { GRADIENTS, type Gradient } from "@/lib/gradients";

// 동적 OG 이미지: GET /api/og?title=...&desc=...&site=...&g=grape
// 그라디언트 배경 + 제목 + 설명 + 사이트명. 1200x630.
export const runtime = "nodejs";

const FONT_DIR = join(process.cwd(), "public", "fonts");

async function loadFonts() {
  const [bold, regular] = await Promise.all([
    readFile(join(FONT_DIR, "Pretendard-Bold.woff")),
    readFile(join(FONT_DIR, "Pretendard-Regular.woff")),
  ]);
  return { bold, regular };
}

function resolveGradient(name: string | null): Gradient {
  return GRADIENTS.find((g) => g.name === name) ?? GRADIENTS[2]; // 기본 grape
}

/** Satori 가 못 그리는 이모지는 제거(두부 글자 방지). */
function stripEmoji(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = stripEmoji(searchParams.get("title") ?? "ClipNote").slice(0, 90);
  const desc = stripEmoji(searchParams.get("desc") ?? "").slice(0, 140);
  // 사이트명이 없으면 비워둔다(하단 ClipNote 워터마크와 중복 방지).
  const site = stripEmoji(searchParams.get("site") ?? "").slice(0, 40);
  const gradient = resolveGradient(searchParams.get("g"));

  const { bold, regular } = await loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "72px",
          backgroundImage: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
          fontFamily: "Pretendard",
        }}
      >
        {/* 가독성을 위한 하단 스크림 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "70%",
            display: "flex",
            backgroundImage:
              "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.28))",
          }}
        />

        {site ? (
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.92)",
            }}
          >
            {site}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            marginTop: 18,
            fontSize: title.length > 40 ? 60 : 72,
            fontWeight: 700,
            lineHeight: 1.15,
            color: "#ffffff",
            // 최대 3줄
            maxHeight: 72 * 3,
            overflow: "hidden",
          }}
        >
          {title}
        </div>

        {desc ? (
          <div
            style={{
              display: "flex",
              marginTop: 22,
              fontSize: 30,
              fontWeight: 400,
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.9)",
              maxHeight: 30 * 1.4 * 2,
              overflow: "hidden",
            }}
          >
            {desc}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            marginTop: 30,
            fontSize: 24,
            fontWeight: 700,
            color: "rgba(255,255,255,0.95)",
          }}
        >
          ClipNote
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Pretendard", data: bold, weight: 700, style: "normal" },
        { name: "Pretendard", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
