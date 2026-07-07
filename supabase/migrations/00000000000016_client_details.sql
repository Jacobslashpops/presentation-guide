-- ============================================================
-- Client Details: billing info, contacts, contracts
-- ============================================================

-- Extend clients table with billing/invoice fields
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS billing_address text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_account text,
  ADD COLUMN IF NOT EXISTS bank_swift text,
  ADD COLUMN IF NOT EXISTS notes text;

-- Client contacts (multiple per client)
CREATE TABLE IF NOT EXISTS public.client_contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  role text,
  email text,
  phone text,
  wechat text,
  whatsapp text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Client contracts (file uploads)
CREATE TABLE IF NOT EXISTS public.client_contracts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  file_url text NOT NULL,
  contract_type text,
  signed_at date,
  expires_at date,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_contacts_select" ON public.client_contacts
  FOR SELECT USING (true);
CREATE POLICY "client_contacts_insert" ON public.client_contacts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "client_contacts_update" ON public.client_contacts
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "client_contacts_delete" ON public.client_contacts
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "client_contracts_select" ON public.client_contracts
  FOR SELECT USING (true);
CREATE POLICY "client_contracts_insert" ON public.client_contracts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "client_contracts_update" ON public.client_contracts
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "client_contracts_delete" ON public.client_contracts
  FOR DELETE USING (auth.role() = 'authenticated');

-- Storage bucket for contracts
INSERT INTO storage.buckets (id, name, public) VALUES ('contracts', 'contracts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Contracts are viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'contracts');

CREATE POLICY "Authenticated users can upload contracts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'contracts' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete contracts"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'contracts' AND auth.role() = 'authenticated');
