/**
 * CelePulse Import — YouTube Content Script (Silent Mode)
 *
 * Auto-detects channel pages and silently extracts data,
 * sending it to the CelePulse backend without any user interaction.
 */

// ===== Utility Functions =====

function extractEmail(text) {
  if (!text) return null
  const match = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)
  return match ? match[0] : null
}

function extractRedirectUrl(redirectUrl) {
  try {
    const url = new URL(redirectUrl)
    const q = url.searchParams.get('q')
    if (q && q.startsWith('http')) return q
  } catch (e) { /* ignore */ }
  return ''
}

// ===== Social Link Classification =====

function classifySocialLinks(links) {
  const result = {
    website: null,
    twitter: null,
    facebook: null,
    linkedin: null,
    instagram: null,
    tiktok: null,
  }
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

function parseSubCount(text) {
  if (!text) return null
  const clean = text.toLowerCase().replace(/,/g, '').trim()
  const match = clean.match(/([\d.]+)\s*([km]?)/)
  if (!match) return null
  const num = parseFloat(match[1])
  if (isNaN(num)) return null
  if (match[2] === 'k') return Math.round(num * 1000)
  if (match[2] === 'm') return Math.round(num * 1000000)
  return Math.round(num)
}

function getHighResAvatar(url) {
  if (!url) return null
  // Normalize to permanent ggpht.com domain (googleusercontent.com URLs are temporary)
  url = url.replace('yt3.googleusercontent.com', 'yt3.ggpht.com')
  return url.split('=s')[0] + '=s800-c-k-c0x00ffffff-no-rj'
}

// ===== Channel / Watch Page Detection =====

function isChannelPage() {
  const path = window.location.pathname
  if (!window.location.hostname.includes('youtube.com')) return false
  if (path.match(/^\/@[\w.-]+\/?(videos|about|playlists|community|channels)?\/?$/)) return true
  if (path.match(/^\/channel\/[\w-]+\/?(videos|about|playlists|community|channels)?\/?$/)) return true
  if (path.match(/^\/c\/[\w.-]+\/?(videos|about|playlists|community|channels)?\/?$/)) return true
  return false
}

function isWatchPage() {
  return window.location.hostname.includes('youtube.com') &&
         window.location.pathname === '/watch'
}

function getChannelBaseUrl() {
  const path = window.location.pathname
  const match = path.match(/^(\/(?:@[\w.-]+|channel\/[\w-]+|c\/[\w.-]+))/)
  if (!match) return null
  return 'https://www.youtube.com' + match[1]
}

function getChannelUrlFromWatchPage() {
  // Method 1: DOM — uploader link next to the video
  const channelLink = document.querySelector('ytd-video-owner-renderer a.yt-simple-endpoint[href*="/@"], ytd-video-owner-renderer a.yt-simple-endpoint[href*="/channel/"]')
  if (channelLink) {
    const href = channelLink.getAttribute('href')
    if (href) {
      const match = href.match(/(\/@[\w.-]+|\/channel\/[\w-]+)/)
      if (match) return 'https://www.youtube.com' + match[1]
    }
  }

  // Method 2: ytInitialData — browseEndpoint in videoSecondaryInfo
  try {
    const ytData = findYtInitialData()
    if (ytData) {
      const json = JSON.stringify(ytData)
      const patterns = [
        /"browseId":"(UC[\w-]+)"/,
        /"canonicalBaseUrl":"(\/@[\w.-]+)"/,
      ]
      for (const pat of patterns) {
        const m = json.match(pat)
        if (m) {
          if (m[1].startsWith('/')) return 'https://www.youtube.com' + m[1]
          return 'https://www.youtube.com/channel/' + m[1]
        }
      }
    }
  } catch (e) {}

  return null
}

// ===== Deduplication (24h) =====

async function shouldCollect(channelUrl) {
  const key = `collected:${channelUrl}`
  const storage = await chrome.storage.local.get(key)
  const lastCollected = storage[key]
  if (!lastCollected) return true
  // 1 hour cooldown
  return (Date.now() - lastCollected) > 60 * 60 * 1000
}

async function markCollected(channelUrl) {
  const key = `collected:${channelUrl}`
  await chrome.storage.local.set({ [key]: Date.now() })
}

// ===== Data Extraction from ytInitialData =====

function findYtInitialData() {
  const scripts = document.querySelectorAll('script')
  for (const script of scripts) {
    const text = script.textContent
    if (!text || !text.includes('ytInitialData')) continue

    // Find the start of the JSON object
    const idx = text.indexOf('ytInitialData')
    if (idx === -1) continue
    const eqIdx = text.indexOf('=', idx)
    if (eqIdx === -1) continue
    const braceStart = text.indexOf('{', eqIdx)
    if (braceStart === -1) continue

    // Use brace counting to find the matching closing brace
    let depth = 0
    let inString = false
    let escape = false
    for (let i = braceStart; i < text.length; i++) {
      const ch = text[i]
      if (escape) { escape = false; continue }
      if (ch === '\\') { escape = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (inString) continue
      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) {
          try { return JSON.parse(text.slice(braceStart, i + 1)) } catch (e) { break }
        }
      }
    }
  }

  // Fallback: try from innerHTML
  const html = document.documentElement.innerHTML
  const idx = html.indexOf('ytInitialData')
  if (idx === -1) return null
  const eqIdx = html.indexOf('=', idx)
  if (eqIdx === -1) return null
  const braceStart = html.indexOf('{', eqIdx)
  if (braceStart === -1) return null

  let depth = 0, inString = false, escape = false
  for (let i = braceStart; i < html.length; i++) {
    const ch = html[i]
    if (escape) { escape = false; continue }
    if (ch === '\\') { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        try { return JSON.parse(html.slice(braceStart, i + 1)) } catch (e) { return null }
      }
    }
  }
  return null
}

