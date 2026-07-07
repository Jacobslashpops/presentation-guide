/**
 * @deprecated This route is kept for backward compatibility with older extension versions.
 * New extension versions (v2.0+) should use /api/extension/collect instead,
 * which supports silent collection without requiring an influencer_id.
 */
import { NextResponse } from 'next/server'
import { supplementInfluencerFromYouTube } from '@/lib/actions'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { influencer_id, social_links, email, platform, videos } = body

    if (!influencer_id || typeof influencer_id !== 'string') {
      return NextResponse.json({ error: '缺少 influencer_id' }, { status: 400 })
    }

    await supplementInfluencerFromYouTube(influencer_id, {
      social_links: social_links || undefined,
      email: email || undefined,
      platform: platform || undefined,
      videos: videos || undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Supplement error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
