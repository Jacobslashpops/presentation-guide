-- ============================================================-- Insert 2 more real influencers: Ango Lab, Anna Neubert-- ============================================================

-- Ango Lab
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
    NULL,
    'Ango Lab',
    'https://yt3.googleusercontent.com/8sX3a94YHSLa5u7IiPVrDswTeCeM4EJEFjzE0PucV_uE1QBSzudbo8PSOzz96NUExm4pJwZrNQ=s800-c-k-c0x00ffffff-no-rj',
    'Contacts: Instagram: https://www.instagram.com/ango_lab',
    'Europe/Rome',
    'active',
    ARRAY['YouTube', 'Instagram'],
    54600,
    jsonb_build_object(
        'Instagram', 'https://www.instagram.com/ango_lab'
    )
) ON CONFLICT DO NOTHING;

-- Anna Neubert
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
    'anna@ohey-mgmt.de',
    'Anna Neubert',
    'https://yt3.googleusercontent.com/kxzziOaz6Sqko6JFbfP-iH2HAFkS_D159z3FG_qYWOzKLd_PmCNqr2mgBzZkAByQJhH3-U4QQ8A=s800-c-k-c0x00ffffff-no-rj',
    'your favorite gen z(ahnärztin) 🦷🧚🏼 von Haki & Backi, Zahnseide bis hin zu Vlogs, hier findet ihr alles was euer Herz begehrt',
    'Europe/Berlin',
    'active',
    ARRAY['YouTube', 'Instagram', 'TikTok'],
    347000,
    jsonb_build_object(
        'Instagram', 'https://www.instagram.com/annaneubrt/',
        'TikTok', 'https://www.tiktok.com/annanbrt'
    )
) ON CONFLICT DO NOTHING;
