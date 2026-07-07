-- Sentiment analysis for posts
-- video_sentiment: AI analysis of creator's attitude toward the product (based on transcription)
-- comment_sentiment: AI analysis of audience sentiment (based on comments)

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS video_sentiment jsonb,
  ADD COLUMN IF NOT EXISTS video_sentiment_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS comment_sentiment jsonb,
  ADD COLUMN IF NOT EXISTS comment_sentiment_status text DEFAULT 'pending';
