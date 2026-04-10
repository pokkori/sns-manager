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

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "SNS自動投稿管理とは何ができますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "X（旧Twitter）・TikTok台本の投稿文をAIが自動生成し、スケジュール管理・一括投稿ができるダッシュボードです。複数サービスの投稿を一元管理し、週次レポートで効果測定もできます。"
      }
    },
    {
      "@type": "Question",
      "name": "どのSNSに対応していますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "X（旧Twitter）への直接投稿と、TikTok台本の自動生成に対応しています。AIがサービスの内容に合わせた最適な投稿文を生成します。"
      }
    },
    {
      "@type": "Question",
      "name": "無料で使えますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "基本機能は無料でご利用いただけます。X投稿にはTwitter APIキーの設定が必要です。"
      }
    },
  ]
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
