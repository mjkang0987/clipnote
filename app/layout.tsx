import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClipNote — URL을 공유 카드로",
  description:
    "URL을 입력하면 예쁜 공유 카드와 짧은 링크를 만들어 드립니다. ClipNote.",
  metadataBase: new URL("https://clipnote.co.kr"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
