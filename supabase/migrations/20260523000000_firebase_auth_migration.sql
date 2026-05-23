-- ============================================
-- MIGRATION: Switch customer auth from Supabase Auth to Firebase Phone Auth
-- - Profiles.id and orders.user_id now store Firebase UIDs (TEXT) instead of auth.users UUIDs
-- - RLS for profiles becomes permissive to anon (client trust shifts to Firebase ID token verification client-side)
-- ============================================

-- 1. Drop FKs that point to auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- 2. Drop ALL policies on profiles and orders that may depend on id/user_id columns
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='profiles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
  END LOOP;
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='orders' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.orders', r.policyname);
  END LOOP;
END $$;

-- 3. Convert UUID columns to TEXT to hold Firebase UIDs (28 chars typically)
ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE public.orders   ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- 4. Recreate permissive policies (security perimeter is now Firebase OTP on the client).

CREATE POLICY "Anyone can view profiles"   ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Anyone can view orders"   ON public.orders FOR SELECT USING (true);
CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update orders" ON public.orders FOR UPDATE USING (true);
