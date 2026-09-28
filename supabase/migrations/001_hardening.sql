-- ==============================================================================
-- Outfit Zone: Hardening & Security Migration (001_hardening.sql)
-- ==============================================================================

-- 1. Ensure user_id column on admin_users referencing auth.users
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Add public_token and receipt_token to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS public_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex');

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS receipt_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex');

CREATE INDEX IF NOT EXISTS idx_orders_public_token ON public.orders(order_number, public_token);
CREATE INDEX IF NOT EXISTS idx_orders_receipt_token ON public.orders(order_number, receipt_token);

-- 3. Authoritative is_admin() function checking auth.uid() or email
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

-- 4. Atomic create_guest_order with strict variant integrity and no hardcoded shipping
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
  v_public_token TEXT;
  v_subtotal NUMERIC(10, 2) := 0;
  v_shipping_fee NUMERIC(10, 2);
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

  -- 2. Fetch authoritative shipping fee from store_settings (no hardcoded fallback)
  SELECT shipping_fee INTO v_shipping_fee FROM public.store_settings LIMIT 1;
  IF v_shipping_fee IS NULL THEN
    RAISE EXCEPTION 'OZ_SHIPPING_SETTINGS_MISSING: Store shipping settings not configured in database.';
  END IF;

  -- 3. Pre-validate stock and recalculate subtotal using authoritative database values
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::INT;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Invalid item quantity.';
    END IF;

    -- Strict variant lookup: Match ONLY by valid UUID variant_id
    -- NO color/size matching without variant_id and NO fallback to first variant!
    IF (v_item->>'variant_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      SELECT * INTO v_variant 
      FROM public.product_variants 
      WHERE id = (v_item->>'variant_id')::UUID 
      FOR UPDATE;
    ELSE
      SELECT * INTO v_variant 
      FROM public.product_variants 
      WHERE id::TEXT = (v_item->>'variant_id')
      LIMIT 1
      FOR UPDATE;
    END IF;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'OZ_VARIANT_NOT_FOUND: Variant % not found.', COALESCE(v_item->>'variant_id', 'unknown');
    END IF;

    IF v_variant.stock_quantity < v_qty THEN
      RAISE EXCEPTION 'OZ_INSUFFICIENT_STOCK: % (%) requested % but only % available.',
        v_variant.color, v_variant.size, v_qty, v_variant.stock_quantity;
    END IF;

    -- Fetch product to get authoritative price and check active status
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
  v_public_token := encode(gen_random_bytes(24), 'hex');

  -- 4. Insert into orders table with public_token and receipt_token
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
    v_public_token,
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
      WHERE pv.id::TEXT = (v_item->>'variant_id')
      LIMIT 1;
    END IF;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'OZ_VARIANT_NOT_FOUND: Variant % not found during checkout snapshot.', COALESCE(v_item->>'variant_id', 'unknown');
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
    'public_token', v_public_token,
    'receipt_token', v_public_token,
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping_fee,
    'total', v_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Secure get_guest_order_receipt: strictly protecting customer personal data
CREATE OR REPLACE FUNCTION public.get_guest_order_receipt(
  p_order_number TEXT,
  p_receipt_token TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_items JSONB;
  v_token_valid BOOLEAN := false;
BEGIN
  SELECT * INTO v_order 
  FROM public.orders 
  WHERE order_number = trim(p_order_number);

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Check if token matches public_token or receipt_token
  IF p_receipt_token IS NOT NULL AND (
    trim(p_receipt_token) = v_order.receipt_token OR 
    trim(p_receipt_token) = v_order.public_token
  ) THEN
    v_token_valid := true;
  END IF;

  IF v_token_valid THEN
    SELECT jsonb_agg(
      jsonb_build_object(
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

    -- STRICT PRIVACY: NEVER return customer_name, phone, address, notes to public guest receipt lookup!
    RETURN jsonb_build_object(
      'order_number', v_order.order_number,
      'status', v_order.status,
      'created_at', v_order.created_at,
      'subtotal', v_order.subtotal,
      'shipping_fee', v_order.shipping_fee,
      'total', v_order.total,
      'governorate', v_order.governorate,
      'city', v_order.city,
      'order_items', COALESCE(v_items, '[]'::jsonb),
      'has_full_access', true
    );
  END IF;

  -- Without valid token: Minimal public confirmation ONLY
  RETURN jsonb_build_object(
    'order_number', v_order.order_number,
    'status', v_order.status,
    'created_at', v_order.created_at,
    'has_full_access', false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Atomic admin_save_product maintaining variant IDs
CREATE OR REPLACE FUNCTION public.admin_save_product(
  p_product JSONB,
  p_images JSONB,
  p_variants JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_product_id UUID;
  v_img JSONB;
  v_var JSONB;
  v_var_id UUID;
  v_kept_var_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can save products.';
  END IF;

  -- 1. Insert or Update Product
  IF (p_product->>'id') IS NOT NULL AND (p_product->>'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_product_id := (p_product->>'id')::UUID;
    UPDATE public.products SET
      name = trim(p_product->>'name'),
      slug = trim(p_product->>'slug'),
      description = COALESCE(p_product->>'description', ''),
      fabric_details = COALESCE(p_product->>'fabric_details', ''),
      category_id = (p_product->>'category_id')::UUID,
      price = (p_product->>'price')::NUMERIC(10, 2),
      compare_at_price = (p_product->>'compare_at_price')::NUMERIC(10, 2),
      is_active = COALESCE((p_product->>'is_active')::BOOLEAN, true),
      is_featured = COALESCE((p_product->>'is_featured')::BOOLEAN, false),
      is_new = COALESCE((p_product->>'is_new')::BOOLEAN, false),
      updated_at = now()
    WHERE id = v_product_id;
  ELSE
    INSERT INTO public.products (
      name, slug, description, fabric_details, category_id,
      price, compare_at_price, is_active, is_featured, is_new
    ) VALUES (
      trim(p_product->>'name'),
      trim(p_product->>'slug'),
      COALESCE(p_product->>'description', ''),
      COALESCE(p_product->>'fabric_details', ''),
      (p_product->>'category_id')::UUID,
      (p_product->>'price')::NUMERIC(10, 2),
      (p_product->>'compare_at_price')::NUMERIC(10, 2),
      COALESCE((p_product->>'is_active')::BOOLEAN, true),
      COALESCE((p_product->>'is_featured')::BOOLEAN, false),
      COALESCE((p_product->>'is_new')::BOOLEAN, false)
    ) RETURNING id INTO v_product_id;
  END IF;

  -- 2. Images: Replace images for product
  DELETE FROM public.product_images WHERE product_id = v_product_id;
  IF p_images IS NOT NULL AND jsonb_array_length(p_images) > 0 THEN
    FOR v_img IN SELECT * FROM jsonb_array_elements(p_images)
    LOOP
      INSERT INTO public.product_images (
        product_id, image_url, sort_order, is_primary
      ) VALUES (
        v_product_id,
        v_img->>'image_url',
        COALESCE((v_img->>'sort_order')::INT, 0),
        COALESCE((v_img->>'is_primary')::BOOLEAN, false)
      );
    END LOOP;
  END IF;

  -- 3. Variants: Preserve existing IDs!
  IF p_variants IS NOT NULL AND jsonb_array_length(p_variants) > 0 THEN
    FOR v_var IN SELECT * FROM jsonb_array_elements(p_variants)
    LOOP
      IF (v_var->>'id') IS NOT NULL AND (v_var->>'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_var_id := (v_var->>'id')::UUID;
        UPDATE public.product_variants SET
          color = trim(v_var->>'color'),
          size = trim(v_var->>'size'),
          stock_quantity = GREATEST(0, (v_var->>'stock_quantity')::INT),
          updated_at = now()
        WHERE id = v_var_id AND product_id = v_product_id;

        IF FOUND THEN
          v_kept_var_ids := array_append(v_kept_var_ids, v_var_id);
        ELSE
          INSERT INTO public.product_variants (
            product_id, color, size, stock_quantity
          ) VALUES (
            v_product_id,
            trim(v_var->>'color'),
            trim(v_var->>'size'),
            GREATEST(0, (v_var->>'stock_quantity')::INT)
          ) RETURNING id INTO v_var_id;
          v_kept_var_ids := array_append(v_kept_var_ids, v_var_id);
        END IF;
      ELSE
        -- Insert new variant
        INSERT INTO public.product_variants (
          product_id, color, size, stock_quantity
        ) VALUES (
          v_product_id,
          trim(v_var->>'color'),
          trim(v_var->>'size'),
          GREATEST(0, (v_var->>'stock_quantity')::INT)
        ) RETURNING id INTO v_var_id;
        v_kept_var_ids := array_append(v_kept_var_ids, v_var_id);
      END IF;
    END LOOP;
  END IF;

  -- Delete variants removed from the payload
  DELETE FROM public.product_variants 
  WHERE product_id = v_product_id 
    AND id != ALL(v_kept_var_ids);

  RETURN jsonb_build_object(
    'success', true,
    'product_id', v_product_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_guest_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_guest_order_receipt(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_product(JSONB, JSONB, JSONB) TO authenticated;
