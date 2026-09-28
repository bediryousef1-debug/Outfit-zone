-- ==============================================================================
-- Outfit Zone
-- 002_hardening.sql
--
-- Runs AFTER:
--   001_initial_schema.sql
--
-- This migration hardens:
--   - Admin authorization
--   - Guest checkout
--   - Order access tokens
--   - Guest receipt privacy
--   - Admin product management
--   - Admin order status management
--   - Row Level Security
--   - Public storefront permissions
-- ==============================================================================

BEGIN;


-- ==============================================================================
-- 1. EXTENSIONS
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ==============================================================================
-- 2. ADMIN RBAC
-- ==============================================================================

ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS user_id UUID
  REFERENCES auth.users(id)
  ON DELETE CASCADE;


CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_user_id_unique
  ON public.admin_users(user_id)
  WHERE user_id IS NOT NULL;


-- ==============================================================================
-- 3. BOOTSTRAP EXISTING ADMIN
--
-- This links the existing Supabase Auth account to public.admin_users.
-- It does NOT create a new Auth user.
-- ==============================================================================

UPDATE public.admin_users au
SET
  user_id = u.id,
  email = u.email
FROM auth.users u
WHERE lower(au.email) = lower(u.email)
  AND lower(u.email) = lower('bediryousef1@gmail.com');


INSERT INTO public.admin_users (
  email,
  user_id
)
SELECT
  u.email,
  u.id
FROM auth.users u
WHERE lower(u.email) = lower('bediryousef1@gmail.com')
  AND NOT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE lower(au.email) = lower(u.email)
       OR au.user_id = u.id
  );


-- ==============================================================================
-- 4. AUTHORITATIVE ADMIN CHECK
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
  );
$$;


REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon;

GRANT EXECUTE ON FUNCTION public.is_admin()
TO authenticated;


-- ==============================================================================
-- 5. ORDER TOKENS
-- ==============================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS public_token TEXT
  NOT NULL
  DEFAULT encode(gen_random_bytes(24), 'hex');


ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS receipt_token TEXT
  NOT NULL
  DEFAULT encode(gen_random_bytes(24), 'hex');


CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_public_token_unique
  ON public.orders(public_token);


CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_receipt_token_unique
  ON public.orders(receipt_token);


CREATE INDEX IF NOT EXISTS idx_orders_order_number
  ON public.orders(order_number);


CREATE INDEX IF NOT EXISTS idx_orders_order_number_public_token
  ON public.orders(order_number, public_token);


CREATE INDEX IF NOT EXISTS idx_orders_order_number_receipt_token
  ON public.orders(order_number, receipt_token);


