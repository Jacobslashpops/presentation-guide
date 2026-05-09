-- ============================================================
-- Influencer Management System — Initial Schema
-- Created: 2026-05-09
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. Currencies (must be created first for FK references)
-- ============================================================
CREATE TABLE public.currencies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code text UNIQUE NOT NULL,
    name text NOT NULL,
    symbol text,
    is_active boolean DEFAULT true,
    is_default boolean DEFAULT false,
    supported_countries text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;

-- Seed default currencies
INSERT INTO public.currencies (code, name, symbol, is_default) VALUES
    ('USD', 'US Dollar', '$', true),
    ('EUR', 'Euro', '€', false),
    ('GBP', 'British Pound', '£', false),
    ('SGD', 'Singapore Dollar', 'S$', false),
    ('CNY', 'Chinese Yuan', '¥', false),
    ('JPY', 'Japanese Yen', '¥', false),
    ('AUD', 'Australian Dollar', 'A$', false),
    ('CAD', 'Canadian Dollar', 'C$', false),
    ('HKD', 'Hong Kong Dollar', 'HK$', false);

-- ============================================================
-- 2. Internal Users (extends auth.users)
-- ============================================================
CREATE TABLE public.users (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    role text NOT NULL DEFAULT 'operations' CHECK (role IN ('operations', 'finance', 'admin', 'super_admin')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Trigger: auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'operations')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_auth_users_insert
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. Clients
-- ============================================================
CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    logo_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.users(id)
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. Projects
-- ============================================================
CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid REFERENCES public.clients(id) ON DELETE RESTRICT NOT NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    start_date date,
    end_date date,
    budget numeric(15,2),
    budget_currency_id uuid REFERENCES public.currencies(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.users(id)
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. Project Members
-- ============================================================
CREATE TABLE public.project_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    can_request_payment boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    UNIQUE(project_id, user_id)
);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. Influencers
-- ============================================================
CREATE TABLE public.influencers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text UNIQUE,
    display_name text NOT NULL,
    phone text,
    avatar_url text,
    bio text,
    timezone text DEFAULT 'UTC',
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.users(id),
    registered_at timestamptz
);

ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. Collaborations
-- ============================================================
CREATE TABLE public.collaborations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    influencer_id uuid REFERENCES public.influencers(id) ON DELETE RESTRICT NOT NULL,
    title text NOT NULL,
    description text,
    total_amount numeric(15,2) NOT NULL,
    currency_id uuid REFERENCES public.currencies(id) NOT NULL,
    status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    deliverables_confirmed boolean DEFAULT false,
    deliverables_confirmed_by uuid REFERENCES public.users(id),
    deliverables_confirmed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.users(id)
);

ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. Deliverables
-- ============================================================
CREATE TABLE public.deliverables (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    collaboration_id uuid REFERENCES public.collaborations(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    due_date date,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'approved')),
    completed_at timestamptz,
    approved_by uuid REFERENCES public.users(id),
    approved_at timestamptz,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 9. Companies (for external invoice recipients)
-- ============================================================
CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id uuid REFERENCES public.influencers(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    email text,
    address text,
    tax_id text,
    country text NOT NULL,
    logo_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 10. Invoices
-- ============================================================
CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    collaboration_id uuid REFERENCES public.collaborations(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id),
    invoice_number text,
    amount numeric(15,2) NOT NULL,
    currency_id uuid REFERENCES public.currencies(id) NOT NULL,
    source_type text NOT NULL CHECK (source_type IN ('uploaded', 'generated')),
    file_url text,
    invoice_date date,
    due_date date,
    notes text,
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    submitted_by uuid REFERENCES public.influencers(id),
    submitted_at timestamptz,
    approved_by uuid REFERENCES public.users(id),
    approved_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 11. Invoice Items
-- ============================================================
CREATE TABLE public.invoice_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    description text NOT NULL,
    quantity numeric(10,2) DEFAULT 1,
    unit_price numeric(15,2) NOT NULL,
    amount numeric(15,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 12. Payments
-- ============================================================
CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    collaboration_id uuid REFERENCES public.collaborations(id) ON DELETE RESTRICT NOT NULL,
    invoice_id uuid REFERENCES public.invoices(id) UNIQUE,
    requested_amount numeric(15,2) NOT NULL,
    requested_currency_id uuid REFERENCES public.currencies(id) NOT NULL,
    requested_by uuid REFERENCES public.users(id) NOT NULL,
    requested_at timestamptz DEFAULT now(),
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'rejected', 'cancelled')),
    paid_by uuid REFERENCES public.users(id),
    paid_at timestamptz,
    actual_amount numeric(15,2),
    actual_currency_id uuid REFERENCES public.currencies(id),
    exchange_rate numeric(15,6),
    payment_reference text,
    receipt_url text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 13. Bank Accounts
