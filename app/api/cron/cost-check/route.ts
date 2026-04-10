import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

interface CostAlert {
  service: string;
  level: "normal" | "warning" | "critical";
  value: string;
  message: string;
}

/** Anthropic Usage API (beta) で当日コストを取得 */
async function getAnthropicDailyCost(): Promise<number | null> {
  const adminKey = process.env.ANTHROPIC_ADMIN_API_KEY;
  if (!adminKey) return null;

  try {
    const today = new Date();
    const startDate = today.toISOString().slice(0, 10);
    const resp = await fetch(
      `https://api.anthropic.com/v1/organizations/costs?start_date=${startDate}&end_date=${startDate}`,
      {
        headers: {
          "x-api-key": adminKey,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "usage-1",
        },
      }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    return typeof data?.total_cost === "number" ? data.total_cost : null;
  } catch {
    return null;
  }
}

function buildAlertHtml(alerts: CostAlert[], date: string): string {
  const hasCritical = alerts.some((a) => a.level === "critical");
  const hasWarning = alerts.some((a) => a.level === "warning");
  const statusColor = hasCritical ? "#ef4444" : hasWarning ? "#f59e0b" : "#34d399";
  const statusLabel = hasCritical ? "緊急" : hasWarning ? "警告" : "正常";

  const rows = alerts
    .map((a) => {
      const color = a.level === "critical" ? "#ef4444" : a.level === "warning" ? "#f59e0b" : "#34d399";
      return `<tr style="border-bottom:1px solid #1f2937;">
        <td style="padding:10px 12px;font-weight:bold;color:#e5e7eb;">${a.service}</td>
        <td style="padding:10px 12px;color:${color};font-weight:bold;">${a.level.toUpperCase()}</td>
        <td style="padding:10px 12px;color:#9ca3af;">${a.value}</td>
        <td style="padding:10px 12px;color:#6b7280;font-size:12px;">${a.message}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>コスト監視レポート ${date}</title></head>
<body style="margin:0;padding:0;background:#0a0a15;color:#e5e7eb;font-family:sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
    <h1 style="font-size:20px;font-weight:900;color:${statusColor};margin-bottom:4px;">
      インフラコスト監視 [${statusLabel}] — ${date}
    </h1>
    <p style="color:#6b7280;font-size:13px;margin-top:0;margin-bottom:24px;">自動コストスパイク検知レポート（毎朝 06:30 JST）</p>

    <table style="width:100%;border-collapse:collapse;background:#111827;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <thead>
        <tr style="background:#1f2937;">
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9ca3af;">サービス</th>
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9ca3af;">ステータス</th>
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9ca3af;">現在値</th>
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9ca3af;">メモ</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    ${hasCritical ? `<div style="background:#7f1d1d;border:1px solid #ef4444;border-radius:12px;padding:16px;margin-bottom:16px;">
      <p style="margin:0;font-weight:bold;color:#fca5a5;">緊急アクションが必要です。cfo-analyst に詳細分析を依頼してください。</p>
    </div>` : ""}

    <div style="background:#111827;border:1px solid #1f2937;border-radius:12px;padding:16px;">
      <p style="margin:0;font-size:12px;color:#6b7280;">閾値設定: Anthropic API &gt;$15/日=警告/$25/日=緊急 | Supabase &gt;$40/月=警告/$60/月=緊急 | Vercel &gt;$35/月=警告/$50/月=緊急</p>
    </div>

    <p style="font-size:11px;color:#374151;text-align:center;margin-top:24px;">コスト監視システム 自動送信 — ANTHROPIC_ADMIN_API_KEY未設定の場合は手動入力値を表示</p>
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

  const today = new Date().toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" });
  const alerts: CostAlert[] = [];

  // Anthropic daily cost check
  const anthropicCost = await getAnthropicDailyCost();
  if (anthropicCost !== null) {
    const level = anthropicCost >= 25 ? "critical" : anthropicCost >= 15 ? "warning" : "normal";
    alerts.push({
      service: "Anthropic API",
      level,
      value: `$${anthropicCost.toFixed(2)}/日`,
      message: level === "critical" ? "即時対応: ループバグ/opus誤用を確認" : level === "warning" ? "Prompt Caching適用状況を確認" : "正常範囲",
    });
  } else {
    // No admin key — add placeholder
    alerts.push({
      service: "Anthropic API",
      level: "normal",
      value: "取得不可",
      message: "ANTHROPIC_ADMIN_API_KEY未設定。手動でconsole.anthropic.comを確認",
    });
  }

  // Supabase / Vercel — placeholder (no billing API without special tokens)
  alerts.push({
    service: "Supabase",
    level: "normal",
    value: "手動確認",
    message: "supabase.com/dashboard/org/billing で月次確認",
  });
  alerts.push({
    service: "Vercel",
    level: "normal",
    value: "手動確認",
    message: "vercel.com/account/billing で月次確認",
  });

  const hasCritical = alerts.some((a) => a.level === "critical");
  const hasWarning = alerts.some((a) => a.level === "warning");
  const subject = hasCritical
    ? `【緊急】コストスパイク検知 — ${today}`
    : hasWarning
    ? `【警告】コスト上昇 — ${today}`
    : `【正常】コスト日次サマリー — ${today}`;

  const html = buildAlertHtml(alerts, today);

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "コスト監視 <noreply@resend.dev>",
      to: process.env.REPORT_EMAIL_TO,
      subject,
      html,
    });

    return NextResponse.json({ ok: true, alerts, hasCritical, hasWarning });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error }, { status: 500 });
  }
}