-- ==============================================================================
-- 6. GUEST ORDER CREATION
--
-- Guests cannot directly INSERT into orders/order_items.
-- They create orders only through this SECURITY DEFINER function.
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

  -- --------------------------------------------------------------------------
  -- Validate customer information
  -- --------------------------------------------------------------------------

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


  -- --------------------------------------------------------------------------
  -- Shipping fee comes from database settings.
  -- --------------------------------------------------------------------------

  SELECT ss.shipping_fee
  INTO v_shipping_fee
  FROM public.store_settings ss
  LIMIT 1;


  IF v_shipping_fee IS NULL THEN
    RAISE EXCEPTION 'OZ_SHIPPING_SETTINGS_MISSING';
  END IF;


  -- --------------------------------------------------------------------------
  -- Validate cart and calculate authoritative subtotal.
  -- Client-side prices are never trusted.
  -- --------------------------------------------------------------------------

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


    -- Lock variant row to prevent concurrent stock races.
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


    -- Product must still be active.
    SELECT p.*
    INTO v_product
    FROM public.products p
    WHERE p.id = v_variant.product_id
      AND p.is_active = TRUE;


    IF NOT FOUND THEN
      RAISE EXCEPTION 'OZ_PRODUCT_NOT_AVAILABLE';
    END IF;


    -- Authoritative server-side price.
    v_line_total := v_product.price * v_qty;

    v_subtotal := v_subtotal + v_line_total;

  END LOOP;


  -- --------------------------------------------------------------------------
  -- Generate independent order tokens.
  -- --------------------------------------------------------------------------

  v_order_number := public.generate_order_number();

  v_public_token :=
    encode(gen_random_bytes(24), 'hex');

  v_receipt_token :=
    encode(gen_random_bytes(24), 'hex');


  -- --------------------------------------------------------------------------
  -- Create order.
  -- --------------------------------------------------------------------------

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


  -- --------------------------------------------------------------------------
  -- Snapshot order items and decrement stock.
  -- --------------------------------------------------------------------------

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


  -- --------------------------------------------------------------------------
  -- Initial order status history.
  -- --------------------------------------------------------------------------

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


  -- --------------------------------------------------------------------------
  -- Return only what the frontend needs.
  -- --------------------------------------------------------------------------

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
-- 7. SECURE GUEST RECEIPT
--
-- Without valid token:
--   order number
--   status
--   creation date
--
-- With valid token:
--   totals
--   purchased items
--   governorate
--   city
--
-- Never returns:
--   customer name
--   phone
--   full address
--   notes
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


  -- --------------------------------------------------------------------------
  -- No valid token: minimal confirmation only.
  -- --------------------------------------------------------------------------

  IF p_receipt_token IS NULL
     OR NOT (
       trim(p_receipt_token) = v_order.public_token
       OR trim(p_receipt_token) = v_order.receipt_token
     ) THEN

    RETURN jsonb_build_object(
      'order_number', v_order.order_number,
      'status', v_order.status,
      'created_at', v_order.created_at,
      'has_full_access', FALSE
    );

  END IF;


  -- --------------------------------------------------------------------------
  -- Valid token: return order details without customer PII.
  -- --------------------------------------------------------------------------

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
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
    'order_number', v_order.order_number,
    'status', v_order.status,
    'created_at', v_order.created_at,
    'subtotal', v_order.subtotal,
    'shipping_fee', v_order.shipping_fee,
    'total', v_order.total,
    'governorate', v_order.governorate,
    'city', v_order.city,
    'order_items', v_items,
    'has_full_access', TRUE
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


