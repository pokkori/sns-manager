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

export function isTwitterConfigured(): boolean {
  return !!(
    process.env.TWITTER_API_KEY &&
    process.env.TWITTER_API_SECRET &&
    process.env.TWITTER_ACCESS_TOKEN &&
    process.env.TWITTER_ACCESS_TOKEN_SECRET
  );
}
