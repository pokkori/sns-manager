"use client";
import { useState } from "react";
import Link from "next/link";

type Template = "飲食" | "美容" | "EC";
type Result = { email: string; status: "sent" | "failed"; error?: string };

const TEMPLATE_DESCRIPTIONS: Record<Template, { subject: string; target: string }> = {
  飲食: { subject: "【2026年10月 義務化】カスハラ対策、準備できていますか？", target: "飲食店・居酒屋・カフェ" },
  美容: { subject: "施術後クレーム・キャンセルトラブルをAIが15秒で解決します", target: "美容院・エステ・ネイル" },
  EC: { subject: "配送トラブル・返品クレームへの返信文、AIで自動生成できます", target: "EC・通販・Amazon出品者" },
};

export default function EmailPage() {
  const [template, setTemplate] = useState<Template>("飲食");
  const [recipientText, setRecipientText] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("ポッコリラボ 代表 新美諭");
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [summary, setSummary] = useState<{ sent: number; failed: number } | null>(null);

  const parseRecipients = () => {
    return recipientText
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const [name, email] = line.split(",").map(s => s.trim());
        return { name: name || "ご担当者", email };
      })
      .filter(r => r.email && r.email.includes("@"));
  };

  const recipients = parseRecipients();

  async function handleSend() {
    if (!recipients.length) return alert("送信先を入力してください");
    if (!fromEmail) return alert("送信元メールアドレスを入力してください");
    if (recipients.length > 20) return alert("一度に送れるのは20件までです");
    if (!confirm(`${recipients.length}件に送信します。よろしいですか？`)) return;

    setSending(true);
    setResults(null);
    setSummary(null);

    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients, template, fromEmail, fromName }),
      });
      const data = await res.json();
      setResults(data.results ?? []);
      setSummary({ sent: data.sent, failed: data.failed });
    } catch {
      alert("送信中にエラーが発生しました");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <nav className="backdrop-blur-sm bg-gray-900/80 border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link href="/" aria-label="SNS自動投稿管理ダッシュボードに戻る" className="text-gray-400 hover:text-gray-200 text-sm transition">← ダッシュボード</Link>
        <span className="text-gray-700">|</span>
        <span className="font-bold text-white">コールドメール送信</span>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* セットアップ案内 */}
        <div className="backdrop-blur-md bg-amber-900/20 border border-amber-500/30 rounded-xl p-5 text-sm shadow-lg">
          <p className="font-bold text-amber-300 mb-2">[注意] 初回セットアップが必要です</p>
          <ol className="list-decimal list-inside space-y-1 text-amber-200/80">
            <li><a href="https://resend.com" target="_blank" className="underline hover:text-amber-100 transition">resend.com</a> で無料アカウントを作成</li>
            <li>API Keys ページでAPIキーを発行</li>
            <li>VercelのSNS自動投稿管理プロジェクトに <code className="bg-amber-900/40 px-1 rounded text-amber-200">RESEND_API_KEY</code> を追加</li>
            <li>Domains でメールドメインを追加（または <code className="bg-amber-900/40 px-1 rounded text-amber-200">onboarding@resend.dev</code> でテスト可）</li>
          </ol>
          <p className="text-amber-400/70 mt-2">無料枠：3,000通/月・100通/日</p>
        </div>

        {/* テンプレート選択 */}
        <div className="backdrop-blur-md bg-white/8 border border-white/20 rounded-xl shadow-xl p-6">
          <h2 className="font-bold text-white mb-4">1. テンプレートを選択</h2>
          <div className="grid grid-cols-3 gap-3">
            {(Object.keys(TEMPLATE_DESCRIPTIONS) as Template[]).map(t => (
              <button
                key={t}
                onClick={() => setTemplate(t)}
                aria-label={`${t}業テンプレートを選択する（${TEMPLATE_DESCRIPTIONS[t].target}向け）`}
                aria-pressed={template === t}
                className={`rounded-lg border p-4 text-left transition min-h-[44px] ${template === t ? "border-blue-500/60 bg-blue-900/30 text-white" : "border-white/15 bg-white/5 text-gray-300 hover:border-white/30 hover:bg-white/10"}`}
              >
                <p className="font-bold text-sm mb-1">{t}業</p>
                <p className="text-xs text-gray-400">{TEMPLATE_DESCRIPTIONS[t].target}</p>
              </button>
            ))}
          </div>
          <div className="mt-4 backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">件名プレビュー：</p>
            <p className="text-sm font-medium text-gray-200">{TEMPLATE_DESCRIPTIONS[template].subject}</p>
          </div>
        </div>

        {/* 送信元設定 */}
        <div className="backdrop-blur-md bg-white/8 border border-white/20 rounded-xl shadow-xl p-6 space-y-4">
          <h2 className="font-bold text-white">2. 送信元を設定</h2>
          <div>
            <label htmlFor="from-email" className="block text-sm text-gray-400 mb-1">送信元メールアドレス（Resendで確認済みのドメイン）</label>
            <input
              id="from-email"
              type="email"
              value={fromEmail}
              onChange={e => setFromEmail(e.target.value)}
              placeholder="info@yourdomain.com"
              aria-label="送信元メールアドレス（Resendで確認済みのドメイン）"
              className="w-full backdrop-blur-sm bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 min-h-[44px]"
            />
          </div>
          <div>
            <label htmlFor="from-name" className="block text-sm text-gray-400 mb-1">送信者名</label>
            <input
              id="from-name"
              type="text"
              value={fromName}
              onChange={e => setFromName(e.target.value)}
              aria-label="送信者名"
              className="w-full backdrop-blur-sm bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 min-h-[44px]"
            />
          </div>
        </div>

        {/* 送信先リスト */}
        <div className="backdrop-blur-md bg-white/8 border border-white/20 rounded-xl shadow-xl p-6">
          <h2 className="font-bold text-white mb-2">3. 送信先を入力</h2>
          <p className="text-xs text-gray-400 mb-3">
            1行に1件、<code className="bg-white/10 px-1 rounded text-gray-300">会社名・店舗名, メールアドレス</code> の形式で入力してください。<br />
            例：<code className="bg-white/10 px-1 rounded text-gray-300">山田食堂, info@yamada-shokudo.jp</code>（最大20件）
          </p>
          <textarea
            value={recipientText}
            onChange={e => setRecipientText(e.target.value)}
            rows={10}
            aria-label="送信先リスト（1行に1件、店舗名・会社名とメールアドレスをカンマ区切りで入力）"
            placeholder={"山田食堂, info@yamada-shokudo.jp\n田中美容院, contact@tanaka-hair.com\n鈴木EC, support@suzuki-store.com"}
            className="w-full backdrop-blur-sm bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
          />
          <p className={`text-xs mt-2 ${recipients.length > 20 ? "text-red-400" : "text-gray-500"}`}>
            認識済み: {recipients.length}件 {recipients.length > 20 && "（20件を超えています）"}
          </p>
        </div>

        {/* 送信ボタン */}
        <button
          onClick={handleSend}
          disabled={sending || !recipients.length || !fromEmail}
          aria-label={`${recipients.length}件の送信先にコールドメールを送信する`}
          className="w-full bg-blue-600/80 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-blue-500/30 backdrop-blur-sm min-h-[44px]"
        >
          {sending ? `送信中... (1件ずつ処理中)` : `${recipients.length}件にメールを送信する`}
        </button>

        {/* 送信結果 */}
        {summary && (
          <div className={`backdrop-blur-md rounded-xl p-5 border shadow-xl ${summary.failed === 0 ? "bg-emerald-900/20 border-emerald-500/30" : "bg-amber-900/20 border-amber-500/30"}`}>
            <p className="font-bold text-white mb-3">
              送信完了: {summary.sent}件成功 / {summary.failed}件失敗
            </p>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {results?.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className={`text-xs font-bold ${r.status === "sent" ? "text-emerald-400" : "text-red-400"}`}>
                    {r.status === "sent" ? "[成功]" : "[失敗]"}
                  </span>
                  <span className="text-gray-300">{r.email}</span>
                  {r.error && <span className="text-red-400 text-xs">{r.error}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
