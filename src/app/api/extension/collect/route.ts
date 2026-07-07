import { NextResponse } from 'next/server'
import { upsertInfluencerFromExtension } from '@/lib/actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { writeFile } from 'fs/promises'

// Always save the latest cookies — newer cookies are more likely to be valid
let lastCookiesHash = ''

/**
 * Save YouTube cookies from extension payload to disk for yt-dlp.
 * Uses a content hash to avoid redundant disk writes.
 */
async function saveYouTubeCookies(cookies: string): Promise<void> {
  // Simple hash to skip identical cookie sets
  const hash = String(cookies.length) + ':' + cookies.substring(0, 200)
  if (hash === lastCookiesHash) return

  try {
    const cookiesFile = process.env.YOUTUBE_COOKIES_FILE || '/home/ubuntu/celepulse/cookies_youtube.txt'
    await writeFile(cookiesFile, cookies, 'utf-8')
    lastCookiesHash = hash
    console.log(`[Extension] YouTube cookies saved (${cookies.split('\n').filter(l => l && !l.startsWith('#')).length} cookies)`)
  } catch (e) {
    console.error('[Extension] Failed to save YouTube cookies:', e)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      platform,
      channel_url,
      display_name,
      avatar_url,
      bio,
      followers_count,
      email,
      location,
      social_links,
      videos,
      _youtube_cookies,
    } = body

    // Save YouTube cookies in the background (never blocks response)
    if (_youtube_cookies && typeof _youtube_cookies === 'string') {
      saveYouTubeCookies(_youtube_cookies).catch(() => {})
    }

    // Validate required fields
    if (!platform || !channel_url) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, channel_url' },
        { status: 400 }
      )
    }

    if (!['YouTube', 'Instagram', 'TikTok'].includes(platform)) {
      return NextResponse.json(
        { error: `Unsupported platform: ${platform}` },
        { status: 400 }
      )
    }

    // Parse followers_count if it's a string like "1.2M" or "123K"
    let parsedFollowers: number | null = null
    if (followers_count) {
      if (typeof followers_count === 'number') {
        parsedFollowers = followers_count
      } else {
        parsedFollowers = parseFollowerCount(String(followers_count))
      }
    }

    // Use admin client (service role key) to bypass RLS for extension data collection
    const adminClient = createAdminClient()

    const result = await upsertInfluencerFromExtension({
      platform,
      channel_url,
      display_name: display_name || null,
      avatar_url: avatar_url || null,
      bio: bio || null,
      followers_count: parsedFollowers,
      email: email || null,
      location: location || null,
      social_links: social_links || {},
      videos: videos || [],
    }, adminClient)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Extension collect error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * Parse follower count strings like "1.2M", "123K", "1,234" into numbers
 */
function parseFollowerCount(text: string): number | null {
  const clean = text.toLowerCase().replace(/,/g, '').trim()
  const match = clean.match(/([\d.]+)\s*([kmb]?)/)
  if (!match) return null
  const num = parseFloat(match[1])
  if (isNaN(num)) return null
  const suffix = match[2]
  if (suffix === 'k') return Math.round(num * 1000)
  if (suffix === 'm') return Math.round(num * 1000000)
  if (suffix === 'b') return Math.round(num * 1000000000)
  return Math.round(num)
}

