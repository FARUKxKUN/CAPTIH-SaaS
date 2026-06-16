-- ============================================================================
-- Recreate credit helper functions with TEXT user params (Clerk IDs).
-- The Clerk-ID migration converted table columns UUID → TEXT but left these
-- functions declaring UUID, so passing a Clerk id ("user_...") threw 22P02:
--   invalid input syntax for type uuid: "user_3F5..."
-- ============================================================================

-- Drop old UUID-typed versions (signature change requires drop).
DROP FUNCTION IF EXISTS get_user_active_minutes(UUID);
DROP FUNCTION IF EXISTS deduct_credit_minutes(UUID, BIGINT);

-- Active (unexpired) minutes for a user.
CREATE OR REPLACE FUNCTION get_user_active_minutes(user_uuid TEXT)
RETURNS BIGINT AS $$
  SELECT COALESCE(SUM(minutes_remaining), 0)
  FROM public.credits
  WHERE user_id = user_uuid
    AND (expires_at IS NULL OR expires_at > NOW())
  GROUP BY user_id;
$$ LANGUAGE SQL STABLE;

-- Deduct minutes from the user's oldest-expiring active pack.
CREATE OR REPLACE FUNCTION deduct_credit_minutes(
  user_uuid TEXT,
  minutes_to_deduct BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
  _credit_id UUID;
BEGIN
  SELECT id INTO _credit_id
  FROM public.credits
  WHERE user_id = user_uuid
    AND (expires_at IS NULL OR expires_at > NOW())
    AND minutes_remaining > 0
  ORDER BY expires_at ASC NULLS LAST, created_at ASC
  LIMIT 1;

  IF _credit_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.credits
  SET minutes_used = minutes_used + minutes_to_deduct,
      updated_at = NOW()
  WHERE id = _credit_id;

  RETURN TRUE;
END;
$$ LANGUAGE PLPGSQL;
