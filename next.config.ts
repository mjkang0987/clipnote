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
};

export default nextConfig;
