import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Lightweight endpoint for polling post transcription/sentiment status.
 * Returns only the status fields needed to update the UI in real-time.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('id')

  if (!postId) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from('posts')
    .select(
      'transcription_status, transcription_error, transcription_source, transcription_language, transcription, video_sentiment_status, video_sentiment, comment_sentiment_status, comment_sentiment'
    )
    .eq('id', postId)
    .single()

  if (error || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  return NextResponse.json(post)
}
