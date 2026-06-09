-- Run this in your Supabase SQL editor

CREATE TABLE proposal_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,

  -- User inputs (saved before payment)
  client_brief TEXT NOT NULL,
  your_role TEXT NOT NULL,
  day_rate TEXT NOT NULL,
  approach TEXT NOT NULL,
  timeline TEXT NOT NULL,
  your_name TEXT NOT NULL,
  email TEXT,

  -- Generated output (set by webhook after payment)
  proposal TEXT,
  word_count INTEGER,

  -- Payment
  payment_status TEXT DEFAULT 'pending', -- pending | paid
  paddle_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_proposal_sessions_session_id ON proposal_sessions(session_id);
CREATE INDEX idx_proposal_sessions_paddle_sub ON proposal_sessions(paddle_subscription_id);

-- RLS
ALTER TABLE proposal_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON proposal_sessions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon can insert" ON proposal_sessions
  FOR INSERT WITH CHECK (true);
