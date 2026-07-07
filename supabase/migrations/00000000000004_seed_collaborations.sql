-- ============================================================
-- Seed Demo Clients, Projects, and Collaborations
-- ============================================================

-- 1. Seed Clients (brands)
INSERT INTO public.clients (name, description, logo_url) VALUES
    ('L''Oréal Paris', 'Global beauty and cosmetics brand', NULL),
    ('Nike China', 'Sportswear and athletic equipment', NULL),
    ('Starbucks', 'Coffeehouse chain and lifestyle brand', NULL),
    ('Xiaomi', 'Consumer electronics and smart devices', NULL)
ON CONFLICT DO NOTHING;

-- 2. Seed Projects (campaigns)
INSERT INTO public.projects (client_id, name, description, status, start_date, end_date, budget, budget_currency_id) VALUES
    ((SELECT id FROM public.clients WHERE name = 'L''Oréal Paris'), '2026 Spring Beauty Launch', 'New skincare line promotion for spring season', 'active', '2026-03-01', '2026-05-31', 500000, (SELECT id FROM public.currencies WHERE code = 'CNY')),
    ((SELECT id FROM public.clients WHERE name = 'Nike China'), 'Air Max Campaign', 'Summer Air Max series influencer campaign', 'active', '2026-04-01', '2026-06-30', 800000, (SELECT id FROM public.currencies WHERE code = 'CNY')),
    ((SELECT id FROM public.clients WHERE name = 'Starbucks'), 'Frappuccino Summer Vibes', 'Summer limited edition drink promotion', 'completed', '2026-05-01', '2026-07-31', 300000, (SELECT id FROM public.currencies WHERE code = 'CNY')),
    ((SELECT id FROM public.clients WHERE name = 'Xiaomi'), 'Smart Home Series', 'New smart home product line launch', 'active', '2026-02-15', '2026-06-15', 600000, (SELECT id FROM public.currencies WHERE code = 'CNY')),
    ((SELECT id FROM public.clients WHERE name = 'L''Oréal Paris'), 'Holiday Gift Guide', 'End of year holiday makeup collection', 'draft', '2026-11-01', '2026-12-31', 450000, (SELECT id FROM public.currencies WHERE code = 'CNY'))
ON CONFLICT DO NOTHING;

-- 3. Seed Collaborations (linking influencers to projects)
-- L'Oréal Spring Beauty Launch
INSERT INTO public.collaborations (project_id, influencer_id, title, description, total_amount, currency_id, status) VALUES
    ((SELECT id FROM public.projects WHERE name = '2026 Spring Beauty Launch'), (SELECT id FROM public.influencers WHERE display_name = 'Amy Chen'), 'Spring Glow Tutorial', 'Beauty tutorial featuring new skincare line', 25000, (SELECT id FROM public.currencies WHERE code = 'CNY'), 'active'),
    ((SELECT id FROM public.projects WHERE name = '2026 Spring Beauty Launch'), (SELECT id FROM public.influencers WHERE display_name = 'Ava Huang'), 'Makeup Transformation', 'Day to night makeup look with L''Oréal products', 30000, (SELECT id FROM public.currencies WHERE code = 'CNY'), 'active'),
    ((SELECT id FROM public.projects WHERE name = '2026 Spring Beauty Launch'), (SELECT id FROM public.influencers WHERE display_name = 'Angela Xu'), 'Skincare Routine Review', 'Honest review of new spring skincare collection', 20000, (SELECT id FROM public.currencies WHERE code = 'CNY'), 'completed');

-- Nike Air Max Campaign
INSERT INTO public.collaborations (project_id, influencer_id, title, description, total_amount, currency_id, status) VALUES
    ((SELECT id FROM public.projects WHERE name = 'Air Max Campaign'), (SELECT id FROM public.influencers WHERE display_name = 'Aaron Zhang'), 'Fitness Challenge Series', '30-day fitness challenge wearing Air Max', 35000, (SELECT id FROM public.currencies WHERE code = 'CNY'), 'active'),
    ((SELECT id FROM public.projects WHERE name = 'Air Max Campaign'), (SELECT id FROM public.influencers WHERE display_name = 'Arthur He'), 'Street Style Lookbook', 'Urban streetwear styling with Air Max sneakers', 28000, (SELECT id FROM public.currencies WHERE code = 'CNY'), 'active'),
    ((SELECT id FROM public.projects WHERE name = 'Air Max Campaign'), (SELECT id FROM public.influencers WHERE display_name = 'Albert Deng'), 'Sneaker Collection Tour', 'Showcasing complete sneaker collection featuring Air Max', 32000, (SELECT id FROM public.currencies WHERE code = 'CNY'), 'active');

