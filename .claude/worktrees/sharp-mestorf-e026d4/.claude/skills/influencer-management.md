---
name: influencer-management
description: Influencer Management & Payment System — 红人管理与付款系统的开发和维护 skill。每次代码更新后自动更新 changelog，确保项目状态可追溯。
triggers:
  - file_path: "**/*.{ts,tsx,sql,md}"
  - directory: "celepulse"
---

# Influencer Management System — Development Skill

## 核心职责

1. **开发规范执行** — 严格遵守 `docs/rules.md` 中的编码规范
2. **变更日志维护** — 每次文件修改后，在 `docs/changelog.md` 顶部追加记录
3. **Schema 变更追踪** — 所有数据库变更必须记录在 `docs/changelog.md` 的 Database 区块
4. **计划一致性** — 开发方向必须与 `docs/development-plan.md` 保持一致

## Changelog 更新规则

### 何时更新
- 任何 `.ts`, `.tsx`, `.sql`, `.css`, `.json` 文件被修改后
- 数据库 schema 变更（新增表、字段、索引、触发器、RLS 策略）
- 新建文件或删除文件
- 环境变量或配置文件变更

### 更新格式
```markdown
## YYYY-MM-DD HH:MM

### Added / Changed / Fixed / Removed
- [文件路径] 具体做了什么变更（1-2句话）
- [文件路径] 变更原因（如需要）

### Database
- 新增表 `table_name` / 修改字段 `column_name` / 新增索引 / 新增 RLS 策略
```

### 排序规则
- **顶部最新，底部最旧** — 每次新记录插入到文件最顶部（## 之后）
- 保持时间倒序

### 更新流程
1. 文件修改完成并保存后
2. 读取 `docs/changelog.md`
3. 在第一个 `## ` 标题之前插入新记录
4. 如文件为空，先写入模板头部，再插入记录

## 数据库开发规范

### 必须遵循
- 所有表使用 `public` schema
- 主键使用 `uuid default gen_random_uuid()`
- 金额字段使用 `numeric(15,2)`
- 所有表必须包含 `created_at` 和 `updated_at`
- 外键必须加 `on delete` 策略
- 所有表启用 RLS（Row Level Security）
- 敏感信息使用 `pgcrypto` 加密存储

### Schema 变更追踪
任何数据库变更必须在 changelog 中记录：
```markdown
### Database
- 新增表 `invoices`：发票管理，关联 collaborations 和 companies
- 修改表 `payments`：新增字段 `exchange_rate numeric(15,6)`
- 新增触发器 `trg_check_payment_amount`
```

## 开发阶段检查清单

### Phase 1: 基础设施
- [ ] Supabase 项目连接
- [ ] Next.js + shadcn/ui 搭建
- [ ] 认证系统（Supabase Auth）
- [ ] 路由布局（内部端 + 红人端）

### Phase 2: 核心数据
- [ ] 客户 CRUD
- [ ] 项目 CRUD + 成员管理
- [ ] 红人 CRUD
- [ ] 币种管理（Super Admin）

### Phase 3: Collaboration
- [ ] 合作 CRUD
- [ ] 交付物管理
- [ ] 交付确认流程

### Phase 4: Airwallex
- [ ] Edge Functions 搭建
- [ ] 动态银行表单
- [ ] 银行账户加密存储
- [ ] 红人端银行管理

### Phase 5: Invoice
- [ ] Invoice 上传
- [ ] Invoice 生成器
- [ ] PDF API 接入
- [ ] Companies 管理
- [ ] Invoice 审批

### Phase 6: 付款
- [ ] 付款申请（验证金额上限）
- [ ] 财务付款回填
- [ ] 状态追踪

### Phase 7: 红人端
- [ ] Dashboard
- [ ] 合作/Invoice/银行 管理

### Phase 8: 优化
- [ ] 仪表盘统计
- [ ] 搜索筛选
- [ ] 邮件通知
- [ ] 测试

## 关键文件索引

| 文件 | 用途 |
|------|------|
| `docs/development-plan.md` | 完整开发计划与架构 |
| `docs/rules.md` | 编码规范与开发规则 |
| `docs/changelog.md` | 变更日志（顶部最新） |
| `supabase/migrations/` | 数据库迁移文件 |
| `.claude/skills/influencer-management.md` | 本 skill |
