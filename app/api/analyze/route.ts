import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const FREE_LIMIT = 3;

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const isPremium = cookieStore.get("stripe_premium")?.value === "1";

  let usedCount = 0;
  if (!isPremium) {
    usedCount = parseInt(cookieStore.get("free_uses")?.value ?? "0", 10);
    if (usedCount >= FREE_LIMIT) {
      return NextResponse.json({ error: "無料回数を使い切りました" }, { status: 402 });
    }
  }

  const { line, context } = await req.json();
  if (!line?.trim()) {
    return NextResponse.json({ error: "LINEの内容を入力してください" }, { status: 400 });
  }

  const prompt = `あなたは男性向け恋愛コーチAIです。以下のLINEの会話内容を分析して、好きな子の気持ちと脈あり度を診断し、具体的なアドバイスをしてください。

【LINEの内容】
${line}

${context ? `【関係性・状況】\n${context}` : ""}

以下の形式で必ず回答してください：

===SCORE===
[脈あり度を0〜100の数値のみで記載。例：73]

===ANALYSIS===
[相手の心理・気持ちの分析を200〜300文字で記載。言葉の選び方・返信速度・絵文字の使い方・会話の展開などの具体的な根拠を挙げること]

===REPLIES===
1. [距離を縮める積極的な返信（1〜2文）]
2. [自然に関係を深める返信（1〜2文）]
3. [余韻を残しつつ次につなげる返信（1〜2文）]

===CONFESSION===
[告白文テンプレート。LINE告白文・直接告白用・電話告白用の3パターンをそれぞれ「LINE:」「直接:」「電話:」で始めて記載。それぞれ2〜3文]

===TIMING===
[告白のベストタイミングを「今すぐ」「〇週間後」「もう少し仲良くなってから」などの具体的な判断と、そのタイミングの理由・準備すべきことを200文字以内で記載]

===ADVICE===
[今後の関係をどう発展させるか、次にとるべきアクションを具体的に150〜200文字で記載]`;

  try {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const result = (response.content[0] as { text: string }).text;

    const res = NextResponse.json({
      result,
      remaining: isPremium ? null : FREE_LIMIT - (usedCount + 1),
    });

    if (!isPremium) {
      res.cookies.set("free_uses", String(usedCount + 1), {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }

    return res;
  } catch {
    return NextResponse.json({ error: "AI分析中にエラーが発生しました" }, { status: 500 });
  }
}
