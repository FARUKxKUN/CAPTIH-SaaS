-- ============================================================================
-- CAPTIH v1 Database Schema
-- Locked 2026-05-31. Single source of truth for data model.
-- ============================================================================

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,

  total_minutes_free BIGINT DEFAULT 3 NOT NULL,
  total_minutes_used BIGINT DEFAULT 0 NOT NULL,

  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 2. JOBS TABLE (must come before TRANSACTIONS due to FK)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  original_filename TEXT NOT NULL,
  original_file_size BIGINT,
  file_type TEXT,

  duration_seconds BIGINT,

  upload_path TEXT,
  audio_extracted_path TEXT,

  status TEXT NOT NULL DEFAULT 'pending',

  srt_content TEXT,
  transcript_text TEXT,
  transcript_json JSONB,

  error_message TEXT,

  minutes_charged BIGINT,

  is_refunded BOOLEAN DEFAULT FALSE,
  refund_reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,

  audio_delete_after TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 3. TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  transaction_type TEXT NOT NULL,
  minutes_delta BIGINT NOT NULL,

  job_id UUID REFERENCES public.jobs(id),

  payment_provider TEXT,
  payment_id TEXT,
  amount_dt NUMERIC(10, 2),

  status TEXT NOT NULL DEFAULT 'pending',

  description TEXT,
  metadata JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 4. CREDITS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  pack_type TEXT NOT NULL,
  total_minutes BIGINT NOT NULL,
  minutes_used BIGINT DEFAULT 0 NOT NULL,

  minutes_remaining BIGINT GENERATED ALWAYS AS (total_minutes - minutes_used) STORED,

  expires_at TIMESTAMP WITH TIME ZONE,

  transaction_id UUID REFERENCES public.transactions(id),

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. RATE LIMITING TABLE (abuse prevention)
-- ============================================================================
-- Track failed signups/uploads per IP to enforce limits
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  action TEXT NOT NULL, -- 'signup' | 'upload' | 'api_call'
  attempt_count BIGINT DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  window_end TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 hour',
  blocked BOOLEAN DEFAULT FALSE,

  UNIQUE(ip_address, action, window_start)
);

-- ============================================================================
-- INDEXES (for query performance)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credits_user_id ON public.credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_is_active ON public.credits(is_active);
CREATE INDEX IF NOT EXISTS idx_credits_expires_at ON public.credits(expires_at);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_is_refunded ON public.jobs(is_refunded);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_job_id ON public.transactions(job_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON public.rate_limits(ip_address, action);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own row
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Service role (backend) can bypass RLS via SUPABASE_SERVICE_ROLE_KEY
-- No policy needed — service role has full access

-- Credits: users can read their own credits only
CREATE POLICY "credits_select_own" ON public.credits
  FOR SELECT USING (user_id = auth.uid());

-- Jobs: users can read their own jobs only
CREATE POLICY "jobs_select_own" ON public.jobs
  FOR SELECT USING (user_id = auth.uid());

-- Transactions: users can read their own transactions only
CREATE POLICY "transactions_select_own" ON public.transactions
  FOR SELECT USING (user_id = auth.uid());

-- Rate limits: no user-facing reads needed (internal only)
CREATE POLICY "rate_limits_no_select" ON public.rate_limits
  FOR SELECT USING (false);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check if a credit pack is active (not expired)
CREATE OR REPLACE FUNCTION is_credit_active(expires_at TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN expires_at IS NULL OR expires_at > NOW();
END;
$$ LANGUAGE PLPGSQL IMMUTABLE;

-- Get user's active (unexpired) minutes balance
CREATE OR REPLACE FUNCTION get_user_active_minutes(user_uuid UUID)
RETURNS BIGINT AS $$
  SELECT COALESCE(SUM(minutes_remaining), 0)
  FROM public.credits
  WHERE user_id = user_uuid
    AND (expires_at IS NULL OR expires_at > NOW())
  GROUP BY user_id;
$$ LANGUAGE SQL STABLE;

-- Deduct minutes from user's oldest expiring pack
CREATE OR REPLACE FUNCTION deduct_credit_minutes(
  user_uuid UUID,
  minutes_to_deduct BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
  _credit_id UUID;
BEGIN
  -- Get the credit pack that expires soonest (prioritize freeing up old packs first)
  SELECT id INTO _credit_id
  FROM public.credits
  WHERE user_id = user_uuid
    AND (expires_at IS NULL OR expires_at > NOW())
    AND minutes_remaining > 0
  ORDER BY expires_at ASC NULLS LAST, created_at ASC
  LIMIT 1;

  IF _credit_id IS NULL THEN
    RETURN FALSE; -- No active credits available
  END IF;

  -- Deduct from this credit pack
  UPDATE public.credits
  SET minutes_used = minutes_used + minutes_to_deduct,
      updated_at = NOW()
  WHERE id = _credit_id;

  RETURN TRUE;
END;
$$ LANGUAGE PLPGSQL;

-- ============================================================================
-- TRIGGERS (auto-update timestamps, etc.)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE PLPGSQL;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER credits_updated_at BEFORE UPDATE ON public.credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Set audio_delete_after when processing completes
CREATE OR REPLACE FUNCTION set_audio_delete_after()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.processing_completed_at IS NOT NULL AND OLD.processing_completed_at IS NULL THEN
    NEW.audio_delete_after = NEW.processing_completed_at + INTERVAL '90 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE PLPGSQL;

CREATE TRIGGER jobs_set_audio_delete_after BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION set_audio_delete_after();

-- ============================================================================
-- SEED DATA (optional — for testing)
-- ============================================================================
-- Uncomment to seed test data
/*
-- Create test user (replace with real Clerk user ID)
INSERT INTO public.users (id, email, display_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'test@example.com', 'Test User');

-- Give them a free tier credit pack
INSERT INTO public.credits (user_id, pack_type, total_minutes)
VALUES ('00000000-0000-0000-0000-000000000001', 'free', 3);

-- Give them a 30-min paid pack (expires in 1 year)
INSERT INTO public.credits (user_id, pack_type, total_minutes, expires_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'pack_30', 30, NOW() + INTERVAL '1 year');
*/