function extractChannelData(ytData) {
  const result = {
    display_name: null,
    avatar_url: null,
    followers_count: null,
    bio: null,
    email: null,
    location: null,
    social_links: {},
    videos: [],
  }

  // --- Extract from header ---
  const header = ytData?.header?.pageHeaderRenderer?.content?.pageHeaderViewModel
  if (header) {
    // Display name
    const titleContent = header?.title?.dynamicTextViewModel?.text
    if (titleContent?.runs) {
      const run = Array.isArray(titleContent.runs)
        ? (typeof titleContent.runs[0] === 'string' ? titleContent.runs[0] : titleContent.runs[0]?.text)
        : null
      result.display_name = run || titleContent?.content || null
    } else if (titleContent?.content) {
      result.display_name = titleContent.content
    }

    // Avatar
    const imageSources = header?.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources || []
    if (imageSources.length > 0) {
      const bestImage = imageSources.reduce((a, b) => (a.width > b.width ? a : b))
      result.avatar_url = getHighResAvatar(bestImage?.url)
    }

    // Subscriber count from metadata
    const metaRows = header?.metadata?.contentMetadataViewModel?.metadataRows || []
    for (const row of metaRows) {
      for (const part of row.metadataParts || []) {
        const text = part.text?.content || ''
        if (text.toLowerCase().includes('subscriber')) {
          result.followers_count = parseSubCount(text)
        }
        // Also try to find email in metadata
        const email = extractEmail(text)
        if (email) result.email = email
      }
    }
  }

  // --- Bio from channelMetadataRenderer ---
  const metadata = ytData?.metadata?.channelMetadataRenderer
  if (metadata) {
    if (metadata.description) {
      result.bio = metadata.description.slice(0, 500)
      const email = extractEmail(metadata.description)
      if (email) result.email = result.email || email
    }
  }

  // --- Videos from content tabs ---
  const tabs = ytData?.contents?.twoColumnBrowseResultsRenderer?.tabs || []
  for (const tab of tabs) {
    const tabRenderer = tab?.tabRenderer || tab?.expandableTabRenderer || {}
    const content = tabRenderer?.content
    if (!content) continue

    const richGrid = content.richGridRenderer
    if (richGrid) {
      const items = richGrid.contents || []
      for (const item of items) {
        if (item.continuationItemRenderer) continue
        if (result.videos.length >= 30) break

        const inner = item?.richItemRenderer?.content
        const lockup = inner?.lockupViewModel

        if (lockup) {
          const videoId = lockup.contentId
          if (!videoId) continue

          // Title
          const meta = lockup.metadata?.lockupMetadataViewModel || {}
          const title = meta.title?.content || ''

          // Thumbnail
          const thumbs = lockup.contentImage?.thumbnailViewModel?.image?.sources || []
          const bestThumb = thumbs.length > 0
            ? thumbs.reduce((a, b) => (a.width * a.height > b.width * b.height ? a : b))
            : null

          // Duration from overlays
          let duration = null
          const overlays = lockup.contentImage?.thumbnailViewModel?.overlays || []
          for (const overlay of overlays) {
            const badge = overlay?.thumbnailBottomOverlayViewModel?.badges?.[0]?.thumbnailBadgeViewModel
            if (badge?.text) { duration = badge.text; break }
          }

          // View count and date from metadata rows
          const mRows = meta.metadata?.contentMetadataViewModel?.metadataRows || []
          let viewCount = null
          let publishedAt = null
          for (const row of mRows) {
            const parts = row.metadataParts || []
            if (parts[0]?.text?.content) viewCount = parts[0].text.content
            if (parts[1]?.text?.content) publishedAt = parts[1].text.content
          }

          result.videos.push({
            video_id: videoId,
            title,
            thumbnail_url: bestThumb?.url || null,
            duration,
            view_count: viewCount,
            published_at: publishedAt,
            video_url: `https://www.youtube.com/watch?v=${videoId}`,
          })
        } else {
          // Legacy format
          const vr = inner?.videoRenderer || inner?.gridVideoRenderer
          if (!vr?.videoId) continue

          const thumbs = vr.thumbnail?.thumbnails || []
          const bestThumb = thumbs.length > 0
            ? thumbs.reduce((a, b) => (a.width * a.height > b.width * b.height ? a : b))
            : null

          result.videos.push({
            video_id: vr.videoId,
            title: typeof vr.title === 'string' ? vr.title : vr.title?.runs?.[0]?.text || vr.title?.simpleText || '',
            thumbnail_url: bestThumb?.url || null,
            duration: vr.lengthText?.simpleText || vr.lengthText?.runs?.[0]?.text || null,
            view_count: typeof vr.viewCountText === 'string' ? vr.viewCountText
              : vr.viewCountText?.simpleText || vr.viewCountText?.runs?.[0]?.text || null,
            published_at: vr.publishedTimeText?.simpleText || vr.publishedTimeText?.runs?.[0]?.text || null,
            video_url: `https://www.youtube.com/watch?v=${vr.videoId}`,
          })
        }
      }
      break
    }
  }

  return result
}

