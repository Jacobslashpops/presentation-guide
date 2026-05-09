# Changelog — Influencer Management System

> 格式：顶部最新，底部最旧。每次代码更新后在顶部追加记录。

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
