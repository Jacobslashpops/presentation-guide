import { NextResponse } from 'next/server'
import { fetchSyncData } from '@/lib/youtube'

export async function POST(request: Request) {
  try {
    const { videoId } = await request.json()
    if (!videoId || typeof videoId !== 'string') {
      return NextResponse.json({ error: '缺少 videoId' }, { status: 400 })
    }

    const result = await fetchSyncData(videoId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('YouTube sync API error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
