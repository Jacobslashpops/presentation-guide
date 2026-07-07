# Influencer Management & Payment System — 开发计划

> 版本: v1.0  
> 创建日期: 2026-05-09  
> 最后更新: 2026-05-09  
> 状态: 规划中

---

## 目录

1. [业务架构总览](#一业务架构总览)
2. [核心数据模型](#二核心数据模型)
3. [系统架构](#三系统架构)
4. [Airwallex 集成方案](#四airwallex-集成方案)
5. [前端页面规划](#五前端页面规划)
6. [核心业务流程](#六核心业务流程)
7. [开发阶段划分](#七开发阶段划分)
8. [关键决策总结](#八关键决策总结)

---

## 一、业务架构总览

### 1.1 业务层级

```
服务商（内部运营）
  └── 客户 A
        └── 项目：春季新品发布（项目负责人：Alice, Bob）
              └── Collaboration：红人小王（价格 $5,000 / USD）
                    ├── Deliverables：3条 Instagram 帖子
                    ├── Invoice #1：$2,000（首款）→ Payment #1（已付）
                    └── Invoice #2：$3,000（尾款）→ Payment #2（pending）
        └── 项目：年中大促
              └── Collaboration：红人小李（价格 $3,000 / SGD）
  └── 客户 B
        └── ...
```

### 1.2 用户角色

| 角色 | 权限 | 说明 |
|------|------|------|
| Operations | 查看全部项目、管理自己负责的项目、提交付款申请 | 基础运营 |
| Finance | 查看全部、操作付款、回填付款信息 | 财务 |
| Admin | 查看全部、操作全部 | 管理员 |
| Super Admin | 查看全部、操作全部、管理币种 | 超级管理员 |
| Influencer | 查看自己的合作、管理银行/Invoice/Companies | 红人 |

### 1.3 核心约束

1. **付款累计 ≤ Collaboration 总价**（数据库触发器强制）
2. **付款必须与 Invoice 一对一**（Invoice 必须先审批）
3. **只有项目负责人（project_members）可提交付款**
4. **只有 Finance / Super Admin 可标记付款完成**
5. **付款前必须确认所有 Deliverables 已完成**

---

## 二、核心数据模型

### 2.1 ER 关系图

```
users (内部用户)
  ├── 1:N project_members → projects
  ├── 1:N collaborations (created_by)
  └── 1:N payments (requested_by, paid_by)

clients
  └── 1:N projects

projects
  ├── N:1 clients
  ├── N:M project_members ↔ users
  └── 1:N collaborations

influencers
  ├── 1:N collaborations
  ├── 1:N bank_accounts
  ├── 1:N invoices (submitted_by)
  └── 1:N companies (owner)

collaborations (核心财务单元)
  ├── N:1 projects
  ├── N:1 influencers
  ├── N:1 currencies
  ├── 1:N deliverables
  ├── 1:N invoices
  └── 1:N payments

invoices
  ├── N:1 collaborations (nullable = 独立 invoice)
  ├── N:1 companies (付款方)
  ├── N:1 currencies
  ├── 1:1 payments
  └── 1:N invoice_items

payments
  ├── N:1 collaborations
  ├── 1:1 invoices
  ├── N:1 currencies (requested_currency_id)
  ├── N:1 currencies (actual_currency_id, nullable)
  ├── N:1 users (requested_by)
  └── N:1 users (paid_by, nullable)

bank_accounts
  ├── N:1 influencers
  └── N:1 currencies

companies
  └── N:1 influencers (owner)

currencies
  └── 1:N 多处引用
```

### 2.2 表结构定义

详见 `supabase/migrations/` 目录下的迁移文件。核心表包括：

| 表名 | 说明 |
|------|------|
| `users` | 内部用户（扩展 Supabase Auth） |
| `clients` | 客户（品牌方） |
| `projects` | 项目 |
| `project_members` | 项目成员（多对多，含付款权限） |
| `influencers` | 红人 |
| `collaborations` | 合作（核心财务单元） |
| `deliverables` | 交付物 |
| `currencies` | 币种（Super Admin 管理） |
| `companies` | 付款方（红人自有，可复用） |
| `invoices` | 发票 |
| `invoice_items` | 发票明细 |
| `payments` | 付款申请/记录 |
| `bank_accounts` | 银行账户（加密存储） |

### 2.3 关键数据库约束

#### 触发器：付款金额上限

```sql
create or replace function check_payment_amount()
returns trigger as $$
declare
    total_paid numeric(15,2);
    collab_amount numeric(15,2);
begin
    select coalesce(sum(requested_amount), 0)
    into total_paid
    from public.payments
    where collaboration_id = new.collaboration_id
      and status in ('pending', 'paid')
      and id != new.id;
    
    select total_amount into collab_amount
    from public.collaborations
    where id = new.collaboration_id;
    
    if (total_paid + new.requested_amount) > collab_amount then
        raise exception '累计付款金额 (%) 超过合作总价 (%)', 
            (total_paid + new.requested_amount), collab_amount;
    end if;
    
    return new;
end;
$$ language plpgsql;
```

#### 触发器：付款必须关联已审批 Invoice

```sql
create or replace function check_payment_invoice()
returns trigger as $$
declare
    inv_status text;
begin
    select status into inv_status
    from public.invoices
    where id = new.invoice_id;
    
    if inv_status != 'approved' then
        raise exception '付款申请需要关联已审批的 Invoice';
    end if;
    
    return new;
end;
$$ language plpgsql;
```

### 2.4 敏感信息加密

银行账户敏感字段使用 `pgcrypto` 加密：

```sql
-- 加密示例
update bank_accounts
set account_number_encrypted = pgp_sym_encrypt(account_number, current_setting('app.encryption_key'));
```

---

## 三、系统架构

### 3.1 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Next.js 14 (App Router) | SSR/SSG，API Routes |
| UI 组件 | shadcn/ui + Tailwind CSS | 快速搭建管理后台 |
| 状态管理 | React Server Components + Zustand | 轻量状态 |
| ORM/Client | Supabase Client | 直接前端查询 + RLS |
| 后端服务 | Supabase Edge Functions | Airwallex 等敏感 API |
| 数据库 | PostgreSQL (Supabase) | 主数据库 |
| 存储 | Supabase Storage | Invoice PDF、头像等 |
| 认证 | Supabase Auth | JWT + 邮件验证 |

### 3.2 架构图

```
┌────────────────────────────────────────┐
│           Next.js Frontend             │
│  ┌──────────────┐  ┌────────────────┐ │
│  │  内部运营端   │  │    红人端       │ │
│  │  /dashboard  │  │  /i/dashboard  │ │
│  │  /projects/* │  │  /i/invoices/* │ │
│  └──────────────┘  └────────────────┘ │
└────────────────────────────────────────┘
           │                    │
           ▼                    ▼
┌────────────────────────────────────────┐
│        Supabase Client (RLS)           │
│  ┌─────────────┐    ┌──────────────┐  │
│  │  Auth/用户   │    │  Database    │  │
│  └─────────────┘    └──────────────┘  │
│  ┌─────────────┐    ┌──────────────┐  │
│  │   Storage   │    │ Edge Functions│  │
│  │  (PDF/头像)  │    │ (Airwallex)  │  │
│  └─────────────┘    └──────────────┘  │
└────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│           PostgreSQL                   │
│    (Triggers + RLS + pgcrypto)         │
└────────────────────────────────────────┘
```

### 3.3 RLS 策略原则

- `users`：只能看到自己的资料，admin/super_admin 可以查看全部
- `projects`：内部用户可见全部，红人只能看到自己参与的
- `collaborations`：内部用户可见全部，红人只能看到自己的
- `invoices`：红人只能看到自己的，内部用户可见全部
- `payments`：红人只能看到关联 collaboration 的付款
- `bank_accounts`：红人只能看到自己的
- `companies`：红人只能看到自己创建的（通过 `owner_id`）

---

## 四、Airwallex 集成方案

### 4.1 Day 1 接入的 API

| 功能 | Airwallex API | 用途 |
|------|---------------|------|
| 创建联系人 | `POST /api/v1/contacts` | 创建红人收款人信息 |
| 验证银行账户 | `POST /api/v1/bank_accounts/validate` | 验证 IBAN/ACH 等 |
| 查询支持的国家/币种 | `GET /api/v1/bank_accounts/supported` | 动态表单字段 |
| 创建受益人 | `POST /api/v1/beneficiaries` | 创建收款受益人 |
| 查询汇率 | `GET /api/v1/rates` | 预留，显示参考汇率 |

### 4.2 Edge Functions

```
supabase/functions/
├── airwallex-create-contact/      # 创建联系人 + 受益人
├── airwallex-validate-account/    # 验证银行账户
├── airwallex-get-supported/       # 获取支持的国家/账户类型
└── generate-invoice-pdf/          # 调用外部 PDF API
```

### 4.3 动态银行表单

根据 Airwallex 返回的 `supported_countries` 和 `supported_account_types`，动态渲染：

| 国家/地区 | 账户类型 | 所需字段 |
|-----------|----------|----------|
| 美国 | ACH | routing_number + account_number |
| 欧洲 | IBAN | iban |
| 英国 | Local | sort_code + account_number |
| 新加坡 | Local | 特定格式 |
| ... | ... | ... |

---

## 五、前端页面规划

### 5.1 内部运营端路由

```
/dashboard                          → 仪表盘
│
├── /clients
│   ├── /                           → 客户列表
│   ├── /new                        → 新建客户
│   └── /[id]                       → 客户详情
│
├── /projects
│   ├── /                           → 项目列表
│   ├── /new                        → 新建项目
│   ├── /[id]                       → 项目详情
│   │   ├── /members                → 项目成员管理
│   │   └── /collaborations         → 项目下的合作
│   └── /[id]/edit                  → 编辑项目
│
├── /collaborations
│   ├── /                           → 全部合作列表
│   ├── /new                        → 新建合作
│   └── /[id]                       → 合作详情
│       ├── /deliverables           → 交付物管理
│       ├── /invoices               → Invoice 列表
│       └── /payments               → 付款记录 + 申请
│
├── /influencers
│   ├── /                           → 红人列表
│   ├── /new                        → 创建/邀请红人
│   └── /[id]                       → 红人详情
│
├── /payments
│   ├── /pending                    → 待处理付款
│   ├── /history                    → 付款历史
│   └── /[id]                       → 付款详情（回填）
│
├── /invoices
│   └── /[id]                       → Invoice 详情/审批
│
└── /admin
    └── /currencies                 → 币种管理（Super Admin）
```

### 5.2 红人端路由

```
/i/dashboard                        → 红人仪表盘
│
├── /i/collaborations
│   ├── /                           → 我的合作
│   └── /[id]                       → 合作详情
│
├── /i/invoices
│   ├── /                           → Invoice 列表
│   ├── /new                        → 新建 Invoice
│   │   ├── ?type=upload            → 上传 PDF
│   │   └── ?type=generate          → 使用生成器
│   └── /[id]                       → Invoice 详情
│
├── /i/bank-accounts
│   ├── /                           → 银行账户列表
│   ├── /new                        → 添加账户
│   └── /[id]                       → 账户详情
│
├── /i/companies
│   ├── /                           → 我的付款方
│   ├── /new
│   └── /[id]/edit
│
└── /i/profile                      → 个人资料
```

---

## 六、核心业务流程

### 6.1 标准付款流程

```
1. 运营创建 Project
        ↓
2. 运营创建 Collaboration（设定总价、币种）
        ↓
3. 红人登录 → 查看 Collaboration
        ↓
4. 运营确认 Deliverables 全部完成
        ↓
5. 红人提交 Invoice #1（首款）
   - 上传 PDF 或 使用生成器
        ↓
6. 运营审批 Invoice
        ↓
7. 项目负责人点击"申请付款"
   - 系统验证：累计已付 + 申请 ≤ 总价 ✅
   - 系统验证：Invoice 已审批 ✅
   - 系统验证：Deliverables 已完成 ✅
   - 付款状态：pending
        ↓
8. 财务登录 → 查看 Pending Payments
   - 手动转账（通过 Airwallex GUI 或银行）
   - 回填：实际付款金额、汇率、参考号、上传凭证
   - 标记状态：paid
        ↓
9. 红人看到付款记录更新
```

### 6.2 独立 Invoice（给外部品牌）

```
红人 → 新建 Invoice → 选择"独立创建"
      → 选择/新建 Company（付款方）
      → 填写明细 或 上传 PDF
      → 生成 Invoice PDF（接入外部 PDF API）
      → 下载/发送给外部品牌
```

### 6.3 多币种默认逻辑

```
默认：按红人银行账户所在国家的本地币种
      新加坡账户 → SGD
      美国账户   → USD
      德国账户   → EUR
      
例外：允许手动覆盖（前端隐藏选项）
      财务/运营在付款时可以选择其他币种
      
汇率：由 Airwallex 决定，财务回填实际汇率
```

---

## 七、开发阶段划分

### Phase 1: 基础设施（Week 1）

| 任务 | 详情 |
|------|------|
| Supabase 项目初始化 | 建表、RLS、触发器 |
| Next.js 项目搭建 | App Router、shadcn/ui、Tailwind |
| 认证系统 | Supabase Auth、登录/注册页、中间件 |
| 路由布局 | 内部端 Layout、红人端 Layout |
| 基础组件 | Sidebar、Header、DataTable、Form |

**交付物**: 可运行的基础框架 + 登录系统

### Phase 2: 核心数据 - 客户/项目/红人（Week 2）

| 任务 | 详情 |
|------|------|
| 客户 CRUD | 列表、新建、编辑、详情 |
| 项目 CRUD | 列表、新建、编辑、详情 |
| 项目成员管理 | 添加/移除成员、设置付款权限 |
| 红人 CRUD | 内部创建、邀请邮件、自主注册 |
| 币种管理 | Super Admin 专属页面 |

**交付物**: 内部运营可完整管理客户、项目、红人

### Phase 3: Collaboration + Deliverables（Week 3）

| 任务 | 详情 |
|------|------|
| Collaboration CRUD | 关联项目+红人、设定价格/币种 |
| 交付物管理 | 创建交付项、确认完成、审批 |
| 项目详情页 | 显示所有 collaboration |

**交付物**: 完整的合作管理流程

### Phase 4: Airwallex + 银行账户（Week 3-4）

| 任务 | 详情 |
|------|------|
| Airwallex API 调研 | 确认 Contact/Beneficiary/Validation 接口 |
| Edge Functions | airwallex-create-contact、airwallex-validate |
| 动态银行表单 | 根据国家渲染不同字段（ACH/IBAN/etc） |
| 银行账户加密 | pgcrypto 实现敏感信息加密 |
| 红人端银行管理 | 添加/查看/设置默认账户 |

**交付物**: 红人可安全添加并验证银行账户

### Phase 5: Invoice 系统（Week 4-5）

| 任务 | 详情 |
|------|------|
| Invoice 上传 | 文件上传至 Supabase Storage |
| Invoice 生成器 | 表单：公司信息、明细项、日期 |
| PDF 生成 API 接入 | 调用外部 API |
| Companies 管理 | 红人可创建/管理付款方 |
| 独立 Invoice | 不关联 Collaboration 的 Invoice |
| Invoice 审批 | 内部运营审批流程 |

**交付物**: 完整的 Invoice 上传/生成/审批流程

### Phase 6: 付款流程（Week 5-6）

| 任务 | 详情 |
|------|------|
| 付款申请 | 项目负责人提交（验证权限+金额） |
| 付款验证 | 触发器：金额上限、Invoice 审批、Deliverables 完成 |
| 财务付款页 | Pending 列表、回填信息、上传凭证 |
| 状态追踪 | pending → paid（或 rejected） |
| 付款历史 | 双方均可查看 |

**交付物**: 完整的付款申请-确认流程

### Phase 7: 红人端 + 仪表盘（Week 6-7）

| 任务 | 详情 |
|------|------|
| 红人 Dashboard | 进行中的合作、待收款、近期记录 |
| 合作查看 | 只读查看自己的 collaboration |
| Invoice 管理 | 创建、查看、下载 |
| 银行账户 | 管理（接入 Phase 4） |
| 个人资料 | 编辑信息 |

**交付物**: 红人可独立使用平台

### Phase 8: 优化与收尾（Week 7-8）

| 任务 | 详情 |
|------|------|
| 仪表盘统计 | 金额汇总、项目进度、待处理事项 |
| 搜索与筛选 | 所有列表页 |
| 邮件通知 | 邀请、付款状态变更 |
| 测试 | E2E 测试核心流程 |
| Bug 修复 | 全面测试 |

**交付物**: MVP 可上线版本

---

## 八、关键决策总结

| 决策点 | 选择 | 原因 |
|--------|------|------|
| 项目负责人 | Project 级别，可多人 | 通过 `project_members` 表实现，灵活且可控 |
| Invoice 来源 | 二选一（上传 vs 生成） | `source_type` 字段区分，满足不同场景 |
| 付款-Invoice 关系 | 一对一 | 每个付款必须关联一个已审批 Invoice |
| 独立 Invoice | 支持，有 Companies 表 | 红人可复用自己创建的付款方，有 ownership 隔离 |
| 多币种默认 | 按银行账户所在国家币种 | 默认逻辑，可手动覆盖（前端隐藏选项） |
| 汇率来源 | Airwallex 决定，财务回填 | 暂时不走自动 API 付款，手动回填 |
| 敏感信息 | pgcrypto 加密 | 银行账户信息必须加密存储 |
| 权限控制 | RLS + API 层校验 | 双重保障，确保数据安全 |
| 客户登录 | 不支持 | 当前阶段客户不登录系统 |
| 红人注册 | 支持自主注册，但主要由员工邀请 | 兼顾灵活性和管控 |

---

## 附录：待确认事项

1. [ ] Supabase 连接信息（URL + Service Role Key）
2. [ ] Airwallex API Key + 文档
3. [ ] 外部 PDF 生成 API 接口文档
4. [ ] 邮件服务选择（Resend / SendGrid / 其他）
5. [ ] Logo 和品牌色
6. [ ] 是否需要合同/协议管理功能
7. [ ] 是否需要数据导出（Excel）功能
