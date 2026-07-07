# Influencer Management & Payment System

红人管理与付款系统 — 面向内部运营团队和红人的协作管理平台。

## 项目概述

本系统用于管理服务商与客户的合作项目，追踪与红人的合作（Collaboration）、Invoice 开具和付款流程。

### 核心功能

- **客户管理** — 管理合作的品牌方客户
- **项目管理** — 按客户组织不同项目（新品发布、促销活动等）
- **红人管理** — 创建/邀请红人，管理其档案
- **合作管理** — 设定合作价格、追踪交付物
- **Invoice 系统** — 红人上传或生成 Invoice
- **付款流程** — 项目负责人申请付款，财务确认付款
- **银行账户** — 红人通过 Airwallex 验证的收款账户
- **币种管理** — Super Admin 维护支持的币种
- **Posts 监控** — 追踪社交媒体发布内容及情绪分析
- **AI 转写** — YouTube 视频字幕自动提取（InnerTube API + OpenAI Whisper）

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui |
| 后端 | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| 音频转写 | youtubei.js (InnerTube API) + OpenAI Whisper + ffmpeg |
| 情绪分析 | DeepSeek API |
| 支付验证 | Airwallex API |
| 部署 | VPS (Next.js + Caddy) + Supabase (数据库/Auth/存储) |

## 系统架构

```
用户浏览器 (admin.celepulse.com)
        ↓
    Caddy (HTTPS, 自动SSL)
        ↓
    Next.js (port 3000, PM2 管理)
        ↓                    ↓
   Supabase              OpenAI API
   (数据库/Auth/存储)     (Whisper 转写)
        ↓
   DeepSeek API
   (情绪分析)
```

## 部署指南

本系统由三个独立组件组成，各自部署在不同位置。

---

### 1. 数据库 & 认证 — Supabase

Supabase 提供 PostgreSQL 数据库、用户认证（Auth）和文件存储（Storage），无需自行维护。

| 项目 | 信息 |
|------|------|
| 项目名 | celepulse2026 |
| Project Ref | hpgrglhtkjwoqrrhmbnp |
| Region | Southeast Asia (Singapore) |
| 控制台 | https://supabase.com/dashboard/project/hpgrglhtkjwoqrrhmbnp |
| API URL | https://hpgrglhtkjwoqrrhmbnp.supabase.co |
| Auth 回调 | https://admin.celepulse.com |

**数据库连接方式：**

```bash
# 通过 Supabase CLI 推送数据库迁移
npx supabase db push

# 通过 Supabase CLI 拉取远程 schema
npx supabase db pull
```

**注意事项：**
- 数据库迁移文件位于 `supabase/migrations/` 目录
- 新增表或字段后需创建迁移文件并推送
- Auth Redirect URLs 需包含 `https://admin.celepulse.com`（已在控制台配置）

---

### 2. 前端 & 后端 — 硅谷 VPS

前端（Next.js）和后端 API 部署在同一台 VPS 上，通过 PM2 管理进程，Caddy 提供 HTTPS 反向代理。

| 项目 | 信息 |
|------|------|
| IP | 43.162.94.130 |
| 位置 | 硅谷 (Silicon Valley) |
| 配置 | 2C / 3.6GB RAM / 60GB SSD |
| 系统 | Ubuntu 24.04 |
| 用户 | ubuntu |
| PEM 密钥 | ~/Desktop/Dev/server_key/tencentSF01.pem |
| 应用目录 | /home/ubuntu/celepulse |
| 进程管理 | PM2（开机自启） |
| Web 服务器 | Caddy v2.11（自动 HTTPS，Let's Encrypt） |
| Node.js | v22.x |
| 访问地址 | https://admin.celepulse.com |

**SSH 连接：**

```bash
ssh -i ~/Desktop/Dev/server_key/tencentSF01.pem ubuntu@43.162.94.130
```

**部署更新（两条命令）：**

