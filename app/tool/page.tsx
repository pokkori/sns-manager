"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

type Result = {
  score: number;
  analysis: string;
  replies: string[];
  confession: string;
  timing: string;
  adviceLine: string;
} | null;

function parseResult(text: string): Result {
  const get = (tag: string) => {
    const m = text.match(new RegExp(`===\\s*${tag}\\s*===\\s*([\\s\\S]*?)(?====|$)`));
    return m ? m[1].trim() : "";
  };
  const scoreStr = get("SCORE");
  const score = parseInt(scoreStr, 10);
  if (isNaN(score)) return null;
  const repliesRaw = get("REPLIES");
  const replies = repliesRaw.split(/\n(?=\d\.)/).map((s) => s.replace(/^\d\.\s*/, "").trim()).filter(Boolean);
  return {
    score,
    analysis: get("ANALYSIS"),
    replies,
    confession: get("CONFESSION"),
    timing: get("TIMING"),
    adviceLine: get("ADVICE"),
  };
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? "#3b82f6" : score >= 40 ? "#f59e0b" : "#ef4444";
  const label = score >= 70 ? "脈ありです！" : score >= 40 ? "まだわからない" : "厳しいかも…";
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2 my-6">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#1e293b" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 70 70)" strokeLinecap="round"
        />
        <text x="70" y="65" textAnchor="middle" fill="white" fontSize="26" fontWeight="bold">{score}%</text>
        <text x="70" y="85" textAnchor="middle" fill="#94a3b8" fontSize="11">脈あり度</text>
      </svg>
      <span className="font-bold text-lg" style={{ color }}>{label}</span>
    </div>
  );
}

type Tab = "score" | "analysis" | "replies" | "confession" | "timing";
const TABS: { id: Tab; label: string }[] = [
  { id: "score", label: "📊 判定" },
  { id: "analysis", label: "🔍 心理分析" },
  { id: "replies", label: "💬 返信例文" },
  { id: "confession", label: "💌 告白文" },
  { id: "timing", label: "📅 タイミング" },
];

export default function ToolPage() {
  const [line, setLine] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [tab, setTab] = useState<Tab>("score");
  const [copied, setCopied] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/status").then((r) => r.json()).then((d) => {
      setIsPremium(d.premium);
      setRemaining(d.remaining);
    });
  }, []);

  async function analyze() {
    if (!line.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line, context }),
      });
      if (res.status === 402) { setShowPaywall(true); setLoading(false); return; }
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      const parsed = parseResult(data.result);
      setResult(parsed);
      setRemaining(data.remaining);
      setTab("score");
    } catch {
      setError("エラーが発生しました。もう一度お試しください。");
    }
    setLoading(false);
  }

  async function startCheckout() {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setCheckoutLoading(false);
    }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="font-bold text-blue-400">💬 告白LINE返信AI</Link>
        {!isPremium && remaining !== null && (
          <span className="text-xs text-slate-400">残り無料 {remaining}回</span>
        )}
        {isPremium && <span className="text-xs text-blue-400 font-bold">✓ プレミアム</span>}
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div>
          <label className="block text-sm font-bold mb-2 text-slate-300">好きな子のLINE（コピペしてください）</label>
          <textarea
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500 h-40"
            placeholder={"例）\n彼女: 「今日バイトだよー」\n自分: 「お疲れ！何時まで？」\n彼女: 「9時まで笑 なんで？」\n自分: 「いや別に笑」\n彼女: 「気になる笑」"}
            value={line}
            onChange={(e) => setLine(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-slate-300">関係性・状況（任意）</label>
          <input
            type="text"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            placeholder="例：クラスメートで知り合って1ヶ月、まだ連絡先交換したばかり"
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </div>

        {!isPremium && remaining === 0 && !result && (
          <div className="bg-blue-900/40 border border-blue-600 rounded-xl p-4 text-center">
            <p className="text-sm text-blue-200 mb-3">無料回数を使い切りました。月額¥980で使い放題！</p>
            <button onClick={startCheckout} disabled={checkoutLoading} className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-6 py-2 rounded-xl text-sm transition disabled:opacity-50">
              {checkoutLoading ? "処理中..." : "プレミアムにアップグレード"}
            </button>
          </div>
        )}

        <button
          onClick={analyze}
          disabled={loading || !line.trim() || (!isPremium && remaining === 0)}
          className="w-full bg-blue-500 hover:bg-blue-400 text-white font-black py-4 rounded-xl text-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "AIが解析中…" : "解析する"}
        </button>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        {/* Paywall */}
        {showPaywall && (
          <div className="bg-slate-800 border border-blue-500 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold mb-2">無料回数が終わりました</h3>
            <p className="text-slate-400 text-sm mb-6">月額¥980で解析し放題 + 告白文テンプレ完全解放</p>
            <button onClick={startCheckout} disabled={checkoutLoading} className="bg-blue-500 hover:bg-blue-400 text-white font-black px-8 py-4 rounded-xl text-lg transition disabled:opacity-50 w-full">
              {checkoutLoading ? "処理中..." : "¥980/月でアップグレード"}
            </button>
          </div>
        )}

        {result && (
          <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
            {/* Tab nav */}
            <div className="flex overflow-x-auto border-b border-slate-700">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-3 text-xs font-bold whitespace-nowrap transition ${tab === t.id ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-500 hover:text-slate-300"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {tab === "score" && (
                <div>
                  <ScoreRing score={result.score} />
                  {result.adviceLine && (
                    <div className="bg-slate-800 rounded-xl p-4 mt-4">
                      <p className="text-sm text-slate-300 leading-relaxed">{result.adviceLine}</p>
                    </div>
                  )}
                </div>
              )}

              {tab === "analysis" && (
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{result.analysis}</div>
              )}

              {tab === "replies" && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 mb-4">LINEに送る返信例文（そのままコピーして使えます）</p>
                  {result.replies.map((r, i) => (
                    <div key={i} className="bg-slate-800 rounded-xl p-4 relative">
                      <p className="text-sm text-slate-200 leading-relaxed pr-16">{r}</p>
                      <button
                        onClick={() => copy(r, `reply-${i}`)}
                        className="absolute top-3 right-3 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded transition"
                      >
                        {copied === `reply-${i}` ? "コピー済" : "コピー"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {tab === "confession" && (
                isPremium ? (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 mb-4">告白文（そのまま使えます）</p>
                    <div className="bg-slate-800 rounded-xl p-4 relative">
                      <p className="text-sm text-slate-200 leading-relaxed pr-16 whitespace-pre-wrap">{result.confession}</p>
                      <button
                        onClick={() => copy(result.confession, "confession")}
                        className="absolute top-3 right-3 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded transition"
                      >
                        {copied === "confession" ? "コピー済" : "コピー"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🔒</div>
                    <p className="text-slate-400 text-sm mb-4">告白文テンプレはプレミアム限定機能です</p>
                    <button onClick={startCheckout} disabled={checkoutLoading} className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-6 py-3 rounded-xl text-sm transition disabled:opacity-50">
                      {checkoutLoading ? "処理中..." : "¥980/月でアップグレード"}
                    </button>
                  </div>
                )
              )}

              {tab === "timing" && (
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{result.timing}</div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-600 space-x-4 mt-10">
        <Link href="/legal" className="hover:underline">特定商取引法</Link>
        <Link href="/privacy" className="hover:underline">プライバシーポリシー</Link>
        <Link href="/" className="hover:underline">トップへ戻る</Link>
      </footer>
    </main>
  );
}
