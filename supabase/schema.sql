-- ==============================================================================
-- Outfit Zone: Production Database Schema & Security
-- Egyptian Streetwear E-Commerce Platform
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. admin_users
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 6. orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  governorate TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  notes TEXT,
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

-- 10. store_content (Centralized CMS for storefront texts & sections)
CREATE TABLE IF NOT EXISTS public.store_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_title TEXT NOT NULL DEFAULT 'WEAR IN THE ZONE',
  hero_subtitle TEXT NOT NULL DEFAULT 'ستايل يومي بروح الشارع المصري',
  hero_button_text TEXT NOT NULL DEFAULT 'تسوق الآن',
  hero_image_url TEXT NOT NULL DEFAULT '/src/assets/images/hero_streetwear_editorial_1790342899745.jpg',
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
-- SECURE ORDER CREATION RPC (ATOMIC TRANSACTION WITH STOCK VERIFICATION)
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

  IF jsonb_array_length(p_items) = 0 THEN
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
    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Invalid item quantity.';
    END IF;

    -- Safely find variant by UUID or text
    IF (v_item->>'variant_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      SELECT * INTO v_variant 
      FROM public.product_variants 
      WHERE id = (v_item->>'variant_id')::UUID 
      FOR UPDATE;
    ELSE
      SELECT * INTO v_variant 
      FROM public.product_variants 
      WHERE (v_item->>'variant_id') IS NOT NULL AND (
        id::TEXT = (v_item->>'variant_id') OR 
        (color = trim(v_item->>'color') AND size = trim(v_item->>'size'))
      )
      LIMIT 1
      FOR UPDATE;
    END IF;

    IF NOT FOUND THEN
      -- If variant not found by ID, match first available variant for product
      SELECT * INTO v_variant
      FROM public.product_variants
      WHERE product_id::TEXT = trim(v_item->>'product_id')
      LIMIT 1
      FOR UPDATE;
    END IF;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product variant not found: %', (v_item->>'variant_id');
    END IF;

    IF v_variant.stock_quantity < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for % (%). Available: %, Requested: %',
        v_variant.color, v_variant.size, v_variant.stock_quantity, v_qty;
    END IF;

    -- Fetch product to get authoritative price and snapshot name
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

  -- 4. Insert into orders table
  INSERT INTO public.orders (
    order_number,
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
         OR (pv.color = trim(v_item->>'color') AND pv.size = trim(v_item->>'size'))
      LIMIT 1;
    END IF;

    IF NOT FOUND THEN
      SELECT pv.*, p.name AS product_name, p.price AS current_price
      INTO v_variant
      FROM public.product_variants pv
      JOIN public.products p ON p.id = pv.product_id
      LIMIT 1;
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
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping_fee,
    'total', v_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- SECURE GUEST ORDER RECEIPT LOOKUP (NO DIRECT SELECT ON ORDERS TABLE)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_guest_order_receipt(p_order_number TEXT)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_items JSONB;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE order_number = trim(p_order_number);
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

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
    'order_items', COALESCE(v_items, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_guest_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_guest_order_receipt(TEXT) TO anon, authenticated;

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

-- Case-insensitive helper function to check if current authenticated user is an approved admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 1. admin_users policies:
-- Authenticated users can check if their own email exists in admin_users (case-insensitive)
CREATE POLICY "Users can check their own admin status" ON public.admin_users
  FOR SELECT TO authenticated
  USING (LOWER(email) = LOWER(auth.jwt() ->> 'email'));

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
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;

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
