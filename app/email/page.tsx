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
  const [fromName, setFromName] = useState("ポッコリラボ 代表 新美");
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
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/" aria-label="SNS自動投稿管理ダッシュボードに戻る" className="text-gray-500 hover:text-gray-700 text-sm">← ダッシュボード</Link>
        <span className="text-gray-300">|</span>
        <span className="font-bold text-gray-900">📧 コールドメール送信</span>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* セットアップ案内 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-sm">
          <p className="font-bold text-yellow-800 mb-2">⚠️ 初回セットアップが必要です</p>
          <ol className="list-decimal list-inside space-y-1 text-yellow-700">
            <li><a href="https://resend.com" target="_blank" className="underline">resend.com</a> で無料アカウントを作成</li>
            <li>API Keys ページでAPIキーを発行</li>
            <li>VercelのSNS自動投稿管理プロジェクトに <code className="bg-yellow-100 px-1 rounded">RESEND_API_KEY</code> を追加</li>
            <li>Domains でメールドメインを追加（または <code className="bg-yellow-100 px-1 rounded">onboarding@resend.dev</code> でテスト可）</li>
          </ol>
          <p className="text-yellow-600 mt-2">無料枠：3,000通/月・100通/日</p>
        </div>

        {/* テンプレート選択 */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-gray-900 mb-4">1. テンプレートを選択</h2>
          <div className="grid grid-cols-3 gap-3">
            {(Object.keys(TEMPLATE_DESCRIPTIONS) as Template[]).map(t => (
              <button
                key={t}
                onClick={() => setTemplate(t)}
                aria-label={`${t}業テンプレートを選択する（${TEMPLATE_DESCRIPTIONS[t].target}向け）`}
                aria-pressed={template === t}
                className={`rounded-lg border p-4 text-left transition ${template === t ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
              >
                <p className="font-bold text-sm text-gray-900 mb-1">{t}業</p>
                <p className="text-xs text-gray-500">{TEMPLATE_DESCRIPTIONS[t].target}</p>
              </button>
            ))}
          </div>
          <div className="mt-4 bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">件名プレビュー：</p>
            <p className="text-sm font-medium text-gray-700">{TEMPLATE_DESCRIPTIONS[template].subject}</p>
          </div>
        </div>

        {/* 送信元設定 */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="font-bold text-gray-900">2. 送信元を設定</h2>
          <div>
            <label htmlFor="from-email" className="block text-sm text-gray-600 mb-1">送信元メールアドレス（Resendで確認済みのドメイン）</label>
            <input
              id="from-email"
              type="email"
              value={fromEmail}
              onChange={e => setFromEmail(e.target.value)}
              placeholder="info@yourdomain.com"
              aria-label="送信元メールアドレス（Resendで確認済みのドメイン）"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="from-name" className="block text-sm text-gray-600 mb-1">送信者名</label>
            <input
              id="from-name"
              type="text"
              value={fromName}
              onChange={e => setFromName(e.target.value)}
              aria-label="送信者名"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 送信先リスト */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-gray-900 mb-2">3. 送信先を入力</h2>
          <p className="text-xs text-gray-500 mb-3">
            1行に1件、<code className="bg-gray-100 px-1 rounded">会社名・店舗名, メールアドレス</code> の形式で入力してください。<br />
            例：<code className="bg-gray-100 px-1 rounded">山田食堂, info@yamada-shokudo.jp</code>（最大20件）
          </p>
          <textarea
            value={recipientText}
            onChange={e => setRecipientText(e.target.value)}
            rows={10}
            aria-label="送信先リスト（1行に1件、店舗名・会社名とメールアドレスをカンマ区切りで入力）"
            placeholder={"山田食堂, info@yamada-shokudo.jp\n田中美容院, contact@tanaka-hair.com\n鈴木EC, support@suzuki-store.com"}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className={`text-xs mt-2 ${recipients.length > 20 ? "text-red-500" : "text-gray-500"}`}>
            認識済み: {recipients.length}件 {recipients.length > 20 && "（20件を超えています）"}
          </p>
        </div>

        {/* 送信ボタン */}
        <button
          onClick={handleSend}
          disabled={sending || !recipients.length || !fromEmail}
          aria-label={`${recipients.length}件の送信先にコールドメールを送信する`}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {sending ? `送信中... (1件ずつ処理中)` : `📧 ${recipients.length}件にメールを送信する`}
        </button>

        {/* 送信結果 */}
        {summary && (
          <div className={`rounded-xl p-5 border ${summary.failed === 0 ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}>
            <p className="font-bold text-gray-900 mb-3">
              送信完了：✅ {summary.sent}件成功 / ❌ {summary.failed}件失敗
            </p>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {results?.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span>{r.status === "sent" ? "✅" : "❌"}</span>
                  <span className="text-gray-700">{r.email}</span>
                  {r.error && <span className="text-red-500 text-xs">{r.error}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
