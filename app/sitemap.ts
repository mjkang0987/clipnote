import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// /sitemap.xml — 인덱싱 대상은 정적 페이지만.
// 공유 페이지(/슬러그)는 noindex 라 포함하지 않는다.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
