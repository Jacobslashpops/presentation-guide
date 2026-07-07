-- Add Twitch column to influencers table
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS twitch text;