// ===== Fetch /videos Page for Video List =====

async function fetchVideosPageData(channelBaseUrl) {
  const videosUrl = channelBaseUrl + '/videos'
  try {
    const response = await fetch(videosUrl)
    const html = await response.text()

    const idx = html.indexOf('ytInitialData')
    if (idx === -1) return null
    const eqIdx = html.indexOf('=', idx)
    if (eqIdx === -1) return null
    const braceStart = html.indexOf('{', eqIdx)
    if (braceStart === -1) return null

    let data = null
    let depth = 0, inString = false, escape = false
    for (let i = braceStart; i < html.length; i++) {
      const ch = html[i]
      if (escape) { escape = false; continue }
      if (ch === '\\') { escape = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (inString) continue
      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) {
          try { data = JSON.parse(html.slice(braceStart, i + 1)) } catch (e) {}
          break
        }
      }
    }
    if (!data) return null

    const videos = []
    const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || []
    for (const tab of tabs) {
      const tr = tab?.tabRenderer || {}
      const url = tr?.endpoint?.commandMetadata?.webCommandMetadata?.url || ''
      if (!url.includes('/videos') && tr.tabIdentifier !== 'VIDEOS') continue

      const richGrid = tr?.content?.richGridRenderer
      if (!richGrid) continue

      for (const item of richGrid.contents || []) {
        if (item.continuationItemRenderer) continue
        if (videos.length >= 30) break

        const inner = item?.richItemRenderer?.content
        const lockup = inner?.lockupViewModel

        if (lockup) {
          const videoId = lockup.contentId
          if (!videoId) continue

          const meta = lockup.metadata?.lockupMetadataViewModel || {}
          const title = meta.title?.content || ''

          const thumbs = lockup.contentImage?.thumbnailViewModel?.image?.sources || []
          const bestThumb = thumbs.length > 0
            ? thumbs.reduce((a, b) => (a.width * a.height > b.width * b.height ? a : b))
            : null

          let duration = null
          const overlays = lockup.contentImage?.thumbnailViewModel?.overlays || []
          for (const overlay of overlays) {
            const badge = overlay?.thumbnailBottomOverlayViewModel?.badges?.[0]?.thumbnailBadgeViewModel
            if (badge?.text) { duration = badge.text; break }
          }

          const mRows = meta.metadata?.contentMetadataViewModel?.metadataRows || []
          let viewCount = null
          let publishedAt = null
          if (mRows[0]?.metadataParts?.[0]?.text?.content) viewCount = mRows[0].metadataParts[0].text.content
          if (mRows[0]?.metadataParts?.[1]?.text?.content) publishedAt = mRows[0].metadataParts[1].text.content

          videos.push({
            video_id: videoId,
            title,
            thumbnail_url: bestThumb?.url || null,
            duration,
            view_count: viewCount,
            published_at: publishedAt,
            video_url: `https://www.youtube.com/watch?v=${videoId}`,
          })
        } else {
          // Legacy format
          const vr = inner?.videoRenderer || inner?.gridVideoRenderer
          if (!vr?.videoId) continue
          const t = vr.title
          const title = typeof t === 'string' ? t : t?.runs?.[0]?.text || t?.simpleText || ''
          const thumbs = vr.thumbnail?.thumbnails || []
          const bestThumb = thumbs.length > 0
            ? thumbs.reduce((a, b) => (a.width * a.height > b.width * b.height ? a : b))
            : null

          videos.push({
            video_id: vr.videoId,
            title,
            thumbnail_url: bestThumb?.url || null,
            duration: vr.lengthText?.simpleText || vr.lengthText?.runs?.[0]?.text || null,
            view_count: typeof vr.viewCountText === 'string' ? vr.viewCountText
              : vr.viewCountText?.simpleText || vr.viewCountText?.runs?.[0]?.text || null,
            published_at: vr.publishedTimeText?.simpleText || vr.publishedTimeText?.runs?.[0]?.text || null,
            video_url: `https://www.youtube.com/watch?v=${vr.videoId}`,
          })
        }
      }
      break
    }

    return videos.length > 0 ? videos : null
  } catch (e) {
    console.error('[CelePulse] Failed to fetch videos page:', e)
    return null
  }
}

