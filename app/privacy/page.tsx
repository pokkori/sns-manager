import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">← トップに戻る</Link>
        </div>
      </nav>
      <article className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>
        <p className="text-sm text-gray-500 mb-8">最終更新日：2026年3月</p>
        <section className="space-y-8 text-sm text-gray-700 leading-relaxed">
          <div>
            <h2 className="font-bold text-gray-900 mb-2">1. 事業者情報</h2>
            <p>本サービス「SNS自動投稿管理」は、ポッコリラボが運営するWebサービスです。</p>
          </div>
          <div>
            <h2 className="font-bold text-gray-900 mb-2">2. 取得する情報</h2>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>入力いただいたSNS投稿コンテンツ</li>
              <li>Cookie（セッション管理に使用）</li>
              <li>アクセスログ（IPアドレス・ブラウザ情報）</li>
            </ul>
          </div>
          <div>
            <h2 className="font-bold text-gray-900 mb-2">3. 利用目的</h2>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>SNS自動投稿機能の提供</li>
              <li>サービス改善のための利用状況分析</li>
              <li>不正利用の防止</li>
            </ul>
          </div>
          <div>
            <h2 className="font-bold text-gray-900 mb-2">4. 第三者提供</h2>
            <p>取得した情報は、法令に基づく場合またはAI生成のためAnthropicのAPIへ送信する場合を除き、第三者に提供しません。</p>
          </div>
          <div>
            <h2 className="font-bold text-gray-900 mb-2">5. ポリシーの変更</h2>
            <p>本ポリシーは予告なく変更する場合があります。変更後は本ページに掲載した時点で効力を生じます。</p>
          </div>
          <div>
            <h2 className="font-bold text-gray-900 mb-2">6. 外部送信規律に基づく情報送信</h2>
            <p className="mb-2">本サービスでは、電気通信事業法の外部送信規律に基づき、以下の外部サービスにデータを送信しています。</p>
            <table className="w-full text-left border-collapse text-xs text-gray-600">
              <thead><tr className="border-b"><th className="py-2 pr-2">送信先</th><th className="py-2 pr-2">目的</th><th className="py-2">送信される情報</th></tr></thead>
              <tbody>
                <tr className="border-b"><td className="py-2 pr-2">Anthropic（Claude API）</td><td className="py-2 pr-2">AIによるSNS投稿文の生成</td><td className="py-2">ユーザーの入力テキスト</td></tr>
                <tr><td className="py-2 pr-2">Vercel Inc.</td><td className="py-2 pr-2">ホスティング・アクセス解析</td><td className="py-2">ページビュー・デバイス情報</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <h2 className="font-bold text-gray-900 mb-2">7. お問い合わせ</h2>
            <p>ポッコリラボ 代表 新美　／　levonadesign@gmail.com　／　090-6093-5290</p>
          </div>
        </section>
      </article>
    </main>
  );
}
