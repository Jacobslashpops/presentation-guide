/**
 * YouTube API 共享模块
 * 供 API Route 和 Server Action 直接使用，避免 HTTP 自调用依赖端口问题
 */

import { createYouTubeTranscriptApi } from 'youtube-transcript-api-js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommentData {
  platform_comment_id: string
  author_name: string | null
  author_avatar_url: string | null
  author_channel_url: string | null
  text: string
  like_count: number
  published_at: string | null
  is_reply: boolean
  parent_comment_id: string | null
}

export interface ChannelData {
  channel_id: string
  handle: string | null
  title: string
  avatar_url: string | null
  subscriber_count: number | null
  country: string | null
  description: string | null
  channel_description: string | null
  banner_url: string | null
  total_views: number | null
  video_count: number | null
  channel_created_at: string | null
}

export interface VideoPostData {
  platform_post_id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  duration: string | null
  published_at: string | null
  url: string
  view_count: number | null
  like_count: number | null
  comment_count: number | null
  comments_disabled: boolean
  comments: CommentData[]
  channel: ChannelData
  // New fields
  tags: string[]
  hashtags: string[]
  channel_title: string
  language: string | null
  category_id: number | null
}

export interface SyncPostData {
  view_count: number | null
  like_count: number | null
  comment_count: number | null
  comments_disabled: boolean
  comments: CommentData[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) throw new Error('YOUTUBE_API_KEY 未配置')
  return key
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u4e00-\u9fff]+/g)
  if (!matches) return []
  // Deduplicate and remove the # prefix
  return [...new Set(matches.map((t) => t.slice(1)))]
}

export function extractVideoId(url: string): string | null {
  // Standard: youtube.com/watch?v=VIDEO_ID
  const standardMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (standardMatch) return standardMatch[1]

  // Short: youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return shortMatch[1]

  // Embed: youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/)
  if (embedMatch) return embedMatch[1]

  // Shorts: youtube.com/shorts/VIDEO_ID
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/)
  if (shortsMatch) return shortsMatch[1]

  return null
}

function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return iso
  const h = match[1] ? `${match[1]}:` : ''
  const m = match[2] ? match[2].padStart(h ? 2 : 1, '0') : '0'
  const s = match[3] ? match[3].padStart(2, '0') : '00'
  return `${h}${m}:${s}`
}

// ─── API Calls ────────────────────────────────────────────────────────────────

const MAX_COMMENT_PAGES = 10 // max 1000 comments per sync

export async function fetchAllComments(
  videoId: string,
  apiKey: string,
  maxPages: number = MAX_COMMENT_PAGES
): Promise<{ comments: CommentData[]; disabled: boolean }> {
  const comments: CommentData[] = []
  let pageToken: string | null = null
  let pages = 0

  while (pages < maxPages) {
    const params = new URLSearchParams({
      part: 'snippet,replies',
      videoId,
      maxResults: '100',
      order: 'time',
      key: apiKey,
    })
    if (pageToken) params.set('pageToken', pageToken)

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?${params}`
    )

    if (!res.ok) {
      const errorData = await res.json().catch(() => null)
      const errorCode = errorData?.error?.errors?.[0]?.reason
      if (errorCode === 'commentsDisabled') {
        return { comments, disabled: true }
      }
      console.error('YouTube comments API error:', errorData)
      break
    }

    const data = await res.json()
    const items = data.items || []

    for (const thread of items) {
      const topComment = thread.snippet?.topLevelComment?.snippet
      if (!topComment) continue

      comments.push({
        platform_comment_id: thread.id,
        author_name: topComment.authorDisplayName || null,
        author_avatar_url: topComment.authorProfileImageUrl || null,
        author_channel_url: topComment.authorChannelUrl || null,
        text: topComment.textDisplay || topComment.textOriginal || '',
        like_count: topComment.likeCount || 0,
        published_at: topComment.publishedAt || null,
        is_reply: false,
        parent_comment_id: null,
      })

      if (thread.replies?.comments) {
        for (const reply of thread.replies.comments) {
          const snippet = reply.snippet
          if (!snippet) continue
          comments.push({
            platform_comment_id: reply.id,
            author_name: snippet.authorDisplayName || null,
            author_avatar_url: snippet.authorProfileImageUrl || null,
            author_channel_url: snippet.authorChannelUrl || null,
            text: snippet.textDisplay || snippet.textOriginal || '',
            like_count: snippet.likeCount || 0,
            published_at: snippet.publishedAt || null,
            is_reply: true,
            parent_comment_id: thread.id,
          })
        }
      }
    }

    pageToken = data.nextPageToken || null
    pages++
    if (!pageToken) break
  }

  return { comments, disabled: false }
}

export async function fetchChannelInfo(
  channelId: string,
  apiKey: string
): Promise<ChannelData | null> {
  const params = new URLSearchParams({
    part: 'snippet,statistics,brandingSettings',
    id: channelId,
    key: apiKey,
  })

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?${params}`
  )

  if (!res.ok) {
    console.error('YouTube channels API error:', res.statusText)
    return null
  }

  const data = await res.json()
  const channel = data.items?.[0]
  if (!channel) return null

  const s = channel.snippet
  const st = channel.statistics
  const branding = channel.brandingSettings

  const customUrl = s?.customUrl || null
  const handle = customUrl?.startsWith('@') ? customUrl.slice(1) : customUrl

  return {
    channel_id: channelId,
    handle,
    title: s?.title || '',
    avatar_url: s?.thumbnails?.default?.url
      ? s.thumbnails.default.url.split('=s')[0] + '=s800-c-k-c0x00ffffff-no-rj'
      : null,
    subscriber_count: st?.subscriberCount
      ? parseInt(st.subscriberCount, 10)
      : null,
    country: s?.country || null,
    description: s?.description?.slice(0, 500) || null,
    channel_description: s?.description || null,
    banner_url: branding?.image?.bannerExternalUrl
      ? branding.image.bannerExternalUrl + '=w2560-h340-fcrop64=1,00005a5bffffab6a-k-c0xffffffff-no-nd-rj'
      : null,
    total_views: st?.viewCount ? parseInt(st.viewCount, 10) : null,
    video_count: st?.videoCount ? parseInt(st.videoCount, 10) : null,
    channel_created_at: s?.publishedAt || null,
  }
}

