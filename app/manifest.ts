import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION } from "@/lib/site";

// 웹 앱 매니페스트 → /manifest.webmanifest (Next 가 <link rel="manifest"> 자동 주입).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ClipNote",
    short_name: "ClipNote",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#7c5cfc",
    lang: "ko",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
