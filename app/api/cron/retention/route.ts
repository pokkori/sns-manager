import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getServiceStats } from '@/lib/store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Vercel Cron認証
  const authHeader = request.headers.get('authorization')
  const bearerSecret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const secret = bearerSecret
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY || !process.env.REPORT_EMAIL_TO) {
    return NextResponse.json({
      skipped: true,
      reason: 'RESEND_API_KEY or REPORT_EMAIL_TO not set',
    })
  }

  try {
    const stats = await getServiceStats()
    const activeStats = stats.filter((s) => s.totalPosts > 0)

    const topServices = [...activeStats]
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 5)

    const lowServices = [...activeStats]
      .sort((a, b) => a.avgEngagement - b.avgEngagement)
      .slice(0, 3)

    const topRows = topServices
      .map(
        (s, i) => `
      <tr style="border-bottom:1px solid #1f2937;">
        <td style="padding:8px 12px;color:#9ca3af;">${i + 1}</td>
        <td style="padding:8px 12px;font-weight:bold;color:#e5e7eb;">${s.serviceName}</td>
        <td style="padding:8px 12px;text-align:right;color:#34d399;">${s.avgEngagement.toFixed(1)}</td>
        <td style="padding:8px 12px;text-align:right;color:#9ca3af;">${s.totalPosts}</td>
      </tr>`
      )
      .join('')

    const lowRows = lowServices
      .map(
        (s) => `
      <tr style="border-bottom:1px solid #1f2937;">
        <td style="padding:8px 12px;color:#e5e7eb;">${s.serviceName}</td>
        <td style="padding:8px 12px;text-align:right;color:#ef4444;">${s.avgEngagement.toFixed(1)}</td>
        <td style="padding:8px 12px;color:#6b7280;">ハッシュタグ・投稿時間の見直しを推奨</td>
      </tr>`
      )
      .join('')

    const dateStr = new Date().toLocaleDateString('ja-JP')

    const html = `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>SNS投稿 週次改善提案</title></head>
<body style="margin:0;padding:0;background:#0a0a15;color:#e5e7eb;font-family:sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
    <h1 style="font-size:22px;font-weight:900;color:#93c5fd;margin-bottom:4px;">SNS自動投稿 週次改善提案レポート</h1>
    <p style="color:#6b7280;font-size:14px;margin-top:0;margin-bottom:24px;">${dateStr}</p>

    <h2 style="font-size:16px;font-weight:700;color:#e5e7eb;margin-bottom:12px;">高エンゲージメント TOP5 — 継続強化推奨</h2>
    <table style="width:100%;border-collapse:collapse;background:#111827;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <thead>
        <tr style="background:#1f2937;">
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9ca3af;">順位</th>
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9ca3af;">サービス</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#9ca3af;">平均EG</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#9ca3af;">投稿数</th>
        </tr>
      </thead>
      <tbody>${topRows || '<tr><td colspan="4" style="padding:12px;color:#6b7280;text-align:center;">データなし</td></tr>'}</tbody>
    </table>

    <h2 style="font-size:16px;font-weight:700;color:#e5e7eb;margin-bottom:8px;">低エンゲージメント TOP3 — 改善提案</h2>
    <p style="font-size:12px;color:#6b7280;margin-bottom:8px;">エンゲージメントが低いサービスの改善アクションを確認してください。</p>
    <table style="width:100%;border-collapse:collapse;background:#111827;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <thead>
        <tr style="background:#1f2937;">
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9ca3af;">サービス</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#9ca3af;">平均EG</th>
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9ca3af;">改善提案</th>
        </tr>
      </thead>
      <tbody>${lowRows || '<tr><td colspan="3" style="padding:12px;color:#6b7280;text-align:center;">データなし</td></tr>'}</tbody>
    </table>

    <p style="font-size:12px;color:#374151;text-align:center;">SNS自動投稿管理システム 自動送信</p>
  </div>
</body>
</html>`

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'SNS自動投稿 <noreply@resend.dev>',
      to: process.env.REPORT_EMAIL_TO,
      subject: `[SNS自動投稿] 週次改善提案 ${dateStr}`,
      html,
    })

    return NextResponse.json({ sent: true })
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error }, { status: 500 })
  }
}
