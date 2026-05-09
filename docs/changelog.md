# Changelog — Influencer Management System

> 格式：顶部最新，底部最旧。每次代码更新后在顶部追加记录。

---

## 2026-05-10 00:15

### Added
- [src/lib/actions.ts] 创建 Server Actions，包含客户/项目/红人/币种的 CRUD 操作
- [src/app/page.tsx] 创建根路由重定向到 /dashboard
- [src/app/(dashboard)/clients/page.tsx] 客户列表页，支持查看所有客户
- [src/app/(dashboard)/clients/client-form.tsx] 客户表单组件，支持新建/编辑/删除（Dialog 弹窗）
- [src/app/(dashboard)/projects/page.tsx] 项目列表页，显示客户关联和状态
- [src/app/(dashboard)/projects/project-form.tsx] 项目表单组件，支持客户选择、状态、日期、预算和币种
- [src/app/(dashboard)/influencers/page.tsx] 红人列表页，显示状态和时区
- [src/app/(dashboard)/influencers/influencer-form.tsx] 红人表单组件，支持新建/编辑/删除
- [src/app/(dashboard)/admin/currencies/page.tsx] 币种管理页（Super Admin）
- [src/app/(dashboard)/admin/currencies/currency-form.tsx] 币种表单组件，支持启用/禁用/默认设置
- [src/components/ui/checkbox.tsx] 添加 shadcn checkbox 组件
- [src/components/ui/sonner.tsx] 添加 shadcn sonner 组件
- [src/components/ui/textarea.tsx] 添加 shadcn textarea 组件
- [src/components/ui/select.tsx] 添加 shadcn select 组件
- [.env.local] 配置 Supabase 连接信息（URL + Anon Key + Service Role Key）

### Fixed
- [src/lib/actions.ts] 修复 `createClient` 命名冲突，重命名导入为 `createServerClient`
- [src/app/(dashboard)/{clients,projects,influencers,admin/currencies}/*/form.tsx] 移除 DialogTrigger 的 `asChild` 属性（base-ui 不支持）
- [src/app/page.tsx] 创建根路由重定向，修复 Next.js 类型检查报错

### Database
- [supabase/migrations/00000000000000_initial_schema.sql] 已推送到远程数据库
- 9 种默认币种种子数据已写入（USD, EUR, GBP, SGD, CNY, JPY, AUD, CAD, HKD）

### Project
- Phase 2 核心数据 CRUD 完成
- Supabase 项目已链接并推送迁移
- 客户/项目/红人/币种四个模块可完整 CRUD 操作

---

## 2026-05-09 23:45

### Added
- [src/app/layout.tsx] 更新页面标题为 CelePulse
- [src/app/login/page.tsx] 创建登录页面，支持邮箱密码登录
- [src/app/(dashboard)/layout.tsx] 创建内部运营端布局，带侧边栏导航
- [src/app/(dashboard)/page.tsx] 创建运营仪表盘首页（统计卡片 + 活动区域）
- [src/app/(dashboard)/{clients,projects,collaborations,influencers,payments,invoices,admin/currencies}/page.tsx] 创建运营端各模块占位页面
- [src/app/(influencer)/layout.tsx] 创建红人端布局，带侧边栏导航
- [src/app/(influencer)/i/dashboard/page.tsx] 创建红人仪表盘首页
- [src/lib/supabase/client.ts] 创建浏览器端 Supabase client
- [src/lib/supabase/server.ts] 创建服务端 Supabase client
- [src/lib/supabase/admin.ts] 创建 Admin client (service role)
- [src/middleware.ts] 创建认证中间件，保护 dashboard 和 influencer 路由
- [src/components/shared/dashboard-sidebar.tsx] 创建运营端侧边栏组件，含导航和退出
- [src/types/database.ts] 创建数据库 TypeScript 类型定义
- [supabase/migrations/00000000000000_initial_schema.sql] 创建完整数据库迁移文件，包含 13 张核心表、触发器、RLS 策略
- [.env.example] 创建环境变量模板

### Database
- 新增表 `currencies`：币种管理，Super Admin 维护，含默认币种种子数据
- 新增表 `users`：内部用户（扩展 auth.users），支持 roles（operations/finance/admin/super_admin）
- 新增表 `clients`：客户（品牌方）
- 新增表 `projects`：项目，关联 clients
- 新增表 `project_members`：项目成员（多对多），含付款权限字段
- 新增表 `influencers`：红人档案
- 新增表 `collaborations`：合作（核心财务单元），含交付确认字段
- 新增表 `deliverables`：交付物
- 新增表 `companies`：付款方（红人自有）
- 新增表 `invoices`：发票，支持 uploaded/generated 两种来源
- 新增表 `invoice_items`：发票明细
- 新增表 `payments`：付款申请/记录，与 invoice 一对一
- 新增表 `bank_accounts`：银行账户，加密存储敏感信息，预留 Airwallex 字段
- 新增触发器 `trg_auth_users_insert`：自动创建用户档案
- 新增触发器 `trg_payments_check_amount`：付款金额不能超过合作总价
- 新增触发器 `trg_payments_check_invoice`：付款必须关联已审批 Invoice
- 所有业务表启用 RLS，配置基础策略

### Project
- Phase 1 基础设施搭建完成
- Next.js 14 + shadcn/ui + Tailwind 初始化
- Supabase 客户端配置完成（browser/server/admin）
- 认证中间件保护 dashboard 和 influencer 路由
- 运营端 8 个模块路由 + 红人端 5 个模块路由框架就绪

---

## 2026-05-09 15:30

### Added
- [docs/development-plan.md] 创建完整开发计划文档，包含业务架构、数据模型、系统架构、Airwallex 集成方案、前端页面规划、开发阶段划分
- [docs/rules.md] 创建开发规则与规范文档，包含数据库规范、前端规范、安全规范、Git 工作流、命名约定
- [.claude/skills/influencer-management.md] 创建项目 skill，定义自动更新 changelog 的规则和开发阶段检查清单
- [.gitignore] 初始化 git 忽略文件
- [docs/changelog.md] 创建变更日志（本文件）

### Project
- 初始化 Influencer Management & Payment System 项目
- 技术栈：Next.js 14 + shadcn/ui + Tailwind + Supabase + TypeScript
- 数据库：PostgreSQL (Supabase)，启用 RLS + pgcrypto 加密
- 目标：支持内部运营管理和红人自助服务，包含项目/合作/Invoice/付款全流程

---

*End of log*
