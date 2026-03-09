"use client";
import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <section className="pt-20 pb-16 px-4 text-center">
        <div className="inline-block bg-blue-900 text-blue-300 text-xs font-bold px-3 py-1 rounded-full mb-6">
          💬 告白LINE返信AI — 完全無料で3回試せる
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
          好きな子のLINE、<br />
          <span className="text-blue-400">AIが本気で解読。</span>
        </h1>
        <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8">
          コピペするだけで<strong className="text-white">脈あり度</strong>を0〜100%判定。<br />
          最適な返信例文・告白文・告白タイミングまでAIが生成します。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/tool"
            className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-8 py-4 rounded-xl text-lg transition"
          >
            無料で解析する（3回）
          </Link>
          <button
            onClick={startCheckout}
            disabled={loading}
            className="border border-blue-400 text-blue-300 hover:bg-blue-900 font-bold px-8 py-4 rounded-xl text-lg transition disabled:opacity-50"
          >
            {loading ? "処理中..." : "月額¥980で使い放題"}
          </button>
        </div>
      </section>

      {/* Pain points */}
      <section className="py-16 px-4 bg-slate-900">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">こんな悩み、ありませんか？</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: "😰", title: "返信が遅い…", body: "既読から2時間。これって脈なし？それとも忙しいだけ？不安で他のことが手につかない" },
              { emoji: "🤔", title: "何て返せばいい？", body: "「うん」「そうだね」みたいな短い返信。もっと話を続けたいけど、何て送ればいいかわからない" },
              { emoji: "💭", title: "告白していいの？", body: "いい感じな気はするけど、フラれたら関係が壊れる。告白のタイミングがわからなくて踏み出せない" },
            ].map((p) => (
              <div key={p.title} className="bg-slate-800 rounded-2xl p-6">
                <div className="text-3xl mb-3">{p.emoji}</div>
                <h3 className="font-bold text-lg mb-2">{p.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">使い方は超シンプル</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "LINEをコピペ", body: "好きな子とのやり取りをそのままテキストエリアに貼り付け" },
              { step: "2", title: "状況を入力", body: "「クラスメート」「付き合って2ヶ月」など関係性を一言で" },
              { step: "3", title: "AIが即分析", body: "脈あり度・返信例文・告白タイミングを30秒で生成" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-xl font-black mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/tool"
              className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-8 py-4 rounded-xl text-lg transition inline-block"
            >
              今すぐ無料で試す
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-slate-900">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">AIが教えてくれること</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { emoji: "❤️‍🔥", title: "脈あり度スコア", body: "0〜100%で数値化。会話のトーン・返信速度・絵文字の使い方など複合的に判断" },
              { emoji: "💌", title: "返信例文3パターン", body: "「距離を縮める返信」「自然なデート誘い」「余韻を残す一言」など状況別に生成" },
              { emoji: "📅", title: "告白タイミング分析", body: "「今すぐOK」「あと2週間」「もう少し仲良くなってから」とタイミングを具体的に提示" },
              { emoji: "💬", title: "告白文テンプレ", body: "LINE・直接・電話、シチュエーション別の告白文をそのまま使えるレベルで生成" },
            ].map((f) => (
              <div key={f.title} className="bg-slate-800 rounded-2xl p-6 flex gap-4">
                <div className="text-3xl shrink-0">{f.emoji}</div>
                <div>
                  <h3 className="font-bold mb-1">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">使った人の声</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "高2・男子", text: "脈あり度78%って出て、返信例文そのまま送ったら「かわいいね笑」って返ってきた。神ツール" },
              { name: "大学1年・男子", text: "告白タイミング「今週末がベスト」って出て、実際に告白したらOKもらえた！マジで感謝" },
              { name: "高3・男子", text: "友達に相談しにくい内容なのに、AIは全部フラットに答えてくれる。毎日使ってる" },
            ].map((t) => (
              <div key={t.name} className="bg-slate-800 rounded-2xl p-6">
                <p className="text-slate-300 text-sm mb-4 leading-relaxed">「{t.text}」</p>
                <p className="text-blue-400 text-xs font-bold">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4 bg-slate-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-10">料金プラン</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <h3 className="font-bold text-lg mb-2">無料</h3>
              <div className="text-4xl font-black mb-4">¥0</div>
              <ul className="text-slate-400 text-sm space-y-2 mb-6 text-left">
                <li>✓ 3回まで無料で解析</li>
                <li>✓ 脈あり度・返信例文・告白タイミング</li>
                <li>✗ 告白文テンプレ（月額のみ）</li>
                <li>✗ 回数制限あり</li>
              </ul>
              <Link href="/tool" className="block w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition text-center">
                無料で試す
              </Link>
            </div>
            <div className="bg-blue-900 rounded-2xl p-8 border-2 border-blue-400 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-400 text-slate-900 text-xs font-black px-4 py-1 rounded-full">人気No.1</div>
              <h3 className="font-bold text-lg mb-2">月額プラン</h3>
              <div className="text-4xl font-black mb-4">¥980<span className="text-lg font-normal text-blue-300">/月</span></div>
              <ul className="text-blue-200 text-sm space-y-2 mb-6 text-left">
                <li>✓ 解析し放題（回数制限なし）</li>
                <li>✓ 脈あり度・心理分析・返信例文</li>
                <li>✓ 告白文テンプレ（LINE/直接/電話）</li>
                <li>✓ 告白タイミング詳細分析</li>
              </ul>
              <button
                onClick={startCheckout}
                disabled={loading}
                className="w-full bg-blue-400 hover:bg-blue-300 text-slate-900 font-black py-3 rounded-xl transition disabled:opacity-50"
              >
                {loading ? "処理中..." : "今すぐ始める"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">まず無料で試してみよう</h2>
        <p className="text-slate-400 mb-8">クレカ不要・登録不要。LINEをコピペするだけ。</p>
        <Link
          href="/tool"
          className="bg-blue-500 hover:bg-blue-400 text-white font-black px-10 py-5 rounded-2xl text-xl transition inline-block"
        >
          今すぐ無料で解析
        </Link>
      </section>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500 space-x-4">
        <Link href="/legal" className="hover:underline">特定商取引法に基づく表記</Link>
        <Link href="/privacy" className="hover:underline">プライバシーポリシー</Link>
      </footer>
    </main>
  );
}
