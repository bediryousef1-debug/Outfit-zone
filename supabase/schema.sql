-- ==============================================================================
-- Outfit Zone: Production Database Schema & Security
-- Egyptian Streetwear E-Commerce Platform
-- ==============================================================================

-- Enable UUID and cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. admin_users
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  fabric_details TEXT NOT NULL DEFAULT '',
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(10, 2) CHECK (compare_at_price IS NULL OR compare_at_price > price),
  category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_new BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. product_images
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. product_variants
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color TEXT NOT NULL,
  size TEXT NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_product_color_size UNIQUE(product_id, color, size)
);

-- 6. orders (includes secure public_token and receipt_token for guest verification)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  public_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  receipt_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  governorate TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  notes TEXT,
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_fee NUMERIC(10, 2) NOT NULL CHECK (shipping_fee >= 0),
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_public_token ON public.orders(order_number, public_token);
CREATE INDEX IF NOT EXISTS idx_orders_receipt_token ON public.orders(order_number, receipt_token);

-- 7. order_items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name_snapshot TEXT NOT NULL,
  color TEXT NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  line_total NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0)
);

-- 8. order_status_history
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  changed_by TEXT NOT NULL DEFAULT 'system'
);

-- 9. store_settings
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT NOT NULL DEFAULT 'Outfit Zone',
  shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 65.00,
  whatsapp_number TEXT NOT NULL DEFAULT '201012345678',
  phone_number TEXT NOT NULL DEFAULT '01012345678',
  inspection_available BOOLEAN NOT NULL DEFAULT true,
  exchange_policy TEXT NOT NULL DEFAULT 'استبدال المقاس متاح خلال 14 يوم من تاريخ الاستلام.',
  return_policy TEXT NOT NULL DEFAULT 'إرجاع المنتج متاح خلال 3 أيام في حالته الأصلية وبطاقة المنتج.',
  cod_message TEXT NOT NULL DEFAULT 'الدفع عند الاستلام فقط لجميع المحافظات داخل مصر.',
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9b. shipping_rates (Dynamic shipping rates per Egyptian governorate)
CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  governorate TEXT NOT NULL UNIQUE,
  shipping_fee NUMERIC(10, 2) NOT NULL CHECK (shipping_fee >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shipping_rates_governorate ON public.shipping_rates(governorate);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_is_active ON public.shipping_rates(is_active);

-- 10. store_content (Centralized CMS for storefront texts & sections)
CREATE TABLE IF NOT EXISTS public.store_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_title TEXT NOT NULL DEFAULT 'WEAR IN THE ZONE',
  hero_subtitle TEXT NOT NULL DEFAULT 'ستايل يومي بروح الشارع المصري',
  hero_button_text TEXT NOT NULL DEFAULT 'تسوق الآن',
  hero_image_url TEXT NOT NULL DEFAULT '/images/hero_streetwear_editorial_1790342899745.jpg',
  featured_section_title TEXT NOT NULL DEFAULT 'الموديلات الأكثر طلباً',
  new_arrivals_section_title TEXT NOT NULL DEFAULT 'وصل حديثًا',
  categories_section_title TEXT NOT NULL DEFAULT 'تسوق حسب الستايل والقَصّة',
  cta_title TEXT NOT NULL DEFAULT 'انضم إلى مجتمع Outfit Zone',
  cta_text TEXT NOT NULL DEFAULT 'قصات Box Fit و Oversized مريحة مصممة بعناية من خامات قطنية ثقيلة 240+ GSM تدوم معك.',
  announcement_text TEXT NOT NULL DEFAULT 'الدفع عند الاستلام فقط داخل جميع محافظات مصر · معاينة مجانية للطلب قبل الدفع والاستلام',
  show_hero BOOLEAN NOT NULL DEFAULT true,
  show_featured BOOLEAN NOT NULL DEFAULT true,
  show_new_arrivals BOOLEAN NOT NULL DEFAULT true,
  show_categories BOOLEAN NOT NULL DEFAULT true,
  show_trust BOOLEAN NOT NULL DEFAULT true,
  show_contact_cta BOOLEAN NOT NULL DEFAULT true,
  about_text TEXT NOT NULL DEFAULT 'براند مصري متخصص في ملابس الستريت وير الرجالي بقصات Box Fit و Oversized.',
  about_story TEXT NOT NULL DEFAULT 'انطلق Outfit Zone لتقديم ملابس شارع مصرية بجودة استثنائية وبدون مبالغة في الأسعار.',
  contact_text TEXT NOT NULL DEFAULT 'فريق خدمة عملاء Outfit Zone جاهز للرد على استفساراتك يوميًا بخصوص المقاسات والشحن.',
  footer_text TEXT NOT NULL DEFAULT 'براند مصري متخصص في ملابس الستريت وير الرجالي بقصات Box Fit و Oversized، مصممة بخامات قطنية ثقيلة لتمنحك الراحة والثقة يوميًا بروح الشارع.',
  shipping_text TEXT NOT NULL DEFAULT 'شحن لجميع محافظات مصر خلال 2 إلى 5 أيام عمل.',
  inspection_text TEXT NOT NULL DEFAULT 'معاينة مجانية للمنتج قبل الدفع والاستلام.',
  exchange_policy TEXT NOT NULL DEFAULT 'استبدال المقاس متاح خلال 14 يوم من تاريخ الاستلام.',
  return_policy TEXT NOT NULL DEFAULT 'إرجاع المنتج متاح خلال 3 أيام في حالته الأصلية وبطاقة المنتج.',
  cod_text TEXT NOT NULL DEFAULT 'الدفع عند الاستلام فقط لجميع المحافظات.',
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. contact_social_settings
CREATE TABLE IF NOT EXISTS public.contact_social_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_number TEXT NOT NULL DEFAULT '201012345678',
  phone_number TEXT NOT NULL DEFAULT '01012345678',
  facebook_url TEXT NOT NULL DEFAULT 'https://facebook.com/outfitzone.eg',
  instagram_url TEXT NOT NULL DEFAULT 'https://instagram.com/outfitzone.eg',
  tiktok_url TEXT NOT NULL DEFAULT 'https://tiktok.com/@outfitzone.eg',
  messenger_url TEXT NOT NULL DEFAULT 'https://m.me/outfitzone.eg',
  facebook_enabled BOOLEAN NOT NULL DEFAULT true,
  instagram_enabled BOOLEAN NOT NULL DEFAULT true,
  tiktok_enabled BOOLEAN NOT NULL DEFAULT true,
  messenger_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sequences & Order Number Generator
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1001;

CREATE OR REPLACE FUNCTION generate_order_number() 
RETURNS TEXT AS $$
DECLARE
  today_prefix TEXT;
  seq_num TEXT;
BEGIN
  today_prefix := to_char(CURRENT_DATE, 'YYYYMMDD');
  seq_num := lpad(nextval('order_number_seq')::TEXT, 4, '0');
  RETURN 'OZ-' || today_prefix || '-' || seq_num;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- SECURE ORDER CREATION RPC (ATOMIC TRANSACTION WITH STRICT VARIANT INTEGRITY)
-- ------------------------------------------------------------------------------
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
  v_receipt_token TEXT;
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

  -- 2. Fetch authoritative shipping fee from shipping_rates for governorate
  SELECT sr.shipping_fee INTO v_shipping_fee
  FROM public.shipping_rates sr
  WHERE sr.governorate = trim(p_governorate) AND sr.is_active = TRUE
  LIMIT 1;

  IF v_shipping_fee IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.shipping_rates sr WHERE sr.governorate = trim(p_governorate)) THEN
      RAISE EXCEPTION 'OZ_SHIPPING_GOVERNORATE_UNAVAILABLE';
    ELSIF NOT EXISTS (SELECT 1 FROM public.shipping_rates LIMIT 1) THEN
      RAISE EXCEPTION 'OZ_SHIPPING_SETTINGS_MISSING';
    ELSE
      RAISE EXCEPTION 'OZ_SHIPPING_GOVERNORATE_UNAVAILABLE';
    END IF;
  END IF;

  -- 3. Pre-validate stock and recalculate subtotal using authoritative database values
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::INT;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Invalid item quantity.';
    END IF;

    -- Strict variant lookup: Match ONLY by valid UUID variant_id
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
  v_receipt_token := encode(gen_random_bytes(24), 'hex');

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
    v_receipt_token,
    trim(p_customer_name),
    trim(p_phone),
    trim(p_governorate),
    trim(p_city),
    trim(p_address),
    NULLIF(trim(COALESCE(p_notes, '')), ''),
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
    'receipt_token', v_receipt_token,
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping_fee,
    'total', v_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- SECURE GUEST ORDER RECEIPT LOOKUP (PROTECTED BY PUBLIC TOKEN, STRICT PRIVACY)