-- ==============================================================================
-- 8. ADMIN PRODUCT SAVE
--
-- Existing variant IDs are preserved.
-- New variants are inserted.
-- Removed variants are deleted.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.admin_save_product(
  p_product JSONB,
  p_images JSONB,
  p_variants JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_product_id UUID;

  v_var JSONB;
  v_img JSONB;

  v_var_id UUID;

  v_kept_var_ids UUID[] := ARRAY[]::UUID[];
BEGIN

  -- --------------------------------------------------------------------------
  -- Authorization
  -- --------------------------------------------------------------------------

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'OZ_UNAUTHORIZED';
  END IF;


  -- --------------------------------------------------------------------------
  -- Product
  -- --------------------------------------------------------------------------

  IF p_product->>'id' IS NOT NULL
     AND p_product->>'id'
       ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  THEN

    v_product_id := (p_product->>'id')::UUID;


    UPDATE public.products
    SET
      name = trim(p_product->>'name'),
      slug = trim(p_product->>'slug'),
      description = COALESCE(p_product->>'description', ''),
      fabric_details = COALESCE(p_product->>'fabric_details', ''),
      category_id = NULLIF(
        p_product->>'category_id',
        ''
      )::UUID,
      price = (p_product->>'price')::NUMERIC(10,2),
      compare_at_price = NULLIF(
        p_product->>'compare_at_price',
        ''
      )::NUMERIC(10,2),
      is_active = COALESCE(
        (p_product->>'is_active')::BOOLEAN,
        TRUE
      ),
      is_featured = COALESCE(
        (p_product->>'is_featured')::BOOLEAN,
        FALSE
      ),
      is_new = COALESCE(
        (p_product->>'is_new')::BOOLEAN,
        FALSE
      ),
      updated_at = now()
    WHERE id = v_product_id;


    IF NOT FOUND THEN
      RAISE EXCEPTION 'OZ_PRODUCT_NOT_FOUND';
    END IF;

  ELSE

    INSERT INTO public.products (
      name,
      slug,
      description,
      fabric_details,
      category_id,
      price,
      compare_at_price,
      is_active,
      is_featured,
      is_new
    )
    VALUES (
      trim(p_product->>'name'),
      trim(p_product->>'slug'),
      COALESCE(p_product->>'description', ''),
      COALESCE(p_product->>'fabric_details', ''),
      NULLIF(
        p_product->>'category_id',
        ''
      )::UUID,
      (p_product->>'price')::NUMERIC(10,2),
      NULLIF(
        p_product->>'compare_at_price',
        ''
      )::NUMERIC(10,2),
      COALESCE(
        (p_product->>'is_active')::BOOLEAN,
        TRUE
      ),
      COALESCE(
        (p_product->>'is_featured')::BOOLEAN,
        FALSE
      ),
      COALESCE(
        (p_product->>'is_new')::BOOLEAN,
        FALSE
      )
    )
    RETURNING id
    INTO v_product_id;

  END IF;


  -- --------------------------------------------------------------------------
  -- Images
  -- --------------------------------------------------------------------------

  DELETE FROM public.product_images
  WHERE product_id = v_product_id;


  IF p_images IS NOT NULL
     AND jsonb_typeof(p_images) = 'array'
  THEN

    FOR v_img IN
      SELECT value
      FROM jsonb_array_elements(p_images)
    LOOP

      INSERT INTO public.product_images (
        product_id,
        image_url,
        sort_order,
        is_primary
      )
      VALUES (
        v_product_id,
        v_img->>'image_url',
        COALESCE(
          (v_img->>'sort_order')::INTEGER,
          0
        ),
        COALESCE(
          (v_img->>'is_primary')::BOOLEAN,
          FALSE
        )
      );

    END LOOP;

  END IF;


  -- --------------------------------------------------------------------------
  -- Variants
  -- --------------------------------------------------------------------------

  IF p_variants IS NOT NULL
     AND jsonb_typeof(p_variants) = 'array'
  THEN

    FOR v_var IN
      SELECT value
      FROM jsonb_array_elements(p_variants)
    LOOP

      IF v_var->>'id' IS NOT NULL
         AND v_var->>'id'
           ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN

        v_var_id := (v_var->>'id')::UUID;


        UPDATE public.product_variants
        SET
          color = trim(v_var->>'color'),
          size = trim(v_var->>'size'),
          stock_quantity = GREATEST(
            0,
            COALESCE(
              (v_var->>'stock_quantity')::INTEGER,
              0
            )
          ),
          updated_at = now()
        WHERE id = v_var_id
          AND product_id = v_product_id;


        IF FOUND THEN

          v_kept_var_ids :=
            array_append(
              v_kept_var_ids,
              v_var_id
            );

        ELSE

          INSERT INTO public.product_variants (
            product_id,
            color,
            size,
            stock_quantity
          )
          VALUES (
            v_product_id,
            trim(v_var->>'color'),
            trim(v_var->>'size'),
            GREATEST(
              0,
              COALESCE(
                (v_var->>'stock_quantity')::INTEGER,
                0
              )
            )
          )
          RETURNING id
          INTO v_var_id;


          v_kept_var_ids :=
            array_append(
              v_kept_var_ids,
              v_var_id
            );

        END IF;

      ELSE

        INSERT INTO public.product_variants (
          product_id,
          color,
          size,
          stock_quantity
        )
        VALUES (
          v_product_id,
          trim(v_var->>'color'),
          trim(v_var->>'size'),
          GREATEST(
            0,
            COALESCE(
              (v_var->>'stock_quantity')::INTEGER,
              0
            )
          )
        )
        RETURNING id
        INTO v_var_id;


        v_kept_var_ids :=
          array_append(
            v_kept_var_ids,
            v_var_id
          );

      END IF;

    END LOOP;

  END IF;


  -- --------------------------------------------------------------------------
  -- Delete variants removed from admin payload.
  -- --------------------------------------------------------------------------

  IF cardinality(v_kept_var_ids) > 0 THEN

    DELETE FROM public.product_variants
    WHERE product_id = v_product_id
      AND NOT (
        id = ANY(v_kept_var_ids)
      );

  ELSE

    DELETE FROM public.product_variants
    WHERE product_id = v_product_id;

  END IF;


  RETURN jsonb_build_object(
    'success', TRUE,
    'product_id', v_product_id
  );

END;
$$;


REVOKE ALL ON FUNCTION public.admin_save_product(
  JSONB,
  JSONB,
  JSONB
)
FROM PUBLIC;


GRANT EXECUTE ON FUNCTION public.admin_save_product(
  JSONB,
  JSONB,
  JSONB
)
TO authenticated;


-- ==============================================================================
-- 9. ADMIN ORDER STATUS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.admin_set_order_status(
  p_order_id UUID,
  p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_old_status TEXT;
BEGIN

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'OZ_UNAUTHORIZED';
  END IF;


  SELECT status
  INTO v_old_status
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;


  IF NOT FOUND THEN
    RAISE EXCEPTION 'OZ_ORDER_NOT_FOUND';
  END IF;


  UPDATE public.orders
  SET
    status = p_status,
    updated_at = now()
  WHERE id = p_order_id;


  INSERT INTO public.order_status_history (
    order_id,
    status,
    changed_by
  )
  VALUES (
    p_order_id,
    p_status,
    auth.uid()::TEXT
  );


  RETURN jsonb_build_object(
    'success', TRUE,
    'order_id', p_order_id,
    'old_status', v_old_status,
    'new_status', p_status
  );

END;
$$;


REVOKE ALL ON FUNCTION public.admin_set_order_status(
  UUID,
  TEXT
)
FROM PUBLIC;


GRANT EXECUTE ON FUNCTION public.admin_set_order_status(
  UUID,
  TEXT
)
TO authenticated;


-- ==============================================================================
-- 10. ENABLE RLS
-- ==============================================================================

ALTER TABLE public.admin_users
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.categories
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.products
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.product_images
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.product_variants
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.orders
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.order_items
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.order_status_history
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.store_settings
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.store_content
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.contact_social_settings
  ENABLE ROW LEVEL SECURITY;


-- ==============================================================================
-- 11. REMOVE OLD POLICIES
-- ==============================================================================

DROP POLICY IF EXISTS "Public can read active categories"
  ON public.categories;

DROP POLICY IF EXISTS "Admins can manage categories"
  ON public.categories;


DROP POLICY IF EXISTS "Public can read active products"
  ON public.products;

DROP POLICY IF EXISTS "Admins can manage products"
  ON public.products;


DROP POLICY IF EXISTS "Public can read active product images"
  ON public.product_images;

DROP POLICY IF EXISTS "Admins can manage product images"
  ON public.product_images;


DROP POLICY IF EXISTS "Public can read active product variants"
  ON public.product_variants;

DROP POLICY IF EXISTS "Admins can manage product variants"
  ON public.product_variants;


DROP POLICY IF EXISTS "Admins can manage orders"
  ON public.orders;

DROP POLICY IF EXISTS "Admins can manage order items"
  ON public.order_items;

DROP POLICY IF EXISTS "Admins can manage order status history"
  ON public.order_status_history;


DROP POLICY IF EXISTS "Public can read store settings"
  ON public.store_settings;

DROP POLICY IF EXISTS "Admins can manage store settings"
  ON public.store_settings;


DROP POLICY IF EXISTS "Public can read store content"
  ON public.store_content;

DROP POLICY IF EXISTS "Admins can manage store content"
  ON public.store_content;


DROP POLICY IF EXISTS "Public can read contact social settings"
  ON public.contact_social_settings;

DROP POLICY IF EXISTS "Admins can manage contact social settings"
  ON public.contact_social_settings;


DROP POLICY IF EXISTS "Admins can manage admin users"
  ON public.admin_users;


-- ==============================================================================
-- 12. PUBLIC STOREFRONT POLICIES
-- ==============================================================================

CREATE POLICY "Public can read active categories"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (
  is_active = TRUE
);


CREATE POLICY "Public can read active products"
ON public.products
FOR SELECT
TO anon, authenticated
USING (
  is_active = TRUE
);


CREATE POLICY "Public can read active product images"
ON public.product_images
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.products p
    WHERE p.id = product_images.product_id
      AND p.is_active = TRUE
  )
);


