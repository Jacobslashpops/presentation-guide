-- ============================================================-- Create videos table for storing influencer YouTube videos-- ============================================================

CREATE TABLE IF NOT EXISTS public.videos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    influencer_id uuid NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
    video_id text NOT NULL,
    title text NOT NULL,
    description text,
    thumbnail_url text,
    duration text,
    view_count text,
    published_at text,
    video_url text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(influencer_id, video_id)
);

-- Index for fetching latest videos
CREATE INDEX IF NOT EXISTS idx_videos_influencer_id ON public.videos(influencer_id);

-- Enable RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read videos
CREATE POLICY "Allow authenticated users to read videos"
    ON public.videos
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow all authenticated users to insert/update videos
CREATE POLICY "Allow authenticated users to manage videos"
    ON public.videos
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
