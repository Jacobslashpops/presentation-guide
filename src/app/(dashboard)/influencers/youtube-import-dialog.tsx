'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { PlatformBadge } from '@/components/shared/platform-tag'
import { createInfluencerFromYouTube } from '@/lib/actions'
import { toast } from 'sonner'
import { Film, Loader2, Users, Video, Eye, Check, ExternalLink } from 'lucide-react'

interface ChannelPreview {
  display_name: string
  avatar_url: string | null
  bio: string | null
  email: string | null
  followers_count: number | null
  platform: string[]
  channel_urls: Record<string, string>
  location: string | null
  videos: Array<{
    video_id: string
    title: string
    thumbnail_url: string | null
    duration: string | null
    view_count: string | null
    published_at: string | null
    video_url: string
  }>
}

type State = 'idle' | 'loading' | 'preview' | 'importing' | 'done'

export function YoutubeImportDialog() {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<ChannelPreview | null>(null)

  async function handleFetch() {
    if (!url.trim()) return
    setState('loading')
    setError('')
    setPreview(null)

    try {
      const res = await fetch('/api/youtube/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelUrl: url.trim() }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || '获取失败')
      }

      setPreview(data)
      setState('preview')
    } catch (e) {
      setError((e as Error).message)
      setState('idle')
    }
  }

  async function handleImport() {
    if (!preview) return
    setState('importing')

    try {
      await createInfluencerFromYouTube({
        display_name: preview.display_name,
        avatar_url: preview.avatar_url,
        bio: preview.bio,
        email: preview.email,
        followers_count: preview.followers_count,
        platform: preview.platform,
        channel_urls: preview.channel_urls,
        location: preview.location,
        videos: preview.videos.map((v) => ({
          video_id: v.video_id,
          title: v.title,
          thumbnail_url: v.thumbnail_url,
          duration: v.duration,
          view_count: v.view_count,
          published_at: v.published_at,
          video_url: v.video_url,
        })),
      })

      toast.success(`${preview.display_name} 已导入`)
      setState('done')

      setTimeout(() => {
        setOpen(false)
        resetForm()
      }, 1000)
    } catch (e) {
      toast.error((e as Error).message || '导入失败')
      setState('preview')
    }
  }

  function resetForm() {
    setUrl('')
    setState('idle')
    setError('')
    setPreview(null)
  }

  const initials = preview?.display_name
    ? preview.display_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : ''

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="default">
          <Film className="w-4 h-4 mr-2 text-red-500" />
          从 YouTube 导入
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="w-5 h-5 text-red-500" />
            从 YouTube 导入红人
          </DialogTitle>
          <DialogDescription>
            输入 YouTube 频道 URL，系统将自动获取频道信息
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* URL Input */}
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="youtube-url">YouTube 频道 URL</Label>
              <Input
                id="youtube-url"
                placeholder="https://www.youtube.com/@AlHuTV"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleFetch() }}
                disabled={state === 'loading' || state === 'importing'}
              />
            </div>
            <Button
              className="mt-auto"
              onClick={handleFetch}
              disabled={!url.trim() || state === 'loading' || state === 'importing'}
            >
              {state === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  获取中
                </>
              ) : (
                '获取信息'
              )}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Preview Card */}
          {preview && (
            <div className="border rounded-lg overflow-hidden">
              {/* Channel Header */}
              <div className="flex items-start gap-4 p-4 bg-muted/30">
                <Avatar className="w-14 h-14 shrink-0">
                  <AvatarImage src={preview.avatar_url || undefined} alt={preview.display_name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg leading-tight">{preview.display_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <PlatformBadge platforms={preview.platform} />
                    {preview.location && (
                      <span className="text-xs text-muted-foreground">{preview.location}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                    {preview.followers_count != null && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {(preview.followers_count / 1000).toFixed(1)}k 粉丝
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Video className="w-3.5 h-3.5" />
                      {preview.videos.length} 个视频
                    </span>
                    {preview.email && (
                      <span className="truncate max-w-[180px]">{preview.email}</span>
                    )}
                  </div>
                  {preview.bio && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{preview.bio}</p>
                  )}
                  {Object.keys(preview.channel_urls).length > 1 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {Object.entries(preview.channel_urls).filter(([k]) => k !== 'YouTube').map(([k, href]) => (
                        <a key={k} href={href} target="_blank" rel="noopener noreferrer"
                           className="text-[11px] px-1.5 py-0.5 rounded bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                          {k}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Videos Preview */}
              {preview.videos.length > 0 && (
                <div className="p-3 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    最新视频（将同步 {preview.videos.length} 个）
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {preview.videos.slice(0, 3).map((v) => (
                      <a
                        key={v.video_id}
                        href={v.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block"
                      >
                        <div className="relative aspect-video rounded-md overflow-hidden bg-muted mb-1">
                          {v.thumbnail_url ? (
                            <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          {v.duration && (
                            <span className="absolute bottom-0.5 right-0.5 text-[10px] bg-black/80 text-white px-1 rounded">
                              {v.duration}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] leading-tight line-clamp-1 text-muted-foreground group-hover:text-foreground">
                          {v.title}
                        </p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Success State */}
          {state === 'done' && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="w-4 h-4" />
              导入成功！红人已添加到列表中。
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleImport}
              disabled={state !== 'preview'}
            >
              {state === 'importing' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  导入中
                </>
              ) : (
                '确认导入'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
