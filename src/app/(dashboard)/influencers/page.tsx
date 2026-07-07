import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PlatformBadge } from '@/components/shared/platform-tag'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Users } from 'lucide-react'
import { YoutubeImportDialog } from './youtube-import-dialog'

const PAGE_SIZE = 20

export default async function InfluencersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string; sort?: string }>
}) {
  const { page: pageParam, q, status, sort } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)
  const supabase = await createClient()

  // Build query
  let query = supabase
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
      )
    `, { count: 'exact' })

  // Apply search filter
  if (q) {
    query = query.or(`display_name.ilike.%${q}%,email.ilike.%${q}%`)
  }

  // Apply status filter
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  // Apply sort
  if (sort === 'followers') {
    query = query.order('followers_count', { ascending: false, nullsFirst: false })
  } else if (sort === 'recent') {
    query = query.order('created_at', { ascending: false })
  } else {
    query = query.order('display_name', { ascending: true })
  }

  const { count: totalCount, data: influencersRaw } = await query
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  const influencers = influencersRaw?.sort((a, b) => {
    const aHasVideos = (a.videos?.length || 0) > 0
    const bHasVideos = (b.videos?.length || 0) > 0
    if (sort === 'followers') return 0 // already sorted by DB
    if (aHasVideos && !bHasVideos) return -1
    if (!aHasVideos && bHasVideos) return 1
    return 0
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">红人管理</h1>
        <p className="text-muted-foreground">管理合作的红人</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>红人列表</CardTitle>
              <CardDescription className="flex items-center gap-1.5 mt-1">
                <Users className="w-3.5 h-3.5" />
                {q || status
                  ? `搜索到 ${(totalCount || 0).toLocaleString()} 个结果`
                  : `共 ${(totalCount || 0).toLocaleString()} 个红人`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <YoutubeImportDialog />
              {/* Search */}
              <form className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  name="q"
                  defaultValue={q || ''}
                  placeholder="搜索红人名称或邮箱..."
                  className="pl-9 w-64"
                />
                {q && (
                  <Link
                    href="/influencers"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </Link>
                )}
              </form>
              {/* Status filter */}
              <Select defaultValue={status || 'all'}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="pending">待激活</SelectItem>
                  <SelectItem value="active">活跃</SelectItem>
                  <SelectItem value="inactive">已停用</SelectItem>
                </SelectContent>
              </Select>
              {/* Sort */}
              <Select defaultValue={sort || 'name'}>
                <SelectTrigger className="w-40">
                  <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">按名称排序</SelectItem>
                  <SelectItem value="followers">按粉丝数排序</SelectItem>
                  <SelectItem value="recent">按最近添加排序</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {influencers?.map((influencer) => {
              const latestVideo = influencer.videos?.[0]
              const initials = influencer.display_name
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()

              return (
                <Link
                  key={influencer.id}
                  href={`/influencers/${influencer.id}`}
                  className="flex items-center gap-4 py-3 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  {/* Avatar */}
                  <Avatar className="shrink-0 w-10 h-10">
                    <AvatarImage src={influencer.avatar_url || undefined} alt={influencer.display_name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name & Email */}
                  <div className="w-[140px] shrink-0">
                    <div className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                      {influencer.display_name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {influencer.email || '-'}
                    </div>
                  </div>

                  {/* Platform Tags */}
                  <div className="shrink-0 w-[80px]">
                    <PlatformBadge platforms={influencer.platform} />
                  </div>

                  {/* Followers */}
                  <div className="text-sm text-muted-foreground w-[60px] text-right shrink-0">
                    {influencer.followers_count ? `${(influencer.followers_count / 1000).toFixed(1)}k` : '-'}
                  </div>

                  {/* Latest Video */}
                  <div className="flex-1 min-w-0">
                    {latestVideo ? (
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={latestVideo.thumbnail_url}
                            alt={latestVideo.title}
                            className="w-28 h-16 object-cover rounded-md"
                          />
                          {latestVideo.duration && (
                            <span className="absolute bottom-0.5 right-0.5 text-[10px] bg-black/80 text-white px-1 rounded">
                              {latestVideo.duration}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {latestVideo.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{latestVideo.view_count}</span>
                            <span>·</span>
                            <span>{latestVideo.published_at}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </div>

                  {/* Location */}
                  <div className="text-xs text-muted-foreground shrink-0 w-[60px] text-right hidden lg:block">
                    {influencer.location || '-'}
                  </div>
                </Link>
              )
            })}
            {(!influencers || influencers.length === 0) && (
              <div className="text-center text-muted-foreground py-8">
                {q || status ? '没有找到匹配的红人' : '暂无红人'}
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t">
            <div className="text-sm text-muted-foreground">
              显示第 <span className="font-medium text-foreground">{(page - 1) * PAGE_SIZE + 1}</span> 到 <span className="font-medium text-foreground">{Math.min(page * PAGE_SIZE, totalCount || 0)}</span> 条，共 <span className="font-medium text-foreground">{(totalCount || 0).toLocaleString()}</span> 条
            </div>
            <PaginationControls page={page} totalCount={totalCount || 0} pageSize={PAGE_SIZE} q={q} status={status} sort={sort} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PaginationControls({
  page,
  totalCount,
  pageSize,
  q,
  status,
  sort,
}: {
  page: number
  totalCount: number
  pageSize: number
  q?: string
  status?: string
  sort?: string
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const getPageLink = (p: number) => {
    const params = new URLSearchParams()
    params.set('page', String(p))
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    if (sort) params.set('sort', sort)
    return `/influencers?${params.toString()}`
  }

  const pages: (number | 'ellipsis')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('ellipsis')
    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (page < totalPages - 2) pages.push('ellipsis')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center gap-1">
      {page <= 1 ? (
        <button className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 text-sm disabled:opacity-50 disabled:pointer-events-none" disabled>
          <ChevronLeft className="w-4 h-4" />
        </button>
      ) : (
        <Link
          href={getPageLink(page - 1)}
          className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
      )}
      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e-${i}`} className="px-1 text-muted-foreground">...</span>
        ) : p === page ? (
          <button key={p} className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground h-8 w-8 text-sm font-medium" disabled>
            {p}
          </button>
        ) : (
          <Link
            key={p}
            href={getPageLink(p)}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 text-sm font-medium"
          >
            {p}
          </Link>
        )
      )}
      {page >= totalPages ? (
        <button className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 text-sm disabled:opacity-50 disabled:pointer-events-none" disabled>
          <ChevronRight className="w-4 h-4" />
        </button>
      ) : (
        <Link
          href={getPageLink(page + 1)}
          className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 text-sm"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  )
}
