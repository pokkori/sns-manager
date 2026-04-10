import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

// P6月次レビュープリセット: competitive-analyst + cfo-analyst → service-improver
// 毎月1日 09:00 JST (UTC 00:00) に実行
// このCRONは月次レビューのリマインダーメールを送信し、レビュー実施を促す

const MONTHLY_REVIEW_CHECKLIST = [
  "1. competitive-analyst を起動して主要5サービスの競合状況を確認",
  "2. cfo-analyst を起動してMRR/ARPU/チャーン率を分析",
  "3. service-improver を起動してROI順の改善優先リストを生成",
  "4. 上位3施策をgambling-kpi.mjs --sim で効果シミュレーション",
  "5. 次月の実装ロードマップをproject_ongoing_improvements_2026.mdに記録",
];

function buildReviewEmailHtml(month: string): string {
  const checkItems = MONTHLY_REVIEW_CHECKLIST.map(
    (item) => `<li style="padding:8px 0;border-bottom:1px solid #1f2937;color:#e5e7eb;">${item}</li>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>月次P6レビュー開始 ${month}</title></head>
<body style="margin:0;padding:0;background:#0a0a15;color:#e5e7eb;font-family:sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <h1 style="font-size:20px;font-weight:900;color:#818cf8;margin-bottom:4px;">月次P6レビュー開始 — ${month}</h1>
    <p style="color:#6b7280;font-size:13px;margin-top:0;margin-bottom:24px;">毎月1日の自動リマインダー（P6プリセット）</p>

    <div style="background:#111827;border:1px solid #312e81;border-radius:12px;padding:20px;margin-bottom:24px;">
      <h2 style="font-size:14px;font-weight:700;color:#818cf8;margin-top:0;margin-bottom:12px;">今月の実施チェックリスト</h2>
      <ol style="margin:0;padding-left:20px;">${checkItems}</ol>
    </div>

    <div style="background:#111827;border:1px solid #1f2937;border-radius:12px;padding:16px;">
      <p style="margin:0;font-size:12px;color:#6b7280;">
        Claude Code で以下を実行してレビューを開始:<br>
        <code style="color:#34d399;font-family:monospace;">「月次P6レビューを開始して」</code>
      </p>
    </div>

    <p style="font-size:11px;color:#374151;text-align:center;margin-top:24px;">P6月次レビュー自動リマインダー — 毎月1日 09:00 JST</p>
  </div>
</body>
</html>`;
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const querySecret = req.nextUrl.searchParams.get("secret");
  const secret = bearerSecret ?? querySecret;
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY || !process.env.REPORT_EMAIL_TO) {
    return NextResponse.json({ error: "RESEND_API_KEY or REPORT_EMAIL_TO not configured" }, { status: 500 });
  }

  const now = new Date();
  const month = `${now.getFullYear()}年${now.getMonth() + 1}月`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "月次レビュー <noreply@resend.dev>",
      to: process.env.REPORT_EMAIL_TO,
      subject: `【月次P6レビュー】${month}の改善施策レビューを開始してください`,
      html: buildReviewEmailHtml(month),
    });

    return NextResponse.json({ ok: true, month });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error }, { status: 500 });
  }
}
