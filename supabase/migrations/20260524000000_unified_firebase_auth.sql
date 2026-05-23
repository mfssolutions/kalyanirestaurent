-- ============================================
-- MIGRATION: Unified Firebase Phone OTP auth for ALL roles
-- - Adds RPCs so the client can verify a phone belongs to admin / billing role
--   without exposing those tables' rows (their RLS is restrictive).
-- - Riders table is already publicly readable, no RPC needed.
-- ============================================

-- Admin: returns TRUE if phone is registered as an admin
CREATE OR REPLACE FUNCTION public.is_admin_phone(p_phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  found BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE phone = p_phone
  ) INTO found;
  RETURN found;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_phone(TEXT) TO anon, authenticated;

-- Billing: returns the billing user row (as JSONB) if phone is active, else NULL
CREATE OR REPLACE FUNCTION public.billing_user_by_phone(p_phone TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT to_jsonb(b.*) INTO result
  FROM public.billing_users b
  WHERE b.phone = p_phone AND b.is_active = TRUE
  LIMIT 1;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.billing_user_by_phone(TEXT) TO anon, authenticated;
