'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Eye, ThumbsUp, MessageSquare, ExternalLink, Clock } from 'lucide-react'
import { YouTubeIcon, InstagramIcon, TikTokIcon } from '@/components/shared/platform-tag'
import { AddPostDialog } from './add-post-dialog'

interface Influencer {
  id: string
  display_name: string
}

interface PostData {
  id: string
  platform: string
  platform_post_id: string
  url: string
  title: string | null
  description: string | null
  thumbnail_url: string | null
  published_at: string | null
  duration: string | null
  last_synced_at: string | null
  comments_disabled: boolean
  created_at: string
  influencer: { display_name: string; avatar_url: string | null } | null
  latest_snapshot: {
    view_count: number | null
    like_count: number | null
    comment_count: number | null
  } | null
}

function formatCount(n: number | null | undefined): string {
  if (n == null) return '-'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

function PlatformIcon({ platform }: { platform: string }) {
  switch (platform) {
    case 'youtube':
      return <YouTubeIcon className="w-4 h-4" color="#FF0000" />
    case 'instagram':
      return <InstagramIcon className="w-4 h-4" color="#E4405F" />
    case 'tiktok':
      return <TikTokIcon className="w-4 h-4" color="#000000" />
    default:
      return null
  }
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

export function PostsClient({
  influencers,
  initialPosts,
}: {
  influencers: Influencer[]
  initialPosts: PostData[]
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [influencerFilter, setInfluencerFilter] = useState<string>('all')

  const filteredPosts = useMemo(() => {
    return initialPosts.filter((post) => {
      if (platformFilter !== 'all' && post.platform !== platformFilter) return false
      if (influencerFilter !== 'all' && post.influencer?.display_name !== influencerFilter) return false
      return true
    })
  }, [initialPosts, platformFilter, influencerFilter])

  return (
    <>
      {/* Filters + Add Button */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={platformFilter} onValueChange={(v) => setPlatformFilter(v || 'all')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="所有平台" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有平台</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="instagram" disabled>Instagram (Coming Soon)</SelectItem>
            <SelectItem value="tiktok" disabled>TikTok (Coming Soon)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={influencerFilter} onValueChange={(v) => setInfluencerFilter(v || 'all')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="所有红人" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有红人</SelectItem>
            {influencers.map((inf) => (
              <SelectItem key={inf.id} value={inf.display_name}>
                {inf.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Post
          </Button>
        </div>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground mb-2">
            {initialPosts.length === 0
              ? '还没有添加任何 Post'
              : '没有符合条件的 Post'}
          </div>
          <p className="text-sm text-muted-foreground">
            {initialPosts.length === 0
              ? '点击右上角 "Add Post" 添加红人的视频或帖子'
              : '尝试调整筛选条件'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`}>
              <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-40 h-[90px] rounded-md overflow-hidden bg-muted shrink-0 relative">
                    {post.thumbnail_url ? (
                      <img
                        src={post.thumbnail_url}
                        alt={post.title || ''}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlatformIcon platform={post.platform} />
                      </div>
                    )}
                    {post.duration && (
                      <span className="absolute bottom-1 right-1 text-[10px] bg-black/80 text-white px-1.5 py-0.5 rounded">
                        {post.duration}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm line-clamp-1">
                          {post.title || '无标题'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <PlatformIcon platform={post.platform} />
                          <span className="text-xs text-muted-foreground">
                            {post.influencer?.display_name || '未知红人'}
                          </span>
                          {post.published_at && (
                            <span className="text-xs text-muted-foreground">
                              {timeAgo(post.published_at)}
                            </span>
                          )}
                        </div>
                      </div>
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{formatCount(post.latest_snapshot?.view_count)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{formatCount(post.latest_snapshot?.like_count)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{formatCount(post.latest_snapshot?.comment_count)}</span>
                      </div>
                      {post.last_synced_at && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                          <Clock className="w-3.5 h-3.5" />
                          <span>同步于 {timeAgo(post.last_synced_at)}</span>
                        </div>
                      )}
                      {post.comments_disabled && (
                        <Badge variant="secondary" className="text-[10px]">
                          评论已关闭
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <AddPostDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  )
}
