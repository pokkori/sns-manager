import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getServiceById } from "@/lib/services";

export const dynamic = "force-dynamic";

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

export async function POST(req: NextRequest) {
  const { serviceId, platform = "x" } = await req.json();
  const service = getServiceById(serviceId);
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  let prompt = service.postPrompt;
  if (platform === "tiktok_script") {
    prompt = `TikTok動画の台本を作成してください。サービス: ${service.name} (${service.url})
${service.postPrompt.split("X(Twitter)投稿")[1] ?? service.postPrompt}

TikTok用に以下の構成で30秒の台本を作成:
【フック（0〜3秒）】: 最初の一言（視聴者を止める強いキャッチ）
【本編（3〜25秒）】: サービスの価値・使い方を具体的に
【CTA（25〜30秒）】: 「プロフのリンクから試してみて」など

台本のセリフをそのまま返す。ナレーションとして読み上げられる形式で。`;
  }

  try {
    const response = await getAnthropic().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = (response.content[0] as { text: string }).text.trim();
    // Convert literal \n to actual newlines
    const text = raw.replace(/\\n/g, "\n");
    return NextResponse.json({ text, serviceId, platform });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "生成に失敗しました" }, { status: 500 });
  }
}
