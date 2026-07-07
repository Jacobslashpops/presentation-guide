-- Extension silent collection optimization
-- Add GIN index on channel_urls for faster JSONB queries
-- Add last_collected_at to track extension collection timestamp

-- GIN index accelerates channel_urls JSONB matching (used by upsertInfluencerFromExtension)
CREATE INDEX IF NOT EXISTS idx_influencers_channel_urls 
  ON public.influencers USING gin(channel_urls);

-- Track when the extension last collected data for this influencer
ALTER TABLE public.influencers 
  ADD COLUMN IF NOT EXISTS last_collected_at timestamptz;

-- Add comment for documentation
COMMENT ON COLUMN public.influencers.last_collected_at IS 'Timestamp of last collection by Chrome extension';
