-- ============================================================-- Insert 2 more real influencers: Aurelie & Morgan Malau, Avis Express-- ============================================================

-- Aurelie & Morgan Malau
INSERT INTO public.influencers (
    email,
    display_name,
    avatar_url,
    bio,
    timezone,
    status,
    platform,
    followers_count,
    channel_urls
) VALUES (
    'aurelie.malau@gmail.com',
    'Aurélie & Morgan Malau',
    'https://yt3.googleusercontent.com/8J9iws02XODjFws3JbaFg-Er_wlWOs8bVpWgWndTOf4ebdQKFHkiJIoK6GkXvmbiJRN7fVUGfg=s800-c-k-c0x00ffffff-no-rj',
    'Testeurs invétérés, bricoleurs du dimanche, organisatrice dans l''âme ! Bienvenue sur notre chaîne !',
    'Europe/Paris',
    'active',
    ARRAY['YouTube', 'Instagram', 'Facebook', 'Twitter', 'Pinterest'],
    157000,
    jsonb_build_object(
        'Instagram', 'http://instagram.com/aureliemalau',
        'Facebook', 'https://www.facebook.com/aureliemalaucom?fref=ts',
        'Twitter', 'https://twitter.com/',
        'Pinterest', 'http://pinterest.com/aureliemalau/',
        'Blog', 'http://www.aurelieetcompagnie.com/'
    )
) ON CONFLICT DO NOTHING;

-- Avis Express
INSERT INTO public.influencers (
    email,
    display_name,
    avatar_url,
    bio,
    timezone,
    status,
    platform,
    followers_count,
    channel_urls
) VALUES (
    'avis.express.com@gmail.com',
    'Avis Express - Testeur High-Tech',
    'https://yt3.googleusercontent.com/1c6XQNOsqYlVTRseNf7IK3fPwWJ9RcwlrhVflKo10mcC7jpzuaG3GEAViIucouivpyfk5B7N=s800-c-k-c0x00ffffff-no-rj',
    'Bienvenue sur ma chaîne de produits High-Tech. J''essaie de trouver les meilleurs rapports qualité prix du Web.',
    'Europe/Paris',
    'active',
    ARRAY['YouTube', 'TikTok', 'Facebook'],
    274000,
    jsonb_build_object(
        'TikTok', 'https://www.tiktok.com/@_avis_express_?lang=fr',
        'Facebook', 'https://www.facebook.com/avisaliexpress/?ref=hl',
        'Blog', 'https://avis-express.com'
    )
) ON CONFLICT DO NOTHING;
