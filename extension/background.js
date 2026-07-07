/**
 * CelePulse Import — Background Service Worker
 *
 * Listens for collection results from content scripts,
 * updates extension icon badge and collection log.
 */

// Pending scrape requests: influencerId -> sourceTabId
const pendingScrapes = new Map()

// Cache YouTube cookies to avoid fetching them on every request
let cachedYoutubeCookies = null
let cookiesLastFetched = 0
const COOKIES_CACHE_MS = 5 * 60 * 1000 // 5 min cache

/**
 * Extract YouTube cookies in Netscape format for yt-dlp.
 * Returns a string that yt-dlp can consume via --cookies flag.
 */
async function getYouTubeCookiesNetscape() {
  const now = Date.now()
  if (cachedYoutubeCookies && (now - cookiesLastFetched) < COOKIES_CACHE_MS) {
    return cachedYoutubeCookies
  }

  try {
    // Collect cookies from both YouTube and Google domains
    // YouTube auth cookies (SID, HSID, SSID, APISID, SAPISID) are split across both domains
    const [ytCookies, googleCookies] = await Promise.all([
      chrome.cookies.getAll({ domain: '.youtube.com' }),
      chrome.cookies.getAll({ domain: '.google.com' }),
    ])
    const cookies = [...ytCookies, ...googleCookies]
    if (!cookies || cookies.length === 0) return null

    // Convert to Netscape cookie format
    const lines = ['# Netscape HTTP Cookie File', '# Auto-exported by CelePulse Import', '']
    for (const c of cookies) {
      const domain = c.domain
      const flag = domain.startsWith('.') ? 'TRUE' : 'FALSE'
      const path = c.path || '/'
      const secure = c.secure ? 'TRUE' : 'FALSE'
      const expires = c.expirationDate ? Math.floor(c.expirationDate) : 0
      lines.push([domain, flag, path, secure, expires, c.name, c.value].join('\t'))
    }

    cachedYoutubeCookies = lines.join('\n')
    cookiesLastFetched = now
    return cachedYoutubeCookies
  } catch (e) {
    console.error('[CelePulse BG] Failed to get YouTube cookies:', e)
    return null
  }
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle API requests from content scripts (avoids mixed content issues)
  if (message.type === 'API_REQUEST') {
    (async () => {
      try {
        const baseUrl = 'https://admin.celepulse.com'

        // Attach YouTube cookies to every API request for server-side yt-dlp
        const youtubeCookies = await getYouTubeCookiesNetscape()
        const payloadWithCookies = youtubeCookies
          ? { ...message.payload, _youtube_cookies: youtubeCookies }
          : message.payload

        const res = await fetch(`${baseUrl}${message.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadWithCookies),
        })
        const data = await res.json().catch(() => ({}))
        sendResponse({ ok: res.ok, status: res.status, data, error: data.error || null })
      } catch (e) {
        sendResponse({ ok: false, error: e.message })
      }
    })()
    return true // async response
  }

  // Handle manual cookie refresh from CelePulse web app (via bridge)
  if (message.type === 'REFRESH_COOKIES_REQUEST') {
    (async () => {
      try {
        // Force clear cache so we get fresh cookies
        cachedYoutubeCookies = null
        cookiesLastFetched = 0

        const cookies = await getYouTubeCookiesNetscape()
        if (!cookies) {
          sendResponse({ ok: false, count: 0, error: '未找到 YouTube cookies，请先登录 YouTube' })
          return
        }

        const baseUrl = 'https://admin.celepulse.com'
        const res = await fetch(`${baseUrl}/api/extension/refresh-cookies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cookies }),
        })

        const count = cookies.split('\n').filter(l => l && !l.startsWith('#')).length
        sendResponse({ ok: res.ok, count })
      } catch (e) {
        sendResponse({ ok: false, count: 0, error: e.message })
      }
    })()
    return true // async response
  }

  // Handle scrape links request from CelePulse frontend (via bridge)
  if (message.type === 'SCRAPE_LINKS_REQUEST') {
    // Track source tab for completion notification
    const sourceTabId = sender.tab?.id
    if (sourceTabId) {
      pendingScrapes.set(message.influencerId, sourceTabId)
    }

    chrome.tabs.create({
      url: message.channelUrl + '?celepulse_scrape=links&influencer_id=' + message.influencerId,
      active: false,
    }).then((tab) => {
      sendResponse({ ok: true, tabId: tab.id })
    }).catch((err) => {
      sendResponse({ ok: false, error: err.message })
    })
    return true // async response
  }

  // Handle scrape complete - close the tab and notify source tab
  if (message.type === 'SCRAPE_LINKS_COMPLETE') {
    // Close the scraping tab
    if (sender.tab?.id) {
      chrome.tabs.remove(sender.tab.id).catch(() => {})
    }

    // Notify the CelePulse app tab
    const sourceTabId = pendingScrapes.get(message.influencerId)
    if (sourceTabId) {
      chrome.tabs.sendMessage(sourceTabId, {
        type: 'CELEPULSE_SCRAPE_COMPLETE',
        influencerId: message.influencerId,
        success: message.success,
      }).catch(() => {})
      pendingScrapes.delete(message.influencerId)
    }

    console.log(`[CelePulse BG] Scrape links complete: ${message.influencerId}, success=${message.success}`)
    return
  }

  if (message.type !== 'COLLECTION_COMPLETE') return

  const { action, platform, channelUrl } = message

  // Update collection log
  chrome.storage.local.get('collectionLog', (data) => {
    const log = data.collectionLog || []
    log.push(Date.now())
    // Keep last 1000 entries
    if (log.length > 1000) log.splice(0, log.length - 1000)
    chrome.storage.local.set({ collectionLog: log })
  })

  // Update badge with today's count
  updateBadge()

  // Set a green badge text to indicate collection happened on this tab
  if (sender.tab?.id) {
    chrome.action.setBadgeText({
      tabId: sender.tab.id,
      text: action === 'created' ? 'NEW' : 'UPD',
    })
    chrome.action.setBadgeBackgroundColor({
      tabId: sender.tab.id,
      color: action === 'created' ? '#10b981' : '#6366f1',
    })
  }

  console.log(`[CelePulse BG] ${action}: ${platform} — ${channelUrl}`)
})

// Update global badge with today's collection count
async function updateBadge() {
  const data = await chrome.storage.local.get('collectionLog')
  const log = data.collectionLog || []
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const todayCount = log.filter(ts => ts >= todayStart).length

  // Set global badge
  if (todayCount > 0) {
    await chrome.action.setBadgeText({ text: String(todayCount) })
    await chrome.action.setBadgeBackgroundColor({ color: '#6366f1' })
  } else {
    await chrome.action.setBadgeText({ text: '' })
  }
}

// Reset badge at midnight (check every hour)
chrome.alarms?.create('checkDay', { periodInMinutes: 60 })
chrome.alarms?.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkDay') {
    updateBadge()
  }
})

// On extension install/update, initialize
chrome.runtime.onInstalled.addListener(() => {
  updateBadge()
  console.log('[CelePulse BG] Extension installed/updated — silent mode active')
})
