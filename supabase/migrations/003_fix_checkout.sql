-- ==============================================================================
-- Outfit Zone
-- 003_fix_checkout.sql
--
-- Fixes the missing order-number generator and re-aligns guest checkout
-- with the current frontend contract and database schema.
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. ORDER NUMBER GENERATOR
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_number TEXT;
BEGIN
  LOOP
    v_order_number :=
      'OZ-' ||
      to_char(now(), 'YYYYMMDD') ||
      '-' ||
      upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8));

    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.orders
      WHERE order_number = v_order_number
    );
  END LOOP;

  RETURN v_order_number;
END;
$$;


REVOKE ALL ON FUNCTION public.generate_order_number()
FROM PUBLIC;


-- ==============================================================================
-- 2. GUEST CHECKOUT RPC
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

  v_shipping_fee NUMERIC(10,2);
  v_subtotal NUMERIC(10,2) := 0;
  v_total NUMERIC(10,2) := 0;

  v_item JSONB;
  v_variant RECORD;
  v_product RECORD;

  v_variant_id UUID;
  v_qty INTEGER;
  v_line_total NUMERIC(10,2);
BEGIN

  -- ============================================================================
  -- Validate customer information
  -- ============================================================================

  IF p_customer_name IS NULL
     OR length(trim(p_customer_name)) < 3 THEN
    RAISE EXCEPTION 'OZ_INVALID_CUSTOMER_NAME';
  END IF;

  IF p_phone IS NULL
     OR length(trim(p_phone)) < 11 THEN
    RAISE EXCEPTION 'OZ_INVALID_PHONE';
  END IF;

  IF p_governorate IS NULL
     OR length(trim(p_governorate)) = 0 THEN
    RAISE EXCEPTION 'OZ_INVALID_GOVERNORATE';
  END IF;

  IF p_city IS NULL
     OR length(trim(p_city)) = 0 THEN
    RAISE EXCEPTION 'OZ_INVALID_CITY';
  END IF;

  IF p_address IS NULL
     OR length(trim(p_address)) < 5 THEN
    RAISE EXCEPTION 'OZ_INVALID_ADDRESS';
  END IF;

  IF p_items IS NULL
     OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'OZ_EMPTY_CART';
  END IF;


  -- ============================================================================
  -- Shipping fee from store settings
  -- ============================================================================

  SELECT ss.shipping_fee
  INTO v_shipping_fee
  FROM public.store_settings ss
  LIMIT 1;

  IF v_shipping_fee IS NULL THEN
    RAISE EXCEPTION 'OZ_SHIPPING_SETTINGS_MISSING';
  END IF;


  -- ============================================================================
  -- Validate cart and calculate authoritative subtotal
  -- ============================================================================

  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements(p_items)
  LOOP

    IF v_item->>'variant_id' IS NULL
       OR NOT (
         v_item->>'variant_id'
         ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       ) THEN
      RAISE EXCEPTION 'OZ_VARIANT_NOT_FOUND';
    END IF;


    v_variant_id := (v_item->>'variant_id')::UUID;


    BEGIN
      v_qty := (v_item->>'quantity')::INTEGER;
    EXCEPTION
      WHEN invalid_text_representation THEN
        RAISE EXCEPTION 'OZ_INVALID_QUANTITY';
    END;


    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'OZ_INVALID_QUANTITY';
    END IF;


    -- Lock the variant to prevent concurrent stock races.
    SELECT pv.*
    INTO v_variant
    FROM public.product_variants pv
    WHERE pv.id = v_variant_id
    FOR UPDATE;


    IF NOT FOUND THEN
      RAISE EXCEPTION 'OZ_VARIANT_NOT_FOUND';
    END IF;


    IF v_variant.stock_quantity < v_qty THEN
      RAISE EXCEPTION
        'OZ_INSUFFICIENT_STOCK: requested %, available %',
        v_qty,
        v_variant.stock_quantity;
    END IF;


    -- Product must be active.
    SELECT p.*
    INTO v_product
    FROM public.products p
    WHERE p.id = v_variant.product_id
      AND p.is_active = TRUE;


    IF NOT FOUND THEN
      RAISE EXCEPTION 'OZ_PRODUCT_NOT_AVAILABLE';
    END IF;


    -- Use database price, never client price.
    v_line_total := v_product.price * v_qty;
    v_subtotal := v_subtotal + v_line_total;

  END LOOP;


  -- ============================================================================
  -- Generate order identity
  -- ============================================================================

  v_order_number := public.generate_order_number();

  v_public_token :=
    encode(gen_random_bytes(24), 'hex');

  v_receipt_token :=
    encode(gen_random_bytes(24), 'hex');


  -- ============================================================================
  -- Create order
  -- ============================================================================

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
  )
  VALUES (
    v_order_number,
    v_public_token,
    v_receipt_token,
    trim(p_customer_name),
    trim(p_phone),
    trim(p_governorate),
    trim(p_city),
    trim(p_address),
    NULLIF(trim(COALESCE(p_notes, '')), ''),
    v_subtotal,
    v_shipping_fee,
    v_subtotal + v_shipping_fee,
    'pending'
  )
  RETURNING id, total
  INTO v_order_id, v_total;


  -- ============================================================================
  -- Snapshot items and decrement stock
  -- ============================================================================

  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements(p_items)
  LOOP

    v_variant_id := (v_item->>'variant_id')::UUID;
    v_qty := (v_item->>'quantity')::INTEGER;


    SELECT
      pv.*,
      p.name AS product_name,
      p.price AS current_price
    INTO v_variant
    FROM public.product_variants pv
    JOIN public.products p
      ON p.id = pv.product_id
    WHERE pv.id = v_variant_id
      AND p.is_active = TRUE;


    IF NOT FOUND THEN
      RAISE EXCEPTION 'OZ_VARIANT_NOT_FOUND';
    END IF;


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
    )
    VALUES (
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
    SET
      stock_quantity = stock_quantity - v_qty,
      updated_at = now()
    WHERE id = v_variant_id
      AND stock_quantity >= v_qty;


    IF NOT FOUND THEN
      RAISE EXCEPTION 'OZ_INSUFFICIENT_STOCK';
    END IF;

  END LOOP;


  -- ============================================================================
  -- Initial status history
  -- ============================================================================

  INSERT INTO public.order_status_history (
    order_id,
    status,
    changed_by
  )
  VALUES (
    v_order_id,
    'pending',
    'customer_checkout'
  );


  -- ============================================================================
  -- Frontend response
  -- ============================================================================

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


REVOKE ALL ON FUNCTION public.create_guest_order(
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  JSONB
)
FROM PUBLIC;


GRANT EXECUTE ON FUNCTION public.create_guest_order(
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  JSONB
)
TO anon, authenticated;


-- ==============================================================================
-- 3. GUEST RECEIPT RPC
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_guest_order_receipt(
  p_order_number TEXT,
  p_receipt_token TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order RECORD;
  v_items JSONB;
BEGIN

  SELECT *
  INTO v_order
  FROM public.orders
  WHERE order_number = trim(p_order_number);


  IF NOT FOUND THEN
    RETURN NULL;
  END IF;


  -- Valid receipt token -> full receipt.
  IF p_receipt_token IS NOT NULL
     AND trim(p_receipt_token) = v_order.receipt_token THEN

    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', oi.id,
          'product_name_snapshot', oi.product_name_snapshot,
          'color', oi.color,
          'size', oi.size,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'line_total', oi.line_total
        )
      ),
      '[]'::JSONB
    )
    INTO v_items
    FROM public.order_items oi
    WHERE oi.order_id = v_order.id;


    RETURN jsonb_build_object(
      'id', v_order.id,
      'order_number', v_order.order_number,
      'customer_name', v_order.customer_name,
      'phone', v_order.phone,
      'governorate', v_order.governorate,
      'city', v_order.city,
      'address', v_order.address,
      'notes', v_order.notes,
      'subtotal', v_order.subtotal,
      'shipping_fee', v_order.shipping_fee,
      'total', v_order.total,
      'status', v_order.status,
      'created_at', v_order.created_at,
      'order_items', v_items,
      'has_full_access', TRUE
    );

  END IF;


  -- No valid token -> non-sensitive confirmation only.
  RETURN jsonb_build_object(
    'order_number', v_order.order_number,
    'status', v_order.status,
    'created_at', v_order.created_at,
    'has_full_access', FALSE
  );

END;
$$;


REVOKE ALL ON FUNCTION public.get_guest_order_receipt(
  TEXT,
  TEXT
)
FROM PUBLIC;


GRANT EXECUTE ON FUNCTION public.get_guest_order_receipt(
  TEXT,
  TEXT
)
TO anon, authenticated;


COMMIT;