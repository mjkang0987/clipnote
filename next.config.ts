import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 한국어는 루트가 정식 경로다(`/`). `/ko` 로 들어오면 같은 내용이 두 URL 에
      // 존재해 중복 인덱싱되므로 영구 리다이렉트로 canonical 을 하나로 유지한다.
      { source: "/ko", destination: "/", permanent: true },
      { source: "/ko/:path*", destination: "/:path*", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        // `public/` 은 기본이 `max-age=0, must-revalidate` 라 재방문마다 폰트를 재검증한다.
        // 조각이 십수 개라 그 왕복이 그대로 쌓인다. 경로에 버전이 박혀 있어(`pretendard-1.3.9`)
        // 업그레이드하면 URL 이 통째로 바뀌므로 immutable 로 둬도 옛 파일을 물고 있을 수 없다.
        //
        // **버전 디렉터리에만 건다.** `/fonts/:path*` 로 넓히면 `/api/og` 가 쓰는 버전 없는
        // `Pretendard-{Bold,Regular}.woff` 까지 1년 immutable 이 된다 — 그 둘은 파일명이
        // 안 바뀌므로 교체해도 캐시가 옛것을 물고 있게 되고, 위 근거가 성립하지 않는다.
        // `:path+` 는 **1개 이상** — `:path*` 로 두면 0개도 허용되고 경로 매칭이
        // 대소문자를 안 가려서 `/fonts/Pretendard-Bold.woff` 가
        // `pretendard-` + `:version=Bold.woff` + 빈 `:path` 로 매치돼 버린다.
        source: "/fonts/pretendard-:version/:path+",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
