import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CB Control Center",
  description: "Business transformation pipeline — Crawl, validate, strategize, and publish business-ready assets from one control layer.",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
