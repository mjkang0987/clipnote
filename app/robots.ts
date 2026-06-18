import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// /robots.txt 자동 생성. /auth 는 크롤링 제외, OG 이미지(/api/og)는 허용.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/auth/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