-- ============================================================
CREATE TABLE public.bank_accounts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    influencer_id uuid REFERENCES public.influencers(id) ON DELETE CASCADE NOT NULL,
    account_name text NOT NULL,
    bank_name text,
    country text NOT NULL,
    currency_id uuid REFERENCES public.currencies(id) NOT NULL,
    account_type text,
    account_number_encrypted text,
    routing_number_encrypted text,
    iban_encrypted text,
    swift_bic text,
    airwallex_contact_id text,
    airwallex_account_id text,
    airwallex_verification_status text,
    airwallex_verified_at timestamptz,
    is_verified boolean DEFAULT false,
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Triggers: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trg_currencies_updated_at BEFORE UPDATE ON public.currencies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_influencers_updated_at BEFORE UPDATE ON public.influencers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_collaborations_updated_at BEFORE UPDATE ON public.collaborations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Payment Constraints
-- ============================================================

-- Trigger: Payment amount cannot exceed collaboration total
CREATE OR REPLACE FUNCTION public.check_payment_amount()
RETURNS TRIGGER AS $$
DECLARE
    total_paid numeric(15,2);
    collab_amount numeric(15,2);
BEGIN
    SELECT COALESCE(SUM(requested_amount), 0)
    INTO total_paid
    FROM public.payments
    WHERE collaboration_id = NEW.collaboration_id
      AND status IN ('pending', 'paid')
      AND id != NEW.id;

    SELECT total_amount INTO collab_amount
    FROM public.collaborations
    WHERE id = NEW.collaboration_id;

    IF (total_paid + NEW.requested_amount) > collab_amount THEN
        RAISE EXCEPTION '累计付款金额 (%) 超过合作总价 (%)',
            (total_paid + NEW.requested_amount), collab_amount;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payments_check_amount
    BEFORE INSERT OR UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.check_payment_amount();

-- Trigger: Payment must reference an approved invoice
CREATE OR REPLACE FUNCTION public.check_payment_invoice()
RETURNS TRIGGER AS $$
DECLARE
    inv_status text;
BEGIN
    SELECT status INTO inv_status
    FROM public.invoices
    WHERE id = NEW.invoice_id;

    IF inv_status != 'approved' THEN
        RAISE EXCEPTION '付款申请需要关联已审批的 Invoice';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payments_check_invoice
    BEFORE INSERT ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.check_payment_invoice();

-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- Users: All internal users can see each other, influencers cannot see users
CREATE POLICY users_select_all ON public.users
    FOR SELECT USING (true);

-- Currencies: Everyone can see active currencies
CREATE POLICY currencies_select_active ON public.currencies
    FOR SELECT USING (is_active = true);

CREATE POLICY currencies_manage_admin ON public.currencies
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Clients: All internal users can see, admins can manage
CREATE POLICY clients_select_all ON public.clients FOR SELECT USING (true);
CREATE POLICY clients_manage_admin ON public.clients
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Projects: All internal users can see
CREATE POLICY projects_select_all ON public.projects FOR SELECT USING (true);
CREATE POLICY projects_manage_admin ON public.projects
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'operations'))
    );

-- Project Members: All internal users can see
CREATE POLICY project_members_select_all ON public.project_members FOR SELECT USING (true);
CREATE POLICY project_members_manage ON public.project_members
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Influencers: Internal users see all, influencers see only themselves
CREATE POLICY influencers_select_all ON public.influencers FOR SELECT USING (true);
CREATE POLICY influencers_manage_admin ON public.influencers
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'operations'))
    );

-- Collaborations: Internal users see all, influencers see their own
CREATE POLICY collaborations_select_all ON public.collaborations FOR SELECT USING (true);
CREATE POLICY collaborations_manage_internal ON public.collaborations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid())
    );

-- Deliverables: Internal users see all, influencers see their own
CREATE POLICY deliverables_select_all ON public.deliverables FOR SELECT USING (true);
CREATE POLICY deliverables_manage_internal ON public.deliverables
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid())
    );

-- Companies: Only owner influencer can see/manage
CREATE POLICY companies_select_owner ON public.companies
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.influencers WHERE id = owner_id AND email = auth.email())
    );

CREATE POLICY companies_manage_owner ON public.companies
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.influencers WHERE id = owner_id AND email = auth.email())
    );

-- Invoices: Internal users see all, influencers see their own
CREATE POLICY invoices_select_all ON public.invoices FOR SELECT USING (true);
CREATE POLICY invoices_manage_internal ON public.invoices
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid())
    );

-- Invoice Items: Follow invoice policy
CREATE POLICY invoice_items_select_all ON public.invoice_items FOR SELECT USING (true);

-- Payments: Internal users see all, influencers see payments for their collaborations
CREATE POLICY payments_select_all ON public.payments FOR SELECT USING (true);
CREATE POLICY payments_manage_finance ON public.payments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('finance', 'admin', 'super_admin'))
    );

-- Bank Accounts: Only owner influencer
CREATE POLICY bank_accounts_select_owner ON public.bank_accounts
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.influencers WHERE id = influencer_id AND email = auth.email())
    );

CREATE POLICY bank_accounts_manage_owner ON public.bank_accounts
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.influencers WHERE id = influencer_id AND email = auth.email())
    );