```bash
# 1. 同步代码到服务器（排除 node_modules、.next、.git）
rsync -avz -e "ssh -i ~/Desktop/Dev/server_key/tencentSF01.pem" \
  --exclude=node_modules --exclude=.next --exclude=.git --exclude=supabase/.temp \
  . ubuntu@43.162.94.130:/home/ubuntu/celepulse/

# 2. 在服务器上安装依赖、构建、重启
ssh -i ~/Desktop/Dev/server_key/tencentSF01.pem ubuntu@43.162.94.130 \
  "cd /home/ubuntu/celepulse && npm install && npm run build && pm2 restart celepulse"
```

**服务器常用命令：**

```bash
# 查看应用状态
ssh -i ~/Desktop/Dev/server_key/tencentSF01.pem ubuntu@43.162.94.130 "pm2 list"

# 查看应用日志
ssh -i ~/Desktop/Dev/server_key/tencentSF01.pem ubuntu@43.162.94.130 "pm2 logs celepulse"

# 重启应用
ssh -i ~/Desktop/Dev/server_key/tencentSF01.pem ubuntu@43.162.94.130 "pm2 restart celepulse"

# 查看 Caddy 状态
ssh -i ~/Desktop/Dev/server_key/tencentSF01.pem ubuntu@43.162.94.130 "sudo systemctl status caddy"

# 重载 Caddy 配置（修改 Caddyfile 后）
ssh -i ~/Desktop/Dev/server_key/tencentSF01.pem ubuntu@43.162.94.130 "sudo systemctl reload caddy"
```

**服务器环境变量：**

服务器上的 `.env.local` 文件位于 `/home/ubuntu/celepulse/.env.local`。更新方式：

```bash
scp -i ~/Desktop/Dev/server_key/tencentSF01.pem .env.local ubuntu@43.162.94.130:/home/ubuntu/celepulse/.env.local
```

**Caddy 配置文件：**

服务器上 `/etc/caddy/Caddyfile`，修改后执行 `sudo systemctl reload caddy`。

**服务器已安装的依赖：**
- Node.js v22（via nodesource）
- ffmpeg 6.1（用于音频分段，适配 Whisper API 25MB 限制）
- PM2 v7（全局安装）
- Caddy v2.11（全局安装）
- youtubei.js（项目依赖，无需额外安装）

---

### 3. Chrome Extension — 本地安装

Chrome 插件用于运营人员在浏览 YouTube/Instagram/TikTok 时自动采集红人数据。

**安装步骤：**

1. 打开 Chrome，地址栏输入 `chrome://extensions/`
2. 右上角开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择项目中的 `extension/` 目录
5. 插件图标出现在浏览器工具栏中

**插件功能：**
- 在 YouTube 视频页面自动采集红人信息（频道名、订阅数、社交链接等）
- 1 小时冷却机制，避免重复采集
- 数据通过 API 静默上报到服务器

**更新插件：**
修改 `extension/` 目录下的代码后，在 `chrome://extensions/` 页面点击插件卡片的刷新按钮即可。

---

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（自动热重载）
npm run dev

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

## 环境变量

复制 `.env.example` 为 `.env.local` 并填写：

```bash
# Supabase 连接（必需）
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# YouTube Data API（红人数据采集）
YOUTUBE_API_KEY=

# OpenAI（Whisper 音频转写）
OPENAI_API_KEY=

# DeepSeek（情绪分析）
DEEPSEEK_API_URL=
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=

# Airwallex（支付验证）
AIRWALLEX_API_KEY=
AIRWALLEX_CLIENT_ID=

# PDF & 邮件
PDF_GENERATOR_API_URL=
PDF_GENERATOR_API_KEY=
RESEND_API_KEY=
```

## 文档索引

| 文档 | 说明 |
|------|------|
| [docs/development-plan.md](docs/development-plan.md) | 完整开发计划与架构设计 |
| [docs/rules.md](docs/rules.md) | 编码规范、数据库规范、Git 工作流 |
| [docs/changelog.md](docs/changelog.md) | 变更日志（顶部最新） |
