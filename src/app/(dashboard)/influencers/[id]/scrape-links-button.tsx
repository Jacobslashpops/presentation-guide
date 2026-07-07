'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, ExternalLink, AlertCircle } from 'lucide-react'

interface SocialLinks {
  website: string | null
  twitter: string | null
  facebook: string | null
  linkedin: string | null
  instagram: string | null
  tiktok: string | null
  twitch: string | null
  email: string | null
}

interface ScrapeLinksButtonProps {
  influencerId: string
  channelUrl: string | null
  existingLinks: SocialLinks
}

export function ScrapeLinksButton({ influencerId, channelUrl, existingLinks }: ScrapeLinksButtonProps) {
  const [status, setStatus] = useState<'idle' | 'scraping' | 'done' | 'error' | 'no-extension'>('idle')
  const [updatedLinks, setUpdatedLinks] = useState<SocialLinks | null>(null)

  const allLinksFilled = !!(
    existingLinks.website &&
    existingLinks.twitter &&
    existingLinks.facebook &&
    existingLinks.linkedin &&
    existingLinks.instagram &&
    existingLinks.tiktok &&
    existingLinks.twitch &&
    existingLinks.email
  )

  const hasAnyLink = !!(
    existingLinks.website ||
    existingLinks.twitter ||
    existingLinks.facebook ||
    existingLinks.linkedin ||
    existingLinks.instagram ||
    existingLinks.tiktok ||
    existingLinks.twitch ||
    existingLinks.email
  )

  // Poll for updated data
  const pollForUpdates = useCallback(async (attempts = 0) => {
    if (attempts >= 10) {
      setStatus('no-extension')
      return
    }

    await new Promise(resolve => setTimeout(resolve, 3000))

    try {
      const res = await fetch(`/api/influencer/${influencerId}`)
      if (res.ok) {
        const data = await res.json()
        const links: SocialLinks = {
          website: data.website,
          twitter: data.twitter,
          facebook: data.facebook,
          linkedin: data.linkedin,
          instagram: data.instagram,
          tiktok: data.tiktok,
          twitch: data.twitch,
          email: data.email,
        }

        // Check if any new links were added
        const hasNew = Object.keys(links).some(
          key => !existingLinks[key as keyof SocialLinks] && links[key as keyof SocialLinks]
        )

        if (hasNew) {
          setUpdatedLinks(links)
          setStatus('done')
        } else {
          pollForUpdates(attempts + 1)
        }
      } else {
        pollForUpdates(attempts + 1)
      }
    } catch {
      pollForUpdates(attempts + 1)
    }
  }, [influencerId, existingLinks])

  async function handleScrape() {
    if (!channelUrl) return

    setStatus('scraping')

    // Send message to extension bridge via window.postMessage
    // The bridge.js content script on CelePulse pages will relay this to background
    window.postMessage({
      type: 'CELEPULSE_SCRAPE_LINKS',
      channelUrl,
      influencerId,
    }, '*')

    // Start polling for updates
    pollForUpdates()
  }

  // Listen for scrape complete from extension
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'CELEPULSE_SCRAPE_COMPLETE' && event.data?.influencerId === influencerId) {
        if (event.data.success) {
          // Refresh will happen via polling
        } else {
          setStatus('error')
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [influencerId])

  if (allLinksFilled) return null

  if (status === 'done' && updatedLinks) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <AlertCircle className="w-4 h-4" />
        <span>社交链接已更新，刷新页面查看完整数据</span>
        <Button variant="link" size="sm" onClick={() => window.location.reload()}>
          刷新
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleScrape}
        disabled={status === 'scraping'}
      >
        {status === 'scraping' ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            采集中...
          </>
        ) : (
          <>
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            {hasAnyLink ? '补充更多链接' : '采集社交链接'}
          </>
        )}
      </Button>
      {status === 'no-extension' && (
        <span className="text-xs text-muted-foreground">
          未检测到 Chrome 插件，请安装后重试
        </span>
      )}
      {status === 'error' && (
        <span className="text-xs text-destructive">
          采集失败，请重试
        </span>
      )}
    </div>
  )
}
