import { NextResponse } from 'next/server'

interface VideoInfo {
  video_id: string
  title: string
  thumbnail_url: string
  duration: string | null
  view_count: string | null
  published_at: string | null
  video_url: string
}

interface ChannelInfo {
  display_name: string
  avatar_url: string | null
  bio: string | null
  followers_count: number | null
  platform: string[]
  channel_urls: Record<string, string>
  location: string | null
  email: string | null
  videos: VideoInfo[]
}

interface SupplementalData {
  videos: Map<string, { duration: string | null; view_count: string | null }>
  social_links: Record<string, string>
  platforms: string[]
  email: string | null
  bio: string | null
  location: string | null
}

const YT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
}

function parseHandleFromUrl(url: string): string | null {
  const match = url.match(/youtube\.com\/@([\w.-]+)/)
  return match ? match[1] : null
}

function getHighResAvatar(url: string): string {
  return url.split('=s')[0] + '=s800-c-k-c0x00ffffff-no-rj'
}

function extractEmail(text: string | null): string | null {
  if (!text) return null
  const match = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)
  return match ? match[0] : null
}

function extractRedirectUrl(redirectUrl: string): string {
  try {
    const url = new URL(redirectUrl)
    const q = url.searchParams.get('q')
    if (q?.startsWith('http')) return q
  } catch { /* ignore */ }
  return ''
}

async function fetchPageHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: YT_HEADERS })
    return await res.text()
  } catch {
    return null
  }
}

function parseYtInitialData(html: string): any | null {
  const match = html.match(/ytInitialData\s*=\s*({[\s\S]+?});\s*<\/script>/)
  if (!match) return null
  try { return JSON.parse(match[1]) } catch { return null }
}

// ============================================================
//  POST handler
// ============================================================

