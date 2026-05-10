-- Seed test admin user
-- UUID: 1d8fdc1f-f7ca-4329-8baf-17b48f4a4c79
-- Email: admin@admin.com
-- Role: super_admin

INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
VALUES (
    '1d8fdc1f-f7ca-4329-8baf-17b48f4a4c79',
    'admin@admin.com',
    'Admin User',
    'super_admin',
    now(),
    now()
)
ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    updated_at = now();
