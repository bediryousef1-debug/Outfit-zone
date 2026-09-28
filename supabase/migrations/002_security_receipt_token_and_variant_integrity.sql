-- ==============================================================================
-- Migration 002: Security, Receipt Token & Strict Variant Integrity
-- ==============================================================================

-- 1. Add user_id reference to admin_users for auth.uid() RBAC
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Add secure receipt_token to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS receipt_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex');

CREATE INDEX IF NOT EXISTS idx_orders_receipt_token ON public.orders(order_number, receipt_token);

-- 3. Update public.is_admin() to verify auth.uid() or email
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE (user_id IS NOT NULL AND user_id = auth.uid())
       OR (LOWER(email) = LOWER(auth.jwt() ->> 'email'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 4. Recreate create_guest_order with strict variant integrity (NO fallback to first variant)
CREATE OR REPLACE FUNCTION create_guest_order(
  p_customer_name TEXT,
  p_phone TEXT,
  p_governorate TEXT,
  p_city TEXT,
  p_address TEXT,
  p_notes TEXT,
  p_items JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_receipt_token TEXT;
  v_subtotal NUMERIC(10, 2) := 0;
  v_shipping_fee NUMERIC(10, 2) := 65.00;
  v_total NUMERIC(10, 2) := 0;
  v_item JSONB;
  v_variant RECORD;
  v_product RECORD;
  v_qty INT;
  v_line_total NUMERIC(10, 2);
BEGIN
  -- 1. Validate customer inputs
  IF length(trim(p_customer_name)) < 3 THEN
    RAISE EXCEPTION 'Customer name must be at least 3 characters.';
  END IF;

  IF length(trim(p_phone)) < 11 THEN
    RAISE EXCEPTION 'Invalid Egyptian phone number.';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty.';
  END IF;

  -- 2. Fetch shipping fee from settings
  SELECT shipping_fee INTO v_shipping_fee FROM public.store_settings LIMIT 1;
  IF v_shipping_fee IS NULL THEN
    v_shipping_fee := 65.00;
  END IF;

  -- 3. Pre-validate stock and recalculate subtotal using authoritative database values
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::INT;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Invalid item quantity.';
    END IF;

    -- Strict variant lookup: Match variant strictly by UUID or exact product_id + color + size
    -- NO fallback to "first variant" or another variant is permitted!
    IF (v_item->>'variant_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      SELECT * INTO v_variant 
      FROM public.product_variants 
      WHERE id = (v_item->>'variant_id')::UUID 
      FOR UPDATE;
    ELSE
      SELECT * INTO v_variant 
      FROM public.product_variants 
      WHERE (v_item->>'product_id') IS NOT NULL 
        AND product_id::TEXT = trim(v_item->>'product_id')
        AND color = trim(v_item->>'color')
        AND size = trim(v_item->>'size')
      LIMIT 1
      FOR UPDATE;
    END IF;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product variant not found or invalid: %', COALESCE(v_item->>'variant_id', 'unknown');
    END IF;

    IF v_variant.stock_quantity < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for % (%). Available: %, Requested: %',
        v_variant.color, v_variant.size, v_variant.stock_quantity, v_qty;
    END IF;

    -- Fetch product to get authoritative price and active status
    SELECT * INTO v_product 
    FROM public.products 
    WHERE id = v_variant.product_id AND is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not available: %', v_variant.product_id;
    END IF;

    v_line_total := v_product.price * v_qty;
    v_subtotal := v_subtotal + v_line_total;
  END LOOP;

  v_total := v_subtotal + v_shipping_fee;
  v_order_number := generate_order_number();
  v_receipt_token := encode(gen_random_bytes(24), 'hex');

  -- 4. Insert into orders table with receipt_token
  INSERT INTO public.orders (
    order_number,
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
    v_receipt_token,
    trim(p_customer_name),
    trim(p_phone),
    p_governorate,
    trim(p_city),
    trim(p_address),
    p_notes,
    v_subtotal,
    v_shipping_fee,
    v_total,
    'pending'
  ) RETURNING id INTO v_order_id;

  -- 5. Insert order items & safely decrement stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::INT;

    IF (v_item->>'variant_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      SELECT pv.*, p.name AS product_name, p.price AS current_price
      INTO v_variant
      FROM public.product_variants pv
      JOIN public.products p ON p.id = pv.product_id
      WHERE pv.id = (v_item->>'variant_id')::UUID;
    ELSE
      SELECT pv.*, p.name AS product_name, p.price AS current_price
      INTO v_variant
      FROM public.product_variants pv
      JOIN public.products p ON p.id = pv.product_id
      WHERE pv.product_id::TEXT = trim(v_item->>'product_id')
        AND pv.color = trim(v_item->>'color')
        AND pv.size = trim(v_item->>'size')
      LIMIT 1;
    END IF;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Variant integrity check failed during item insertion: %', COALESCE(v_item->>'variant_id', 'unknown');
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

    -- Decrement inventory atomically
    UPDATE public.product_variants
    SET stock_quantity = stock_quantity - v_qty,
        updated_at = now()
    WHERE id = v_variant.id;
  END LOOP;

  -- 6. Add initial status history entry
  INSERT INTO public.order_status_history (
    order_id,
    status,
    changed_by
  ) VALUES (
    v_order_id,
    'pending',
    'customer_checkout'
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'receipt_token', v_receipt_token,
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping_fee,
    'total', v_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Recreate get_guest_order_receipt requiring receipt_token for personal data
CREATE OR REPLACE FUNCTION public.get_guest_order_receipt(
  p_order_number TEXT,
  p_receipt_token TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_items JSONB;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE order_number = trim(p_order_number);
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- If valid receipt token is provided and matches, return full receipt details
  IF p_receipt_token IS NOT NULL AND trim(p_receipt_token) = v_order.receipt_token THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'product_name_snapshot', product_name_snapshot,
        'color', color,
        'size', size,
        'quantity', quantity,
        'unit_price', unit_price,
        'line_total', line_total
      )
    ) INTO v_items
    FROM public.order_items
    WHERE order_id = v_order.id;

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
      'order_items', COALESCE(v_items, '[]'::jsonb),
      'has_full_access', true
    );
  END IF;

  -- Without matching receipt token: return minimal non-sensitive confirmation ONLY
  RETURN jsonb_build_object(
    'order_number', v_order.order_number,
    'status', v_order.status,
    'created_at', v_order.created_at,
    'has_full_access', false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_guest_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_guest_order_receipt(TEXT, TEXT) TO anon, authenticated;
