import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, ogImagePath } from "@/lib/site";
import ServiceWorkerRegister from "@/app/_components/ServiceWorkerRegister";

const ogImage = ogImagePath({
  title: "URL을 예쁜 공유 카드로",
  desc: "링크 하나로 공유 카드와 짧은 링크를 만들어요",
  site: "ClipNote",
  g: "grape",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ClipNote — URL을 예쁜 공유 카드로",
    template: "%s · ClipNote",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "ClipNote",
    "클립노트",
    "공유 카드",
    "링크 공유",
    "OG 이미지",
    "오픈그래프",
    "URL 단축",
    "썸네일 카드",
    "네이버 카페 공유",
    "인스타그램 공유",
  ],
  authors: [{ name: "ClipNote" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "ClipNote — URL을 예쁜 공유 카드로",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "ko_KR",
    images: [{ url: ogImage, width: 1200, height: 630, alt: "ClipNote" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ClipNote — URL을 예쁜 공유 카드로",
    description: SITE_DESCRIPTION,
    images: [ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-icon-180.png",
  },
  appleWebApp: {
    capable: true,
    title: "ClipNote",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c5cfc",
};

// 사이트 전역 구조화 데이터(JSON-LD) — 검색·생성형 AI 가 ClipNote 를 이해하도록
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "ko",
      description: SITE_DESCRIPTION,
    },
    {
      "@type": "WebApplication",
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web",
      inLanguage: "ko",
      description: SITE_DESCRIPTION,
      offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
