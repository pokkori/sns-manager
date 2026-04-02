import { supabase, PostLogRow } from './supabase'

export async function logPostToSupabase(row: PostLogRow): Promise<void> {
  if (!supabase) return // 未設定時はスキップ
  const { error } = await supabase.from('post_logs').insert(row)
  if (error) console.error('[Supabase] post_logs insert error:', error.message)
}

export async function updatePostMetricsInSupabase(
  tweetId: string,
  metrics: { likes: number; retweets: number; replies: number; engagementScore: number }
): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('post_logs')
    .update({
      likes: metrics.likes,
      retweets: metrics.retweets,
      replies: metrics.replies,
      engagement_score: metrics.engagementScore,
      metrics_fetched_at: new Date().toISOString(),
    })
    .eq('tweet_id', tweetId)
  if (error) console.error('[Supabase] post_logs update error:', error.message)
}

export async function getTopPerformingContent(serviceId: string, limit = 5): Promise<PostLogRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('post_logs')
    .select('*')
    .eq('service_id', serviceId)
    .eq('status', 'success')
    .order('engagement_score', { ascending: false })
    .limit(limit)
  if (error) return []
  return (data as PostLogRow[]) ?? []
}
