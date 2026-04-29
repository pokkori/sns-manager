import { replyTweet } from "@/lib/twitter";
import type { Service } from "@/lib/services";

/** ENABLE_FIRST_COMMENT=true のときだけリプライを投稿する */
export function isFirstCommentEnabled(): boolean {
  return process.env.ENABLE_FIRST_COMMENT === "true";
}

/**
 * ファーストコメント用テキストを生成する。
 * Grokアルゴリズム2026: 著者返信を引き出す返信は150倍スコア
 * 質問形式でエンゲージメントを誘発する
 */
export function buildFirstCommentText(service: Service): string {
  const tags = service.hashtags
    .slice(0, 3)
    .map((h) => `#${h.replace(/\s/g, "")}`)
    .join(" ");

  const ctaVariants = [
    `無料でお試しいただけます。使ってみた感想を聞かせてください！\n${service.url}`,
    `30秒で試せます。どんな結果でしたか？\n${service.url}`,
    `無料版あります。感想を教えてもらえると嬉しいです。\n${service.url}`,
  ];
  const cta = ctaVariants[Math.floor(Math.random() * ctaVariants.length)];

  return `${cta}${tags ? `\n\n${tags}` : ""}`;
}

/**
 * メイン投稿の成功後にファーストコメントを投稿する。
 * - ENABLE_FIRST_COMMENT が true でなければ何もしない
 * - 5分待ってからリプライ（Grok 2026: 即リプより自然な間隔でスコア向上）
 * - 失敗してもメイン投稿のステータスには影響しない（エラーをconsole.warnに留める）
 */
export async function postFirstComment(
  tweetId: string,
  service: Service,
  delayMs = 300000  // 5分（Grokアルゴリズム2026推奨）
): Promise<{ replyId: string | null; skipped: boolean }> {
  if (!isFirstCommentEnabled()) {
    return { replyId: null, skipped: true };
  }

  await new Promise((resolve) => setTimeout(resolve, delayMs));

  const text = buildFirstCommentText(service);
  const replyId = await replyTweet(text, tweetId);

  if (!replyId) {
    console.warn(`[FirstComment] reply failed for tweet ${tweetId}`);
  }

  return { replyId, skipped: false };
}
