import { TwitterApi } from "twitter-api-v2";

export type XAccount = "hanamori" | "pokkori";

function getClient(account: XAccount = "pokkori") {
  if (account === "hanamori") {
    return new TwitterApi({
      appKey: process.env.HANAMORI_TWITTER_API_KEY!,
      appSecret: process.env.HANAMORI_TWITTER_API_SECRET!,
      accessToken: process.env.HANAMORI_TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.HANAMORI_TWITTER_ACCESS_TOKEN_SECRET!,
    });
  }
  return new TwitterApi({
    appKey: process.env.TWITTER_API_KEY!,
    appSecret: process.env.TWITTER_API_SECRET!,
    accessToken: process.env.TWITTER_ACCESS_TOKEN!,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
  });
}

export async function postTweet(
  text: string,
  account: XAccount = "pokkori"
): Promise<{ tweetId: string; url: string }> {
  const client = getClient(account);
  const tweet = await client.v2.tweet(text);
  const tweetId = tweet.data.id;
  return {
    tweetId,
    url: `https://x.com/i/web/status/${tweetId}`,
  };
}

export async function replyTweet(
  text: string,
  inReplyToTweetId: string,
  account: XAccount = "pokkori"
): Promise<string | null> {
  const client = getClient(account);
  try {
    const response = await client.v2.reply(text, inReplyToTweetId);
    return response.data?.id ?? null;
  } catch (error) {
    console.error('[Twitter] reply error:', error);
    return null;
  }
}

export function isTwitterConfigured(account: XAccount = "pokkori"): boolean {
  if (account === "hanamori") {
    return !!(
      process.env.HANAMORI_TWITTER_API_KEY &&
      process.env.HANAMORI_TWITTER_API_SECRET &&
      process.env.HANAMORI_TWITTER_ACCESS_TOKEN &&
      process.env.HANAMORI_TWITTER_ACCESS_TOKEN_SECRET
    );
  }
  return !!(
    process.env.TWITTER_API_KEY &&
    process.env.TWITTER_API_SECRET &&
    process.env.TWITTER_ACCESS_TOKEN &&
    process.env.TWITTER_ACCESS_TOKEN_SECRET
  );
}

export async function getTweetMetrics(
  tweetIds: string[],
  account: XAccount = "pokkori"
): Promise<Array<{
  tweetId: string;
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
}>> {
  if (tweetIds.length === 0) return [];

  const results: Array<{
    tweetId: string;
    likes: number;
    retweets: number;
    replies: number;
    quotes: number;
  }> = [];

  try {
    const client = getClient(account);
    // Process in batches of 100 (Twitter API limit)
    const batchSize = 100;
    for (let i = 0; i < tweetIds.length; i += batchSize) {
      const batch = tweetIds.slice(i, i + batchSize);
      try {
        const response = await client.v2.tweets(batch, {
          "tweet.fields": ["public_metrics"],
        });
        if (response.data) {
          for (const tweet of response.data) {
            const m = tweet.public_metrics;
            results.push({
              tweetId: tweet.id,
              likes: m?.like_count ?? 0,
              retweets: m?.retweet_count ?? 0,
              replies: m?.reply_count ?? 0,
              quotes: m?.quote_count ?? 0,
            });
          }
        }
      } catch {
        // Skip this batch on error, continue with next
      }
    }
  } catch {
    // Return whatever we collected so far
  }

  return results;
}
