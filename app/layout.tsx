import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://sns-auto-post.vercel.app";

export const metadata: Metadata = {
  title: "SNS自動投稿管理 | pokkori services",
  description: "複数サービスのSNS投稿を自動生成・スケジュール管理するダッシュボード。X（旧Twitter）・TikTok台本の一元管理。",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "SNS自動投稿管理",
    description: "複数サービスのSNS投稿を自動生成・スケジュール管理するダッシュボード。",
    url: SITE_URL,
    siteName: "SNS自動投稿管理",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "SNS自動投稿管理",
    description: "複数サービスのSNS投稿を自動生成・スケジュール管理するダッシュボード。",
  },
  robots: { index: true, follow: true },
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "ホーム", "item": SITE_URL },
    { "@type": "ListItem", "position": 2, "name": "SNS自動投稿管理ツール", "item": `${SITE_URL}/dashboard` },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "SNS自動投稿管理",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "複数サービスのSNS投稿を自動生成・スケジュール管理するダッシュボード。X（旧Twitter）・TikTok台本の一元管理。",
  "url": "https://sns-auto-post.vercel.app",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "JPY",
    "description": "無料で利用可能"
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
