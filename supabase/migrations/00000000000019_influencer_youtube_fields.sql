-- ============================================================
-- Influencer YouTube channel fields
-- ============================================================

ALTER TABLE public.influencers
  ADD COLUMN IF NOT EXISTS youtube_channel_id text,
  ADD COLUMN IF NOT EXISTS channel_handle text,
  ADD COLUMN IF NOT EXISTS channel_description text,
  ADD COLUMN IF NOT EXISTS channel_banner_url text,
  ADD COLUMN IF NOT EXISTS total_views bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS channel_created_at timestamptz;
