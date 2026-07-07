'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createPost } from '@/lib/actions'
import { toast } from 'sonner'
import { Plus, Loader2, AlertCircle } from 'lucide-react'
import { YouTubeIcon, InstagramIcon, TikTokIcon } from '@/components/shared/platform-tag'

function detectPlatform(url: string): string | null {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube'
  if (/instagram\.com/.test(url)) return 'instagram'
  if (/tiktok\.com/.test(url)) return 'tiktok'
  return null
}

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  switch (platform) {
    case 'youtube':
      return <YouTubeIcon className={className || 'w-4 h-4'} color="#FF0000" />
    case 'instagram':
      return <InstagramIcon className={className || 'w-4 h-4'} color="#E4405F" />
    case 'tiktok':
      return <TikTokIcon className={className || 'w-4 h-4'} color="#000000" />
    default:
      return null
  }
}

export function AddPostDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const platform = url.trim() ? detectPlatform(url.trim()) : null
    setDetectedPlatform(platform)
  }, [url])

  const isComingSoon = detectedPlatform === 'instagram' || detectedPlatform === 'tiktok'

  async function handleSubmit() {
    if (!url.trim() || !detectedPlatform) return
    if (isComingSoon) return

    setLoading(true)
    try {
      const result = await createPost({
        url: url.trim(),
        platform: detectedPlatform,
      })
      const name = result?.influencer_name
      toast.success(
        name
          ? `Post 添加成功，红人「${name}」已自动关联`
          : 'Post 添加成功，评论已同步'
      )
      onOpenChange(false)
      setUrl('')
    } catch (e) {
      toast.error((e as Error).message || '添加失败')
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(v: boolean) {
    if (!v) {
      setUrl('')
      setLoading(false)
    }
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            添加 Post
          </DialogTitle>
          <DialogDescription>
            粘贴视频或帖子链接，系统将自动识别平台、匹配红人并抓取评论
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="post-url">帖子 URL</Label>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                id="post-url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isComingSoon && detectedPlatform) handleSubmit()
                }}
                disabled={loading}
              />
              {detectedPlatform && (
                <div className="flex items-center gap-1.5 px-3 border rounded-md bg-muted/50 shrink-0">
                  <PlatformIcon platform={detectedPlatform} />
                  <span className="text-xs capitalize">{detectedPlatform}</span>
                </div>
              )}
            </div>
          </div>

          {/* Coming Soon Warning */}
          {isComingSoon && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {detectedPlatform === 'instagram' ? 'Instagram' : 'TikTok'} 支持即将上线，目前仅支持 YouTube
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!url.trim() || !detectedPlatform || isComingSoon || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  正在识别红人并获取视频信息...
                </>
              ) : isComingSoon ? (
                'Coming Soon'
              ) : (
                '添加 Post'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
