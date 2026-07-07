import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { PlatformTags } from '@/components/shared/platform-tag'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Eye,
  Play,
  Clock,
  Users,
  Video,
  Calendar,
  Globe,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { InfluencerTabs } from './influencer-tabs'
import { ExpandableDescription } from './expandable-description'
import { ChannelBanner } from './channel-banner'
import { SocialLinksSection } from './social-links-section'
import { ScrapeLinksButton } from './scrape-links-button'
import { EmailBadge } from './email-badge'
import { EditSocialLinksDialog } from './edit-social-links-dialog'

function formatCount(n: number | null | undefined): string {
  if (n == null) return '-'
  if (n >= 1000000000) return `${(n / 1000000000).toFixed(1)}B`
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

export default async function InfluencerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: influencer } = await supabase
    .from('influencers')
    .select(`
      *,
      videos:videos(
        video_id,
        title,
        thumbnail_url,
        duration,
        view_count,
        published_at,
        video_url
      ),
      posts:posts(
        id,
        platform,
        platform_post_id,
        url,
        title,
        thumbnail_url,
        duration,
        published_at,
        channel_title,
        post_snapshots(
          view_count,
          like_count,
          comment_count,
          snapshot_at
        )
      )
    `)
    .eq('id', id)
    .single()

  if (!influencer) {
    notFound()
  }

  const initials = influencer.display_name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()

  // Sort posts by published_at desc
  const sortedPosts = (influencer.posts || []).sort(
    (a: any, b: any) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime()
  )

  // Sort videos by published_at desc
  const sortedVideos = (influencer.videos || []).sort(
    (a: any, b: any) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime()
  )

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/influencers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回红人列表
      </Link>

      {/* Banner + Avatar Header */}
      <Card className="overflow-hidden">
        <ChannelBanner url={influencer.channel_banner_url} />

        {/* Profile info overlapping banner */}
        <CardContent className="px-6 pb-6 -mt-10 relative">
          <div className="flex items-end gap-5">
            <Avatar className="w-20 h-20 border-4 border-background shadow-md">
              <AvatarImage
                src={influencer.avatar_url || undefined}
                alt={influencer.display_name}
              />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-2xl font-bold">{influencer.display_name}</h1>
                {influencer.email && (
                  <EmailBadge email={influencer.email} />
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                {influencer.channel_handle && (
                  <span>@{influencer.channel_handle}</span>
                )}
                {influencer.location && (
                  <>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" />
                      {influencer.location}
                    </span>
                  </>
                )}
                <PlatformTags links={{
                  youtube: (influencer.channel_urls as Record<string, string>)?.YouTube || null,
                  instagram: influencer.instagram,
                  tiktok: influencer.tiktok,
                  twitter: influencer.twitter,
                  facebook: influencer.facebook,
                  linkedin: influencer.linkedin,
                  twitch: influencer.twitch,
                  website: influencer.website,
                  email: influencer.email,
                }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description + Stats + Content */}
      <Card>
        <CardContent className="p-6 space-y-5">
          {/* Description */}
          {influencer.channel_description && (
            <ExpandableDescription text={influencer.channel_description} />
          )}

          {/* Social Links + Scrape Button */}
          {(() => {
            const channelUrls = (influencer.channel_urls as Record<string, string>) || {}
            const youtubeUrl = channelUrls['YouTube'] || null
            const socialLinks = {
              website: influencer.website,
              twitter: influencer.twitter,
              facebook: influencer.facebook,
              linkedin: influencer.linkedin,
              instagram: influencer.instagram,
              tiktok: influencer.tiktok,
              twitch: influencer.twitch,
              email: influencer.email,
            }
            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <SocialLinksSection links={socialLinks} />
                </div>
                <div className="flex items-center gap-3">
                  <ScrapeLinksButton
                    influencerId={influencer.id}
                    channelUrl={youtubeUrl}
                    existingLinks={socialLinks}
                  />
                  <EditSocialLinksDialog
                    influencerId={influencer.id}
                    existingLinks={socialLinks}
                  />
                </div>
              </div>
            )
          })()}

          {/* Stats Row */}
          <div className="flex items-center gap-6 text-sm border-t border-b py-4">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-red-500" />
              <span className="font-semibold">
                {formatCount(influencer.followers_count)}
              </span>
              <span className="text-muted-foreground">订阅</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-blue-500" />
              <span className="font-semibold">
                {formatCount(influencer.total_views)}
              </span>
              <span className="text-muted-foreground">总播放</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <Video className="w-4 h-4 text-green-500" />
              <span className="font-semibold">
                {formatCount(influencer.video_count)}
              </span>
              <span className="text-muted-foreground">视频</span>
            </div>
            {influencer.channel_created_at && (
              <>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {new Date(influencer.channel_created_at).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <span className="text-muted-foreground">加入</span>
                </div>
              </>
            )}
          </div>

          {/* Tabs: Videos | Posts */}
          <InfluencerTabs
            tabs={[
              {
                key: 'videos',
                label: 'Videos',
                count: sortedVideos.length,
                content: (
                  <VideosTab videos={sortedVideos} />
                ),
              },
              {
                key: 'posts',
                label: 'Posts',
                count: sortedPosts.length,
                content: (
                  <PostsTab posts={sortedPosts} />
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function VideosTab({ videos }: { videos: any[] }) {
  if (videos.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        暂无视频
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map((video) => (
        <a
          key={video.video_id}
          href={video.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block"
        >
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-2">
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-5 h-5 text-black fill-black ml-0.5" />
              </div>
            </div>
            {video.duration && (
              <span className="absolute bottom-1.5 right-1.5 text-[11px] bg-black/80 text-white px-1.5 py-0.5 rounded font-medium">
                {video.duration}
              </span>
            )}
          </div>
          <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors mb-1">
            {video.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {video.view_count && (
              <span className="flex items-center gap-0.5">
                <Eye className="w-3 h-3" />
                {formatCount(Number(video.view_count))}
              </span>
            )}
            {video.published_at && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  {new Date(video.published_at).toLocaleDateString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </>
            )}
          </div>
        </a>
      ))}
    </div>
  )
}

function PostsTab({ posts }: { posts: any[] }) {
  if (posts.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        暂无 Post 数据
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => {
        const snapshot = post.post_snapshots?.[0]
        return (
          <Link
            key={post.id}
            href={`/posts/${post.id}`}
            className="flex gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
          >
            {/* Thumbnail */}
            <div className="w-40 shrink-0 relative rounded-md overflow-hidden bg-muted" style={{ aspectRatio: '16/9' }}>
              {post.thumbnail_url ? (
                <img
                  src={post.thumbnail_url}
                  alt={post.title || ''}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <Video className="w-6 h-6" />
                </div>
              )}
              {post.duration && (
                <span className="absolute bottom-1 right-1 text-[10px] bg-black/80 text-white px-1 py-0.5 rounded">
                  {post.duration}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                {post.title || '无标题'}
              </h3>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                {post.published_at && (
                  <span>{new Date(post.published_at).toLocaleDateString('zh-CN')}</span>
                )}
                {snapshot && (
                  <>
                    <span className="flex items-center gap-0.5">
                      <Eye className="w-3 h-3" />
                      {formatCount(snapshot.view_count)}
                    </span>
                    <span className="flex items-center gap-0.5">
                      👍 {formatCount(snapshot.like_count)}
                    </span>
                    <span className="flex items-center gap-0.5">
                      💬 {formatCount(snapshot.comment_count)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
