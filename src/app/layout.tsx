import type { Metadata } from "next";
import "./globals.css";
import Provider from "@/components/Provider";

export const metadata: Metadata = {
  title: "法律ナビ v1",
  description: "日常の疑問に関連する法律をAIが分析し、わかりやすく解説する学習用Webアプリ",
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
          href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap"
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
