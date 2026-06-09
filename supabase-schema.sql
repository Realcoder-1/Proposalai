-- Run this in your Supabase SQL editor

CREATE TABLE cv_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  original_cv TEXT NOT NULL,
  job_description TEXT NOT NULL,
  before_score INTEGER,           -- set client-side on submit, free
  after_score INTEGER,            -- set by webhook after OpenAI call
  optimized_cv TEXT,              -- set by webhook after OpenAI call
  improvements JSONB,             -- set by webhook after OpenAI call
  keywords JSONB,                 -- set on submit (client-side keyword extract)
  payment_status TEXT DEFAULT 'pending', -- pending | paid
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_cv_sessions_session_id ON cv_sessions(session_id);
CREATE INDEX idx_cv_sessions_stripe_session_id ON cv_sessions(stripe_session_id);

-- RLS
ALTER TABLE cv_sessions ENABLE ROW LEVEL SECURITY;

-- Service role only (all API routes use service role key)
CREATE POLICY "Service role full access" ON cv_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Allow anon INSERT (needed for homepage to save session before payment)
CREATE POLICY "Anon can insert" ON cv_sessions
  FOR INSERT WITH CHECK (true);
