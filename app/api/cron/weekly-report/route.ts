import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getLogs } from "@/lib/store";

export const dynamic = "force-dynamic";

const REPORT_TO = "timbercharlotte@icloud.com";

function fmt(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function buildHtml(params: {
  dateRange: string;
  totalPosts: number;
  errorCount: number;
  errorRate: string;
  byService: Array<{ name: string; posts: number; errors: number }>;
}): string {
  const { dateRange, totalPosts, errorCount, errorRate, byService } = params;

  const rows = byService
    .map(
      (s) => `
    <tr style="border-bottom:1px solid #1f2937;">
      <td style="padding:8px 12px;">${s.name}</td>
      <td style="padding:8px 12px;text-align:right;color:#34d399;">${s.posts}</td>
      <td style="padding:8px 12px;text-align:right;color:${s.errors > 0 ? "#ef4444" : "#6b7280"};">${s.errors}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>SNS週次レポート</title></head>
<body style="margin:0;padding:0;background:#0a0a15;color:#e5e7eb;font-family:sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <h1 style="font-size:20px;font-weight:900;color:#93c5fd;margin-bottom:4px;">SNS自動投稿 週次レポート</h1>
    <p style="color:#6b7280;font-size:13px;margin-top:0;margin-bottom:24px;">${dateRange}</p>

    <div style="display:flex;gap:12px;margin-bottom:24px;">
      <div style="flex:1;background:#111827;border:1px solid #1f2937;border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:30px;font-weight:900;color:#34d399;">${totalPosts}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">投稿数</div>
      </div>
      <div style="flex:1;background:#111827;border:1px solid #1f2937;border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:30px;font-weight:900;color:${errorCount > 0 ? "#ef4444" : "#34d399"};">${errorCount}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">エラー数</div>
      </div>
      <div style="flex:1;background:#111827;border:1px solid #1f2937;border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:30px;font-weight:900;color:${parseFloat(errorRate) >= 20 ? "#f59e0b" : "#34d399"};">${errorRate}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">エラー率</div>
      </div>
    </div>

    <h2 style="font-size:15px;font-weight:700;margin-bottom:10px;">サービス別</h2>
    <table style="width:100%;border-collapse:collapse;background:#111827;border-radius:10px;overflow:hidden;margin-bottom:24px;">
      <thead>
        <tr style="background:#1f2937;">
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#9ca3af;">サービス</th>
          <th style="padding:8px 12px;text-align:right;font-size:12px;color:#9ca3af;">成功</th>
          <th style="padding:8px 12px;text-align:right;font-size:12px;color:#9ca3af;">エラー</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <p style="font-size:11px;color:#374151;text-align:center;">SNS自動投稿管理システム 自動送信</p>
  </div>
</body>
</html>`;
}

export async function GET(req: NextRequest) {
  // CRONシークレット検証
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

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    const allLogs = await getLogs();
    const weekLogs = allLogs.filter((l) => new Date(l.createdAt) >= sevenDaysAgo);

    const totalPosts = weekLogs.filter((l) => l.status === "success").length;
    const errorCount = weekLogs.filter((l) => l.status === "failed").length;
    const total = weekLogs.length;
    const errorRate = total > 0
      ? `${Math.round((errorCount / total) * 1000) / 10}%`
      : "0%";

    // サービス別集計
    const serviceMap: Record<string, { name: string; posts: number; errors: number }> = {};
    for (const log of weekLogs) {
      if (!serviceMap[log.serviceId]) {
        serviceMap[log.serviceId] = { name: log.serviceName, posts: 0, errors: 0 };
      }
      if (log.status === "success") serviceMap[log.serviceId].posts += 1;
      if (log.status === "failed") serviceMap[log.serviceId].errors += 1;
    }
    const byService = Object.values(serviceMap).sort((a, b) => b.posts - a.posts);

    const dateRange = `${fmt(sevenDaysAgo)} 〜 ${fmt(now)}`;
    const html = buildHtml({ dateRange, totalPosts, errorCount, errorRate, byService });

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "SNS自動投稿 <noreply@resend.dev>",
      to: REPORT_TO,
      subject: `【SNS週次レポート】${dateRange} / 投稿${totalPosts}件・エラー${errorCount}件`,
      html,
    });

    return NextResponse.json({ ok: true, totalPosts, errorCount, errorRate, emailSent: REPORT_TO });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error }, { status: 500 });
  }
}
