-- Migration 009: Order Status Enhancements, Order Source, Coupons, and Analytics
-- Run in Supabase SQL Editor if you wish to apply these database extensions.

-- 1. Extend orders status check to include 'returned' (مرتجع)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'));

ALTER TABLE public.order_status_history DROP CONSTRAINT IF EXISTS order_status_history_status_check;
ALTER TABLE public.order_status_history ADD CONSTRAINT order_status_history_status_check
  CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'));

-- 2. Add order_source, coupon_code, and discount_amount to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_source TEXT DEFAULT 'Direct';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0 CHECK (discount_amount >= 0);

-- 3. Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC(10, 2) DEFAULT 0 CHECK (min_order_amount >= 0),
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER DEFAULT 0 CHECK (used_count >= 0),
  expires_at TIMESTAMPTZ DEFAULT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookup by code
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- RLS for coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active coupons" ON public.coupons
  FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins full access on coupons" ON public.coupons
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Analytics Events Table (Funnel: views, add_to_cart, checkout_started, order_completed)
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('product_view', 'add_to_cart', 'checkout_started', 'order_completed')),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert analytics events" ON public.analytics_events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins select analytics events" ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (true);

-- 5. Abandoned Checkouts Table (for analytics)
CREATE TABLE IF NOT EXISTS public.abandoned_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  items_count INTEGER DEFAULT 0,
  subtotal NUMERIC(10, 2) DEFAULT 0,
  customer_name TEXT,
  phone TEXT,
  status TEXT DEFAULT 'abandoned' CHECK (status IN ('abandoned', 'completed')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_abandoned_status ON public.abandoned_checkouts(status);
CREATE INDEX IF NOT EXISTS idx_abandoned_created_at ON public.abandoned_checkouts(created_at);

ALTER TABLE public.abandoned_checkouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert/update checkouts" ON public.abandoned_checkouts
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins select checkouts" ON public.abandoned_checkouts
  FOR SELECT
  TO authenticated
  USING (true);
