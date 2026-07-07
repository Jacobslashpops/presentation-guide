-- ============================================================-- Insert real influencers scraped from YouTube-- ============================================================

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
    'alhu.einstein@gmail.com',
    'AlHuTV',
    'https://yt3.googleusercontent.com/cveBcABOCjiXgBSfzzWV88SeDdOPbCAQzJbQTYVrBE0M4XSEYaoGtYIPIkgbCugBND3yhgM2hg=s800-c-k-c0x00ffffff-no-rj',
    'AlHuTV - Dein Sender für Produktvorstellungen! Für Anfragen jeglicher Art, einfach per E-Mail an alhu.einstein@gmail.com',
    'Europe/Berlin',
    'active',
    ARRAY['YouTube'],
    169000,
    '{}'::jsonb
) ON CONFLICT DO NOTHING;

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
    'partenariat@andremartin.net',
    'André Martin',
    'https://yt3.googleusercontent.com/QUkljKMh5B_nfoHv_JgVAqjXAHOStqbyCGNHtbv4XkIbH2FbHeJuxxCTcAZ9c5UUa0YT3Uhs=s800-c-k-c0x00ffffff-no-rj',
    'Déjà 2,9 millions sur TikTok et 490 mille sur Instagram ! On continue là-bas ? ➡️ @andremartinyt',
    'Europe/Paris',
    'active',
    ARRAY['YouTube', 'Instagram', 'TikTok'],
    398000,
    jsonb_build_object(
        'Instagram', 'https://www.instagram.com/andremartinyt/',
        'TikTok', 'https://www.tiktok.com/@andremartinyt'
    )
) ON CONFLICT DO NOTHING;
