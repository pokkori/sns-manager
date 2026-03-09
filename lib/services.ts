export type Service = {
  id: string;
  name: string;
  emoji: string;
  url: string;
  hashtags: string[];
  /** 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat */
  cronDays: number[];
  cronHour: number; // JST hour to post
  postPrompt: string;
};

export const SERVICES: Service[] = [
  {
    id: "keiba",
    name: "競馬予想AI",
    emoji: "🐎",
    url: "https://keiba-yoso-ai.vercel.app",
    hashtags: ["競馬予想", "G1予想", "AI競馬"],
    cronDays: [6, 0], // Sat, Sun
    cronHour: 7,
    postPrompt: `競馬予想AIサービスのX(Twitter)投稿を1つ作成してください。

以下のいずれかのテーマで、日本語ツイートを作成:
1. 今週末の重賞レースへの言及と「AIが予想」という訴求
2. AI予想の精度・実績への言及（「的中続出」など）
3. 競馬ファンへのTips（複勝・三連複など馬券の考え方）
4. 「無料で試せる」という訴求

本文の最後の行にサービスURL https://keiba-yoso-ai.vercel.app を入れる。
その次の行に #競馬予想 #G1予想 #AI競馬 を付ける。
本文＋URL＋ハッシュタグの合計が280文字以内に収まるようにする。
テキストのみ返す（余計な説明不要）。`,
  },
  {
    id: "claim",
    name: "クレームAI",
    emoji: "📞",
    url: "https://claim-ai.vercel.app",
    hashtags: ["クレーム対応", "カスタマーサービス"],
    cronDays: [1, 3, 5], // Mon, Wed, Fri
    cronHour: 8,
    postPrompt: `クレーム対応AIサービスのX投稿を1つ作成してください。
対象: 飲食店・EC事業者・ホテル・サービス業の経営者・店長

以下のいずれかのテーマで日本語ツイートを作成:
1. 「こんなクレーム対応、していませんか？」という失敗例の共感訴求
2. クレーム対応のノウハウTips（短く実用的に）
3. 「クレーム対応文をAIが30秒で生成」という機能訴求
4. カスハラ法制化への言及と対応の必要性

本文の最後の行にサービスURL https://claim-ai.vercel.app を入れる。
その次の行に #クレーム対応 #カスタマーサポート #飲食業 を付ける。
本文＋URL＋ハッシュタグの合計が280文字以内に収まるようにする。
テキストのみ返す（余計な説明不要）。`,
  },
  {
    id: "uranai",
    name: "占いAI",
    emoji: "🔮",
    url: "https://uranai-ai.vercel.app",
    hashtags: ["占い", "AI占い", "今日の運勢"],
    cronDays: [1, 2, 3, 4, 5, 6, 0], // Every day
    cronHour: 7,
    postPrompt: `AI占いサービスのX投稿を1つ作成してください。
今日の日付・曜日を考慮してください。

以下のいずれかのテーマで日本語ツイートを作成:
1. 今日の運勢（12星座のどれか1つについて具体的に）
2. 今週の恋愛運・金運・仕事運への言及
3. 「好きな人との相性占い、試してみて」という訴求
4. 月の満ち欠けや季節への言及とスピリチュアルな内容

本文の最後の行にサービスURL https://uranai-ai-sigma.vercel.app を入れる。
その次の行に #占い #AI占い #今日の運勢 を付ける。
本文＋URL＋ハッシュタグの合計が280文字以内に収まるようにする。
テキストのみ返す（余計な説明不要）。`,
  },
  {
    id: "yakuari",
    name: "脈あり解読AI",
    emoji: "💗",
    url: "https://yaku-ari-ai.vercel.app",
    hashtags: ["恋愛相談", "LINE診断", "脈あり"],
    cronDays: [2, 5], // Tue, Fri
    cronHour: 22,
    postPrompt: `LINEの脈あり判定AIサービスのX投稿を1つ作成してください。
対象: 女子高生〜20代女性

以下のいずれかのテーマで日本語ツイートを作成（女子向けかわいいトーンで）:
1. 「こんなLINEが来たら脈ありかも...💗」という共感投稿
2. 脈ありLINEのあるある（絵文字の使い方・既読無視など）
3. 「好きな人のLINEを解読してみた結果が...」という体験談風
4. 「3回無料で試せる、コピペするだけ」という訴求

本文の最後の行にサービスURL https://yaku-ari-ai.vercel.app を入れる。
その次の行に #恋愛相談 #LINE診断 #脈あり を付ける。
本文＋URL＋ハッシュタグの合計が280文字以内に収まるようにする。
テキストのみ返す（余計な説明不要）。`,
  },
  {
    id: "kokuhaku",
    name: "告白LINE返信AI",
    emoji: "💬",
    url: "https://kokuhaku-line-ai.vercel.app",
    hashtags: ["恋愛", "告白", "LINE"],
    cronDays: [2, 5], // Tue, Fri
    cronHour: 22,
    postPrompt: `好きな子へのLINE返信・告白文生成AIサービスのX投稿を1つ作成してください。
対象: 男子高生〜20代男性

以下のいずれかのテーマで日本語ツイートを作成（男子向けカジュアルトーンで）:
1. 「好きな子に既読スルーされた...脈なし？」という共感投稿
2. 「告白のタイミングがわからない男子必見」
3. 「脈あり度〇%判定、返信例文もAIが生成」という機能訴求
4. 「フラれるのが怖くて告白できない→AIに相談」という訴求

本文の最後の行にサービスURL https://kokuhaku-line-ai.vercel.app を入れる。
その次の行に #恋愛 #告白 #LINE を付ける。
本文＋URL＋ハッシュタグの合計が280文字以内に収まるようにする。
テキストのみ返す（余計な説明不要）。`,
  },
  {
    id: "keikaku",
    name: "AI経営計画書",
    emoji: "📊",
    url: "https://ai-keiei-keikaku.vercel.app",
    hashtags: ["起業", "経営計画書", "創業融資"],
    cronDays: [1, 4], // Mon, Thu
    cronHour: 8,
    postPrompt: `経営計画書AI作成サービスのX投稿を1つ作成してください。
対象: 起業家・個人事業主・副業で法人化を検討中の方

以下のいずれかのテーマで日本語ツイートを作成:
1. 「融資申請で経営計画書に困っていませんか？」という共感訴求
2. 「経営コンサルに頼むと30〜100万→AIなら¥2,980」という比較
3. ものづくり補助金・IT導入補助金への言及と計画書の必要性
4. 「入力5分、AIが5分で本格的な計画書を生成」という機能訴求

本文の最後の行にサービスURL https://ai-keiei-keikaku.vercel.app を入れる。
その次の行に #起業 #創業融資 #経営計画書 を付ける。
本文＋URL＋ハッシュタグの合計が280文字以内に収まるようにする。
テキストのみ返す（余計な説明不要）。`,
  },
  {
    id: "hojyokin",
    name: "補助金AI",
    emoji: "💰",
    url: "https://hojyokin-ai-delta.vercel.app",
    hashtags: ["補助金", "助成金", "中小企業"],
    cronDays: [2, 5], // Tue, Fri
    cronHour: 9,
    postPrompt: `補助金診断AIサービスのX投稿を1つ作成してください。
対象: 中小企業経営者・個人事業主・フリーランス

以下のいずれかのテーマで日本語ツイートを作成:
1. 「あなたの業種で使える補助金、知っていますか？」という問いかけ
2. ものづくり補助金・IT導入補助金の次回公募への言及
3. 「AIが使える補助金を5件診断＋申請書ドラフトを自動生成」
4. 「補助金申請の書き方がわからない→AIに任せて採択率UP」

本文の最後の行にサービスURL https://hojyokin-ai-delta.vercel.app を入れる。
その次の行に #補助金 #助成金 #中小企業 を付ける。
本文＋URL＋ハッシュタグの合計が280文字以内に収まるようにする。
テキストのみ返す（余計な説明不要）。`,
  },
  {
    id: "ec",
    name: "EC説明文生成AI",
    emoji: "🛒",
    url: "https://ec-description-generator.vercel.app",
    hashtags: ["メルカリ", "EC副業", "フリマ"],
    cronDays: [1, 4], // Mon, Thu
    cronHour: 21,
    postPrompt: `EC商品説明文生成AIサービスのX投稿を1つ作成してください。
対象: メルカリ・ヤフオク・楽天・Amazon出品者・EC副業をしている方

以下のいずれかのテーマで日本語ツイートを作成:
1. 「商品説明文1つで売れ行きが3倍変わる」という訴求
2. 「メルカリで売れる説明文vs売れない説明文の違い」
3. 「10商品分の説明文を一括生成、コピペするだけ」という機能訴求
4. 「副業でEC始めたい人向け、説明文作成を時短する方法」

本文の最後の行にサービスURL https://ec-description-generator.vercel.app を入れる。
その次の行に #メルカリ #EC副業 #フリマ を付ける。
本文＋URL＋ハッシュタグの合計が280文字以内に収まるようにする。
テキストのみ返す（余計な説明不要）。`,
  },
  {
    id: "sns",
    name: "SNS投稿生成AI",
    emoji: "📱",
    url: "https://sns-post-generator.vercel.app",
    hashtags: ["SNS運用", "コンテンツ制作"],
    cronDays: [3], // Wed
    cronHour: 21,
    postPrompt: `SNS投稿文生成AIサービスのX投稿を1つ作成してください。
対象: 副業・フリーランス・個人事業主・スモールビジネスオーナー

以下のいずれかのテーマで日本語ツイートを作成:
1. 「SNS投稿のネタが尽きた→AIで解決する方法」
2. 「毎日投稿が続かない人へ、月¥980で投稿ネタを量産」
3. 「X・Instagram・TikTok向け投稿を同時に5パターン生成」
4. 「サービス名を入力するだけ、あとはAIにお任せ」

本文の最後の行にサービスURL https://sns-post-generator-gamma.vercel.app を入れる。
その次の行に #SNS運用 #コンテンツ制作 #副業 を付ける。
本文＋URL＋ハッシュタグの合計が280文字以内に収まるようにする。
テキストのみ返す（余計な説明不要）。`,
  },
];

export function getServiceById(id: string) {
  return SERVICES.find((s) => s.id === id);
}

export function getTodayServices() {
  const day = new Date().getDay(); // JST
  return SERVICES.filter((s) => s.cronDays.includes(day));
}
