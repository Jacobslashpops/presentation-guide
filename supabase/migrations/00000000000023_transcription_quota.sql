-- 用户每月转写用量表
CREATE TABLE transcription_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month text NOT NULL,           -- 格式 '2026-07'
  used_seconds integer NOT NULL DEFAULT 0,
  quota_seconds integer NOT NULL DEFAULT 6000,  -- 100分钟 = 6000秒
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, year_month)
);

-- 索引：按用户快速查询
CREATE INDEX idx_transcription_usage_user_month ON transcription_usage(user_id, year_month);

-- RLS：用户只能看到自己的用量
ALTER TABLE transcription_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own usage" ON transcription_usage FOR SELECT USING (auth.uid() = user_id);
-- Admin 可查看所有
CREATE POLICY "Admins view all" ON transcription_usage FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
-- 允许已认证用户写入自己的记录
CREATE POLICY "Users insert own usage" ON transcription_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own usage" ON transcription_usage FOR UPDATE USING (auth.uid() = user_id);
