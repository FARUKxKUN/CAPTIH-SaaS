-- ============================================================================
-- Migrate user IDs from Supabase-auth UUIDs → Clerk text IDs.
-- Clerk user IDs look like "user_2abc..." (TEXT), not UUIDs, and there is no
-- auth.users table to reference anymore (Clerk is the auth provider).
--
-- This drops the old Supabase-auth-era test rows (they keyed off auth.users,
-- which no longer applies). Run once.
-- ============================================================================

-- 1. Drop the auth.users sync trigger/function (Supabase-auth era).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS sync_auth_to_public();

-- 2. Wipe data that keyed off the old UUID users (test data only).
--    Order respects FKs: children first.
TRUNCATE public.transactions, public.credits, public.jobs, public.users
  RESTART IDENTITY CASCADE;

-- 3. Convert user id columns UUID → TEXT.

-- Drop RLS policies that reference the id/user_id columns (they block the
-- type change). They were written for Supabase-auth (auth.uid()) and are
-- being recreated for Clerk at the end of this migration.
DROP POLICY IF EXISTS users_select_own        ON public.users;
DROP POLICY IF EXISTS users_update_own        ON public.users;
DROP POLICY IF EXISTS credits_select_own      ON public.credits;
DROP POLICY IF EXISTS jobs_select_own         ON public.jobs;
DROP POLICY IF EXISTS transactions_select_own ON public.transactions;

-- Drop FK constraints that reference users.id so we can alter the type.
ALTER TABLE public.jobs         DROP CONSTRAINT IF EXISTS jobs_user_id_fkey;
ALTER TABLE public.credits      DROP CONSTRAINT IF EXISTS credits_user_id_fkey;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

-- users.id: drop the auth.users FK, change UUID → TEXT.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.users ALTER COLUMN id TYPE TEXT USING id::text;

-- Child user_id columns: UUID → TEXT.
ALTER TABLE public.jobs         ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE public.credits      ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE public.transactions ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- Recreate the FKs (now TEXT → TEXT).
ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.credits
  ADD CONSTRAINT credits_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 4. Recreate RLS policies for the Clerk era.
-- All app data access now goes through the SERVICE_ROLE key (server-side),
-- which bypasses RLS entirely. The anon/public client never reads these tables
-- directly anymore, so we deny anon access (defence in depth). RLS stays ON.
CREATE POLICY users_no_anon        ON public.users        FOR SELECT USING (false);
CREATE POLICY credits_no_anon      ON public.credits      FOR SELECT USING (false);
CREATE POLICY jobs_no_anon         ON public.jobs         FOR SELECT USING (false);
CREATE POLICY transactions_no_anon ON public.transactions FOR SELECT USING (false);
