-- ============================================
-- RIDERS TABLE - Delivery rider management
-- ============================================

CREATE TABLE IF NOT EXISTS public.riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'bike',
  vehicle_number TEXT,
  is_online BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  rating NUMERIC(2,1) NOT NULL DEFAULT 5.0,
  total_deliveries INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add rider_id column to orders for proper assignment
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rider_id UUID REFERENCES public.riders(id);
-- Add rejection_reason column if not exists
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- RLS
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view riders" ON public.riders FOR SELECT USING (true);
CREATE POLICY "Anon can insert riders" ON public.riders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can update riders" ON public.riders FOR UPDATE USING (true);
CREATE POLICY "Anon can delete riders" ON public.riders FOR DELETE USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.riders;
