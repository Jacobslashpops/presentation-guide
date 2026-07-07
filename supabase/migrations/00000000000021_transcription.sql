-- Add transcription fields to posts table
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS transcription text,
  ADD COLUMN IF NOT EXISTS transcription_source text,
  ADD COLUMN IF NOT EXISTS transcription_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS transcription_language text,
  ADD COLUMN IF NOT EXISTS transcription_error text,
  ADD COLUMN IF NOT EXISTS transcription_quota_cost integer DEFAULT 0;

COMMENT ON COLUMN public.posts.transcription IS 'Full transcription text of the video';
COMMENT ON COLUMN public.posts.transcription_source IS 'Source of transcription: youtube_subtitle | openai_whisper';
COMMENT ON COLUMN public.posts.transcription_status IS 'Status: pending | completed | failed | available_for_stt';
COMMENT ON COLUMN public.posts.transcription_language IS 'Detected language of the transcription';
COMMENT ON COLUMN public.posts.transcription_error IS 'Error message if transcription failed';
COMMENT ON COLUMN public.posts.transcription_quota_cost IS 'Quota points consumed for this transcription (reserved for future billing)';