// ===== Fetch /about Page for Social Links =====

async function fetchAboutPageData(channelBaseUrl) {
  const aboutUrl = channelBaseUrl + '/about'
  try {
    const response = await fetch(aboutUrl)
    const html = await response.text()

    // Find ytInitialData using brace counting
    const idx = html.indexOf('ytInitialData')
    if (idx === -1) return null
    const eqIdx = html.indexOf('=', idx)
    if (eqIdx === -1) return null
    const braceStart = html.indexOf('{', eqIdx)
    if (braceStart === -1) return null

    let data = null
    let depth = 0, inString = false, escape = false
    for (let i = braceStart; i < html.length; i++) {
      const ch = html[i]
      if (escape) { escape = false; continue }
      if (ch === '\\') { escape = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (inString) continue
      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) {
          try { data = JSON.parse(html.slice(braceStart, i + 1)) } catch (e) {}
          break
        }
      }
    }
    if (!data) return null
    const result = { social_links: {}, email: null, location: null }

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
            result.email = extractEmail(aboutMeta.description)
          }
          if (aboutMeta.country) {
            result.location = aboutMeta.country
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
                actualUrl = extractRedirectUrl(urlEndpoint.url)
                break
              }
            }

            if (actualUrl && title) {
              result.social_links[title] = actualUrl
            }
          }
          break
        }
      }
    }

    return result
  } catch (e) {
    console.error('[CelePulse] Failed to fetch about page:', e)
    return null
  }
}

