-- ==============================================================================
-- Outfit Zone
-- 004_shipping_rates.sql
--
-- Adds dynamic shipping per governorate system:
--   - public.shipping_rates table with 27 Egyptian governorates
--   - Row Level Security (RLS) for public and admin access
--   - Idempotent seed using store_settings.shipping_fee baseline
--   - Authoritative create_guest_order() RPC with governorate validation
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. SHIPPING RATES TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  governorate TEXT NOT NULL UNIQUE,
  shipping_fee NUMERIC(10, 2) NOT NULL CHECK (shipping_fee >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shipping_rates_governorate
  ON public.shipping_rates (governorate);

CREATE INDEX IF NOT EXISTS idx_shipping_rates_is_active
  ON public.shipping_rates (is_active);

-- ==============================================================================
-- 2. SEED THE 27 EGYPTIAN GOVERNORATES (IDEMPOTENT)
-- ==============================================================================

DO $$
DECLARE
  v_default_fee NUMERIC(10, 2);
BEGIN
  -- Read baseline fee from store_settings or fallback to 65 EGP
  SELECT COALESCE(shipping_fee, 65.00)
  INTO v_default_fee
  FROM public.store_settings
  LIMIT 1;

  IF v_default_fee IS NULL THEN
    v_default_fee := 65.00;
  END IF;

  INSERT INTO public.shipping_rates (governorate, shipping_fee, is_active)
  VALUES
    ('القاهرة', v_default_fee, true),
    ('الجيزة', v_default_fee, true),
    ('الإسكندرية', v_default_fee, true),
    ('القليوبية', v_default_fee, true),
    ('الشرقية', v_default_fee, true),
    ('الدقهلية', v_default_fee, true),
    ('الغربية', v_default_fee, true),
    ('المنوفية', v_default_fee, true),
    ('البحيرة', v_default_fee, true),
    ('كفر الشيخ', v_default_fee, true),
    ('دمياط', v_default_fee, true),
    ('بورسعيد', v_default_fee, true),
    ('الإسماعيلية', v_default_fee, true),
    ('السويس', v_default_fee, true),
    ('الفيوم', v_default_fee, true),
    ('بني سويف', v_default_fee, true),
    ('المنيا', v_default_fee, true),
    ('أسيوط', v_default_fee, true),
    ('سوهاج', v_default_fee, true),
    ('قنا', v_default_fee, true),
    ('الأقصر', v_default_fee, true),
    ('أسوان', v_default_fee, true),
    ('البحر الأحمر', v_default_fee, true),
    ('الوادي الجديد', v_default_fee, true),
    ('مطروح', v_default_fee, true),
    ('شمال سيناء', v_default_fee, true),
    ('جنوب سيناء', v_default_fee, true)
  ON CONFLICT (governorate) DO NOTHING;
END;
$$;

-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

-- Anonymous/Public: Can read only active shipping rates
DROP POLICY IF EXISTS "Public can view active shipping rates" ON public.shipping_rates;
CREATE POLICY "Public can view active shipping rates"
  ON public.shipping_rates
  FOR SELECT
  TO public
  USING (is_active = true);

-- Admin: Full SELECT, INSERT, UPDATE via public.is_admin()
DROP POLICY IF EXISTS "Admins have full access to shipping rates" ON public.shipping_rates;
CREATE POLICY "Admins have full access to shipping rates"
  ON public.shipping_rates
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Anonymous/Public CANNOT insert, update, or delete
GRANT SELECT ON public.shipping_rates TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.shipping_rates FROM anon;

-- ==============================================================================
-- 4. AUTHORITATIVE create_guest_order() RPC WITH GOVERNORATE SHIPPING
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.create_guest_order(
  p_customer_name TEXT,
  p_phone TEXT,
  p_governorate TEXT,
  p_city TEXT,
  p_address TEXT,
  p_notes TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_public_token TEXT;
  v_receipt_token TEXT;
  v_clean_governorate TEXT;
  v_shipping_fee NUMERIC(10, 2);
  v_subtotal NUMERIC(10, 2) := 0;
  v_total NUMERIC(10, 2) := 0;
  v_item JSONB;
  v_variant_id UUID;
  v_qty INT;
  v_line_total NUMERIC(10, 2);
  v_variant RECORD;
  v_product RECORD;
  v_rate_exists BOOLEAN;
BEGIN
  -- 1. Validate customer inputs
  IF p_customer_name IS NULL OR length(trim(p_customer_name)) < 3 THEN
    RAISE EXCEPTION 'OZ_INVALID_NAME';
  END IF;

  IF p_phone IS NULL OR length(trim(p_phone)) < 11 THEN
    RAISE EXCEPTION 'OZ_INVALID_PHONE';
  END IF;

  v_clean_governorate := trim(COALESCE(p_governorate, ''));
  IF length(v_clean_governorate) = 0 THEN
    RAISE EXCEPTION 'OZ_INVALID_GOVERNORATE';
  END IF;

  IF p_city IS NULL OR length(trim(p_city)) = 0 THEN
    RAISE EXCEPTION 'OZ_INVALID_CITY';
  END IF;

  IF p_address IS NULL OR length(trim(p_address)) < 5 THEN
    RAISE EXCEPTION 'OZ_INVALID_ADDRESS';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'OZ_EMPTY_CART';
  END IF;

  -- 2. Fetch authoritative shipping fee for governorate
  SELECT sr.shipping_fee
  INTO v_shipping_fee
  FROM public.shipping_rates sr
  WHERE sr.governorate = v_clean_governorate
    AND sr.is_active = TRUE
  LIMIT 1;

  IF v_shipping_fee IS NULL THEN
    -- Check if governorate exists but is inactive
    SELECT EXISTS (
      SELECT 1 FROM public.shipping_rates sr WHERE sr.governorate = v_clean_governorate
    ) INTO v_rate_exists;

    IF v_rate_exists THEN
      RAISE EXCEPTION 'OZ_SHIPPING_GOVERNORATE_UNAVAILABLE';
    ELSE
      -- Governorate not found in configured shipping rates
      -- Check if any rates exist at all
      IF NOT EXISTS (SELECT 1 FROM public.shipping_rates LIMIT 1) THEN
        RAISE EXCEPTION 'OZ_SHIPPING_SETTINGS_MISSING';
      ELSE
        RAISE EXCEPTION 'OZ_SHIPPING_GOVERNORATE_UNAVAILABLE';
      END IF;
    END IF;
  END IF;

  -- 3. Validate cart and calculate authoritative subtotal
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    IF v_item->>'variant_id' IS NULL
       OR NOT (v_item->>'variant_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') THEN
      RAISE EXCEPTION 'OZ_INVALID_VARIANT_ID';
    END IF;

    v_variant_id := (v_item->>'variant_id')::UUID;
    v_qty := COALESCE((v_item->>'quantity')::INT, 0);

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'OZ_INVALID_QUANTITY';
    END IF;

    -- Lock variant row to prevent concurrent stock races
    SELECT pv.*
    INTO v_variant
    FROM public.product_variants pv
    WHERE pv.id = v_variant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'OZ_VARIANT_NOT_FOUND';
    END IF;

    IF v_variant.stock_quantity < v_qty THEN
      RAISE EXCEPTION 'OZ_INSUFFICIENT_STOCK: requested %, available %', v_qty, v_variant.stock_quantity;
    END IF;

    -- Product must be active
    SELECT p.*
    INTO v_product
    FROM public.products p
    WHERE p.id = v_variant.product_id
      AND p.is_active = TRUE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'OZ_PRODUCT_NOT_AVAILABLE';
    END IF;

    -- Authoritative server-side price calculation
    v_line_total := v_product.price * v_qty;
    v_subtotal := v_subtotal + v_line_total;
  END LOOP;

  -- 4. Calculate total with authoritative shipping fee
  v_total := v_subtotal + v_shipping_fee;

  -- Generate tokens
  v_order_number := public.generate_order_number();
  v_public_token := encode(gen_random_bytes(24), 'hex');
  v_receipt_token := encode(gen_random_bytes(24), 'hex');

  -- 5. Insert order record with shipping_fee snapshot
  INSERT INTO public.orders (
    order_number,
    public_token,
    receipt_token,
    customer_name,
    phone,
    governorate,
    city,
    address,
    notes,
    subtotal,
    shipping_fee,
    total,
    status
  ) VALUES (
    v_order_number,
    v_public_token,
    v_receipt_token,
    trim(p_customer_name),
    trim(p_phone),
    v_clean_governorate,
    trim(p_city),
    trim(p_address),
    NULLIF(trim(COALESCE(p_notes, '')), ''),
    v_subtotal,
    v_shipping_fee,
    v_total,
    'pending'
  ) RETURNING id INTO v_order_id;

  -- 6. Insert order items & safely decrement stock
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_variant_id := (v_item->>'variant_id')::UUID;
    v_qty := (v_item->>'quantity')::INT;

    SELECT pv.*, p.name AS product_name, p.price AS current_price
    INTO v_variant
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = v_variant_id;

    v_line_total := v_variant.current_price * v_qty;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name_snapshot,
      color,
      size,
      quantity,
      unit_price,
      line_total
    ) VALUES (
      v_order_id,
      v_variant.product_id,
      v_variant.product_name,
      v_variant.color,
      v_variant.size,
      v_qty,
      v_variant.current_price,
      v_line_total
    );

    UPDATE public.product_variants
    SET stock_quantity = stock_quantity - v_qty,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_variant_id;
  END LOOP;

  -- 7. Audit log status
  INSERT INTO public.order_status_history (
    order_id,
    from_status,
    to_status,
    notes
  ) VALUES (
    v_order_id,
    NULL,
    'pending',
    'طلب جديد من المتجر الإلكتروني - تم التحقق من أسعار المنتجات والشحن حسب المحافظة.'
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'public_token', v_public_token,
    'receipt_token', v_receipt_token,
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping_fee,
    'total', v_total
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_guest_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;

COMMIT;