-- Starbucks Frappuccino
INSERT INTO public.collaborations (project_id, influencer_id, title, description, total_amount, currency_id, status) VALUES
    ((SELECT id FROM public.projects WHERE name = 'Frappuccino Summer Vibes'), (SELECT id FROM public.influencers WHERE display_name = 'Anna Liu'), 'Summer Vlog Series', 'Daily summer vlogs featuring Starbucks moments', 18000, (SELECT id FROM public.currencies WHERE code = 'CNY'), 'completed'),
    ((SELECT id FROM public.projects WHERE name = 'Frappuccino Summer Vibes'), (SELECT id FROM public.influencers WHERE display_name = 'Alice Wu'), 'Dance Challenge', 'TikTok dance challenge at Starbucks locations', 15000, (SELECT id FROM public.currencies WHERE code = 'CNY'), 'completed'),
    ((SELECT id FROM public.projects WHERE name = 'Frappuccino Summer Vibes'), (SELECT id FROM public.influencers WHERE display_name = 'Abby Lin'), 'DIY Frappuccino Art', 'Creative DIY content inspired by Frappuccino', 16000, (SELECT id FROM public.currencies WHERE code = 'CNY'), 'completed');

-- Xiaomi Smart Home
INSERT INTO public.collaborations (project_id, influencer_id, title, description, total_amount, currency_id, status) VALUES
    ((SELECT id FROM public.projects WHERE name = 'Smart Home Series'), (SELECT id FROM public.influencers WHERE display_name = 'Alex Wang'), 'Tech Review Series', 'In-depth review of Xiaomi smart home ecosystem', 40000, (SELECT id FROM public.currencies WHERE code = 'CNY'), 'active'),
    ((SELECT id FROM public.projects WHERE name = 'Smart Home Series'), (SELECT id FROM public.influencers WHERE display_name = 'Austin Ma'), 'Gaming Setup Upgrade', 'Smart home automation for gaming room', 35000, (SELECT id FROM public.currencies WHERE code = 'CNY'), 'active'),
    ((SELECT id FROM public.projects WHERE name = 'Smart Home Series'), (SELECT id FROM public.influencers WHERE display_name = 'Andy Zhou'), 'Smart Living Vlog', 'Day in the life with Xiaomi smart home devices', 22000, (SELECT id FROM public.currencies WHERE code = 'CNY'), 'active');

-- Additional collaborations for variety
INSERT INTO public.collaborations (project_id, influencer_id, title, description, total_amount, currency_id, status) VALUES
    ((SELECT id FROM public.projects WHERE name = '2026 Spring Beauty Launch'), (SELECT id FROM public.influencers WHERE display_name = 'Audrey Sun'), 'Book & Beauty', 'Reading vlog with skincare routine', 18000, (SELECT id FROM public.currencies WHERE code = 'CNY'), 'active'),
    ((SELECT id FROM public.projects WHERE name = 'Air Max Campaign'), (SELECT id FROM public.influencers WHERE display_name = 'Adam Zhao'), 'Comedy Sports Skit', 'Funny sports-themed content featuring Nike', 20000, (SELECT id FROM public.currencies WHERE code = 'CNY'), 'active'),
    ((SELECT id FROM public.projects WHERE name = 'Smart Home Series'), (SELECT id FROM public.influencers WHERE display_name = 'Alan Gao'), 'Music Production Setup', 'Smart home studio tour and music creation', 28000, (SELECT id FROM public.currencies WHERE code = 'CNY'), 'active'),
    ((SELECT id FROM public.projects WHERE name = 'Frappuccino Summer Vibes'), (SELECT id FROM public.influencers WHERE display_name = 'Amber Feng'), 'Eco-friendly Lifestyle', 'Sustainable living content featuring Starbucks', 17000, (SELECT id FROM public.currencies WHERE code = 'CNY'), 'completed'),
    ((SELECT id FROM public.projects WHERE name = '2026 Spring Beauty Launch'), (SELECT id FROM public.influencers WHERE display_name = 'Anita Song'), 'Yoga & Skincare', 'Morning yoga routine with beauty prep', 19000, (SELECT id FROM public.currencies WHERE code = 'CNY'), 'active'),
    ((SELECT id FROM public.projects WHERE name = 'Air Max Campaign'), (SELECT id FROM public.influencers WHERE display_name = 'Anthony Qian'), 'Cooking & Fitness', 'Healthy cooking content for athletes', 21000, (SELECT id FROM public.currencies WHERE code = 'CNY'), 'active'),
    ((SELECT id FROM public.projects WHERE name = 'Smart Home Series'), (SELECT id FROM public.influencers WHERE display_name = 'Allison Cai'), 'Family Smart Home', 'Smart home setup for families with kids', 23000, (SELECT id FROM public.currencies WHERE code = 'CNY'), 'active'),
    ((SELECT id FROM public.projects WHERE name = 'Frappuccino Summer Vibes'), (SELECT id FROM public.influencers WHERE display_name = 'Andrew Li'), 'Photography & Coffee', 'Coffee shop photography tips and Starbucks', 19000, (SELECT id FROM public.currencies WHERE code = 'CNY'), 'completed');
