# Influencer Management System — 开发规则与规范

> 版本: v1.0  
> 创建日期: 2026-05-09  
> 最后更新: 2026-05-09

---

## 目录

1. [通用规范](#一通用规范)
2. [数据库规范](#二数据库规范)
3. [前端规范](#三前端规范)
4. [API/Edge Functions 规范](#四apiedge-functions-规范)
5. [安全规范](#五安全规范)
6. [Git 工作流](#六git-工作流)
7. [命名约定](#七命名约定)
8. [代码审查清单](#八代码审查清单)

---

## 一、通用规范

### 1.1 语言与框架

- **TypeScript 严格模式** — 所有代码必须使用 TypeScript，`strict: true`
- **不使用 any** — 除非绝对必要，必须标注类型
- **优先使用类型推导** — 简单场景让 TypeScript 推导，复杂场景显式声明

### 1.2 文件组织

```
src/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # 内部运营端路由组
│   │   ├── layout.tsx
│   │   ├── page.tsx              # /dashboard
│   │   ├── clients/
│   │   ├── projects/
│   │   ├── collaborations/
│   │   ├── influencers/
│   │   ├── payments/
│   │   ├── invoices/
│   │   └── admin/
│   │       └── currencies/
│   ├── (influencer)/             # 红人端路由组
│   │   ├── layout.tsx
│   │   ├── i/
│   │       ├── dashboard/
│   │       ├── collaborations/
│   │       ├── invoices/
│   │       ├── bank-accounts/
│   │       ├── companies/
│   │       └── profile/
│   ├── api/                      # API Routes（如需要）
│   ├── login/
│   └── layout.tsx                # Root layout
│
├── components/
│   ├── ui/                       # shadcn/ui 组件（自动生成）
│   ├── forms/                    # 表单组件
│   ├── tables/                   # 表格组件
│   ├── modals/                   # 弹窗组件
│   └── shared/                   # 通用组件
│
├── lib/
│   ├── supabase/                 # Supabase client 配置
│   │   ├── client.ts             # 浏览器端 client
│   │   ├── server.ts             # 服务端 client
│   │   └── admin.ts              # Admin client (service role)
│   ├── utils/
│   │   ├── format.ts             # 格式化工具（金额、日期）
│   │   ├── validation.ts         # 表单验证
│   │   └── permissions.ts        # 权限检查
│   └── constants.ts              # 常量定义
│
├── hooks/
│   ├── use-auth.ts
│   ├── use-user.ts
│   └── use-permissions.ts
│
├── types/
│   ├── database.ts               # 数据库类型（从 Supabase 生成）
│   ├── api.ts                    # API 类型
│   └── index.ts                  # 通用类型
│
└── styles/
    └── globals.css

supabase/
├── migrations/                   # 数据库迁移文件
│   ├── 00000000000000_initial_schema.sql
│   └── ...
├── functions/                    # Edge Functions
│   ├── airwallex-create-contact/
│   ├── airwallex-validate-account/
│   ├── airwallex-get-supported/
│   └── generate-invoice-pdf/
└── seed.sql                      # 种子数据
```

### 1.3 环境变量

```bash
# .env.local（不提交到 git）
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Airwallex
AIRWALLEX_API_KEY=
AIRWALLEX_CLIENT_ID=

# PDF 生成 API
PDF_GENERATOR_API_URL=
PDF_GENERATOR_API_KEY=

# 邮件服务（如 Resend）
RESEND_API_KEY=
```

---

## 二、数据库规范

### 2.1 表设计

```sql
-- 正确示例
CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    collaboration_id uuid REFERENCES public.collaborations(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id),
    amount numeric(15,2) NOT NULL,
    currency_id uuid REFERENCES public.currencies(id) NOT NULL,
    source_type text NOT NULL CHECK (source_type IN ('uploaded', 'generated')),
    file_url text,
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 启用 RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
```

### 2.2 强制规则

| 规则 | 说明 |
|------|------|
| UUID 主键 | 所有表主键使用 `uuid default gen_random_uuid()` |
| 金额字段 | 使用 `numeric(15,2)`，不使用 float/double |
| 时间戳 | 所有表必须有 `created_at` 和 `updated_at` |
| 外键策略 | 必须显式声明 `ON DELETE` 策略（CASCADE / SET NULL / RESTRICT） |
| RLS 启用 | 所有业务表必须启用 Row Level Security |
| 命名规范 | 表名和字段名使用小写 + 下划线（snake_case） |
| 索引命名 | `idx_[table]_[field]` 或 `idx_[table]_[field1]_[field2]` |

### 2.3 触发器规范

```sql
-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER trg_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2.4 敏感数据加密

```sql
-- 使用 pgcrypto 加密
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 加密
INSERT INTO bank_accounts (account_number_encrypted)
VALUES (pgp_sym_encrypt('123456789', current_setting('app.encryption_key')));

-- 解密
SELECT pgp_sym_decrypt(account_number_encrypted, current_setting('app.encryption_key'))
FROM bank_accounts;
```

---

## 三、前端规范

### 3.1 React 组件

```tsx
-- 使用函数组件 + TypeScript 接口
interface CollaborationCardProps {
  collaboration: Collaboration;
  onPaymentRequest: (id: string) => void;
}

export function CollaborationCard({ 
  collaboration, 
  onPaymentRequest 
}: CollaborationCardProps) {
  // 组件逻辑
}

-- 避免
function Card(props: any) {  -- 不用 any
  // ...
}
```

### 3.2 表单处理

```tsx
-- 使用 react-hook-form + zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  amount: z.number().positive('金额必须大于0'),
  currency_id: z.string().uuid(),
});

type FormData = z.infer<typeof schema>;

export function PaymentForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  // ...
}
```

### 3.3 数据获取

```tsx
-- Server Component 优先获取数据
async function CollaborationPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: collaboration } = await supabase
    .from('collaborations')
    .select('*, project:projects(*), influencer:influencers(*)')
    .eq('id', params.id)
    .single();
    
  if (!collaboration) notFound();
  
  return <CollaborationDetail data={collaboration} />;
}

-- Client Component 中使用 hook
function useCollaboration(id: string) {
  const supabase = useSupabaseClient();
  // ...
}
```

### 3.4 错误处理

```tsx
-- 使用 error.tsx 和 loading.tsx
-- app/collaborations/[id]/error.tsx
'use client';

export default function CollaborationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>加载合作信息失败</h2>
      <button onClick={reset}>重试</button>
    </div>
  );
}
```

### 3.5 样式规范

- 优先使用 Tailwind CSS utility classes
- shadcn/ui 组件为基础，自定义变体通过 `cn()` 工具函数合并
- 不使用内联样式（除非动态计算值）
- 颜色使用 CSS 变量（支持主题切换）

---

## 四、API/Edge Functions 规范

### 4.1 Edge Function 模板

```typescript
// supabase/functions/airwallex-create-contact/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  try {
    // 1. 验证请求
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');
    
    // 2. 解析请求体
    const body = await req.json();
    
    // 3. 调用 Airwallex API
    const response = await fetch('https://api.airwallex.com/api/v1/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('AIRWALLEX_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    // 4. 返回结果
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### 4.2 API 错误规范

```typescript
// 统一错误格式
{
  "error": {
    "code": "PAYMENT_EXCEEDED",
    "message": "累计付款金额超过合作总价",
    "details": {
      "total_paid": 3000,
      "requested": 3000,
      "collaboration_amount": 5000
    }
  }
}
```

---

## 五、安全规范

### 5.1 认证

- 使用 Supabase Auth JWT
- Token 过期时间：1小时
- Refresh Token 轮换启用

### 5.2 授权

- 所有数据访问通过 RLS
- 服务端操作使用 Service Role Key
- 绝不将 Service Role Key 暴露给前端

### 5.3 数据安全

- 银行账户信息必须加密存储
- 上传文件（Invoice PDF）限制类型和大小
- 所有用户输入进行验证和清理

### 5.4 环境安全

- `.env.local` 不提交到 git
- Edge Functions 中使用 `Deno.env.get()` 获取密钥
- 定期轮换 API Key

---

## 六、Git 工作流

### 6.1 分支策略

```
main              -> 生产环境
  └── develop     -> 开发集成
        ├── feature/client-crud
        ├── feature/collaboration-flow
        ├── feature/airwallex-integration
        └── bugfix/payment-calculation
```

### 6.2 提交规范

```
feat: 新增客户管理功能
fix: 修复付款金额计算错误
docs: 更新 API 文档
style: 调整表格样式
refactor: 重构权限检查逻辑
test: 添加付款流程测试
chore: 更新依赖版本
```

### 6.3 提交信息模板

```
type(scope): subject

body（可选，描述做了什么、为什么做）

footer（可选，关联 issue、breaking changes）
```

---

## 七、命名约定

### 7.1 数据库

| 类型 | 命名 | 示例 |
|------|------|------|
| 表 | snake_case，复数 | `collaborations`, `bank_accounts` |
| 字段 | snake_case | `created_at`, `total_amount` |
| 触发器 | `trg_[table]_[action]` | `trg_payments_check_amount` |
| 函数 | `fn_[描述]` | `fn_check_payment_amount` |
| 索引 | `idx_[table]_[fields]` | `idx_collaborations_project_id` |
| RLS 策略 | `[table]_[action]_[role]` | `influencers_select_own` |

### 7.2 TypeScript/React

| 类型 | 命名 | 示例 |
|------|------|------|
| 组件 | PascalCase | `CollaborationCard`, `PaymentForm` |
| Hook | camelCase，use 前缀 | `useAuth`, `usePermissions` |
| 类型/接口 | PascalCase | `Collaboration`, `PaymentStatus` |
| 常量 | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| 函数 | camelCase | `formatCurrency`, `validateAmount` |
| 文件 | kebab-case | `payment-form.tsx`, `use-auth.ts` |

---

## 八、代码审查清单

### 提交 PR 前自检

- [ ] TypeScript 类型检查通过（`npm run type-check`）
- [ ] ESLint 无错误（`npm run lint`）
- [ ] 数据库迁移文件已创建（如有 schema 变更）
- [ ] RLS 策略已配置（新增表）
- [ ] 敏感信息已加密（银行账户等）
- [ ] 环境变量已更新 `.env.example`
- [ ] 变更已记录到 `docs/changelog.md`

### 审查重点

- [ ] 权限检查是否正确（RLS + 代码层）
- [ ] 金额计算是否使用 decimal/numeric
- [ ] 错误处理是否完善
- [ ] 是否有 SQL 注入风险
- [ ] 是否有 XSS 风险
- [ ] 性能：N+1 查询、缺少索引

---

## 附录：工具配置

### TypeScript

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### ESLint

```json
{
  "extends": ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```
