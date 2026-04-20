-- ============================================
-- BILLING SYSTEM - POS for in-shop sales
-- ============================================

-- 1. BILLING USERS (cashiers/counter staff)
CREATE TABLE IF NOT EXISTS public.billing_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. BILLING SESSIONS (day start/close)
CREATE TABLE IF NOT EXISTS public.billing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.billing_users(id),
  user_name TEXT NOT NULL,
  session_date DATE NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  is_open BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, session_date)
);

-- 3. BILLS (sales invoices)
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_no SERIAL,
  session_id UUID NOT NULL REFERENCES public.billing_sessions(id),
  user_id UUID NOT NULL REFERENCES public.billing_users(id),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  discount_percent NUMERIC NOT NULL DEFAULT 0,
  gst_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_mode TEXT NOT NULL DEFAULT 'cash',
  credit_name TEXT,
  credit_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. KOT (Kitchen Order Tickets)
CREATE TABLE IF NOT EXISTS public.kots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kot_no SERIAL,
  session_id UUID NOT NULL REFERENCES public.billing_sessions(id),
  user_id UUID NOT NULL REFERENCES public.billing_users(id),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ACCOUNT HEADS (admin-defined expense categories)
CREATE TABLE IF NOT EXISTS public.account_heads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. PAYMENTS / EXPENSES
CREATE TABLE IF NOT EXISTS public.billing_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_no SERIAL,
  session_id UUID NOT NULL REFERENCES public.billing_sessions(id),
  user_id UUID NOT NULL REFERENCES public.billing_users(id),
  account_head TEXT NOT NULL,
  description TEXT,
  paid_to TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  mode TEXT NOT NULL DEFAULT 'cash',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. CREDITS (customer credit tracking)
CREATE TABLE IF NOT EXISTS public.credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES public.bills(id),
  bill_no INT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  is_settled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  settled_at TIMESTAMPTZ
);

-- 8. CREDIT PAYMENTS (partial payments)
CREATE TABLE IF NOT EXISTS public.credit_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id UUID NOT NULL REFERENCES public.credits(id),
  amount NUMERIC NOT NULL,
  mode TEXT NOT NULL DEFAULT 'cash',
  paid_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.billing_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_payments ENABLE ROW LEVEL SECURITY;

-- Permissive policies (same pattern as existing tables)
CREATE POLICY "billing_users_all" ON public.billing_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "billing_sessions_all" ON public.billing_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "bills_all" ON public.bills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "kots_all" ON public.kots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "account_heads_all" ON public.account_heads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "billing_payments_all" ON public.billing_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "credits_all" ON public.credits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "credit_payments_all" ON public.credit_payments FOR ALL USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.bills;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.billing_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.credits;
