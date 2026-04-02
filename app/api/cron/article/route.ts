import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SERVICES } from "@/lib/services";

export const dynamic = "force-dynamic";

// 週次で記事を生成するサービス（収益ポテンシャル高いものに絞る）
const ARTICLE_SERVICES = [
  "hojyokin", "keiyakusho", "kaigo", "iryou", "soukoku",
  "shukatsu", "konkatsu", "rougo", "keiba", "claim",
];

// CRON_SECRET認証
function authorize(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const querySecret = req.nextUrl.searchParams.get("secret");
  const secret = bearerSecret ?? querySecret;
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 今週対象のサービスを輪番で選ぶ（全部は多すぎる・コスト管理）
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const targetServiceIds = ARTICLE_SERVICES.filter(
    (_, i) => i % 4 === weekNum % 4  // 4サービスを輪番
  );

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const results: {
    serviceId: string;
    serviceName: string;
    title?: string;
    articleLength?: number;
    qiitaPosted: boolean;
    qiitaUrl?: string | null;
    status: string;
    error?: string;
  }[] = [];

  for (const serviceId of targetServiceIds) {
    const service = SERVICES.find(s => s.id === serviceId);
    if (!service) continue;

    try {
      // Qiita記事生成（Claude Haiku）
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 3000,
        messages: [{
          role: "user",
          content: `
${service.name}に関するQiita/Zenn向けの技術記事を書いてください。

条件:
- タイトル: 検索上位を狙える具体的なタイトル（「〜の使い方」「〜で解決した話」等）
- 文字数: 1500〜2500字
- 構成: タイトル、導入（課題提示）、本文（解決策・手順）、まとめ、参考リンク
- 自然な形でサービスURL（${service.url}）を本文中に1〜2回紹介
- 技術的・実用的な内容（AIの使い方、業務効率化、コスト削減等）
- マークダウン形式で出力

サービス概要: ${service.postPrompt.split('\n')[0]}
          `
        }]
      });

      const articleContent = (response.content[0] as { text: string }).text.trim();

      // タイトルを抽出（先頭の # 行）
      const titleMatch = articleContent.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : `${service.name}の使い方と活用術`;

      // Qiita APIに投稿（QIITA_ACCESS_TOKEN が設定されている場合）
      let qiitaResult: { url: string; id: string } | null = null;
      if (process.env.QIITA_ACCESS_TOKEN) {
        const qiitaRes = await fetch("https://qiita.com/api/v2/items", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.QIITA_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            body: articleContent,
            private: false,
            tags: [
              { name: "AI", versions: [] },
              { name: "業務効率化", versions: [] },
              { name: service.name.replace(/AI$/, "").trim(), versions: [] },
            ],
          }),
        });

        if (qiitaRes.ok) {
          const qiitaData = await qiitaRes.json() as { url: string; id: string };
          qiitaResult = { url: qiitaData.url, id: qiitaData.id };
        }
      }

      results.push({
        serviceId,
        serviceName: service.name,
        title,
        articleLength: articleContent.length,
        qiitaPosted: !!qiitaResult,
        qiitaUrl: qiitaResult?.url ?? null,
        status: "success",
      });

    } catch (err) {
      results.push({
        serviceId,
        serviceName: service.name,
        qiitaPosted: false,
        status: "failed",
        error: String(err),
      });
    }

    // APIレート制限対策
    await new Promise(r => setTimeout(r, 3000));
  }

  return NextResponse.json({ ok: true, results, week: weekNum });
}
