/**
 * CelePulse Import — Background Service Worker
 *
 * Listens for collection results from content scripts,
 * updates extension icon badge and collection log.
 */

// Pending scrape requests: influencerId -> sourceTabId
const pendingScrapes = new Map()

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle API requests from content scripts (avoids mixed content issues)
  if (message.type === 'API_REQUEST') {
    (async () => {
      try {
        const storage = await chrome.storage.local.get('celepulseUrl')
        const baseUrl = storage.celepulseUrl || 'http://localhost:30015'
        const res = await fetch(`${baseUrl}${message.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message.payload),
        })
        const data = await res.json().catch(() => ({}))
        sendResponse({ ok: res.ok, status: res.status, data, error: data.error || null })
      } catch (e) {
        sendResponse({ ok: false, error: e.message })
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
