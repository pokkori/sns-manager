import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-16">
      <div className="max-w-2xl mx-auto space-y-8 text-slate-300 text-sm leading-relaxed">
        <Link href="/" className="text-blue-400 text-sm hover:text-blue-300 block">← トップに戻る</Link>
        <h1 className="text-2xl font-bold text-white">プライバシーポリシー</h1>
        {[
          ["収集する情報", "本サービスでは、入力いただいたLINEのメッセージ内容、決済情報（Stripe社が管理）、およびCookieによる利用状況を収集します。"],
          ["情報の利用目的", "収集した情報は、AI分析サービスの提供、サービス改善、および不正利用の防止のためにのみ使用します。"],
          ["第三者への提供", "法令に基づく場合を除き、お客様の個人情報を第三者に提供することはありません。"],
          ["入力内容の取り扱い", "入力いただいたLINEのメッセージは、AI分析のためにAnthropicのAPIに送信されます。個人を特定できる形での保存・利用はしません。"],
          ["Cookieの使用", "本サービスでは、無料試用回数の管理およびログイン状態の維持のためにCookieを使用しています。"],
          ["お問い合わせ", "プライバシーに関するご質問はsupport@kokuhaku-line-ai.comまでご連絡ください。"],
        ].map(([title, body]) => (
          <section key={title}>
            <h2 className="text-white font-bold mb-2">{title}</h2>
            <p>{body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
