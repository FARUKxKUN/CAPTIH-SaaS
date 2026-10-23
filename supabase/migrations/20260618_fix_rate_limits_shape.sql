-- ============================================================================
-- Ensure public.rate_limits has the shape src/lib/rate-limit-db.ts expects:
--   key TEXT PRIMARY KEY, hits INTEGER, reset_at TIMESTAMPTZ
--
-- Why: 20260602_init_captih_schema.sql created an earlier rate_limits table
-- (action / attempt_count / window_*). When it runs before
-- 001_rate_limits.sql, that file's CREATE TABLE IF NOT EXISTS is a no-op,
-- the limiter's queries error, and it fails open (no rate limiting).
--
-- Safe to run more than once. Rate-limit rows are short-lived counters, so
-- rebuilding the table loses nothing of value.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rate_limits'
      AND column_name = 'key'
  ) THEN
    DROP TABLE IF EXISTS public.rate_limits;

    CREATE TABLE public.rate_limits (
      key        TEXT        PRIMARY KEY,
      hits       INTEGER     NOT NULL DEFAULT 1,
      reset_at   TIMESTAMPTZ NOT NULL
    );

    ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

    -- Only the service role (server-side) may touch this table.
    CREATE POLICY "service_role_full_access" ON public.rate_limits
      FOR ALL TO service_role USING (true) WITH CHECK (true);

    CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at
      ON public.rate_limits (reset_at);
  END IF;
END $$;
