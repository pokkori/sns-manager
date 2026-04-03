import { replyTweet } from "@/lib/twitter";
import type { Service } from "@/lib/services";

/** ENABLE_FIRST_COMMENT=true のときだけリプライを投稿する */
export function isFirstCommentEnabled(): boolean {
  return process.env.ENABLE_FIRST_COMMENT === "true";
}

/**
 * ファーストコメント用テキストを生成する。
 * 例:
 *   詳細・無料で試せます
 *   https://example.com
 *
 *   #AI #占いAI
 */
export function buildFirstCommentText(service: Service): string {
  const tags = service.hashtags
    .slice(0, 3)
    .map((h) => `#${h.replace(/\s/g, "")}`)
    .join(" ");

  return `詳細・無料で試せます\n${service.url}${tags ? `\n\n${tags}` : ""}`;
}

/**
 * メイン投稿の成功後にファーストコメントを投稿する。
 * - ENABLE_FIRST_COMMENT が true でなければ何もしない
 * - 3秒待ってからリプライ（Xのアルゴリズム上、即リプより少し間を空けた方が自然）
 * - 失敗してもメイン投稿のステータスには影響しない（エラーをconsole.warnに留める）
 */
export async function postFirstComment(
  tweetId: string,
  service: Service,
  delayMs = 3000
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
