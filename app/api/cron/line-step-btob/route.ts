import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN_BTOB ?? process.env.LINE_CHANNEL_ACCESS_TOKEN;

// 介護カスハラAI BtoB 7日間シナリオ
const BTOB_SCENARIO: Record<number, Array<{ type: string; text: string }>> = {
  1: [{ type: "text", text: "おはようございます。介護カスハラAIです。\n\n2026年10月まで約5ヶ月。改正労働施策総合推進法 第30条の7により、全介護事業者にカスハラ対策義務化が迫っています。\n\n未対応のリスク: 行政指導→勧告→社名公表\n\nIT導入補助金2026（補助率4/5）で月¥5,960から導入可能です。\n\n明日は補助金試算をご案内します。" }],
  2: [{ type: "text", text: "おはようございます。介護カスハラAIです。\n\n月¥29,800が高いと感じていませんか？\n\nIT導入補助金2026: 補助率4/5・上限450万円\n年間費用¥357,600 → 補助¥286,080 → 実質¥71,520/年 = 月¥5,960\n\n東京都の施設はさらに最大64万円の上乗せ補助あり。\n補助金詳細を個別に試算します。施設の所在地を教えてください。" }],
  3: [{ type: "text", text: "おはようございます。介護カスハラAIです。\n\n介護カスハラAIの流れ:\n①入力30秒→②AI分析30秒→③警告書完成\n\n「警告書を1枚送ったらクレームがピタリと止まった」\n（東京都・特別養護老人ホーム施設長）\n\n実際の画面をご確認ください→ https://kaigo-custharass-ai.vercel.app" }],
  4: [{ type: "text", text: "おはようございます。介護カスハラAIです。\n\n【事例】神奈川県・通所介護（職員18名）\nIT導入補助金活用で実質¥5,960/月で導入。2ヶ月の記録蓄積後、警告書送付で即日解決。「弁護士を使わずに解決できた」\n\n14日間完全無料体験（カード登録不要）→ https://kaigo-custharass-ai.vercel.app" }],
  5: [{ type: "text", text: "おはようございます。介護カスハラAIです。\n\n【期間限定】先着20施設・14日間完全無料体験\nカード登録不要。期間後の自動課金なし。\n\n全機能が使えます:\n✓ カスハラ記録・管理\n✓ 警告書自動生成\n✓ 義務化対応チェック\n✓ IT導入補助金申請サポート\n\n→ https://kaigo-custharass-ai.vercel.app" }],
  6: [{ type: "text", text: "おはようございます。介護カスハラAIです。\n\n1週間ご覧いただきありがとうございました。\n\n【30分無料オンライン商談】補助金試算・導入スケジュール説明\n→ https://kaigo-custharass-ai.vercel.app/contact\n\n【今すぐ14日間無料体験】\n→ https://kaigo-custharass-ai.vercel.app\n\n2026年10月まで5ヶ月。今月中に動いた施設が補助金を最大活用できます。" }],
};

async function pushLineMessage(userId: string, messages: Array<{ type: string; text: string }>) {
  if (!LINE_TOKEN) return false;
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_TOKEN}`,
      },
      body: JSON.stringify({ to: userId, messages }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const querySecret = req.nextUrl.searchParams.get("secret");
  const secret = bearerSecret ?? querySecret;
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabase) return NextResponse.json({ error: "no supabase" }, { status: 500 });
  if (!LINE_TOKEN) return NextResponse.json({ error: "LINE_CHANNEL_ACCESS_TOKEN not set" }, { status: 500 });

  const { data: users, error } = await supabase
    .from("line_step_users")
    .select("*")
    .eq("app_id", "kaigo-btob")
    .eq("active", true);

  if (error || !users) return NextResponse.json({ sent: 0, error: error?.message });

  const now = new Date();
  let sent = 0;
  let skipped = 0;

  for (const user of users) {
    const registeredAt = new Date((user.registered_at ?? user.created_at) as string);
    const daysSince = Math.floor((now.getTime() - registeredAt.getTime()) / 86400000);
    const scenario = BTOB_SCENARIO[daysSince];

    if (!scenario) { skipped++; continue; }

    const ok = await pushLineMessage(user.line_user_id as string, scenario);
    if (ok) {
      sent++;
      // step更新
      await supabase
        .from("line_step_users")
        .update({ step: daysSince, updated_at: now.toISOString() })
        .eq("line_user_id", user.line_user_id)
        .eq("app_id", "kaigo-btob");

      // DAY6で配信完了→inactive化
      if (daysSince >= 6) {
        await supabase
          .from("line_step_users")
          .update({ active: false })
          .eq("line_user_id", user.line_user_id)
          .eq("app_id", "kaigo-btob");
      }
    }
  }

  return NextResponse.json({ sent, skipped, total: users.length });
}
