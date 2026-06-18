-- Rate limits table for persistent, cross-instance rate limiting.
-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New Query).

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key        TEXT        PRIMARY KEY,
  hits       INTEGER     NOT NULL DEFAULT 1,
  reset_at   TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only the service role (server-side) may touch this table.
CREATE POLICY "service_role_full_access" ON public.rate_limits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Index for the cleanup query (expired window purges).
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON public.rate_limits (reset_at);
