-- ============================================
-- BACKEND FIXES ROUND 2
-- Banner defaults, billing login RPC, categories RLS
-- ============================================

-- 1. Make banner title/subtitle/gradient nullable (code only uses image_url)
ALTER TABLE public.banners ALTER COLUMN title SET DEFAULT '';
ALTER TABLE public.banners ALTER COLUMN title DROP NOT NULL;
ALTER TABLE public.banners ALTER COLUMN subtitle SET DEFAULT '';
ALTER TABLE public.banners ALTER COLUMN gradient SET DEFAULT '';

-- 2. Billing login RPC (SECURITY DEFINER — bypasses RLS for login check)
CREATE OR REPLACE FUNCTION public.billing_login_check(p_phone TEXT, p_pin TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', id,
    'name', name,
    'phone', phone,
    'pin', pin,
    'is_active', is_active
  ) INTO result
  FROM public.billing_users
  WHERE phone = p_phone
    AND pin = p_pin
    AND is_active = true;

  RETURN result;  -- NULL if no match
END;
$$;

-- 3. Fix categories RLS — restrict writes to admin only
DROP POLICY IF EXISTS "Authenticated can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated can update categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated can delete categories" ON public.categories;

CREATE POLICY "Admin can insert categories" ON public.categories FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update categories" ON public.categories FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin can delete categories" ON public.categories FOR DELETE USING (public.is_admin());
