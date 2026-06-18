"use client";

import { useEffect, useState } from "react";

// 사용자는 잠깐 카드를 본 뒤 원본으로 이동.
// 크롤러(카톡·페북)는 JS 를 실행하지 않으므로 OG 카드만 읽고 리다이렉트되지 않음.
export default function SmartRedirect({
  url,
  delayMs = 1200,
}: {
  url: string;
  delayMs?: number;
}) {
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    const go = setTimeout(() => window.location.replace(url), delayMs);
    // 혹시 이동이 막히면 수동 링크 노출
    const fallback = setTimeout(() => setStalled(true), delayMs + 2500);
    return () => {
      clearTimeout(go);
      clearTimeout(fallback);
    };
  }, [url, delayMs]);

  if (!stalled) return null;
  return (
    <p className="mt-4 text-sm text-white/90">
      자동 이동이 안 되면{" "}
      <a href={url} className="font-semibold underline">
        여기를 눌러 이동
      </a>
      하세요.
    </p>
  );
}
