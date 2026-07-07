-- ============================================================
-- Storage Buckets for File Uploads
-- ============================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
    ('invoices', 'invoices', true),
    ('receipts', 'receipts', true),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for invoices bucket
CREATE POLICY "Invoices are viewable by everyone"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'invoices');

CREATE POLICY "Authenticated users can upload invoices"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'invoices'
        AND auth.role() = 'authenticated'
    );

-- RLS policies for receipts bucket
CREATE POLICY "Receipts are viewable by everyone"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'receipts');

CREATE POLICY "Authenticated users can upload receipts"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'receipts'
        AND auth.role() = 'authenticated'
    );

-- RLS policies for avatars bucket
CREATE POLICY "Avatars are viewable by everyone"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
    );
