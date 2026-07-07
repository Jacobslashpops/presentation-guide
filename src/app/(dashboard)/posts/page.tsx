import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { YouTubeIcon } from '@/components/shared/platform-tag'
import { PostsClient } from './posts-client'

export const metadata = { title: 'Posts - CelePulse' }

async function getPosts() {
  const supabase = await createClient()

  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      influencer:influencers!inner(display_name, avatar_url),
      latest_snapshot:post_snapshots(view_count, like_count, comment_count, snapshot_at)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }

  return (posts || []).map((p: any) => {
    const snapshots = Array.isArray(p.latest_snapshot) ? p.latest_snapshot : []
    const latest = snapshots.sort((a: any, b: any) =>
      new Date(b.snapshot_at).getTime() - new Date(a.snapshot_at).getTime()
    )[0] || null

    return {
      ...p,
      latest_snapshot: latest,
    }
  })
}

async function getInfluencers() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('influencers')
    .select('id, display_name')
    .order('display_name')
  return data || []
}

export default async function PostsPage() {
  const [posts, influencers] = await Promise.all([getPosts(), getInfluencers()])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            监控红人发布的帖子和视频评论
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">总 Posts</div>
          <div className="text-2xl font-bold mt-1">{posts.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">YouTube</div>
          <div className="text-2xl font-bold mt-1">
            {posts.filter((p: any) => p.platform === 'youtube').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Instagram</div>
          <div className="text-2xl font-bold mt-1 text-muted-foreground">
            Coming Soon
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">TikTok</div>
          <div className="text-2xl font-bold mt-1 text-muted-foreground">
            Coming Soon
          </div>
        </Card>
      </div>

      {/* Client-side filtered list + Add Post button */}
      <PostsClient influencers={influencers} initialPosts={posts as any[]} />
    </div>
  )
}
