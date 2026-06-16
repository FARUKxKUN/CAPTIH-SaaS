-- ============================================================================
-- Auto-sync Supabase auth.users → public.users
-- When a user signs up or updates their profile in Supabase,
-- this trigger syncs them to public.users
-- ============================================================================

-- Function to sync user from auth.users to public.users
CREATE OR REPLACE FUNCTION sync_auth_to_public()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'first_name'),
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE PLPGSQL SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_auth_to_public();

-- Grant permissions (Supabase system user needs to execute this)
GRANT EXECUTE ON FUNCTION sync_auth_to_public() TO authenticated, anon, service_role;

-- Backfill: sync any users that already exist in auth.users
INSERT INTO public.users (id, email, display_name, created_at, updated_at)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'first_name'),
  created_at,
  NOW()
FROM auth.users
ON CONFLICT (id) DO NOTHING;
