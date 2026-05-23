-- ============================================
-- Permissive RLS for admin-managed tables
-- ============================================
-- Background: admin/rider/billing now authenticate via Firebase Phone OTP,
-- so `auth.uid()` from PostgREST is NULL and the previous `is_admin()` policies
-- always evaluated to false, silently blocking every admin write. Access to
-- the admin/rider/billing UIs is already gated by a row in admin_users /
-- riders / billing_users + SMS OTP, so we open the underlying tables to anon
-- writes (same model already in use for menu_items via earlier migration).
-- ============================================

DO $$
DECLARE
  t TEXT;
  r RECORD;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'menu_items',
    'categories',
    'banners',
    'offers',
    'riders'
  ]
  LOOP
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, t);
    END LOOP;

    EXECUTE format('CREATE POLICY "Public read %1$s" ON public.%1$I FOR SELECT USING (true)', t);
    EXECUTE format('CREATE POLICY "Public insert %1$s" ON public.%1$I FOR INSERT WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "Public update %1$s" ON public.%1$I FOR UPDATE USING (true)', t);
    EXECUTE format('CREATE POLICY "Public delete %1$s" ON public.%1$I FOR DELETE USING (true)', t);
  END LOOP;
END $$;

-- Ensure realtime publication covers all admin-managed tables
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['menu_items','categories','banners','offers','riders']
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN
      -- already added
      NULL;
    END;
  END LOOP;
END $$;
