import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://sns-auto-post.vercel.app";

export const metadata: Metadata = {
  title: "SNS自動投稿管理 | X・TikTok投稿を自動生成・スケジュール管理",
  description: "複数サービスのSNS投稿を自動生成・スケジュール管理するダッシュボード。X（旧Twitter）・TikTok台本の一元管理。AIが最適な投稿文を自動生成します。",
  keywords: ["SNS自動投稿", "X自動投稿", "TikTok台本生成", "SNSマーケティング", "投稿スケジュール管理", "AI投稿生成"],
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "SNS自動投稿管理 | X・TikTok投稿を自動生成",
    description: "複数サービスのSNS投稿を自動生成・スケジュール管理するダッシュボード。X（旧Twitter）・TikTok台本の一元管理。",
    url: SITE_URL,
    siteName: "SNS自動投稿管理",
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "SNS自動投稿管理 - X・TikTok投稿を自動生成・スケジュール管理",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SNS自動投稿管理 | X・TikTok投稿を自動生成",
    description: "複数サービスのSNS投稿を自動生成・スケジュール管理するダッシュボード。",
    images: [`${SITE_URL}/opengraph-image`],
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
