// One-time backfill script for influencer YouTube channel fields
// Run: node scripts/backfill_influencers.js

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const API_KEY = process.env.YOUTUBE_API_KEY
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function resolveChannelId(handle) {
  // Use channels.list with forHandle
  const params = new URLSearchParams({
    part: 'snippet',
    forHandle: `@${handle}`,
    key: API_KEY,
  })
  const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params}`)
  const data = await res.json()
  return data.items?.[0]?.id || null
}

async function fetchChannel(channelId) {
  const params = new URLSearchParams({
    part: 'snippet,statistics,brandingSettings',
    id: channelId,
    key: API_KEY,
  })
  const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params}`)
  const data = await res.json()
  const ch = data.items?.[0]
  if (!ch) return null

  const s = ch.snippet
  const st = ch.statistics
  const branding = ch.brandingSettings

  return {
    title: s?.title || '',
    description: s?.description || null,
    country: s?.country || null,
    avatar_url: s?.thumbnails?.default?.url
      ? s.thumbnails.default.url.split('=s')[0] + '=s800-c-k-c0x00ffffff-no-rj'
      : null,
    subscriber_count: st?.subscriberCount ? parseInt(st.subscriberCount, 10) : null,
    total_views: st?.viewCount ? parseInt(st.viewCount, 10) : null,
    video_count: st?.videoCount ? parseInt(st.videoCount, 10) : null,
    channel_created_at: s?.publishedAt || null,
    banner_url: branding?.image?.bannerExternalUrl
      ? branding.image.bannerExternalUrl + '=w2560-h340-fcrop64=1,00005a5bffffab6a-k-c0xffffffff-no-nd-rj'
      : null,
  }
}

async function extractHandle(url) {
  // https://youtube.com/@handle
  const match = url.match(/@([^/?]+)/)
  return match ? match[1] : null
}

// Fetch social links from YouTube /about page
async function fetchAboutData(channelUrl) {
  try {
    const aboutUrl = channelUrl.replace(/\/$/, '') + '/about'
    const res = await fetch(aboutUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    const html = await res.text()
    const match = html.match(/ytInitialData\s*=\s*({[\s\S]+?});\s*<\/script>/)
    if (!match) return null

    const data = JSON.parse(match[1])
    const result = { social_links: {}, email: null }

    const endpoints = data?.onResponseReceivedEndpoints || []
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

          if (aboutMeta.description) {
            const emailMatch = aboutMeta.description.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)
            if (emailMatch) result.email = emailMatch[0]
          }

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
                try {
                  const u = new URL(urlEndpoint.url)
                  const q = u.searchParams.get('q')
                  actualUrl = (q && q.startsWith('http')) ? q : urlEndpoint.url
                } catch { actualUrl = urlEndpoint.url }
                break
              }
            }

            if (actualUrl && title) {
              result.social_links[title] = actualUrl
            }
          }
          return result
        }
      }
    }

    return result
  } catch (e) {
    console.error('  Failed to fetch about page:', e.message)
    return null
  }
}

function classifySocialLinks(links) {
  const result = { website: null, twitter: null, facebook: null, linkedin: null, instagram: null, tiktok: null }
  for (const [title, url] of Object.entries(links)) {
    const u = url.toLowerCase()
    if (u.includes('twitter.com') || u.includes('x.com')) result.twitter = url
    else if (u.includes('facebook.com') || u.includes('fb.com')) result.facebook = url
    else if (u.includes('linkedin.com')) result.linkedin = url
    else if (u.includes('instagram.com')) result.instagram = url
    else if (u.includes('tiktok.com')) result.tiktok = url
    else if (!result.website && !u.includes('youtube.com')) result.website = url
  }
  return result
}

async function main() {
  const { data: influencers } = await supabase
    .from('influencers')
    .select('id, display_name, channel_urls')
    .not('channel_urls', 'is', null)

  const ytInfluencers = (influencers || []).filter(i => i.channel_urls?.YouTube)

  console.log(`Found ${ytInfluencers.length} influencers with YouTube channels`)

  for (const inf of ytInfluencers) {
    console.log(`\nProcessing: ${inf.display_name}`)
    const handle = await extractHandle(inf.channel_urls.YouTube)
    if (!handle) {
      console.log('  Could not extract handle, skipping')
      continue
    }

    const channelId = await resolveChannelId(handle)
    if (!channelId) {
      console.log('  Could not resolve channel ID, skipping')
      continue
    }
    console.log(`  Channel ID: ${channelId}`)

    const channelData = await fetchChannel(channelId)
    if (!channelData) {
      console.log('  Could not fetch channel data, skipping')
      continue
    }

    console.log(`  Subscribers: ${channelData.subscriber_count}`)
    console.log(`  Total views: ${channelData.total_views}`)
    console.log(`  Videos: ${channelData.video_count}`)
    console.log(`  Country: ${channelData.country}`)
    console.log(`  Banner: ${channelData.banner_url ? 'Yes' : 'No'}`)

    // Fetch social links from about page
    console.log('  Fetching social links...')
    const aboutData = await fetchAboutData(inf.channel_urls.YouTube)
    const classified = aboutData ? classifySocialLinks(aboutData.social_links) : {}
    const email = aboutData?.email || null

    if (aboutData) {
      console.log(`  Social links found: ${Object.keys(aboutData.social_links).length}`)
      if (email) console.log(`  Email: ${email}`)
      if (classified.website) console.log(`  Website: ${classified.website}`)
      if (classified.instagram) console.log(`  Instagram: ${classified.instagram}`)
      if (classified.tiktok) console.log(`  TikTok: ${classified.tiktok}`)
      if (classified.twitter) console.log(`  Twitter: ${classified.twitter}`)
      if (classified.facebook) console.log(`  Facebook: ${classified.facebook}`)
      if (classified.linkedin) console.log(`  LinkedIn: ${classified.linkedin}`)
    } else {
      console.log('  No about page data found')
    }

    const { error } = await supabase.from('influencers').update({
      youtube_channel_id: channelId,
      channel_handle: handle,
      channel_description: channelData.description,
      channel_banner_url: channelData.banner_url,
      total_views: channelData.total_views,
      video_count: channelData.video_count,
      channel_created_at: channelData.channel_created_at,
      followers_count: channelData.subscriber_count,
      avatar_url: channelData.avatar_url || inf.avatar_url,
      location: channelData.country,
      // Social links
      ...(classified.website ? { website: classified.website } : {}),
      ...(classified.twitter ? { twitter: classified.twitter } : {}),
      ...(classified.facebook ? { facebook: classified.facebook } : {}),
      ...(classified.linkedin ? { linkedin: classified.linkedin } : {}),
      ...(classified.instagram ? { instagram: classified.instagram } : {}),
      ...(classified.tiktok ? { tiktok: classified.tiktok } : {}),
      ...(email ? { email } : {}),
    }).eq('id', inf.id)

    if (error) {
      console.log(`  Error: ${error.message}`)
    } else {
      console.log('  Updated successfully')
    }
  }

  console.log('\nDone!')
}

main().catch(console.error)