CREATE POLICY "Public can read active product variants"
ON public.product_variants
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.products p
    WHERE p.id = product_variants.product_id
      AND p.is_active = TRUE
  )
);


CREATE POLICY "Public can read store settings"
ON public.store_settings
FOR SELECT
TO anon, authenticated
USING (TRUE);


CREATE POLICY "Public can read store content"
ON public.store_content
FOR SELECT
TO anon, authenticated
USING (TRUE);


CREATE POLICY "Public can read contact social settings"
ON public.contact_social_settings
FOR SELECT
TO anon, authenticated
USING (TRUE);


-- ==============================================================================
-- 13. ADMIN POLICIES
-- ==============================================================================

CREATE POLICY "Admins can manage categories"
ON public.categories
FOR ALL
TO authenticated
USING (
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);


CREATE POLICY "Admins can manage products"
ON public.products
FOR ALL
TO authenticated
USING (
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);


CREATE POLICY "Admins can manage product images"
ON public.product_images
FOR ALL
TO authenticated
USING (
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);


CREATE POLICY "Admins can manage product variants"
ON public.product_variants
FOR ALL
TO authenticated
USING (
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);


CREATE POLICY "Admins can manage orders"
ON public.orders
FOR ALL
TO authenticated
USING (
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);


CREATE POLICY "Admins can manage order items"
ON public.order_items
FOR ALL
TO authenticated
USING (
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);


