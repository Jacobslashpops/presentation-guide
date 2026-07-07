// CelePulse Extension Popup — Silent Mode
document.addEventListener('DOMContentLoaded', async () => {
  const statusBar = document.getElementById('statusBar')
  const detectedEl = document.getElementById('detected')
  const platformBadge = document.getElementById('platformBadge')
  const detectedName = document.getElementById('detectedName')
  const detectedStatus = document.getElementById('detectedStatus')
  const todayCountEl = document.getElementById('todayCount')
  const totalCountEl = document.getElementById('totalCount')
  const forceBtn = document.getElementById('forceBtn')

  // Load collection log
  const storage = await chrome.storage.local.get(['collectionLog'])

  // Calculate stats from collection log
  const log = storage.collectionLog || []
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const todayCount = log.filter(ts => ts >= todayStart).length
  todayCountEl.textContent = todayCount
  totalCountEl.textContent = log.length

  // Detect current page platform
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  let currentPlatform = null
  let currentName = ''
  let currentChannelUrl = null

  if (tab?.url) {
    try {
      const url = new URL(tab.url)
      const path = url.pathname

      if (url.hostname.includes('youtube.com')) {
        const match = path.match(/^\/(@[\w.-]+|channel\/[\w-]+|c\/[\w.-]+)/)
        if (match) {
          currentPlatform = 'YouTube'
          currentName = tab.title?.replace(' - YouTube', '').trim() || match[1]
          currentChannelUrl = `https://www.youtube.com${match[0]}`
        }
      } else if (url.hostname.includes('instagram.com')) {
        const match = path.match(/^\/([\w.]+)\/?$/)
        if (match && !['p', 'reels', 'explore', 'direct', 'stories', 'accounts'].includes(match[1])) {
          currentPlatform = 'Instagram'
          currentName = match[1]
          currentChannelUrl = `https://www.instagram.com/${match[1]}/`
        }
      } else if (url.hostname.includes('tiktok.com')) {
        const match = path.match(/^@([\w.]+)\/?$/)
        if (match) {
          currentPlatform = 'TikTok'
          currentName = match[1]
          currentChannelUrl = `https://www.tiktok.com/@${match[1]}`
        }
      }
    } catch (e) { /* invalid URL */ }
  }

  if (currentPlatform) {
    detectedEl.style.display = 'block'
    forceBtn.style.display = 'block'

    const badgeClass = `platform-${currentPlatform.toLowerCase()}`
    platformBadge.className = `platform-badge ${badgeClass}`
    platformBadge.textContent = currentPlatform
    detectedName.textContent = currentName

    // Check if already collected
    const key = `collected:${currentChannelUrl}`
    const collected = await chrome.storage.local.get(key)
    if (collected[key]) {
      const ago = Date.now() - collected[key]
      const hoursAgo = Math.round(ago / (60 * 60 * 1000))
      detectedStatus.textContent = `已采集 (${hoursAgo < 1 ? '刚刚' : `${hoursAgo}小时前`})`
    } else {
      detectedStatus.textContent = '采集中...（约需10秒）'
    }

    // Listen for real-time collection completion
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'COLLECTION_COMPLETE' && message.channelUrl === currentChannelUrl) {
        detectedStatus.textContent = '已采集 (刚刚)'
        // Update counters
        chrome.storage.local.get('collectionLog', (data) => {
          const log = data.collectionLog || []
          const now2 = new Date()
          const todayStart2 = new Date(now2.getFullYear(), now2.getMonth(), now2.getDate()).getTime()
          todayCountEl.textContent = log.filter(ts => ts >= todayStart2).length
          totalCountEl.textContent = log.length
        })
      }
    })

    // Also poll storage every 3s to catch completions
    const pollInterval = setInterval(async () => {
      const check = await chrome.storage.local.get(key)
      if (check[key]) {
        const ago = Date.now() - check[key]
        const hoursAgo = Math.round(ago / (60 * 60 * 1000))
        detectedStatus.textContent = `已采集 (${hoursAgo < 1 ? '刚刚' : `${hoursAgo}小时前`})`
        clearInterval(pollInterval)
      }
    }, 3000)
  }

  // Force re-collect
  forceBtn.addEventListener('click', async () => {
    if (!currentChannelUrl || !tab?.id) return

    // Clear the dedup key
    const key = `collected:${currentChannelUrl}`
    await chrome.storage.local.remove(key)

    statusBar.className = 'status-bar success'
    statusBar.textContent = '已清除缓存，正在重新采集...'

    // Reload the tab to trigger content script
    await chrome.tabs.reload(tab.id)

    setTimeout(() => {
      detectedStatus.textContent = '采集中，请稍后刷新 Popup...'
    }, 1000)
  })
})
