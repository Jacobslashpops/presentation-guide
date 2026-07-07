import { NextResponse } from 'next/server'
import { fetchPostData } from '@/lib/youtube'

export async function POST(request: Request) {
  try {
    const { url } = await request.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: '缺少 url' }, { status: 400 })
    }

    const result = await fetchPostData(url)
    return NextResponse.json(result)
  } catch (error) {
    console.error('YouTube post API error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