// ===== Active Scrape Mode (triggered from CelePulse app) =====

function getScrapeParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    scrape: params.get('celepulse_scrape'),
    influencerId: params.get('influencer_id'),
  }
}

async function scrapeSocialLinks(channelBaseUrl) {
  console.log('[CelePulse] Active scrape mode: collecting social links for', channelBaseUrl)

  // Wait for page to render
  await new Promise(resolve => setTimeout(resolve, 3000))

  // Fetch /about page data
  const aboutData = await fetchAboutPageData(channelBaseUrl)

  // Also try DOM-based extraction as fallback
  const domLinks = extractLinksFromDOM()

  // Merge: about page data takes priority, DOM fills gaps
  const allLinks = { ...domLinks, ...(aboutData?.social_links || {}) }

  return {
    social_links: allLinks,
    classified: classifySocialLinks(allLinks),
    email: aboutData?.email || extractEmailFromDOM(),
    location: aboutData?.location || null,
  }
}

// DOM-based link extraction fallback
function extractLinksFromDOM() {
  const links = {}
  // Look for links in the about section / channel page
  const anchors = document.querySelectorAll('a[href]')
  for (const a of anchors) {
    const href = a.getAttribute('href') || ''
    const text = (a.textContent || '').trim()
    // Skip YouTube internal links and empty text
    if (!href || !text || href.includes('youtube.com') || href.startsWith('/') || href.startsWith('#')) continue
    // Decode redirect URLs
    let actualUrl = href
    if (href.includes('/redirect?')) {
      actualUrl = extractRedirectUrl(href) || href
    }
    if (actualUrl && text && actualUrl.startsWith('http')) {
      links[text] = actualUrl
    }
  }
  return links
}

function extractEmailFromDOM() {
  const text = document.body?.innerText || ''
  return extractEmail(text)
}

// ===== Main Collection Flow =====

async function collectAndSend(channelUrlOverride) {
  const channelBaseUrl = channelUrlOverride || getChannelBaseUrl()
  if (!channelBaseUrl) {
    console.log('[CelePulse] Not a channel/watch page, skipping')
    return
  }

  // Check if this is an active scrape request from CelePulse app
  const scrapeParams = getScrapeParams()
  if (scrapeParams.scrape === 'links' && scrapeParams.influencerId) {
    await handleActiveScrape(channelBaseUrl, scrapeParams.influencerId)
    return
  }

  // Check dedup (passive mode only)
  const shouldRun = await shouldCollect(channelBaseUrl)
  if (!shouldRun) {
    console.log('[CelePulse] Already collected within 24h, skipping:', channelBaseUrl)
    return
  }

  console.log('[CelePulse] Auto-collecting YouTube channel data:', channelBaseUrl)

  try {
    // Wait for page to fully render
    await new Promise(resolve => setTimeout(resolve, 2500))

    // Re-verify we're still on the same channel page after waiting
    const currentUrl = getChannelBaseUrl()
    if (!currentUrl || currentUrl !== channelBaseUrl) {
      console.log(`[CelePulse] Page navigated during wait. Was: ${channelBaseUrl}, now: ${currentUrl}. Skipping.`)
      return
    }

    // Extract data from current page
    console.log('[CelePulse] Looking for ytInitialData...')
    const ytData = findYtInitialData()
    if (!ytData) {
      console.error('[CelePulse] Could not find ytInitialData')
      return
    }
    console.log('[CelePulse] Found ytInitialData, extracting channel data...')

    const channelData = extractChannelData(ytData)

    // SPA navigation guard: verify ytInitialData matches current URL
    const canonicalUrl = ytData?.metadata?.channelMetadataRenderer?.vanityChannelUrl
    if (canonicalUrl) {
      const currentHandle = channelBaseUrl.match(/@([\w.-]+)/)?.[1]?.toLowerCase()
      const dataHandle = canonicalUrl.match(/@([\w.-]+)/)?.[1]?.toLowerCase()
      if (currentHandle && dataHandle && currentHandle !== dataHandle) {
        console.log(`[CelePulse] SPA mismatch detected: URL=@${currentHandle}, data=@${dataHandle}. Skipping.`)
        return
      }
    }

    // Fetch /videos page for actual video list (main page only has Home tab)
    console.log('[CelePulse] Fetching videos page...')
    const videosData = await fetchVideosPageData(channelBaseUrl)
    if (videosData && videosData.length > 0) {
      channelData.videos = videosData
    }
    console.log('[CelePulse] Channel data:', channelData.display_name, '| videos:', channelData.videos?.length)

    // Fetch /about page for social links
    console.log('[CelePulse] Fetching about page...')
    const aboutData = await fetchAboutPageData(channelBaseUrl)
    console.log('[CelePulse] About data:', aboutData ? Object.keys(aboutData.social_links || {}).length + ' links' : 'null')

    // Merge data
    const payload = {
      platform: 'YouTube',
      channel_url: channelBaseUrl,
      display_name: channelData.display_name,
      avatar_url: channelData.avatar_url,
      bio: channelData.bio,
      followers_count: channelData.followers_count,
      email: channelData.email || aboutData?.email || null,
      location: channelData.location || aboutData?.location || null,
      social_links: aboutData?.social_links || {},
      videos: channelData.videos,
    }

    console.log('[CelePulse] Sending to background for API call...')
    const apiResult = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      endpoint: '/api/extension/collect',
      payload,
    }).catch(() => null)

    if (apiResult?.ok) {
      console.log(`[CelePulse] Success: ${apiResult.data.action} influencer ${apiResult.data.influencer_id}`)
      await markCollected(channelBaseUrl)

      chrome.runtime.sendMessage({
        type: 'COLLECTION_COMPLETE',
        action: apiResult.data.action,
        platform: 'YouTube',
        channelUrl: channelBaseUrl,
      }).catch(() => {})
    } else {
      console.error('[CelePulse] API error:', apiResult?.status, apiResult?.error)
    }
  } catch (e) {
    console.error('[CelePulse] Collection failed:', e)
  }
}

