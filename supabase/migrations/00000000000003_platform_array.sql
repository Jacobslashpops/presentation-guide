-- ============================================================
-- Change platform from text to text[] for multi-platform support
-- ============================================================

-- First, convert existing text values to single-element arrays
ALTER TABLE public.influencers ALTER COLUMN platform TYPE text[] USING ARRAY[platform];

-- Update some influencers to have multiple platforms for demo variety
UPDATE public.influencers SET platform = ARRAY['Instagram', 'TikTok'] WHERE display_name = 'Amy Chen';
UPDATE public.influencers SET platform = ARRAY['TikTok', 'YouTube'] WHERE display_name = 'Alex Wang';
UPDATE public.influencers SET platform = ARRAY['YouTube', 'Instagram'] WHERE display_name = 'Anna Liu';
UPDATE public.influencers SET platform = ARRAY['Instagram', 'YouTube'] WHERE display_name = 'Aaron Zhang';
UPDATE public.influencers SET platform = ARRAY['TikTok'] WHERE display_name = 'Alice Wu';
UPDATE public.influencers SET platform = ARRAY['Instagram', 'TikTok'] WHERE display_name = 'Andrew Li';
UPDATE public.influencers SET platform = ARRAY['YouTube'] WHERE display_name = 'Ava Huang';
UPDATE public.influencers SET platform = ARRAY['TikTok', 'Instagram'] WHERE display_name = 'Adam Zhao';
UPDATE public.influencers SET platform = ARRAY['Instagram'] WHERE display_name = 'Angela Xu';
UPDATE public.influencers SET platform = ARRAY['YouTube', 'TikTok'] WHERE display_name = 'Austin Ma';
UPDATE public.influencers SET platform = ARRAY['TikTok'] WHERE display_name = 'Abby Lin';
UPDATE public.influencers SET platform = ARRAY['Instagram', 'YouTube'] WHERE display_name = 'Arthur He';
UPDATE public.influencers SET platform = ARRAY['YouTube'] WHERE display_name = 'Audrey Sun';
UPDATE public.influencers SET platform = ARRAY['TikTok', 'YouTube'] WHERE display_name = 'Alan Gao';
UPDATE public.influencers SET platform = ARRAY['Instagram'] WHERE display_name = 'Amber Feng';
UPDATE public.influencers SET platform = ARRAY['YouTube', 'Instagram'] WHERE display_name = 'Andy Zhou';
UPDATE public.influencers SET platform = ARRAY['TikTok'] WHERE display_name = 'Allison Cai';
UPDATE public.influencers SET platform = ARRAY['Instagram', 'TikTok'] WHERE display_name = 'Albert Deng';
UPDATE public.influencers SET platform = ARRAY['YouTube'] WHERE display_name = 'Anita Song';
UPDATE public.influencers SET platform = ARRAY['TikTok', 'Instagram'] WHERE display_name = 'Anthony Qian';
