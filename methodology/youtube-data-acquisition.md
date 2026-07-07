# YouTube 红人数据获取方案

## 概述

从 YouTube 频道 URL 自动获取红人信息并写入 CelePulse 数据库。

## 字段需求 vs 获取能力

| 字段 | 当前脚本（页面抓取） | YouTube Data API v3 | 浏览器插件（用户端） |
|------|---------------------|--------------------|-|--------------------|
| `display_name` | ✅ | ✅ | ✅ |
| `avatar_url` | ✅ | ✅ | ✅ |
| `followers_count` | ✅ 文本解析 "785K" | ✅ 精确数字 | ✅ |
| `bio` / `description` | ✅ | ✅ | ✅ |
| `location` / `country` | ✅ | ✅ | ✅ |
| `youtube_subscribers` | ✅ | ✅ | ✅ |
| `video_count` | ✅ | ✅ | ✅ |
| `view_count` | ✅ | ✅ | ✅ |
| `joined_date` | ✅ | ✅ | ✅ |
| `channel_id` | ✅ | ✅ | ✅ |
| **`social_links`** | ✅ 解析 redirect URL | ❌ API 不提供 | ✅ |
| **`platforms`** (Instagram/TikTok/...) | ✅ 从 social_links 推导 | ❌ API 不提供 | ✅ |
| **`email`** | ✅ 从 description 正则提取 | ❌ API 不提供 | ✅ |
| **最新视频列表** | ✅ | ✅ | ✅ |

**结论**：YouTube Data API 无法获取 `social_links`、`platforms`、`email` 这三个关键字段。必须通过页面抓取补充。

## 方案 A：YouTube Data API（主路）

### 流程

```
用户输入 @AlHuTV
    ↓
GET youtube.com/@AlHuTV → 从 HTML 提取 channelId
    ↓
YouTube Data API: channels.list(part=snippet,statistics,brandingSettings)
    ↓
基础字段写入 DB
```

### 优点
- 合法、稳定、无反爬风险
- 每日 10,000 次配额，内部工具完全够用
- 一次 HTTP fetch，部署到云端零额外成本

### 缺点
- 缺少 social_links、platforms、email
- 需要 Google Cloud Console 申请 API Key

### 无法获取的字段
- `social_links` — YouTube 社交链接通过 `youtube.com/redirect` 跳转，API 不暴露目标 URL
- `platforms` — API 不提供外链信息
- `email` — YouTube 不通过 API 提供用户邮箱

---

## 方案 B：浏览器端 Content Script 爬取（补充方案）

### 流程

```
用户粘贴 URL → 前端打开新窗口到 YouTube 频道页
    ↓
Chrome 插件的 content script 激活
    ↓
读取页面的 ytInitialData JSON → 提取 social_links + description
    ↓
postMessage 发回 CelePulse 后端 → 写入 DB
    ↓
关闭 YouTube 窗口
```

### 优点
- 使用用户真实浏览器、IP、cookie，零反爬风险
- 能获取 API 拿不到的所有字段（social_links、email）
- 用户操作自然（就是打开了一个页面）

### 缺点
- 需要用户安装 Chrome 插件
- 插件有开发/维护成本
- 依赖用户浏览器环境

---

## 推荐组合方案（当前实施 ✅）

**YouTube Data API → 获取主体字段（名称、头像、粉丝数、视频列表）**
**服务器端页面抓取 → 补充 duration, view_count, social_links, email, platforms**
**Chrome 插件 → 云端部署兜底（用用户浏览器绕过反爬）**

### 当前实施状态（2026-06-11）

✅ **API + 页面抓取合并模式**（`src/app/api/youtube/import/route.ts`）
- 有 `YOUTUBE_API_KEY` 时：API 获主体 + 服务器抓取补充
- 无 API Key 时：纯服务器抓取
- 已验证字段完整性：email, social_links, video.duration, video.view_count 全部有值

✅ **Chrome 插件**（`extension/` 目录）
- 检测 `?celepulse_import=<id>` URL 参数
- Content script 提取 `ytInitialData` + fetch `/about` 页面
- POST 补充数据到 `/api/youtube/supplement`

