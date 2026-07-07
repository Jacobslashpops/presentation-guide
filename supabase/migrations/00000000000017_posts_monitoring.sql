-- Posts monitoring: posts / post_snapshots / post_comments

-- posts 表：通用帖子/视频记录
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'youtube' | 'instagram' | 'tiktok'
  platform_post_id TEXT NOT NULL, -- YouTube video_id / IG shortcode / TikTok id
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  published_at TIMESTAMPTZ,
  -- YouTube 特有字段（其他平台可为 null）
  duration TEXT,
  -- 监控状态
  last_synced_at TIMESTAMPTZ,
  comments_disabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(platform, platform_post_id)
);

-- post_snapshots 表：每次同步时快照统计数据
CREATE TABLE post_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  view_count BIGINT,
  like_count BIGINT,
  comment_count BIGINT,
  share_count BIGINT,
  snapshot_at TIMESTAMPTZ DEFAULT now()
);

-- post_comments 表：评论存储
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  platform_comment_id TEXT NOT NULL,
  author_name TEXT,
  author_avatar_url TEXT,
  author_channel_url TEXT,
  text TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_reply BOOLEAN DEFAULT FALSE,
  parent_comment_id TEXT, -- 如果是回复，指向父评论的 platform_comment_id
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, platform_comment_id)
);

-- 索引
CREATE INDEX idx_posts_influencer ON posts(influencer_id);
CREATE INDEX idx_posts_platform ON posts(platform);
CREATE INDEX idx_post_snapshots_post ON post_snapshots(post_id, snapshot_at DESC);
CREATE INDEX idx_post_comments_post ON post_comments(post_id, published_at DESC);
CREATE INDEX idx_post_comments_parent ON post_comments(post_id, parent_comment_id) WHERE is_reply = TRUE;

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read posts" ON posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read snapshots" ON post_snapshots FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read comments" ON post_comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert posts" ON posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert snapshots" ON post_snapshots FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert comments" ON post_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update posts" ON posts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete posts" ON posts FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete snapshots" ON post_snapshots FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete comments" ON post_comments FOR DELETE USING (auth.role() = 'authenticated');