CREATE POLICY "Admins can manage order status history"
ON public.order_status_history
FOR ALL
TO authenticated
USING (
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);


CREATE POLICY "Admins can manage store settings"
ON public.store_settings
FOR ALL
TO authenticated
USING (
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);


CREATE POLICY "Admins can manage store content"
ON public.store_content
FOR ALL
TO authenticated
USING (
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);


CREATE POLICY "Admins can manage contact social settings"
ON public.contact_social_settings
FOR ALL
TO authenticated
USING (
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);


CREATE POLICY "Admins can manage admin users"
ON public.admin_users
FOR ALL
TO authenticated
USING (
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);


-- ==============================================================================
-- 14. REMOVE DIRECT GUEST ACCESS TO PRIVATE TABLES
-- ==============================================================================

REVOKE ALL ON public.orders
FROM anon;

REVOKE ALL ON public.order_items
FROM anon;

REVOKE ALL ON public.order_status_history
FROM anon;

REVOKE ALL ON public.admin_users
FROM anon;


-- ==============================================================================
-- 15. FUNCTION SECURITY
-- ==============================================================================

REVOKE ALL ON FUNCTION public.is_admin()
FROM PUBLIC;

REVOKE ALL ON FUNCTION public.is_admin()
FROM anon;

GRANT EXECUTE ON FUNCTION public.is_admin()
TO authenticated;


-- ==============================================================================
-- 16. FINAL STOREFRONT PERMISSIONS
-- ==============================================================================

GRANT SELECT ON public.categories
TO anon, authenticated;

GRANT SELECT ON public.products
TO anon, authenticated;

GRANT SELECT ON public.product_images
TO anon, authenticated;

GRANT SELECT ON public.product_variants
TO anon, authenticated;

GRANT SELECT ON public.store_settings
TO anon, authenticated;

GRANT SELECT ON public.store_content
TO anon, authenticated;

GRANT SELECT ON public.contact_social_settings
TO anon, authenticated;


-- ==============================================================================
-- 17. COMMENTS
-- ==============================================================================

COMMENT ON COLUMN public.admin_users.user_id IS
  'Authoritative Supabase Auth user ID. Admin authorization uses auth.uid().';


COMMENT ON COLUMN public.orders.public_token IS
  'High-entropy token used by the customer-facing order receipt URL.';


COMMENT ON COLUMN public.orders.receipt_token IS
  'Separate high-entropy token used for guest receipt access.';


-- ==============================================================================
-- 18. FINISH
-- ==============================================================================

COMMIT;


-- ==============================================================================
-- END OF 002_hardening.sql
-- ==============================================================================