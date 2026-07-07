import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import {
  Eye,
  ThumbsUp,
  MessageSquare,
  Clock,
  ArrowLeft,
} from 'lucide-react'
import { YouTubeIcon } from '@/components/shared/platform-tag'
import Link from 'next/link'
import { PostDetailClient } from './post-detail-client'
import { PostInfoSection } from './post-info-section'

export const metadata = { title: 'Post Detail - CelePulse' }

async function getPostDetail(postId: string) {
  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      influencer:influencers!inner(id, display_name, avatar_url)
    `)
    .eq('id', postId)
    .single()

  if (error || !post) return null

  // Get latest snapshot
  const { data: snapshots } = await supabase
    .from('post_snapshots')
    .select('*')
    .eq('post_id', postId)
    .order('snapshot_at', { ascending: false })
    .limit(1)

  const latestSnapshot = snapshots?.[0] || null

  // Get all comments
  const { data: comments } = await supabase
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('published_at', { ascending: false })

  return {
    ...post,
    latest_snapshot: latestSnapshot,
    comments: comments || [],
  }
}

function formatCount(n: number | null | undefined): string {
  if (n == null) return '-'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const post = await getPostDetail(id)

  if (!post) notFound()

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Back Link */}
      <Link
        href="/posts"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回 Posts
      </Link>

      {/* Video Info Card - thumbnail on top, info below */}
      <Card className="overflow-hidden">
        {/* Thumbnail - full width 16:9 */}
        <div className="relative bg-muted" style={{ aspectRatio: '16/9' }}>
          {post.thumbnail_url ? (
            <img
              src={post.thumbnail_url}
              alt={post.title || ''}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <YouTubeIcon className="w-12 h-12" color="#cccccc" />
            </div>
          )}
          {post.duration && (
            <span className="absolute bottom-2 right-2 text-xs bg-black/80 text-white px-2 py-1 rounded">
              {post.duration}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-5">
          <PostInfoSection
            title={post.title || '无标题'}
            description={post.description}
            influencerId={post.influencer?.id || ''}
            influencerName={post.influencer?.display_name || '未知红人'}
            url={post.url}
            hashtags={(post.hashtags as string[]) || []}
            tags={(post.tags as string[]) || []}
            publishedAt={post.published_at}
            channelTitle={post.channel_title as string | null}
            language={post.language as string | null}
          />
        </div>
      </Card>

      {/* Stats + Sync Info - single row */}
      <Card className="p-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="font-semibold">{formatCount(post.latest_snapshot?.view_count)}</span>
              <span className="text-muted-foreground">播放</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <ThumbsUp className="w-4 h-4 text-green-600" />
              <span className="font-semibold">{formatCount(post.latest_snapshot?.like_count)}</span>
              <span className="text-muted-foreground">点赞</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <span className="font-semibold">{formatCount(post.latest_snapshot?.comment_count)}</span>
              <span className="text-muted-foreground">评论</span>
            </div>
          </div>
          <div className="text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            同步于 {formatDate(post.last_synced_at)}
          </div>
        </div>
      </Card>

      {/* Client Component: Sync Button + Transcription + Comments */}
      <PostDetailClient
        postId={post.id}
        comments={post.comments as any[]}
        commentsDisabled={post.comments_disabled}
        duration={post.duration as string | null}
        transcription={post.transcription as string | null}
        transcriptionSource={post.transcription_source as string | null}
        transcriptionStatus={post.transcription_status as string | null}
        transcriptionLanguage={post.transcription_language as string | null}
        transcriptionError={post.transcription_error as string | null}
        videoSentiment={post.video_sentiment as any}
        videoSentimentStatus={post.video_sentiment_status as string | null}
        commentSentiment={post.comment_sentiment as any}
        commentSentimentStatus={post.comment_sentiment_status as string | null}
      />
    </div>
  )
}
