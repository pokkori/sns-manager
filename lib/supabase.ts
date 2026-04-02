import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

export interface PostLogRow {
  id?: number
  service_id: string
  service_name: string
  content: string
  tweet_id: string | null
  status: 'success' | 'error' | 'skipped'
  engagement_score: number
  likes: number
  retweets: number
  replies: number
  created_at?: string
  metrics_fetched_at?: string | null
}

export interface ServiceAnalyticsRow {
  service_id: string
  avg_engagement_score: number
  best_hour: number | null
  top_hashtags: string[]
  post_count: number
  updated_at?: string
}
