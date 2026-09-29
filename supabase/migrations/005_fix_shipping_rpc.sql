BEGIN;

-- ============================================================================
-- Outfit Zone
-- 005_fix_shipping_rpc.sql
--
-- Fixes create_guest_order() to match the existing
-- order_status_history schema.
--
-- Does NOT modify old migrations or delete production data.
-- ============================================================================

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
  IF p_customer_name IS NULL
     OR length(trim(p_customer_name)) < 3 THEN
    RAISE EXCEPTION 'OZ_INVALID_NAME';
  END IF;

  IF p_phone IS NULL
     OR length(trim(p_phone)) < 11 THEN
    RAISE EXCEPTION 'OZ_INVALID_PHONE';
  END IF;

  v_clean_governorate := trim(COALESCE(p_governorate, ''));

  IF length(v_clean_governorate) = 0 THEN
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


  -- 2. Get authoritative shipping fee from DB
  SELECT sr.shipping_fee
  INTO v_shipping_fee
  FROM public.shipping_rates sr
  WHERE sr.governorate = v_clean_governorate
    AND sr.is_active = TRUE
  LIMIT 1;

  IF v_shipping_fee IS NULL THEN

    SELECT EXISTS (
      SELECT 1
      FROM public.shipping_rates sr
      WHERE sr.governorate = v_clean_governorate
    )
    INTO v_rate_exists;

    IF v_rate_exists THEN
      RAISE EXCEPTION 'OZ_SHIPPING_GOVERNORATE_UNAVAILABLE';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.shipping_rates
      LIMIT 1
    ) THEN
      RAISE EXCEPTION 'OZ_SHIPPING_SETTINGS_MISSING';
    END IF;

    RAISE EXCEPTION 'OZ_SHIPPING_GOVERNORATE_UNAVAILABLE';
  END IF;


  -- 3. Validate cart and calculate authoritative subtotal
  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements(p_items)
  LOOP

    IF v_item->>'variant_id' IS NULL
       OR NOT (
         v_item->>'variant_id'
         ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       ) THEN
      RAISE EXCEPTION 'OZ_INVALID_VARIANT_ID';
    END IF;

    v_variant_id := (v_item->>'variant_id')::UUID;
    v_qty := COALESCE((v_item->>'quantity')::INT, 0);

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'OZ_INVALID_QUANTITY';
    END IF;


    -- Lock variant to prevent concurrent stock races
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


    -- Product must still be active
    SELECT p.*
    INTO v_product
    FROM public.products p
    WHERE p.id = v_variant.product_id
      AND p.is_active = TRUE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'OZ_PRODUCT_NOT_AVAILABLE';
    END IF;


    -- Authoritative server-side price
    v_line_total := v_product.price * v_qty;
    v_subtotal := v_subtotal + v_line_total;

  END LOOP;


  -- 4. Calculate final authoritative total
  v_total := v_subtotal + v_shipping_fee;

  v_order_number := public.generate_order_number();

  v_public_token :=
    encode(gen_random_bytes(24), 'hex');

  v_receipt_token :=
    encode(gen_random_bytes(24), 'hex');


  -- 5. Create order
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
    v_clean_governorate,
    trim(p_city),
    trim(p_address),
    NULLIF(trim(COALESCE(p_notes, '')), ''),
    v_subtotal,
    v_shipping_fee,
    v_total,
    'pending'
  )
  RETURNING id INTO v_order_id;


  -- 6. Snapshot order items and decrement stock
  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements(p_items)
  LOOP

    v_variant_id := (v_item->>'variant_id')::UUID;
    v_qty := (v_item->>'quantity')::INT;

    SELECT
      pv.*,
      p.name AS product_name,
      p.price AS current_price
    INTO v_variant
    FROM public.product_variants pv
    JOIN public.products p
      ON p.id = pv.product_id
    WHERE pv.id = v_variant_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'OZ_VARIANT_NOT_FOUND';
    END IF;

    v_line_total :=
      v_variant.current_price * v_qty;


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
      updated_at = timezone('utc'::text, now())
    WHERE id = v_variant_id;

  END LOOP;


  -- 7. Add initial status history entry
  -- Matches the actual production schema:
  -- status + changed_by
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


  -- 8. Return secure order information
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


GRANT EXECUTE ON FUNCTION public.create_guest_order(
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  JSONB
) TO anon, authenticated;

COMMIT;