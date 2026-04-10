import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface MrrRow {
  service_name: string;
  month: string;
  mrr: number;
  active_customers: number;
  arpu: number;
}

function buildMrrHtml(rows: MrrRow[], date: string, totalMrr: number): string {
  const serviceRows = rows
    .slice(0, 10)
    .map(
      (r, i) => `<tr style="border-bottom:1px solid #1f2937;">
      <td style="padding:8px 12px;color:#aaa;">${i + 1}</td>
      <td style="padding:8px 12px;font-weight:bold;color:#e5e7eb;">${r.service_name}</td>
      <td style="padding:8px 12px;text-align:right;color:#34d399;">¥${r.mrr.toLocaleString()}</td>
      <td style="padding:8px 12px;text-align:right;color:#9ca3af;">${r.active_customers}</td>
      <td style="padding:8px 12px;text-align:right;color:#6b7280;">¥${r.arpu?.toLocaleString() ?? "-"}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>KOMOJU MRRレポート ${date}</title></head>
<body style="margin:0;padding:0;background:#0a0a15;color:#e5e7eb;font-family:sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
    <h1 style="font-size:20px;font-weight:900;color:#34d399;margin-bottom:4px;">KOMOJU収益 日次レポート</h1>
    <p style="color:#6b7280;font-size:13px;margin-top:0;margin-bottom:24px;">${date}</p>

    <div style="background:#111827;border:1px solid #1f2937;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <div style="font-size:36px;font-weight:900;color:#34d399;">¥${totalMrr.toLocaleString()}</div>
      <div style="font-size:13px;color:#6b7280;margin-top:4px;">今月累計MRR（全サービス合計）</div>
    </div>

    <table style="width:100%;border-collapse:collapse;background:#111827;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <thead>
        <tr style="background:#1f2937;">
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9ca3af;">#</th>
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9ca3af;">サービス</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#9ca3af;">MRR</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#9ca3af;">顧客数</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#9ca3af;">ARPU</th>
        </tr>
      </thead>
      <tbody>${serviceRows || '<tr><td colspan="5" style="padding:20px;text-align:center;color:#6b7280;">データなし（KOMOJU決済待ち）</td></tr>'}</tbody>
    </table>

    <p style="font-size:11px;color:#374151;text-align:center;">komoju-revenue-tracker 自動送信 — 毎朝08:00 JST</p>
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

  const date = new Date().toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" });
  let rows: MrrRow[] = [];
  let totalMrr = 0;

  if (supabase) {
    try {
      const { data } = await supabase.from("monthly_mrr").select("*").limit(20);
      rows = (data as MrrRow[]) ?? [];
      totalMrr = rows.reduce((sum, r) => sum + (r.mrr ?? 0), 0);
    } catch {
      // Supabase query failure — send empty report
    }
  }

  const html = buildMrrHtml(rows, date, totalMrr);

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "KOMOJU収益 <noreply@resend.dev>",
      to: process.env.REPORT_EMAIL_TO,
      subject: `KOMOJU MRRレポート ¥${totalMrr.toLocaleString()} — ${date}`,
      html,
    });

    return NextResponse.json({ ok: true, totalMrr, serviceCount: rows.length });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error }, { status: 500 });
  }
}
