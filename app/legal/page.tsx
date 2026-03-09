import Link from "next/link";

export default function LegalPage() {
  const items = [
    ["販売事業者", "個人事業主（pokkori）"],
    ["運営責任者", "非公開（特商法に基づく省略）"],
    ["所在地", "非公開（請求があれば遅滞なく開示します）"],
    ["電話番号", "非公開（請求があれば遅滞なく開示します）"],
    ["メールアドレス", "support@kokuhaku-line-ai.com"],
    ["販売価格", "月額¥980（税込）"],
    ["支払方法", "クレジットカード（Stripe経由）"],
    ["支払時期", "お申し込み時にお支払いが確定します"],
    ["サービス提供時期", "決済完了後、即時ご利用いただけます"],
    ["返品・キャンセル", "デジタルコンテンツの性質上、返金は原則お受けしておりません。サブスクリプションはいつでも解約可能です"],
    ["動作環境", "最新のWebブラウザ（Chrome・Safari・Firefox等）"],
  ];
  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-blue-400 text-sm hover:text-blue-300 mb-8 block">← トップに戻る</Link>
        <h1 className="text-2xl font-bold mb-8">特定商取引法に基づく表記</h1>
        <div className="space-y-4">
          {items.map(([k, v]) => (
            <div key={k} className="grid grid-cols-3 gap-4 border-b border-slate-800 pb-4">
              <dt className="text-blue-400 text-sm font-bold col-span-1">{k}</dt>
              <dd className="text-slate-300 text-sm col-span-2">{v}</dd>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
