import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'

/**
 * Dedicated endpoint for cookie refresh from the Chrome extension.
 * Receives Netscape-format cookies and writes them to disk for yt-dlp.
 */
export async function POST(request: Request) {
  try {
    const { cookies } = await request.json()

    if (!cookies || typeof cookies !== 'string') {
      return NextResponse.json(
        { error: 'Missing cookies data' },
        { status: 400 }
      )
    }

    const cookiesFile = process.env.YOUTUBE_COOKIES_FILE || '/home/ubuntu/celepulse/cookies_youtube.txt'
    await writeFile(cookiesFile, cookies, 'utf-8')

    const count = cookies.split('\n').filter((l: string) => l && !l.startsWith('#')).length
    console.log(`[RefreshCookies] Saved ${count} cookies to ${cookiesFile}`)

    return NextResponse.json({ ok: true, count })
  } catch (e) {
    console.error('[RefreshCookies] Error:', e)
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    )
  }
}
