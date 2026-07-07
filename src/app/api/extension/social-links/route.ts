import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      influencer_id,
      channel_url,
      email,
      website,
      twitter,
      facebook,
      linkedin,
      instagram,
      tiktok,
      raw_links,
    } = body

    if (!influencer_id) {
      return NextResponse.json(
        { error: 'Missing required field: influencer_id' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Fetch existing influencer
    const { data: existing, error: fetchError } = await supabase
      .from('influencers')
      .select('*')
      .eq('id', influencer_id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Influencer not found' },
        { status: 404 }
      )
    }

    // Build updates - only fill null/empty fields
    const updates: Record<string, unknown> = {
      last_collected_at: new Date().toISOString(),
    }

    // Structured social link fields
    if (!existing.website && website) updates.website = website
    if (!existing.twitter && twitter) updates.twitter = twitter
    if (!existing.facebook && facebook) updates.facebook = facebook
    if (!existing.linkedin && linkedin) updates.linkedin = linkedin
    if (!existing.instagram && instagram) updates.instagram = instagram
    if (!existing.tiktok && tiktok) updates.tiktok = tiktok

    // Email
    if (!existing.email && email) updates.email = email

    // Merge raw_links into channel_urls JSONB
    if (raw_links && Object.keys(raw_links).length > 0) {
      const existingUrls = (existing.channel_urls as Record<string, string>) || {}
      const mergedUrls = { ...raw_links, ...existingUrls }
      if (JSON.stringify(mergedUrls) !== JSON.stringify(existingUrls)) {
        updates.channel_urls = mergedUrls
      }
    }

    // Merge platform array based on available links
    const existingPlatforms: string[] = existing.platform || []
    const platformMap: Record<string, string> = {
      twitter: 'Twitter',
      facebook: 'Facebook',
      linkedin: 'LinkedIn',
      instagram: 'Instagram',
      tiktok: 'TikTok',
    }
    const newPlatforms = [...existingPlatforms]
    for (const [field, platformName] of Object.entries(platformMap)) {
      if ((body as Record<string, unknown>)[field] && !newPlatforms.includes(platformName)) {
        newPlatforms.push(platformName)
      }
    }
    if (newPlatforms.length !== existingPlatforms.length) {
      updates.platform = newPlatforms
    }

    // Apply updates if there are changes beyond last_collected_at
    if (Object.keys(updates).length > 1) {
      const { error: updateError } = await supabase
        .from('influencers')
        .update(updates)
        .eq('id', influencer_id)

      if (updateError) {
        console.error('Social links update error:', updateError)
        throw updateError
      }
    }

    revalidatePath('/influencers')
    revalidatePath(`/influencers/${influencer_id}`)

    return NextResponse.json({
      ok: true,
      influencer_id,
      updated_fields: Object.keys(updates).filter(k => k !== 'last_collected_at'),
    })
  } catch (error) {
    console.error('Extension social-links error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