/**
 * 获取完整的 Post 数据（视频详情 + 评论 + 频道信息）
 * 供 createPost 使用
 */
export async function fetchPostData(url: string): Promise<VideoPostData> {
  const apiKey = getApiKey()

  const videoId = extractVideoId(url)
  if (!videoId) {
    throw new Error('无法解析 YouTube URL，请检查链接格式')
  }

  // Fetch video details
  const videoParams = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    id: videoId,
    key: apiKey,
  })
  const videoRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${videoParams}`
  )
  if (!videoRes.ok) {
    const err = await videoRes.json().catch(() => null)
    throw new Error(`YouTube API 错误: ${err?.error?.message || videoRes.statusText}`)
  }

  const videoData = await videoRes.json()
  if (!videoData.items?.length) {
    throw new Error('未找到该视频，可能已被删除或设为私密')
  }

  const video = videoData.items[0]
  const snippet = video.snippet
  const stats = video.statistics
  const contentDetails = video.contentDetails

  // Fetch channel + comments in parallel
  const channelId = snippet?.channelId
  const [channelData, commentsResult] = await Promise.all([
    channelId ? fetchChannelInfo(channelId, apiKey) : Promise.resolve(null),
    fetchAllComments(videoId, apiKey),
  ])

  const { comments, disabled } = commentsResult

  if (!channelData) {
    throw new Error('无法获取频道信息')
  }

  const fullDescription = snippet?.description || ''

  return {
    platform_post_id: videoId,
    title: snippet?.title || '',
    description: fullDescription || null,
    thumbnail_url:
      snippet?.thumbnails?.maxres?.url ||
      snippet?.thumbnails?.high?.url ||
      snippet?.thumbnails?.default?.url ||
      null,
    duration: contentDetails?.duration
      ? parseDuration(contentDetails.duration)
      : null,
    published_at: snippet?.publishedAt || null,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    view_count: stats?.viewCount ? parseInt(stats.viewCount, 10) : null,
    like_count: stats?.likeCount ? parseInt(stats.likeCount, 10) : null,
    comment_count: stats?.commentCount ? parseInt(stats.commentCount, 10) : null,
    comments_disabled: disabled,
    comments,
    channel: channelData,
    tags: snippet?.tags || [],
    hashtags: extractHashtags(fullDescription),
    channel_title: snippet?.channelTitle || channelData.title,
    language: snippet?.defaultLanguage || null,
    category_id: snippet?.categoryId ? parseInt(snippet.categoryId, 10) : null,
  }
}

/**
 * 获取同步数据（视频统计 + 评论）
 * 供 syncPost 使用
 */
export async function fetchSyncData(videoId: string): Promise<SyncPostData> {
  const apiKey = getApiKey()

  const videoParams = new URLSearchParams({
    part: 'snippet,statistics',
    id: videoId,
    key: apiKey,
  })
  const videoRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${videoParams}`
  )
  if (!videoRes.ok) {
    throw new Error('YouTube API 错误')
  }

  const videoData = await videoRes.json()
  if (!videoData.items?.length) {
    throw new Error('视频未找到')
  }

  const stats = videoData.items[0].statistics

  const { comments, disabled } = await fetchAllComments(videoId, apiKey)

  return {
    view_count: stats?.viewCount ? parseInt(stats.viewCount, 10) : null,
    like_count: stats?.likeCount ? parseInt(stats.likeCount, 10) : null,
    comment_count: stats?.commentCount ? parseInt(stats.commentCount, 10) : null,
    comments_disabled: disabled,
    comments,
  }
}

// ─── Transcription ─────────────────────────────────────────────────────────────

export interface TranscriptionResult {
  text: string
  language: string | null
  source: 'youtube_subtitle'
}

/**
 * Fetch YouTube video transcription/subtitles using youtube-transcript-api-js.
 * Prioritizes manually created subtitles over auto-generated ones.
 * Returns null if no subtitles are available.
 */
export async function fetchYouTubeTranscription(
  videoId: string
): Promise<TranscriptionResult | null> {
  try {
    const api = createYouTubeTranscriptApi()
    const transcriptList = await api.list(videoId)

    // Get all transcripts and prioritize manually created over auto-generated
    const allTranscripts = transcriptList.getAllTranscripts()
    if (allTranscripts.length === 0) return null

    const manual = allTranscripts.find((t) => !t.isGenerated)
    const generated = allTranscripts.find((t) => t.isGenerated)
    const transcript = manual || generated || null
    if (!transcript) return null

    const fetched = await transcript.fetch()
    // Join snippets with spaces (each snippet is a few words), decode HTML entities,
    // strip any remaining HTML tags, and collapse multiple spaces
    const raw = fetched.snippets.map((s) => s.text).join(' ')
    const text = raw
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    return {
      text,
      language: fetched.languageCode || null,
      source: 'youtube_subtitle',
    }
  } catch (error) {
    console.error('YouTube transcription fetch error:', error)
    return null
  }
}
