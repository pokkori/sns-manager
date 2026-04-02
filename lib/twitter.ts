import { TwitterApi } from "twitter-api-v2";

function getClient() {
  return new TwitterApi({
    appKey: process.env.TWITTER_API_KEY!,
    appSecret: process.env.TWITTER_API_SECRET!,
    accessToken: process.env.TWITTER_ACCESS_TOKEN!,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
  });
}

export async function postTweet(text: string): Promise<{ tweetId: string; url: string }> {
  const client = getClient();
  const tweet = await client.v2.tweet(text);
  const tweetId = tweet.data.id;
  return {
    tweetId,
    url: `https://x.com/i/web/status/${tweetId}`,
  };
}

export async function replyTweet(text: string, inReplyToTweetId: string): Promise<string | null> {
  const client = getClient();
  try {
    const response = await client.v2.reply(text, inReplyToTweetId);
    return response.data?.id ?? null;
  } catch (error) {
    console.error('[Twitter] reply error:', error);
    return null;
  }
}

export function isTwitterConfigured(): boolean {
  return !!(
    process.env.TWITTER_API_KEY &&
    process.env.TWITTER_API_SECRET &&
    process.env.TWITTER_ACCESS_TOKEN &&
    process.env.TWITTER_ACCESS_TOKEN_SECRET
  );
}

export async function getTweetMetrics(
  tweetIds: string[]
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
    const client = getClient();
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
