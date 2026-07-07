/**
 * CelePulse Import — Bridge Script for CelePulse App
 *
 * Runs on CelePulse app pages to relay messages between
 * the web app (window.postMessage) and the extension background.
 */

// Announce extension presence immediately
window.postMessage({ type: 'CELEPULSE_PONG' }, '*')

// Listen for messages from the CelePulse web app
window.addEventListener('message', (event) => {
  if (event.source !== window) return

  const data = event.data
  if (!data || typeof data !== 'object') return

  // Ping — web app checking if extension is installed
  if (data.type === 'CELEPULSE_PING') {
    window.postMessage({ type: 'CELEPULSE_PONG' }, '*')
    return
  }

  // Manual cookie refresh — web app requesting fresh cookies
  if (data.type === 'CELEPULSE_REFRESH_COOKIES') {
    chrome.runtime.sendMessage(
      { type: 'REFRESH_COOKIES_REQUEST' },
      (response) => {
        if (chrome.runtime.lastError) {
          window.postMessage({
            type: 'CELEPULSE_COOKIES_RESULT',
            ok: false,
            error: chrome.runtime.lastError.message,
          }, '*')
          return
        }
        window.postMessage({
          type: 'CELEPULSE_COOKIES_RESULT',
          ok: response?.ok || false,
          count: response?.count || 0,
          error: response?.error || null,
        }, '*')
      }
    )
    return
  }

  // Forward scrape links request to extension background
  if (data.type === 'CELEPULSE_SCRAPE_LINKS') {
    chrome.runtime.sendMessage({
      type: 'SCRAPE_LINKS_REQUEST',
      channelUrl: data.channelUrl,
      influencerId: data.influencerId,
      sourceTabId: null,
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[CelePulse Bridge] Extension not available:', chrome.runtime.lastError.message)
        window.postMessage({
          type: 'CELEPULSE_BRIDGE_ERROR',
          error: chrome.runtime.lastError.message,
        }, '*')
        return
      }
      window.postMessage({
        type: 'CELEPULSE_SCRAPE_ACCEPTED',
        ok: response?.ok || false,
      }, '*')
    })
  }
})

// Listen for scrape complete notifications from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'CELEPULSE_SCRAPE_COMPLETE') {
    window.postMessage({
      type: 'CELEPULSE_SCRAPE_COMPLETE',
      influencerId: message.influencerId,
      success: message.success,
    }, '*')
  }
})

console.log('[CelePulse Bridge] Ready')
