/**
 * CelePulse Import — TikTok Content Script (Silent Mode)
 *
 * Auto-detects TikTok profile pages and silently extracts data,
 * sending it to the CelePulse backend without any user interaction.
 */

// ===== Utility Functions =====

function extractEmail(text) {
  if (!text) return null
  const match = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)
  return match ? match[0] : null
}

function parseFollowerCount(text) {
  if (!text) return null
  const clean = text.toLowerCase().replace(/,/g, '').trim()
  const match = clean.match(/([\d.]+)\s*([kmb]?)/)
  if (!match) return null
  const num = parseFloat(match[1])
  if (isNaN(num)) return null
  if (match[2] === 'k') return Math.round(num * 1000)
  if (match[2] === 'm') return Math.round(num * 1000000)
  return Math.round(num)
}

// ===== Profile Page Detection =====

function isProfilePage() {
  const hostname = window.location.hostname
  if (!hostname.includes('tiktok.com')) return false

  const path = window.location.pathname

  // Exclude non-profile paths
  const excludedPaths = [
    /^\/video\//,
    /^\/discover/,
    /^\/trending/,
    /^\/search/,
    /^\/foryou/,
    /^\/following/,
    /^\/live/,
    /^\/shop/,
    /^\/messages/,
    /^\/notifications/,
    /^\/settings/,
    /^\/upload/,
    /^\/$|^\/$/,
  ]

  for (const pattern of excludedPaths) {
    if (pattern.test(path)) return false
  }

  // Must match @username pattern
  return /^@[\w.]+\/?$/.test(path)
}

function getUsername() {
  const match = window.location.pathname.match(/^@([\w.]+)\/?$/)
  return match ? match[1] : null
}

// ===== Deduplication (24h) =====

async function shouldCollect(channelUrl) {
  const key = `collected:${channelUrl}`
  const storage = await chrome.storage.local.get(key)
  const lastCollected = storage[key]
  if (!lastCollected) return true
  return (Date.now() - lastCollected) > 24 * 60 * 60 * 1000
}

async function markCollected(channelUrl) {
  const key = `collected:${channelUrl}`
  await chrome.storage.local.set({ [key]: Date.now() })
}

// ===== Data Extraction =====

function extractTikTokData() {
  const username = getUsername()
  const result = {
    display_name: null,
    avatar_url: null,
    followers_count: null,
    bio: null,
    email: null,
    social_links: {},
    videos: [],
  }

  if (!username) return result

  // 1. Meta tags
  const ogTitle = document.querySelector('meta[property="og:title"]')
    || document.querySelector('meta[name="title"]')
  if (ogTitle) {
    result.display_name = ogTitle.getAttribute('content')?.replace(/\s*\(\@[\w.]+\)\s*.*$/, '').trim() || null
  }

  const ogDescription = document.querySelector('meta[property="og:description"]')
    || document.querySelector('meta[name="description"]')
  if (ogDescription) {
    const content = ogDescription.getAttribute('content') || ''
    result.bio = content

    // Parse: "1.2M Followers, 345 Following, 678 Likes"
    const followerMatch = content.match(/([\d,.]+[KMB]?)\s*Followers/i)
    if (followerMatch) {
      result.followers_count = parseFollowerCount(followerMatch[1])
    }

    const email = extractEmail(content)
    if (email) result.email = email
  }

  const ogImage = document.querySelector('meta[property="og:image"]')
  if (ogImage) {
    result.avatar_url = ogImage.getAttribute('content') || null
  }

  // 2. DOM elements (supplementary)
  // Display name from h1 or h2
  const h1 = document.querySelector('h1')
  if (h1 && !result.display_name) {
    result.display_name = h1.textContent?.trim() || null
  }

  // Follower count from data-e2e attributes or stats section
  const followerEl = document.querySelector('[data-e2e="followers-count"]')
  if (followerEl && !result.followers_count) {
    result.followers_count = parseFollowerCount(followerEl.textContent?.trim())
  }

  // Bio from profile section
  const bioEl = document.querySelector('[data-e2e="user-bio"], [class*="SpanOtherInfos"] [class*="SpanCount"]')
  if (bioEl && !result.bio) {
    result.bio = bioEl.textContent?.trim().slice(0, 500) || null
    const email = extractEmail(result.bio)
    if (email) result.email = result.email || email
  }

  // Avatar from header image
  const avatarImg = document.querySelector('header img[src*="avatar"], img[class*="StyledAvatar"]')
  if (avatarImg && !result.avatar_url) {
    result.avatar_url = avatarImg.getAttribute('src') || null
  }

  // 3. Extract video list from page links
  const videoLinks = document.querySelectorAll('a[href*="/video/"]')
  const seenIds = new Set()
  videoLinks.forEach((link) => {
    if (result.videos.length >= 20) return
    const href = link.getAttribute('href') || ''
    const match = href.match(/\/video\/(\d+)/)
    if (match && !seenIds.has(match[1])) {
      seenIds.add(match[1])
      result.videos.push({
        video_id: match[1],
        title: link.textContent?.trim().slice(0, 200) || '',
        thumbnail_url: null,
        duration: null,
        view_count: null,
        published_at: null,
        video_url: `https://www.tiktok.com/@${username}/video/${match[1]}`,
      })
    }
  })

  return result
}

// ===== Main Collection Flow =====

async function collectAndSend() {
  const username = getUsername()
  if (!username) return

  const channelUrl = `https://www.tiktok.com/@${username}`

  // Check dedup
  const shouldRun = await shouldCollect(channelUrl)
  if (!shouldRun) {
    console.log('[CelePulse] Already collected within 24h, skipping:', channelUrl)
    return
  }

  console.log('[CelePulse] Auto-collecting TikTok profile:', username)

  // Wait for TikTok SPA to render
  await new Promise(resolve => setTimeout(resolve, 3500))

  const data = extractTikTokData()

  const payload = {
    platform: 'TikTok',
    channel_url: channelUrl,
    display_name: data.display_name || username,
    avatar_url: data.avatar_url,
    bio: data.bio,
    followers_count: data.followers_count,
    email: data.email,
    location: null,
    social_links: data.social_links,
    videos: data.videos,
  }

  console.log('[CelePulse] Sending to background for API call...')
  try {
    const apiResult = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      endpoint: '/api/extension/collect',
      payload,
    }).catch(() => null)

    if (apiResult?.ok) {
      console.log(`[CelePulse] Success: ${apiResult.data.action} influencer ${apiResult.data.influencer_id}`)
      await markCollected(channelUrl)

      chrome.runtime.sendMessage({
        type: 'COLLECTION_COMPLETE',
        action: apiResult.data.action,
        platform: 'TikTok',
        channelUrl: channelUrl,
      }).catch(() => {})
    } else {
      console.error('[CelePulse] API error:', apiResult?.status, apiResult?.error)
    }
  } catch (e) {
    console.error('[CelePulse] Failed to send TikTok data:', e)
  }
}

// Auto-run on profile pages
if (isProfilePage()) {
  collectAndSend()
}
