-- Add missing location column to influencers
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS location text;