// ===== Active Scrape Handler =====

async function handleActiveScrape(channelBaseUrl, influencerId) {
  console.log('[CelePulse] Active scrape triggered for influencer:', influencerId)

  const scrapeResult = await scrapeSocialLinks(channelBaseUrl)

  const payload = {
    influencer_id: influencerId,
    channel_url: channelBaseUrl,
    email: scrapeResult.email,
    ...scrapeResult.classified,
    raw_links: scrapeResult.social_links,
  }

  try {
    const apiResult = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      endpoint: '/api/extension/social-links',
      payload,
    }).catch(() => null)

    if (apiResult?.ok) {
      console.log('[CelePulse] Social links scraped successfully:', apiResult.data)
      chrome.runtime.sendMessage({
        type: 'SCRAPE_LINKS_COMPLETE',
        influencerId,
        success: true,
      }).catch(() => {})
    } else {
      console.error('[CelePulse] Social links API error:', apiResult?.error)
      chrome.runtime.sendMessage({
        type: 'SCRAPE_LINKS_COMPLETE',
        influencerId,
        success: false,
      }).catch(() => {})
    }
  } catch (e) {
    console.error('[CelePulse] Failed to send social links:', e)
    chrome.runtime.sendMessage({
      type: 'SCRAPE_LINKS_COMPLETE',
      influencerId,
      success: false,
    }).catch(() => {})
  }
}

// ===== Auto-run & SPA Navigation Observer =====

function tryAutoCollect() {
  if (isChannelPage()) {
    collectAndSend()
  } else if (isWatchPage()) {
    // Wait for DOM to render the uploader info, then extract channel URL
    setTimeout(() => {
      const ch = getChannelUrlFromWatchPage()
      if (ch) {
        console.log('[CelePulse] Watch page detected, channel:', ch)
        collectAndSend(ch)
      }
    }, 3000)
  }
}

// Initial run
tryAutoCollect()

// Observe SPA navigation (YouTube uses client-side routing)
let lastUrl = location.href
const urlObserver = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href
    tryAutoCollect()
  }
})
urlObserver.observe(document.documentElement, { childList: true, subtree: true })
