/**
 * CelePulse Import — Instagram Content Script (Silent Mode)
 *
 * Auto-detects Instagram profile pages and silently extracts data,
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
  if (!hostname.includes('instagram.com')) return false

  const path = window.location.pathname

  // Exclude non-profile paths
  const excludedPaths = [
    /^\/p\//,           // Post
    /^\/reels?\//,      // Reels
    /^\/explore\//,     // Explore
    /^\/direct\//,      // DM
    /^\/stories\//,     // Stories
    /^\/accounts\//,    // Login/settings
    /^\/about\//,       // About
    /^\/legal\//,       // Legal
    /^\/api\//,         // API
    /^\/graphql\//,     // GraphQL
    /^\/web\//,         // Web
    /^\/$|^\/$/,        // Homepage
  ]

  for (const pattern of excludedPaths) {
    if (pattern.test(path)) return false
  }

  // Must have a username in path like /username/ or /username
  const match = path.match(/^\/([\w.]+)\/?$/)
  return !!match && match[1].length > 1
}

function getUsername() {
  const match = window.location.pathname.match(/^\/([\w.]+)\/?$/)
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

function extractInstagramData() {
  const username = getUsername()
  const result = {
    display_name: null,
    avatar_url: null,
    followers_count: null,
    bio: null,
    email: null,
    social_links: {},
  }

  if (!username) return result

  // 1. Meta tags (most reliable for public profiles)
  const ogTitle = document.querySelector('meta[property="og:title"]')
  if (ogTitle) {
    result.display_name = ogTitle.getAttribute('content') || null
  }

  const ogDescription = document.querySelector('meta[property="og:description"]')
  if (ogDescription) {
    const content = ogDescription.getAttribute('content') || ''

    // Parse: "123K followers, 456 following, 789 posts - @username on Instagram: \"bio text\""
    const followerMatch = content.match(/([\d,.]+[KMB]?)\s*followers/i)
    if (followerMatch) {
      result.followers_count = parseFollowerCount(followerMatch[1])
    }

    // Extract bio from quoted text
    const bioMatch = content.match(/:\s*"(.+)"\s*$/s)
    if (bioMatch) {
      result.bio = bioMatch[1].trim()
    } else {
      result.bio = content
    }

    const email = extractEmail(content)
    if (email) result.email = email
  }

  const ogImage = document.querySelector('meta[property="og:image"]')
  if (ogImage) {
    result.avatar_url = ogImage.getAttribute('content') || null
  }

  // 2. DOM elements (supplementary)
  // Try to get display name from header
  const headerH2 = document.querySelector('header h2, header h1')
  if (headerH2 && !result.display_name) {
    result.display_name = headerH2.textContent?.trim() || null
  }

  // Try to get bio from profile section
  const bioElements = document.querySelectorAll('header section > div > span, header section > div > div > span')
  if (bioElements.length > 0 && !result.bio) {
    const bioText = Array.from(bioElements).map(el => el.textContent).join(' ').trim()
    if (bioText) {
      result.bio = bioText.slice(0, 500)
      const email = extractEmail(bioText)
      if (email) result.email = result.email || email
    }
  }

  // Try follower count from header stats
  const statLinks = document.querySelectorAll('header section ul li a, header section ul li')
  if (statLinks.length >= 2 && !result.followers_count) {
    // Usually: [posts, followers, following]
    for (const link of statLinks) {
      const text = link.textContent || ''
      if (text.toLowerCase().includes('follower')) {
        const countMatch = text.match(/([\d,.]+[KMB]?)/)
        if (countMatch) {
          result.followers_count = parseFollowerCount(countMatch[1])
          break
        }
      }
    }
  }

  // 3. Look for external links in bio (Linktree, etc.)
  const bioLinks = document.querySelectorAll('header section a[href]')
  for (const link of bioLinks) {
    const href = link.getAttribute('href') || ''
    const text = link.textContent?.trim() || ''
    if (href && !href.includes('instagram.com') && !href.startsWith('/')) {
      if (text) result.social_links[text] = href
    }
  }

  return result
}

// ===== Main Collection Flow =====

async function collectAndSend() {
  const username = getUsername()
  if (!username) return

  const channelUrl = `https://www.instagram.com/${username}/`

  // Check dedup
  const shouldRun = await shouldCollect(channelUrl)
  if (!shouldRun) {
    console.log('[CelePulse] Already collected within 24h, skipping:', channelUrl)
    return
  }

  console.log('[CelePulse] Auto-collecting Instagram profile:', username)

  // Wait for page to fully render (Instagram is SPA-heavy)
  await new Promise(resolve => setTimeout(resolve, 3000))

  const data = extractInstagramData()

  const payload = {
    platform: 'Instagram',
    channel_url: channelUrl,
    display_name: data.display_name || username,
    avatar_url: data.avatar_url,
    bio: data.bio,
    followers_count: data.followers_count,
    email: data.email,
    location: null,
    social_links: data.social_links,
    videos: [],
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
        platform: 'Instagram',
        channelUrl: channelUrl,
      }).catch(() => {})
    } else {
      console.error('[CelePulse] API error:', apiResult?.status, apiResult?.error)
    }
  } catch (e) {
    console.error('[CelePulse] Failed to send Instagram data:', e)
  }
}

// Auto-run on profile pages
if (isProfilePage()) {
  collectAndSend()
}
