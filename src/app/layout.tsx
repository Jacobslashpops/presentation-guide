import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CelePulse — Influencer Management",
  description: "红人管理与付款系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
