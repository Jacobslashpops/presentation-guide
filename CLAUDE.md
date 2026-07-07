# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT: Read Next.js docs first

This project uses Next.js 16, which has breaking changes from the Next.js you know. Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. Start with `node_modules/next/dist/docs/index.md` for the topic index.

## Common Commands

```bash
npm run dev          # Start dev server on port 30015
npm run build        # Production build
npm run lint         # ESLint
```

There is no `type-check` or `test` script. To type-check, run `npx tsc --noEmit`.

## Architecture Overview

**CelePulse** — an influencer management and payment system for internal operations teams and influencers. Chinese-language UI targeting a Chinese-speaking operations team.

### Tech Stack
- **Next.js 16** (App Router) with React 19, TypeScript strict mode
- **Supabase** — PostgreSQL database with RLS, Auth, Storage, Edge Functions
- **shadcn/ui** with Tailwind CSS v4 — note: uses `@base-ui/react` (not Radix) for lower-level primitives
- **react-hook-form + zod** for form handling
- **Supabase Auth** — JWT-based, email/password login

### Three Supabase Clients

| File | Where | Purpose |
|------|-------|---------|
| `src/lib/supabase/server.ts` | Server Components, Server Actions | Uses `cookies()` from `next/headers` |
| `src/lib/supabase/client.ts` | Client Components (`'use client'`) | Browser-side Supabase client |
| `src/lib/supabase/admin.ts` | When RLS must be bypassed | Uses `SUPABASE_SERVICE_ROLE_KEY` |

### Route Groups (Two Sides of the App)

- **`(dashboard)/`** — Internal operations team: client management, projects, collaborations, influencers, invoices, payments, admin (currencies). All routes start at `/dashboard/*`.
- **`(influencer)/i/`** — Influencer self-service: collaborations, invoices, bank accounts, companies. All routes start at `/i/*`.

Each route group has its own `layout.tsx` with auth guards. The dashboard layout includes `<DashboardSidebar>`; the influencer layout has an inline sidebar.

### Auth & Middleware

`src/middleware.ts` protects both `/dashboard/*` and `/i/*` routes — unauthenticated users redirect to `/login`. The login page (`src/app/login/page.tsx`) is the only unauthenticated page. Auth uses Supabase Auth with JWT; the `users` table (in `public.users`) extends auth with roles: `operations`, `finance`, `admin`, `super_admin`.

### Server Actions Pattern

All database mutations go through `src/lib/actions.ts` as `'use server'` functions. This is the single mutation layer for the entire app — there are no API routes for CRUD. Each action:
1. Creates a server Supabase client
2. Gets the current user via `supabase.auth.getUser()`
3. Performs the operation (with authorization checks where needed)
4. Calls `revalidatePath()` on affected routes

Server Components fetch data directly from Supabase (Server Component → server client → Supabase).

### Database (Supabase PostgreSQL)

Migrations are in `supabase/migrations/` — numbered SQL files run in order. Key design rules:
- All tables use UUID primary keys (`uuid DEFAULT gen_random_uuid()`)
- Monetary values use `numeric(15,2)`, never float
- All tables have `created_at` and `updated_at` timestamps
- All business tables have RLS enabled
- Foreign keys must explicitly declare `ON DELETE` strategy
- Sensitive fields (bank account numbers) encrypted with `pgcrypto`

Critical database triggers:
- **Payment amount check**: cumulative payments on a collaboration cannot exceed the collaboration's `total_amount`
- **Payment-invoice check**: a payment must reference an approved invoice
- **Payment-invoice uniqueness**: one invoice can have at most one payment (enforced in app code)

### Type System

`src/types/database.ts` contains the `Database` interface — manually maintained (not auto-generated). It defines the shape of all public tables (Row, Insert, Update types).

### Key Business Constraints (enforced in code + DB)

1. Cumulative payment amounts ≤ collaboration total (DB trigger + app code)
2. Payments require approved invoices (DB trigger + app code)
3. Payments require confirmed deliverables (app code in `createPayment`)
4. Only project members with `can_request_payment = true` can request payments
5. Only Finance / Super Admin can mark payments as paid (enforced via UI, not code)

### shadcn/ui Conventions

The project uses `@base-ui/react` as the underlying primitive library for shadcn components (Dialog, Select, etc.). This means some shadcn patterns differ — notably, `DialogTrigger` does not support `asChild`, and Select uses a non-controlled API to avoid type conflicts with React state setters.

Use the `cn()` helper from `src/lib/utils.ts` to merge Tailwind classes.

### Project Documentation

- `docs/development-plan.md` — Full business architecture, data model, page plan, Airwallex integration, development phases
- `docs/rules.md` — Coding conventions, database rules, naming conventions, code review checklist
- `docs/changelog.md` — Chronological log of all changes, top-newest
