import type { Metadata } from "next";
import "./globals.css";
import Provider from "@/components/Provider";

export const metadata: Metadata = {
  title: "yomitoku｜法律・契約・規約をやさしく読み解く",
  description: "日常の疑問に関係する法律や、わかりにくい契約・規約を、AIが根拠とともに整理する学習用Webアプリ",
  // 授業の一環のため、検索エンジンには載せない（実ユーザーの相談データ保護も兼ねる）。
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  );
}
