import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const TEMPLATES: Record<string, { subject: string; getBody: (name: string) => string }> = {
  飲食: {
    subject: "【2026年10月 義務化】カスハラ対策、準備できていますか？",
    getBody: (name: string) => `${name}様

突然のメールをお許しください。
AIツール開発のポッコリラボ（愛知県半田市）と申します。

2026年10月より、改正労働施策総合推進法によりカスタマーハラスメント対策が
全事業者に法的義務化されることをご存じでしょうか。

飲食店向けに特化した「AIクレーム対応文生成ツール」をご提供しております。

▼ 解決できる課題
・クレーム対応文の作成に毎回1時間以上かかる
・SNS投稿リスクを抱えながら感情的な返信をしてしまう
・スタッフごとの対応品質がバラバラ

▼ サービス概要
・業種・クレーム内容を入力するだけで15秒で生成
・メール返信文・電話スクリプト・対応チェックリストがセット
・先着50社限定モニター価格：¥2,980/月（通常¥4,980）

まず無料で3回お試しください。
https://claim-ai-beryl.vercel.app

ご不明点はこのメールにご返信いただくか、
X(@levona_design)へのDMでもお気軽にどうぞ。

━━━━━━━━━━━━━━━━
ポッコリラボ 代表 新美
X: @levona_design
所在地: 愛知県半田市
━━━━━━━━━━━━━━━━

※本メールは1度のみ送信しております。ご不要の場合はこのまま削除ください。`,
  },
  美容: {
    subject: "施術後クレーム・キャンセルトラブルをAIが15秒で解決します",
    getBody: (name: string) => `${name}様

突然のご連絡を失礼いたします。
AIツール開発のポッコリラボと申します。

美容サロンを運営されているとのことで、ご提案があってご連絡しました。

「施術結果への不満」「予約キャンセルのトラブル」「アレルギー・肌トラブルのクレーム」

これらへの対応文を毎回ゼロから作るのは、時間も精神的エネルギーも消耗しますよね。

弊社のAIクレーム対応ツールを使えば、クレーム内容を入力するだけで
美容サロン特有の表現を踏まえたメール返信文・電話スクリプトが15秒で生成されます。

▼ 特徴
・美容業専用プリセット搭載（施術・予約・アレルギー等）
・リピーター維持につながる柔らかいトーン〜強硬トーンまで対応
・クレームをリピーター獲得のチャンスに変えるアドバイス付き

▼ 今なら先着50社モニター価格
¥2,980/月（通常¥4,980）/ まず無料で3回お試しいただけます
https://claim-ai-beryl.vercel.app

━━━━━━━━━━━━━━━━
ポッコリラボ 代表 新美
X: @levona_design
━━━━━━━━━━━━━━━━

※本メールは1度のみ送信しております。ご不要の場合はこのまま削除ください。`,
  },
  EC: {
    subject: "配送トラブル・返品クレームへの返信文、AIで自動生成できます",
    getBody: (name: string) => `${name}様

突然のご連絡を失礼いたします。
AIツール開発のポッコリラボと申します。

EC・通販業の皆様に向けてご提案があってご連絡しました。

配送遅延・商品破損・返品返金トラブルへのクレーム対応は、
1件ずつ丁寧に対応しないとレビュー評価に直撃しますよね。

弊社のAIクレーム対応ツールでは、EC特有のクレームシナリオに特化した
返信文・電話スクリプト・対応チェックリストを15秒で一括生成できます。

▼ EC向け主な対応シナリオ
・配送遅延・紛失への謝罪と補償提示
・商品不良・破損の対応フロー
・理不尽な返品要求への毅然とした断り文

▼ 料金
無料：3回お試し → https://claim-ai-beryl.vercel.app
モニタープラン：¥2,980/月（先着50社限定）

━━━━━━━━━━━━━━━━
ポッコリラボ 代表 新美
X: @levona_design
━━━━━━━━━━━━━━━━

※本メールは1度のみ送信しております。ご不要の場合はこのまま削除ください。`,
  },
};

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { recipients, template, fromEmail, fromName } = await req.json() as {
      recipients: { name: string; email: string }[];
      template: "飲食" | "美容" | "EC";
      fromEmail: string;
      fromName: string;
    };

    if (!recipients?.length || !template || !fromEmail) {
      return NextResponse.json({ error: "recipients, template, fromEmail は必須です" }, { status: 400 });
    }

    if (recipients.length > 20) {
      return NextResponse.json({ error: "一度に送れるのは20件までです" }, { status: 400 });
    }

    const tmpl = TEMPLATES[template];
    if (!tmpl) {
      return NextResponse.json({ error: "不正なテンプレートです" }, { status: 400 });
    }

    const results: { email: string; status: "sent" | "failed"; error?: string }[] = [];

    for (const r of recipients) {
      try {
        await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: r.email,
          subject: tmpl.subject,
          text: tmpl.getBody(r.name),
        });
        results.push({ email: r.email, status: "sent" });
        // レート制限：1秒間隔
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e: unknown) {
        results.push({ email: r.email, status: "failed", error: e instanceof Error ? e.message : String(e) });
      }
    }

    const sent = results.filter(r => r.status === "sent").length;
    const failed = results.filter(r => r.status === "failed").length;

    return NextResponse.json({ sent, failed, results });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "不明なエラー" }, { status: 500 });
  }
}
