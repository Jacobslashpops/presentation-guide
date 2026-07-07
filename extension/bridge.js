/**
 * CelePulse Import — Bridge Script for CelePulse App
 *
 * Runs on CelePulse app pages to relay messages between
 * the web app (window.postMessage) and the extension background.
 */

// Listen for messages from the CelePulse web app
window.addEventListener('message', (event) => {
  // Only accept messages from the same page
  if (event.source !== window) return

  const data = event.data
  if (!data || typeof data !== 'object') return

  // Forward scrape links request to extension background
  if (data.type === 'CELEPULSE_SCRAPE_LINKS') {
    chrome.runtime.sendMessage({
      type: 'SCRAPE_LINKS_REQUEST',
      channelUrl: data.channelUrl,
      influencerId: data.influencerId,
      sourceTabId: null, // will be set by background from sender.tab
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[CelePulse Bridge] Extension not available:', chrome.runtime.lastError.message)
        window.postMessage({
          type: 'CELEPULSE_BRIDGE_ERROR',
          error: chrome.runtime.lastError.message,
        }, '*')
        return
      }
      // Relay response back to the web app
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
    // Forward to the web app
    window.postMessage({
      type: 'CELEPULSE_SCRAPE_COMPLETE',
      influencerId: message.influencerId,
      success: message.success,
    }, '*')
  }
})

console.log('[CelePulse Bridge] Ready')
