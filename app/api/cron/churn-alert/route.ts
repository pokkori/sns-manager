import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface ChurnSignal {
  userId: string;
  email: string;
  lastSignIn: string;
  usage7d: number;
  usagePrev7d: number;
  level: 1 | 2 | 3;
  reason: string;
}

async function detectChurnSignals(): Promise<ChurnSignal[]> {
  if (!supabase) return [];

  try {
    // ログイン停止7日以上 & 使用回数急減ユーザーを検出
    const { data, error } = await supabase.rpc("detect_churn_signals").select("*");
    if (error || !data) {
      // RPC未実装の場合はauth.usersを直接クエリ
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: users, error: usersError } = await supabase
        .from("subscriptions")
        .select("user_id, email, last_active_at, plan")
        .eq("status", "active")
        .lt("last_active_at", sevenDaysAgo)
        .limit(50);

      if (usersError || !users) return [];

      return users.map((u) => ({
        userId: u.user_id,
        email: u.email,
        lastSignIn: u.last_active_at,
        usage7d: 0,
        usagePrev7d: 0,
        level: 1 as const,
        reason: "ログイン停止7日以上",
      }));
    }

    return data;
  } catch {
    return [];
  }
}

function buildReEngagementEmail(signal: ChurnSignal, serviceName: string): string {
  const daysSince = Math.floor(
    (Date.now() - new Date(signal.lastSignIn).getTime()) / (1000 * 60 * 60 * 24)
  );

  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>${serviceName}からのご連絡</title></head>
<body style="margin:0;padding:0;background:#0a0a15;color:#e5e7eb;font-family:sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:32px 16px;">
    <h1 style="font-size:20px;font-weight:900;color:#60a5fa;margin-bottom:8px;">${serviceName}でお力になれることはありますか？</h1>
    <p style="color:#9ca3af;font-size:14px;line-height:1.7;margin-bottom:20px;">
      こんにちは。最近${daysSince}日間ご利用がないことに気づきました。<br>
      何かご不明な点や改善してほしい点がございましたら、ぜひお聞かせください。
    </p>
    ${signal.level >= 2 ? `<div style="background:#1e3a5f;border-radius:12px;padding:16px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#93c5fd;">使い方が分からない場合は、チュートリアルをご確認ください。</p>
    </div>` : ""}
    <a href="https://sns-manager.vercel.app/tool" style="display:inline-block;background:#3b82f6;color:white;font-weight:bold;padding:14px 28px;border-radius:10px;text-decoration:none;font-size:14px;">再開する</a>
    <p style="font-size:11px;color:#374151;margin-top:32px;">このメールはサービス向上のために送信しています。</p>
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

  const signals = await detectChurnSignals();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const serviceName = process.env.SERVICE_NAME ?? "SNS自動投稿管理";

  const results: Array<{ email: string; level: number; sent: boolean; error?: string }> = [];

  for (const signal of signals.slice(0, 20)) {
    try {
      const html = buildReEngagementEmail(signal, serviceName);
      await resend.emails.send({
        from: `${serviceName} <noreply@resend.dev>`,
        to: signal.email,
        subject: `${serviceName}でお力になれることはありますか？`,
        html,
      });
      results.push({ email: signal.email, level: signal.level, sent: true });
    } catch (err) {
      results.push({
        email: signal.email,
        level: signal.level,
        sent: false,
        error: err instanceof Error ? err.message : "Unknown",
      });
    }
  }

  // Admin summary
  if (process.env.REPORT_EMAIL_TO && signals.length > 0) {
    await resend.emails.send({
      from: `チャーン監視 <noreply@resend.dev>`,
      to: process.env.REPORT_EMAIL_TO,
      subject: `【チャーン検知】${signals.length}名にリテンションメール送信 — ${new Date().toLocaleDateString("ja-JP")}`,
      html: `<p>チャーン予備軍 ${signals.length}名 / 送信完了 ${results.filter((r) => r.sent).length}名</p>
             <pre style="font-family:monospace;font-size:12px;">${JSON.stringify(results, null, 2)}</pre>`,
    }).catch(() => {/* admin email failure is non-critical */});
  }

  return NextResponse.json({ detected: signals.length, sent: results.filter((r) => r.sent).length, results });
}
