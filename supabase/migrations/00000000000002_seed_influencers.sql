-- ============================================================
-- Seed Demo Influencers for Screenshots
-- Adds platform + followers_count columns and inserts 20 A-name influencers
-- ============================================================

-- Add platform column
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS platform text;

-- Add followers_count column
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS followers_count integer;

-- Insert 20 demo influencers (all A-names, 30k-100k followers)
INSERT INTO public.influencers (display_name, email, platform, followers_count, timezone, status, bio) VALUES
    ('Amy Chen', 'amy.chen@email.com', 'Instagram', 87500, 'Asia/Shanghai', 'active', 'Lifestyle & fashion creator based in Shanghai'),
    ('Alex Wang', 'alex.wang@email.com', 'TikTok', 62300, 'Asia/Shanghai', 'active', 'Tech reviews and gadget unboxing'),
    ('Anna Liu', 'anna.liu@email.com', 'YouTube', 45100, 'Asia/Taipei', 'active', 'Travel vlogger exploring Southeast Asia'),
    ('Aaron Zhang', 'aaron.z@email.com', 'Instagram', 98700, 'Asia/Shanghai', 'active', 'Fitness coach and nutrition enthusiast'),
    ('Alice Wu', 'alice.wu@email.com', 'TikTok', 34500, 'Asia/Shanghai', 'active', 'Dance and choreography content'),
    ('Andrew Li', 'andrew.li@email.com', 'Instagram', 78900, 'Asia/Hong_Kong', 'active', 'Street photography and urban culture'),
    ('Ava Huang', 'ava.huang@email.com', 'YouTube', 56700, 'Asia/Shanghai', 'active', 'Beauty tutorials and skincare routines'),
    ('Adam Zhao', 'adam.zhao@email.com', 'TikTok', 71200, 'Asia/Shanghai', 'active', 'Comedy skits and daily life content'),
    ('Angela Xu', 'angela.xu@email.com', 'Instagram', 39800, 'Asia/Shanghai', 'active', 'Foodie exploring local restaurants'),
    ('Austin Ma', 'austin.ma@email.com', 'YouTube', 83400, 'Asia/Shanghai', 'active', 'Gaming streams and esports commentary'),
    ('Abby Lin', 'abby.lin@email.com', 'TikTok', 45600, 'Asia/Taipei', 'active', 'DIY crafts and home decor ideas'),
    ('Arthur He', 'arthur.he@email.com', 'Instagram', 67800, 'Asia/Shanghai', 'active', 'Sneaker culture and streetwear fashion'),
    ('Audrey Sun', 'audrey.sun@email.com', 'YouTube', 52300, 'Asia/Shanghai', 'active', 'Book reviews and literary discussions'),
    ('Alan Gao', 'alan.gao@email.com', 'TikTok', 89100, 'Asia/Shanghai', 'active', 'Music covers and original songs'),
    ('Amber Feng', 'amber.feng@email.com', 'Instagram', 36700, 'Asia/Hong_Kong', 'active', 'Sustainable living and eco-friendly tips'),
    ('Andy Zhou', 'andy.zhou@email.com', 'YouTube', 74500, 'Asia/Shanghai', 'active', 'Car reviews and automotive content'),
    ('Allison Cai', 'allison.cai@email.com', 'TikTok', 48900, 'Asia/Shanghai', 'active', 'Parenting tips and family vlogs'),
    ('Albert Deng', 'albert.deng@email.com', 'Instagram', 95600, 'Asia/Shanghai', 'active', 'Architecture and interior design'),
    ('Anita Song', 'anita.song@email.com', 'YouTube', 41200, 'Asia/Taipei', 'active', 'Yoga and wellness lifestyle'),
    ('Anthony Qian', 'anthony.qian@email.com', 'TikTok', 68300, 'Asia/Shanghai', 'active', 'Cooking tutorials and recipe sharing')
ON CONFLICT (email) DO NOTHING;
