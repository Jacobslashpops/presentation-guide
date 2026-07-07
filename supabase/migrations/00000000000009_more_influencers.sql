-- ============================================================-- Insert 3 more real influencers scraped from YouTube-- ============================================================

-- Alejandro Pérez
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
    'Alejandro Pérez',
    'https://yt3.googleusercontent.com/ytc/AIdro_kJ9lispNb3i4cxj7F6Qkk035-bGmdxnsLkFuTvImKgrHo=s800-c-k-c0x00ffffff-no-rj',
    'Explora la tecnología desde otro punto de vista con Alejandro Pérez | Profundizo en smartphones, gadgets, y las últimas innovaciones | Opiniones honestas, reviews detalladas y comparativas únicas.',
    'Europe/Madrid',
    'active',
    ARRAY['YouTube', 'TikTok', 'Instagram'],
    785000,
    jsonb_build_object(
        'TikTok', 'https://www.tiktok.com/@alejandroperezyt',
        'Instagram', 'https://instagram.com/aperezyt',
        'Twitter', 'https://www.twitter.com/aPerezYT',
        'Telegram', 'https://telegram.me/alejandroperezyt'
    )
) ON CONFLICT DO NOTHING;

-- AlessiaHomeLover
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
    'alessiamostarda1994@gmail.com',
    'AlessiaHomeLover',
    'https://yt3.googleusercontent.com/be9G8tOOGxlBmi2QkVlBb164owoxMPctQO4RobWxrCTcPJFCahvrGW4AjO03QUfkaMQe1NgXoA=s800-c-k-c0x00ffffff-no-rj',
    'Ciao a tutti io sono Alessia, benvenuti sul mio canale! Vi aiuto ad avere una casa pulita, profumata e in ordine!',
    'Europe/Rome',
    'active',
    ARRAY['YouTube', 'Instagram', 'TikTok'],
    26100,
    jsonb_build_object(
        'Instagram', 'https://www.instagram.com/alessiahomelover?igsh=eWUzZTlhOHcwNG1m&utm_source=qr',
        'TikTok', 'https://www.tiktok.com/@alessiahomelover?_t=ZN-8zKiMfE4SQw&_r=1'
    )
) ON CONFLICT DO NOTHING;

-- Andres Vidoza
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
    'Andres Vidoza',
    'https://yt3.googleusercontent.com/ytc/AIdro_m1m23uK8qCB5ASjSKySoAmHZD2NBZWFmZpwyCqUmRyI0w=s800-c-k-c0x00ffffff-no-rj',
    'Telling a story with tech.',
    'America/Toronto',
    'active',
    ARRAY['YouTube', 'Instagram', 'TikTok', 'Twitter'],
    608000,
    jsonb_build_object(
        'Instagram', 'https://www.instagram.com/andresvidoza/',
        'TikTok', 'https://www.tiktok.com/@andresvidoza',
        'Twitter', 'https://twitter.com/andres_vidoza'
    )
) ON CONFLICT DO NOTHING;
