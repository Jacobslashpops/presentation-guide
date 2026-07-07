# CelePulse Import — Chrome Extension

静默采集红人数据。用户日常浏览 YouTube / Instagram / TikTok 时，插件自动识别红人账号并将数据同步到 CelePulse 后端，无需任何手动操作。

## 快速开始

### 安装

1. Chrome 打开 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」，选择本目录（`extension/`）

### 配置后端地址

Popup 页面可设置 CelePulse 后端 URL：
- 开发环境：`http://localhost:30015`
- 生产环境：`https://admin.celepulse.com`

设置保存在 `chrome.storage.local` 的 `celepulseUrl` 字段。

## 文件结构

```
extension/
├── manifest.json       # MV3 清单文件
├── background.js       # Service Worker — API 代理、badge 更新、tab 管理
├── content.js          # YouTube 内容脚本 — 静默采集主逻辑
├── instagram.js        # Instagram 内容脚本
├── tiktok.js           # TikTok 内容脚本
├── bridge.js           # CelePulse 前端 ↔ 插件通信桥
├── popup.html/js       # Popup UI — 状态查看、手动配置
└── icon*.png           # 扩展图标（16/48/128）
```

## 采集机制

### 触发条件

| 页面 | URL 匹配 | 行为 |
|------|---------|------|
| 频道页 | `/@handle`, `/channel/UC...`, `/c/name` | 自动全量采集 |
| 视频页 | `/watch?v=...` | 提取频道 URL → 自动采集 |
| SPA 跳转 | YouTube 内部导航 | MutationObserver 监听 → 自动触发 |

### 去重

- 存储位置：`chrome.storage.local`（浏览器本地，非服务端）
- Key 格式：`collected:{channelBaseUrl}`
- 冷却时间：1 小时（同一频道不重复采集）
- 刷新页面或关闭重开标签页不影响去重，清除浏览器数据或卸载插件会重置

### 数据采集流程

```
检测页面 → 提取频道 URL → 冷却检查 → 解析 ytInitialData
    → fetch /videos 页（≤30 条视频）
    → fetch /about 页（社交链接 + 邮箱）
    → POST /api/extension/collect
```

### 提取字段

- **频道信息**：display_name, avatar_url, followers_count, bio
- **邮箱**：从 bio 和 /about 页正则提取
- **社交链接**：Twitter/X, Instagram, TikTok, Facebook, LinkedIn, Twitch, Website
- **视频列表**：video_id, title, thumbnail_url, duration, view_count, published_at（最多 30 条）

### 两种采集模式

1. **静默模式**（默认）：自动检测 + 采集 + 发送，完全无感
2. **主动模式**（CelePulse 前端触发）：URL 带 `?celepulse_scrape=links&influencer_id=xxx`，仅采集社交链接

## 后端 API

| 端点 | 用途 | 触发方 |
|------|------|--------|
| `POST /api/extension/collect` | 全量数据写入 | 静默采集 |
| `POST /api/extension/social-links` | 社交链接更新 | 主动模式 |

插件通过 `background.js` 代理 API 请求，避免 mixed content 问题。

## 数据写入策略

服务端使用 **upsert（只填空缺）** 策略：
- 已有字段不会被覆盖（保护手动编辑的数据）
- 新字段自动填充
- 视频按 `video_id` 去重合并

## 开发注意事项

- **Manifest V3**：不支持 SVG 图标，必须使用 PNG（16/48/128 三种尺寸）
- **Content Script 隔离**：不能直接访问页面 JS 变量，但可以通过 `<script>` 标签注入的 `ytInitialData` JSON 提取数据
- **SPA 导航**：YouTube 使用客户端路由，普通 `DOMContentLoaded` 只触发一次，需要 `MutationObserver` 监听 URL 变化
- **视频页频道提取**：优先从 DOM 的 `ytd-video-owner-renderer` 提取，备选从 `ytInitialData` 匹配

## 调试

1. 打开 YouTube 频道页或视频页
2. F12 打开 DevTools → Console
3. 过滤 `[CelePulse]` 查看日志

常见日志：
```
[CelePulse] Auto-collecting YouTube channel data: https://www.youtube.com/@xxx
[CelePulse] Watch page detected, channel: https://www.youtube.com/@xxx
[CelePulse] Already collected within 1h, skipping: ...
[CelePulse] Success: created influencer xxx
[CelePulse] Success: updated influencer xxx
```