-- ------------------------------------------------------------------------------
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

  -- Verify public_token or receipt_token
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

    -- STRICT PRIVACY: NEVER return customer_name, phone, address, notes in public guest receipt
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

-- ------------------------------------------------------------------------------
-- ATOMIC ADMIN SAVE PRODUCT RPC (PRESERVING VARIANT IDS)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_social_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current authenticated user is an approved admin via auth.uid() or email
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

-- 1. admin_users policies:
CREATE POLICY "Users can check their own admin status" ON public.admin_users
  FOR SELECT TO authenticated
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid()) OR
    (LOWER(email) = LOWER(auth.jwt() ->> 'email'))
  );

CREATE POLICY "Admins can manage admin_users" ON public.admin_users
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. categories policies:
CREATE POLICY "Public can view categories" ON public.categories
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. products policies:
CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR is_active IS NULL);

CREATE POLICY "Admins can view all products" ON public.products
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- 4. product_images policies:
CREATE POLICY "Public can view images for active products" ON public.product_images
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage product images" ON public.product_images
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. product_variants policies:
CREATE POLICY "Public can view variants for active products" ON public.product_variants
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage product variants" ON public.product_variants
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. orders policies:
-- Guests CANNOT read or list arbitrary orders directly!
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete orders" ON public.orders
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- 7. order_items policies:
CREATE POLICY "Admins can view order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can delete order items" ON public.order_items
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- 8. order_status_history policies:
CREATE POLICY "Admins can view and insert order status history" ON public.order_status_history
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 9. store_settings policies:
CREATE POLICY "Public can read store settings" ON public.store_settings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can update store settings" ON public.store_settings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 9b. shipping_rates policies:
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active shipping rates" ON public.shipping_rates
  FOR SELECT TO public
  USING (is_active = true);

CREATE POLICY "Admins have full access to shipping rates" ON public.shipping_rates
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 10. store_content policies:
CREATE POLICY "Public can read store content" ON public.store_content
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can update store content" ON public.store_content
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 11. contact_social_settings policies:
CREATE POLICY "Public can read contact social settings" ON public.contact_social_settings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can update contact social settings" ON public.contact_social_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 12. Storage bucket policies (for product-images bucket)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true) 
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access product-images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product-images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admins can delete product-images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());
