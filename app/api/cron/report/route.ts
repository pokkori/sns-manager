import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getLogs, getServiceStats } from "@/lib/store";

export const dynamic = "force-dynamic";

function buildEmailHtml(params: {
  dateRange: string;
  totalPosts: number;
  totalEngagement: number;
  topServices: Array<{
    rank: number;
    serviceName: string;
    totalPosts: number;
    avgEngagement: number;
    totalEngagement: number;
  }>;
  lowPerformers: Array<{ serviceName: string; totalPosts: number }>;
}): string {
  const { dateRange, totalPosts, totalEngagement, topServices, lowPerformers } = params;

  const topRows = topServices
    .map(
      (s) => `
    <tr style="border-bottom:1px solid #333;">
      <td style="padding:8px 12px;color:#aaa;">${s.rank}</td>
      <td style="padding:8px 12px;font-weight:bold;">${s.serviceName}</td>
      <td style="padding:8px 12px;text-align:right;">${s.totalPosts}</td>
      <td style="padding:8px 12px;text-align:right;">${s.avgEngagement.toFixed(1)}</td>
      <td style="padding:8px 12px;text-align:right;">${s.totalEngagement}</td>
    </tr>`
    )
    .join("");

  const lowRows =
    lowPerformers.length > 0
      ? lowPerformers.map((s) => `<li style="color:#ef4444;">${s.serviceName}（${s.totalPosts}件投稿）</li>`).join("")
      : "<li style='color:#6b7280;'>なし</li>";

  return `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>SNS自動投稿 週次レポート</title></head>
<body style="margin:0;padding:0;background:#0a0a15;color:#e5e7eb;font-family:sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
    <h1 style="font-size:22px;font-weight:900;color:#93c5fd;margin-bottom:4px;">SNS自動投稿 週次レポート</h1>
    <p style="color:#6b7280;font-size:14px;margin-top:0;margin-bottom:24px;">${dateRange}</p>

    <div style="display:flex;gap:16px;margin-bottom:24px;">
      <div style="flex:1;background:#111827;border:1px solid #1f2937;border-radius:12px;padding:16px;text-align:center;">
        <div style="font-size:32px;font-weight:900;color:#34d399;">${totalPosts}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">今週の総投稿数</div>
      </div>
      <div style="flex:1;background:#111827;border:1px solid #1f2937;border-radius:12px;padding:16px;text-align:center;">
        <div style="font-size:32px;font-weight:900;color:#60a5fa;">${totalEngagement}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">総エンゲージメント</div>
      </div>
    </div>

    <h2 style="font-size:16px;font-weight:700;color:#e5e7eb;margin-bottom:12px;">サービス別エンゲージメント TOP10</h2>
    <table style="width:100%;border-collapse:collapse;background:#111827;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <thead>
        <tr style="background:#1f2937;">
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9ca3af;">順位</th>
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9ca3af;">サービス名</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#9ca3af;">投稿数</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#9ca3af;">平均EG</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#9ca3af;">累計EG</th>
        </tr>
      </thead>
      <tbody>${topRows}</tbody>
    </table>

    <h2 style="font-size:16px;font-weight:700;color:#e5e7eb;margin-bottom:8px;">低パフォーマンスサービス</h2>
    <p style="font-size:12px;color:#6b7280;margin-bottom:8px;">エンゲージメント0件が多いサービス（投稿内容・時間帯の見直しを推奨）</p>
    <ul style="background:#111827;border:1px solid #1f2937;border-radius:12px;padding:16px 16px 16px 32px;margin:0 0 24px;">
      ${lowRows}
    </ul>

    <p style="font-size:12px;color:#374151;text-align:center;">SNS自動投稿管理システム 自動送信レポート</p>
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

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }
  if (!process.env.REPORT_EMAIL_TO) {
    return NextResponse.json({ error: "REPORT_EMAIL_TO not configured" }, { status: 500 });
  }

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const logs = await getLogs();
    const weekLogs = logs.filter(
      (l) => l.status === "success" && new Date(l.createdAt) >= sevenDaysAgo
    );

    const totalPosts = weekLogs.length;
    const totalEngagement = weekLogs.reduce(
      (sum, l) => sum + (l.metrics?.engagementScore ?? 0),
      0
    );

    const allStats = await getServiceStats();

    // TOP10 by totalEngagement
    const topServices = [...allStats]
      .sort((a, b) => b.totalEngagement - a.totalEngagement)
      .slice(0, 10)
      .map((s, idx) => ({ rank: idx + 1, ...s }));

    // Low performers: posted at least once but engagementScore = 0
    const lowPerformers = allStats.filter(
      (s) => s.totalPosts > 0 && s.totalEngagement === 0
    );

    // Date range string
    const fmt = (d: Date) =>
      `${d.getMonth() + 1}/${d.getDate()}`;
    const dateRange = `${fmt(sevenDaysAgo)} 〜 ${fmt(now)}`;

    const html = buildEmailHtml({
      dateRange,
      totalPosts,
      totalEngagement,
      topServices,
      lowPerformers,
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "SNS自動投稿 <noreply@resend.dev>",
      to: process.env.REPORT_EMAIL_TO,
      subject: `【SNS自動投稿】週次レポート - ${dateRange}`,
      html,
    });

    return NextResponse.json({ ok: true, emailSent: true, totalPosts, totalEngagement });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error }, { status: 500 });
  }
}
