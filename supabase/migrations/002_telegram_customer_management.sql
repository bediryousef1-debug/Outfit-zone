-- ==============================================================================
-- Outfit Zone - Telegram customer persistence and order management fixes
-- Safe to apply after the initial schema and hardening migrations.
-- Does not import historical orders into the customer table.
-- ==============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_phone text NOT NULL UNIQUE,
  original_phone text NOT NULL,
  current_name text NOT NULL DEFAULT '',
  names_used text[] NOT NULL DEFAULT ARRAY[]::text[],
  has_multiple_names boolean NOT NULL DEFAULT false,
  order_count integer NOT NULL DEFAULT 0 CHECK (order_count >= 0),
  first_order_at timestamptz NOT NULL DEFAULT now(),
  last_order_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customers_last_order_at_idx
  ON public.customers (last_order_at DESC);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.customers FROM anon, authenticated;
GRANT ALL ON TABLE public.customers TO service_role;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_customer_id_fkey'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_customer_id_fkey
      FOREIGN KEY (customer_id)
      REFERENCES public.customers(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS orders_customer_id_idx
  ON public.orders (customer_id);

ALTER TABLE public.order_status_history
  DROP CONSTRAINT IF EXISTS order_status_history_status_check;

ALTER TABLE public.order_status_history
  ADD CONSTRAINT order_status_history_status_check
  CHECK (status = ANY (ARRAY[
    'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'
  ]));

COMMIT;
