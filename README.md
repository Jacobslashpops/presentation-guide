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

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui |
| 后端 | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| 音频转写 | youtubei.js (InnerTube API) + OpenAI Whisper + ffmpeg |
| 情绪分析 | DeepSeek API |
| 支付验证 | Airwallex API |
| 部署 | VPS (Next.js + nginx) + Supabase (后端) |

## 生产服务器

| 项目 | 信息 |
|------|------|
| IP | 43.162.94.130 |
| 位置 | 硅谷 (Silicon Valley) |
| 配置 | 2C / 3.6GB RAM / 60GB SSD |
| 系统 | Ubuntu 24.04 |
| 用户 | ubuntu |
| PEM 密钥 | ~/Desktop/Dev/server_key/tencentSF01.pem |
| 应用目录 | /home/ubuntu/celepulse |
| 进程管理 | PM2 |
| Web 服务器 | Caddy (port 80/443 → localhost:3000, 自动 HTTPS) |
| Node.js | v22.x |
| 访问地址 | https://admin.celepulse.com |

### 部署命令

```bash
# 同步代码到服务器
rsync -avz -e "ssh -i ~/Desktop/Dev/server_key/tencentSF01.pem" \
  --exclude=node_modules --exclude=.next --exclude=.git --exclude=supabase/.temp \
  . ubuntu@43.162.94.130:/home/ubuntu/celepulse/

# 在服务器上构建和重启
ssh -i ~/Desktop/Dev/server_key/tencentSF01.pem ubuntu@43.162.94.130 \
  "cd /home/ubuntu/celepulse && npm install && npm run build && pm2 restart celepulse"
```

### 服务器常用命令

```bash
# 查看应用状态
ssh -i ~/Desktop/Dev/server_key/tencentSF01.pem ubuntu@43.162.94.130 "pm2 list"

# 查看应用日志
ssh -i ~/Desktop/Dev/server_key/tencentSF01.pem ubuntu@43.162.94.130 "pm2 logs celepulse"

# 重启应用
ssh -i ~/Desktop/Dev/server_key/tencentSF01.pem ubuntu@43.162.94.130 "pm2 restart celepulse"
```

## 文档索引

| 文档 | 说明 |
|------|------|
| [docs/development-plan.md](docs/development-plan.md) | 完整开发计划与架构设计 |
| [docs/rules.md](docs/rules.md) | 编码规范、数据库规范、Git 工作流 |
| [docs/changelog.md](docs/changelog.md) | 变更日志（顶部最新） |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

## 环境变量

复制 `.env.example` 为 `.env.local` 并填写：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AIRWALLEX_API_KEY=
AIRWALLEX_CLIENT_ID=
PDF_GENERATOR_API_URL=
PDF_GENERATOR_API_KEY=
RESEND_API_KEY=
```
