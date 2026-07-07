-- ============================================================
-- Add channel_urls JSONB column and update emails to be more realistic
-- ============================================================

-- Add channel_urls column
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS channel_urls jsonb DEFAULT '{}'::jsonb;

-- Update emails to be more realistic (using common Chinese email providers)
UPDATE public.influencers SET email = 'amychen_beauty@163.com' WHERE display_name = 'Amy Chen';
UPDATE public.influencers SET email = 'alexwang_tech@qq.com' WHERE display_name = 'Alex Wang';
UPDATE public.influencers SET email = 'annaliu_travel@gmail.com' WHERE display_name = 'Anna Liu';
UPDATE public.influencers SET email = 'aaronzhang_fit@126.com' WHERE display_name = 'Aaron Zhang';
UPDATE public.influencers SET email = 'alicewu_dance@163.com' WHERE display_name = 'Alice Wu';
UPDATE public.influencers SET email = 'andrewli_photo@qq.com' WHERE display_name = 'Andrew Li';
UPDATE public.influencers SET email = 'avahuang_beauty@gmail.com' WHERE display_name = 'Ava Huang';
UPDATE public.influencers SET email = 'adamzhao_comedy@126.com' WHERE display_name = 'Adam Zhao';
UPDATE public.influencers SET email = 'angelaxu_food@163.com' WHERE display_name = 'Angela Xu';
UPDATE public.influencers SET email = 'austinma_gaming@qq.com' WHERE display_name = 'Austin Ma';
UPDATE public.influencers SET email = 'abbylin_diy@gmail.com' WHERE display_name = 'Abby Lin';
UPDATE public.influencers SET email = 'arthurhe_kicks@126.com' WHERE display_name = 'Arthur He';
UPDATE public.influencers SET email = 'audreysun_books@163.com' WHERE display_name = 'Audrey Sun';
UPDATE public.influencers SET email = 'alangao_music@qq.com' WHERE display_name = 'Alan Gao';
UPDATE public.influencers SET email = 'amberfeng_eco@gmail.com' WHERE display_name = 'Amber Feng';
UPDATE public.influencers SET email = 'andyzhou_cars@126.com' WHERE display_name = 'Andy Zhou';
UPDATE public.influencers SET email = 'allisoncai_family@163.com' WHERE display_name = 'Allison Cai';
UPDATE public.influencers SET email = 'albertdeng_design@qq.com' WHERE display_name = 'Albert Deng';
UPDATE public.influencers SET email = 'anitasong_yoga@gmail.com' WHERE display_name = 'Anita Song';
UPDATE public.influencers SET email = 'anthonyqian_cook@126.com' WHERE display_name = 'Anthony Qian';

-- Generate channel URLs for each influencer based on their platforms
UPDATE public.influencers SET channel_urls = jsonb_build_object(
    'Instagram', 'https://instagram.com/amychen_beauty',
    'TikTok', 'https://tiktok.com/@amychen_beauty'
) WHERE display_name = 'Amy Chen';

UPDATE public.influencers SET channel_urls = jsonb_build_object(
    'TikTok', 'https://tiktok.com/@alexwang_tech',
    'YouTube', 'https://youtube.com/@alexwang_tech'
) WHERE display_name = 'Alex Wang';

UPDATE public.influencers SET channel_urls = jsonb_build_object(
    'YouTube', 'https://youtube.com/@annaliu_travel',
    'Instagram', 'https://instagram.com/annaliu_travel'
) WHERE display_name = 'Anna Liu';

UPDATE public.influencers SET channel_urls = jsonb_build_object(
    'Instagram', 'https://instagram.com/aaronzhang_fit',
    'YouTube', 'https://youtube.com/@aaronzhang_fit'
) WHERE display_name = 'Aaron Zhang';

UPDATE public.influencers SET channel_urls = jsonb_build_object(
    'TikTok', 'https://tiktok.com/@alicewu_dance'
) WHERE display_name = 'Alice Wu';

UPDATE public.influencers SET channel_urls = jsonb_build_object(
    'Instagram', 'https://instagram.com/andrewli_photo',
    'TikTok', 'https://tiktok.com/@andrewli_photo'
) WHERE display_name = 'Andrew Li';

UPDATE public.influencers SET channel_urls = jsonb_build_object(
    'YouTube', 'https://youtube.com/@avahuang_beauty'
) WHERE display_name = 'Ava Huang';

UPDATE public.influencers SET channel_urls = jsonb_build_object(
    'TikTok', 'https://tiktok.com/@adamzhao_comedy',
    'Instagram', 'https://instagram.com/adamzhao_comedy'
) WHERE display_name = 'Adam Zhao';

UPDATE public.influencers SET channel_urls = jsonb_build_object(
    'Instagram', 'https://instagram.com/angelaxu_food'
) WHERE display_name = 'Angela Xu';

UPDATE public.influencers SET channel_urls = jsonb_build_object(
    'YouTube', 'https://youtube.com/@austinma_gaming',
    'TikTok', 'https://tiktok.com/@austinma_gaming'
) WHERE display_name = 'Austin Ma';

UPDATE public.influencers SET channel_urls = jsonb_build_object(
    'TikTok', 'https://tiktok.com/@abbylin_diy'
) WHERE display_name = 'Abby Lin';

UPDATE public.influencers SET channel_urls = jsonb_build_object(
    'Instagram', 'https://instagram.com/arthurhe_kicks',
    'YouTube', 'https://youtube.com/@arthurhe_kicks'
) WHERE display_name = 'Arthur He';

UPDATE public.influencers SET channel_urls = jsonb_build_object(
    'YouTube', 'https://youtube.com/@audreysun_books'
) WHERE display_name = 'Audrey Sun';

UPDATE public.influencers SET channel_urls = jsonb_build_object(
    'TikTok', 'https://tiktok.com/@alangao_music',
    'YouTube', 'https://youtube.com/@alangao_music'
) WHERE display_name = 'Alan Gao';

UPDATE public.influencers SET channel_urls = jsonb_build_object(
    'Instagram', 'https://instagram.com/amberfeng_eco'
) WHERE display_name = 'Amber Feng';

UPDATE public.influencers SET channel_urls = jsonb_build_object(
    'YouTube', 'https://youtube.com/@andyzhou_cars',
    'Instagram', 'https://instagram.com/andyzhou_cars'
) WHERE display_name = 'Andy Zhou';

UPDATE public.influencers SET channel_urls = jsonb_build_object(
    'TikTok', 'https://tiktok.com/@allisoncai_family'
) WHERE display_name = 'Allison Cai';

UPDATE public.influencers SET channel_urls = jsonb_build_object(
    'Instagram', 'https://instagram.com/albertdeng_design',
    'TikTok', 'https://tiktok.com/@albertdeng_design'
) WHERE display_name = 'Albert Deng';

UPDATE public.influencers SET channel_urls = jsonb_build_object(
    'YouTube', 'https://youtube.com/@anitasong_yoga'
) WHERE display_name = 'Anita Song';

UPDATE public.influencers SET channel_urls = jsonb_build_object(
    'TikTok', 'https://tiktok.com/@anthonyqian_cook',
    'Instagram', 'https://instagram.com/anthonyqian_cook'
) WHERE display_name = 'Anthony Qian';