✅ **补充 API**（`/api/youtube/supplement`）
- 接收插件发来的 social_links, email, platforms, video 详情
- 调用 `supplementInfluencerFromYouTube` Server Action 更新数据库

---

## 当前采集架构（2026-07）

### 1. Chrome 插件静默采集（主力方案）

用户日常浏览 YouTube 时，插件在后台自动完成数据采集，无需任何手动操作。

**触发条件：**

| 页面类型 | URL 模式 | 采集行为 |
|---------|----------|----------|
| 频道页 | `/@handle`, `/channel/UC...` | 自动触发全量采集 |
| 视频页 | `/watch?v=...` | 提取视频所属频道 → 自动触发采集 |
| SPA 导航 | YouTube 内部跳转 | MutationObserver 监听 URL 变化 → 自动触发 |

**去重机制：** 浏览器本地 `chrome.storage.local`，同一频道 1 小时内不重复采集。

**采集流程：**

```
用户打开视频/频道页
    ↓
Content Script 检测页面类型
    ↓
从 ytInitialData / DOM 提取频道 URL
    ↓
1h 冷却检查（chrome.storage.local）
    ↓
提取频道数据：名称、头像、粉丝数、简介、邮箱
    ↓
fetch /videos 页获取最新视频列表（≤30 条）
    ↓
fetch /about 页获取社交链接（Twitter/Instagram/TikTok 等）
    ↓
POST /api/extension/collect → 写入 Supabase
    ↓
upsert 策略：只填空缺字段，不覆盖已有数据
```

**关键字段提取方式：**

| 字段 | 来源 | 方法 |
|------|------|------|
| `display_name` | 频道页 ytInitialData | `header.pageHeaderViewModel.title` |
| `avatar_url` | 频道页 ytInitialData | `header.pageHeaderViewModel.image` |
| `followers_count` | 频道页 ytInitialData | `header.metadata.subscriberCount` 文本解析 |
| `bio` | 频道页 ytInitialData | `metadata.channelMetadataRenderer.description` |
| `email` | 频道页 bio + /about 页 | 正则 `[\w.+-]+@[\w-]+\.[\w.-]+` |
| `social_links` | /about 页 ytInitialData | 解析 `aboutChannelRenderer.primaryLinks` 中的 redirect URL |
| 视频列表 | /videos 页 ytInitialData | `richGridRenderer.contents` → lockupViewModel |

### 2. YouTube Data API（辅助方案）

通过 `src/app/api/youtube/import/route.ts` 在手动导入红人时使用。

- 有 `YOUTUBE_API_KEY` 时：API 获取主体字段 + 服务器端页面抓取补充
- 无 API Key 时：纯服务器端页面抓取
- **API 无法获取的字段**：`social_links`、`platforms`、`email`（需插件补充）

### 3. 服务器端页面抓取（兑底方案）

`scripts/youtube_scraper.py` — Python HTTP 请求方案，仅本地批量导入用：

- 使用 User-Agent 伪装访问 YouTube 页面
- 提取 `ytInitialData` JSON 解析频道和视频数据
- 适用本地调试，**不适用云端部署**（数据中心 IP 会触发 CAPTCHA）

---

## 数据写入策略

**Upsert 规则（`upsertInfluencerFromExtension`）：**

```
已存在红人 → 只填充 null 字段（不覆盖手动填入的数据）
不存在     → 创建新记录
视频列表   → 按 video_id 去重合并（新视频追加，不删除旧视频）
```

这意味着：手动编辑的邮箱/社交链接不会被自动采集覆盖。

---

## 字段获取能力对比

| 字段 | YouTube API | 服务器抓取 | Chrome 插件 |
|------|:-----------:|:--------:|:-----------:|
| display_name | ✅ | ✅ | ✅ |
| avatar_url | ✅ | ✅ | ✅ |
| followers_count | ✅ 精确数字 | ✅ 文本解析 | ✅ |
| bio | ✅ | ✅ | ✅ |
| email | ❌ | ✅ | ✅ |
| social_links | ❌ | ✅ | ✅ |
| platforms | ❌ | ✅ | ✅ |
| 视频列表 | ✅ | ✅ | ✅ ≤30条 |
