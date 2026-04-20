-- ============================================
-- SCHEMA FIXES: categories table, menu_items columns,
-- banner column, decrement_qty RPC, tighten RLS
-- ============================================

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert categories" ON public.categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update categories" ON public.categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete categories" ON public.categories FOR DELETE USING (auth.role() = 'authenticated');

ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;

-- 2. ADD MISSING COLUMNS TO menu_items
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS qty INT NOT NULL DEFAULT 100;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS product_code TEXT NOT NULL DEFAULT '';
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS tax NUMERIC NOT NULL DEFAULT 5;

-- 3. ADD image_url COLUMN TO banners (the code expects it)
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';

-- 4. decrement_qty RPC (atomic stock decrement for billing)
CREATE OR REPLACE FUNCTION public.decrement_qty(item_id TEXT, amount INT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.menu_items
  SET qty = GREATEST(0, qty - amount)
  WHERE id = item_id;
$$;

-- 5. hash_password helper using pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.hash_password(raw TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT extensions.crypt(raw, extensions.gen_salt('bf'));
$$;

CREATE OR REPLACE FUNCTION public.verify_password(raw TEXT, hashed TEXT)
RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE
AS $$
  SELECT hashed = extensions.crypt(raw, hashed);
$$;

-- Hash the existing plaintext password(s) in admin_users
UPDATE public.admin_users
SET password_hash = extensions.crypt(password_hash, extensions.gen_salt('bf'))
WHERE password_hash NOT LIKE '$2%';  -- skip already-hashed rows

-- ============================================
-- 6. TIGHTEN RLS POLICIES
-- ============================================

-- Helper: check if the current session user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE phone = (
      SELECT phone FROM auth.users WHERE id = auth.uid()
    )
  );
$$;

-- === MENU ITEMS ===
DROP POLICY IF EXISTS "Anon can insert menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Anon can update menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Anon can delete menu items" ON public.menu_items;

CREATE POLICY "Admin can insert menu items" ON public.menu_items FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update menu items" ON public.menu_items FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin can delete menu items" ON public.menu_items FOR DELETE USING (public.is_admin());

-- === BANNERS ===
DROP POLICY IF EXISTS "Anon can insert banners" ON public.banners;
DROP POLICY IF EXISTS "Anon can update banners" ON public.banners;
DROP POLICY IF EXISTS "Anon can delete banners" ON public.banners;

CREATE POLICY "Admin can insert banners" ON public.banners FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update banners" ON public.banners FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin can delete banners" ON public.banners FOR DELETE USING (public.is_admin());

-- === OFFERS ===
DROP POLICY IF EXISTS "Anon can insert offers" ON public.offers;
DROP POLICY IF EXISTS "Anon can update offers" ON public.offers;
DROP POLICY IF EXISTS "Anon can delete offers" ON public.offers;

CREATE POLICY "Admin can insert offers" ON public.offers FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update offers" ON public.offers FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin can delete offers" ON public.offers FOR DELETE USING (public.is_admin());

-- === ORDERS ===
DROP POLICY IF EXISTS "Anyone can view orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;

-- Customers see their own orders; admins + riders see all
CREATE POLICY "Users can view own orders or admin" ON public.orders
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.riders WHERE phone = (SELECT phone FROM auth.users WHERE id = auth.uid()))
  );
CREATE POLICY "Authenticated can insert orders" ON public.orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin or rider can update orders" ON public.orders
  FOR UPDATE USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.riders WHERE phone = (SELECT phone FROM auth.users WHERE id = auth.uid()))
    OR auth.uid() = user_id
  );

-- === ADMIN USERS ===
-- Remove the fully-open SELECT that exposes password_hash
DROP POLICY IF EXISTS "Admin users select" ON public.admin_users;
-- Only the admin's own row is visible (phone match via auth)
CREATE POLICY "Admin users select own" ON public.admin_users
  FOR SELECT USING (
    phone = (SELECT phone FROM auth.users WHERE id = auth.uid())
  );
-- Allow unauthenticated login check via RPC instead of direct table read
-- We create a secure login RPC below

-- === RIDERS ===
DROP POLICY IF EXISTS "Anon can insert riders" ON public.riders;
DROP POLICY IF EXISTS "Anon can update riders" ON public.riders;
DROP POLICY IF EXISTS "Anon can delete riders" ON public.riders;

CREATE POLICY "Admin can insert riders" ON public.riders FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Authenticated can update riders" ON public.riders FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can delete riders" ON public.riders FOR DELETE USING (public.is_admin());

-- === BILLING TABLES ===
DROP POLICY IF EXISTS "billing_users_all" ON public.billing_users;
DROP POLICY IF EXISTS "billing_sessions_all" ON public.billing_sessions;
DROP POLICY IF EXISTS "bills_all" ON public.bills;
DROP POLICY IF EXISTS "kots_all" ON public.kots;
DROP POLICY IF EXISTS "account_heads_all" ON public.account_heads;
DROP POLICY IF EXISTS "billing_payments_all" ON public.billing_payments;
DROP POLICY IF EXISTS "credits_all" ON public.credits;
DROP POLICY IF EXISTS "credit_payments_all" ON public.credit_payments;

CREATE POLICY "billing_users_select" ON public.billing_users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "billing_users_admin" ON public.billing_users FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "billing_sessions_auth" ON public.billing_sessions FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "bills_auth" ON public.bills FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "kots_auth" ON public.kots FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "account_heads_select" ON public.account_heads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "account_heads_admin" ON public.account_heads FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "billing_payments_auth" ON public.billing_payments FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "credits_auth" ON public.credits FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "credit_payments_auth" ON public.credit_payments FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- === RESTAURANT CONFIG ===
DROP POLICY IF EXISTS "Admin update access" ON restaurant_config;
CREATE POLICY "Admin update config" ON restaurant_config FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================
-- 7. SECURE ADMIN LOGIN RPC
-- (allows checking credentials without exposing the table)
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_login_check(p_phone TEXT, p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT password_hash INTO stored_hash
  FROM public.admin_users
  WHERE phone = p_phone;

  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN stored_hash = extensions.crypt(p_password, stored_hash);
END;
$$;
