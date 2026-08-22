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
        // `public/` 기본값은 `max-age=0` 이라 재방문마다 폰트 조각 십수 개를 재검증한다.
        // immutable 이 안전한 근거는 경로의 버전에 있다 — `app/fonts.css` 헤더 참고.
        //
        // 버전 디렉터리에만 건다. `/api/og` 가 읽는 `Pretendard-{Bold,Regular}.woff` 는
        // 버전이 없어 교체해도 URL 이 그대로라 immutable 이면 안 된다.
        // `:path*` 가 아니라 `:path+` 인 이유: `*` 는 0개도 허용하고 경로 매칭이 대소문자를
        // 안 가려서 `/fonts/Pretendard-Bold.woff` 가 `:version=Bold.woff` + 빈 `:path` 로 샌다.
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
