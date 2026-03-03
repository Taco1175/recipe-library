-- Migration 009: User preferences table (theme, etc.)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme    TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark','light','fun')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own prefs"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
