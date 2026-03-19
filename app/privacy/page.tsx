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
            <h2 className="font-bold text-gray-900 mb-2">6. お問い合わせ</h2>
            <p>ポッコリラボ 代表 新美　／　levonadesign@gmail.com　／　090-6093-5290</p>
          </div>
        </section>
      </article>
    </main>
  );
}
