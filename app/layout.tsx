import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import ServiceWorkerRegister from "@/app/_components/ServiceWorkerRegister";
import Footer from "@/app/_components/Footer";
import {
  DEFAULT_LOCALE,
  LOCALE_TAGS,
  getMessages,
  localizePath,
  type Locale,
} from "@/lib/i18n";
import { localeOpenGraph } from "@/lib/i18n/pageMetadata";
import { getRequestLocale } from "@/lib/i18n/server";

// 구글 애드센스 퍼블리셔 ID(ca-pub-...). 공개값이라 코드에 둔다.
const ADSENSE_CLIENT = "ca-pub-5655041057903258";

// 네이버 서치어드바이저 사이트 소유 확인 값. 애드센스와 같은 이유로 공개값이라 코드에 둔다.
const NAVER_SITE_VERIFICATION = "6ff90a3cd2a4a591e05beec958db1beb653ae0fc";

// 한국어 검색용 키워드. 다른 언어에서는 붙이지 않는다 — 한국어 키워드가 영어 결과에
// 섞이면 도움이 되지 않고, 언어별 키워드 목록을 관리할 가치도 크지 않다.
const KO_KEYWORDS = [
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
];

/**
 * 전역 메타데이터 — **로케일별로 만든다.** 미들웨어가 넘긴 로케일을 읽는다
 * (`lib/i18n/server.ts`). 페이지가 자기 title·canonical 을 주면 그쪽이 덮어쓴다.
 *
 * 여기서 언어를 맞춰두면 각 라우트는 canonical·hreflang 만 선언하면 된다.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const m = getMessages(locale).meta;

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: m.siteTitle, template: `%s · ${SITE_NAME}` },
    description: m.siteDescription,
    applicationName: SITE_NAME,
    keywords: locale === DEFAULT_LOCALE ? KO_KEYWORDS : undefined,
    authors: [{ name: SITE_NAME }],
    alternates: { canonical: localizePath("/", locale) },
    // OG·트위터 카드는 라우트와 같은 함수로 만든다(값의 출처를 한 곳으로).
    ...localeOpenGraph(locale, "/"),
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    icons: { icon: "/icon-192.png", apple: "/apple-icon-180.png" },
    // 애드센스·네이버 서치어드바이저 사이트 소유 확인용 메타태그
    other: {
      "google-adsense-account": ADSENSE_CLIENT,
      "naver-site-verification": NAVER_SITE_VERIFICATION,
    },
    appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" },
  };
}

export const viewport: Viewport = {
  themeColor: "#7c5cfc",
};

// 사이트 전역 구조화 데이터(JSON-LD) — 검색·생성형 AI 가 ClipNote 를 이해하도록.
// `inLanguage` 와 설명이 로케일을 따라야 하므로 함수로 만든다.
function siteJsonLd(locale: Locale) {
  const m = getMessages(locale).meta;
  const url = `${SITE_URL}${localizePath("/", locale)}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url,
        inLanguage: LOCALE_TAGS[locale],
        description: m.siteDescription,
      },
      {
        "@type": "WebApplication",
        name: SITE_NAME,
        url,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web",
        inLanguage: LOCALE_TAGS[locale],
        description: m.siteDescription,
        offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      },
    ],
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 미들웨어가 요청 경로에서 읽어 헤더로 넘긴 값. `<html lang>` 과 푸터 사전이 이걸 쓴다.
  const locale = await getRequestLocale();

  return (
    <html lang={LOCALE_TAGS[locale]} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {/* 구글 애드센스 로더.
            `lazyOnload` 인 이유: `afterInteractive` 는 하이드레이션 직후 — 즉 LCP 가 아직
            확정되지 않은 구간에 스크립트를 밀어 넣는다. 애드센스는 자기 하위 요청을 줄줄이
            달고 오므로 그 시점의 대역폭·메인스레드를 본문과 나눠 쓰게 된다. `lazyOnload` 는
            window load 이후로 미뤄 LCP 구간을 비켜 간다. 광고는 어차피 첫 화면 밖이다. */}
        <Script
          id="adsbygoogle-init"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteJsonLd(locale)),
          }}
        />
        <ServiceWorkerRegister />
        {children}
        <Footer locale={locale} />
      </body>
    </html>
  );
}