export async function POST(request: Request) {
  try {
    const { channelUrl } = await request.json()
    if (!channelUrl || typeof channelUrl !== 'string') {
      return NextResponse.json({ error: '缺少 channelUrl' }, { status: 400 })
    }

    const handle = parseHandleFromUrl(channelUrl)
    if (!handle) {
      return NextResponse.json({ error: '无法解析 YouTube URL，请使用 @handle 格式' }, { status: 400 })
    }

    const apiKey = process.env.YOUTUBE_API_KEY
    const normalizedUrl = channelUrl.endsWith('/') ? channelUrl : channelUrl + '/'

    if (apiKey) {
      // Merge mode: API for structure + scraping for supplemental
      const [apiResult, supplemental] = await Promise.all([
        fetchViaApi(handle, apiKey),
        scrapeSupplementalData(normalizedUrl),
      ])
      const result = mergeChannelData(apiResult, supplemental, handle)
      return NextResponse.json(result)
    }

    // Fallback: pure scraping
    const result = await fetchViaScrapingFull(handle, normalizedUrl)
    return NextResponse.json(result)
  } catch (error) {
    console.error('YouTube import error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

// ============================================================
//  YouTube Data API
// ============================================================

async function fetchViaApi(handle: string, apiKey: string): Promise<ChannelInfo> {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${handle}&key=${apiKey}`
  const res = await fetch(url)
  const data = await res.json()

  if (!data.items?.length) {
    throw new Error('未找到该频道')
  }

  const ch = data.items[0]
  const s = ch.snippet
  const st = ch.statistics
  const uploadsId = ch.contentDetails?.relatedPlaylists?.uploads

  let videos: VideoInfo[] = []
  if (uploadsId) {
    const vUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=10&playlistId=${uploadsId}&key=${apiKey}`
    const vRes = await fetch(vUrl)
    const vData = await vRes.json()

    videos = (vData.items || []).map((item: any) => ({
      video_id: item.contentDetails?.videoId || item.snippet?.resourceId?.videoId || '',
      title: item.snippet?.title || '',
      thumbnail_url: item.snippet?.thumbnails?.maxres?.url || item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || '',
      duration: null,
      view_count: null,
      published_at: item.snippet?.publishedAt || null,
      video_url: `https://www.youtube.com/watch?v=${item.contentDetails?.videoId || item.snippet?.resourceId?.videoId}`,
    }))
  }

  return {
    display_name: s.title || handle,
    avatar_url: s.thumbnails?.default?.url ? getHighResAvatar(s.thumbnails.default.url) : null,
    bio: s.description?.slice(0, 500) || null,
    followers_count: st.subscriberCount ? parseInt(st.subscriberCount, 10) : null,
    platform: ['YouTube'],
    channel_urls: { YouTube: `https://youtube.com/@${handle}` },
    location: s.country || null,
    email: null,
    videos,
  }
}

// ============================================================
//  Server-side page scraping (supplemental data only)
// ============================================================

async function scrapeSupplementalData(channelUrl: string): Promise<SupplementalData | null> {
  const aboutHtml = await fetchPageHtml(channelUrl + 'about')
  const videosHtml = await fetchPageHtml(channelUrl + 'videos')

  const supplemental: SupplementalData = {
    videos: new Map(),
    social_links: {},
    platforms: ['YouTube'],
    email: null,
    bio: null,
    location: null,
  }

  // --- About page: social_links, bio, location, email ---
  if (aboutHtml) {
    const aboutData = parseYtInitialData(aboutHtml)
    if (aboutData) {
      const endpoints = aboutData?.onResponseReceivedEndpoints || []
      for (const ep of endpoints) {
        const panel = ep?.showEngagementPanelEndpoint?.engagementPanel?.engagementPanelSectionListRenderer
        if (!panel?.content?.sectionListRenderer) continue

        const sections = panel.content.sectionListRenderer.contents || []
        for (const section of sections) {
          const items = section?.itemSectionRenderer?.contents || []
          for (const item of items) {
            const renderer = item?.aboutChannelRenderer
            if (!renderer) continue

            const aboutMeta = renderer.metadata?.aboutChannelViewModel
            if (!aboutMeta) continue

            supplemental.bio = aboutMeta.description || null
            supplemental.location = aboutMeta.country || null
            supplemental.email = extractEmail(aboutMeta.description || null)

            const links = aboutMeta.links || []
            for (const link of links) {
              const linkData = link?.channelExternalLinkViewModel
              if (!linkData) continue

              const title = linkData.title?.content || ''
              if (!title) continue

              const commandRuns = linkData.link?.commandRuns || []
              let actualUrl = ''
              for (const run of commandRuns) {
                const urlEndpoint = run?.onTap?.innertubeCommand?.urlEndpoint
                if (urlEndpoint?.url) {
                  actualUrl = extractRedirectUrl(urlEndpoint.url)
                  break
                }
              }

              if (actualUrl && title) {
                supplemental.social_links[title] = actualUrl
                const pName = title.charAt(0).toUpperCase() + title.slice(1)
                if (pName !== 'YouTube' && !supplemental.platforms.includes(pName)) {
                  supplemental.platforms.push(pName)
                }
              }
            }
            break // got what we need from aboutChannelRenderer
          }
        }
      }
    }
  }

  // --- Videos page: duration + view_count ---
  if (videosHtml) {
    const videosData = parseYtInitialData(videosHtml)
    if (videosData) {
      const tabs = videosData?.contents?.twoColumnBrowseResultsRenderer?.tabs || []
      for (const tab of tabs) {
        const tr = tab?.tabRenderer || {}
        const url = tr?.endpoint?.commandMetadata?.webCommandMetadata?.url || ''
        if (!url.includes('/videos') && tr.tabIdentifier !== 'VIDEOS') continue

        const richGrid = tr?.content?.richGridRenderer
        if (!richGrid) continue

        const items = richGrid.contents || []
        for (const item of items) {
          if (item.continuationItemRenderer) continue
          if (supplemental.videos.size >= 10) break

          const inner = item?.richItemRenderer?.content
          const lockup = inner?.lockupViewModel

          if (lockup) {
            const vid = lockup.contentId
            if (!vid) continue

            let duration: string | null = null
            const overlays = lockup.contentImage?.thumbnailViewModel?.overlays || []
            for (const overlay of overlays) {
              const badge = overlay?.thumbnailBottomOverlayViewModel?.badges?.[0]?.thumbnailBadgeViewModel
              if (badge?.text) { duration = badge.text; break }
            }

            const metaRows = lockup.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows || []
            let viewCount: string | null = null
            for (const row of metaRows) {
              const parts = row.metadataParts || []
              if (parts[0]?.text?.content) viewCount = parts[0].text.content
            }

            supplemental.videos.set(vid, { duration, view_count: viewCount })
          } else {
            // Legacy format
            const vr = inner?.videoRenderer || inner?.gridVideoRenderer
            if (!vr?.videoId) continue

            const duration = vr.lengthText?.simpleText || vr.lengthText?.runs?.[0]?.text || null
            const viewText = vr.viewCountText
            const viewCount = typeof viewText === 'string' ? viewText
              : viewText?.simpleText || viewText?.runs?.[0]?.text || null

            supplemental.videos.set(vr.videoId, { duration, view_count: viewCount })
          }
        }
        break
      }
    }
  }

  return supplemental
}

// ============================================================
//  Merge: API primary + scraping supplement
// ============================================================

function mergeChannelData(api: ChannelInfo, supplemental: SupplementalData | null, handle: string): ChannelInfo {
  if (!supplemental) return api

  // Merge videos – fill in duration & view_count from scraped data
  const mergedVideos = api.videos.map((v) => {
    const extra = supplemental.videos.get(v.video_id)
    if (extra) {
      return { ...v, duration: extra.duration || v.duration, view_count: extra.view_count || v.view_count }
    }
    return v
  })

  // Add any scraped videos not in API list (unlikely but safe)
  for (const [vid, extra] of supplemental.videos) {
    if (!mergedVideos.find((v) => v.video_id === vid)) {
      mergedVideos.push({
        video_id: vid,
        title: '',
        thumbnail_url: '',
        duration: extra.duration,
        view_count: extra.view_count,
        published_at: null,
        video_url: `https://www.youtube.com/watch?v=${vid}`,
      })
    }
  }

  // Merge social_links – scraped links win, ensure YouTube is always present
  const channel_urls: Record<string, string> = {
    YouTube: `https://youtube.com/@${handle}`,
    ...supplemental.social_links,
  }

  // Ensure YouTube channel_urls are not overwritten by scraped (scraped may return wiki-type links)
  if (supplemental.social_links['YouTube']) {
    channel_urls['YouTube'] = `https://youtube.com/@${handle}`
  }

  // Platforms – merge API + scraped, deduplicate
  const platformSet = new Set([...api.platform, ...supplemental.platforms])

  // Email – from scraped description
  const email = supplemental.email || extractEmail(api.bio)

  return {
    display_name: api.display_name,
    avatar_url: api.avatar_url,
    bio: api.bio || supplemental.bio,
    followers_count: api.followers_count, // API is more precise
    platform: [...platformSet],
    channel_urls,
    location: api.location || supplemental.location,
    email,
    videos: mergedVideos.slice(0, 30),
  }
}

// ============================================================
//  Pure scraping fallback (no API key)
// ============================================================

async function fetchViaScrapingFull(handle: string, channelUrl: string): Promise<ChannelInfo> {
  const mainHtml = await fetchPageHtml(channelUrl)
  if (!mainHtml) throw new Error('无法访问频道页面')

  const mainData = parseYtInitialData(mainHtml)
  if (!mainData) throw new Error('无法解析频道页面，可能需要 API Key')

  const header = mainData?.header?.pageHeaderRenderer?.content?.pageHeaderViewModel

  // Display name
  const titleContent = header?.title?.dynamicTextViewModel?.text
  let display_name = handle
  if (titleContent?.runs) {
    const run = Array.isArray(titleContent.runs)
      ? (typeof titleContent.runs[0] === 'string' ? titleContent.runs[0] : titleContent.runs[0]?.text)
      : null
    display_name = run || titleContent?.content || handle
  } else if (titleContent?.content) {
    display_name = titleContent.content
  }

  // Avatar
  const imageSources = header?.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources || []
  const bestImage = imageSources.length > 0
    ? imageSources.reduce((a: any, b: any) => (a.width > b.width ? a : b))
    : null
  const avatar_url = bestImage?.url ? getHighResAvatar(bestImage.url) : null

  // Subscriber count
  const metaRows = header?.metadata?.contentMetadataViewModel?.metadataRows || []
  let subText = ''
  for (const row of metaRows) {
    for (const part of row.metadataParts || []) {
      if (part.text?.content?.toLowerCase().includes('subscriber')) {
        subText = part.text.content
      }
    }
  }
  const followers_count = subText ? parseSubCount(subText) : null

  // Scrape supplemental
  const supplemental = await scrapeSupplementalData(channelUrl)

  // Videos (full scrape, already has duration/view_count)
  const videosHtml = await fetchPageHtml(channelUrl + 'videos')
  const videos: VideoInfo[] = []
  if (videosHtml) {
    const videosData = parseYtInitialData(videosHtml)
    if (videosData) {
      const tabs = videosData?.contents?.twoColumnBrowseResultsRenderer?.tabs || []
      for (const tab of tabs) {
        const tr = tab?.tabRenderer || {}
        const url = tr?.endpoint?.commandMetadata?.webCommandMetadata?.url || ''
        if (!url.includes('/videos') && tr.tabIdentifier !== 'VIDEOS') continue

        const richGrid = tr?.content?.richGridRenderer
        if (!richGrid) continue

        for (const item of richGrid.contents || []) {
          if (item.continuationItemRenderer) continue
          if (videos.length >= 10) break

          const inner = item?.richItemRenderer?.content
          const lockup = inner?.lockupViewModel

          if (lockup) {
            const vid = lockup.contentId
            if (!vid) continue

            const meta = lockup.metadata?.lockupMetadataViewModel || {}
            const title = meta.title?.content

            const thumbs = lockup.contentImage?.thumbnailViewModel?.image?.sources || []
            const bestT = thumbs.reduce((a: any, b: any) => (a.width * a.height > b.width * b.height ? a : b), thumbs[0] || {})

            let duration: string | null = null
            const overlays = lockup.contentImage?.thumbnailViewModel?.overlays || []
            for (const overlay of overlays) {
              const badge = overlay?.thumbnailBottomOverlayViewModel?.badges?.[0]?.thumbnailBadgeViewModel
              if (badge?.text) { duration = badge.text; break }
            }

            const mRows = meta.metadata?.contentMetadataViewModel?.metadataRows || []
            let viewCount: string | null = null
            let publishedAt: string | null = null
            if (mRows[0]?.metadataParts?.[0]?.text?.content) viewCount = mRows[0].metadataParts[0].text.content
            if (mRows[0]?.metadataParts?.[1]?.text?.content) publishedAt = mRows[0].metadataParts[1].text.content

            videos.push({ video_id: vid, title: title || '', thumbnail_url: bestT?.url || '', duration, view_count: viewCount, published_at: publishedAt, video_url: `https://www.youtube.com/watch?v=${vid}` })
          } else {
            const vr = inner?.videoRenderer || inner?.gridVideoRenderer
            if (!vr?.videoId) continue
            const t = vr.title
            const title = typeof t === 'string' ? t : t?.runs?.[0]?.text || t?.simpleText || ''
            const thumbs = vr.thumbnail?.thumbnails || []
            const bestT = thumbs.reduce((a: any, b: any) => (a.width * a.height > b.width * b.height ? a : b), thumbs[0] || {})
            const duration = vr.lengthText?.simpleText || vr.lengthText?.runs?.[0]?.text || null
            const pt = vr.publishedTimeText
            const publishedAt = typeof pt === 'string' ? pt : pt?.simpleText || pt?.runs?.[0]?.text || null
            const vt = vr.viewCountText
            const viewCount = typeof vt === 'string' ? vt : vt?.simpleText || vt?.runs?.[0]?.text || null
            videos.push({ video_id: vr.videoId, title, thumbnail_url: bestT?.url || '', duration, view_count: viewCount, published_at: publishedAt, video_url: `https://www.youtube.com/watch?v=${vr.videoId}` })
          }
        }
        break
      }
    }
  }

  const sc = supplemental
  return {
    display_name,
    avatar_url,
    bio: sc?.bio || null,
    followers_count,
    platform: sc?.platforms || ['YouTube'],
    channel_urls: { YouTube: channelUrl.replace(/\/$/, ''), ...(sc?.social_links || {}) },
    location: sc?.location || null,
    email: sc?.email || null,
    videos,
  }
}

function parseSubCount(text: string): number | null {
  const clean = text.toLowerCase().replace(/,/g, '').trim()
  const match = clean.match(/([\d.]+)\s*([km]?)/)
  if (!match) return null
  const num = parseFloat(match[1])
  if (match[2] === 'k') return Math.round(num * 1000)
  if (match[2] === 'm') return Math.round(num * 1000000)
  return Math.round(num)
}
