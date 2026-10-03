-- ==============================================================================
-- 008_customers_slides_multilingual.sql
-- 1. Hero Carousel Slides Table
-- 2. Customer Tracking Table (Starts clean from activation, no old orders)
-- 3. Customer ID Reference on Orders
-- 4. Multilingual columns on Store Content
-- ==============================================================================

-- 1. HERO SLIDES
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_ar TEXT DEFAULT 'NEW COLLECTION 2026',
  tag_en TEXT DEFAULT 'NEW COLLECTION 2026',
  title_line1_ar TEXT DEFAULT 'WEAR IN',
  title_line1_en TEXT DEFAULT 'WEAR IN',
  title_line2_ar TEXT DEFAULT 'THE ZONE',
  title_line2_en TEXT DEFAULT 'THE ZONE',
  subtitle_ar TEXT DEFAULT 'ستايلك له حضور',
  subtitle_en TEXT DEFAULT 'Presence In Every Style',
  description_ar TEXT DEFAULT 'قطع مختارة بعناية تعكس شخصيتك وتخليك دايماً في قلب الحدث بأعلى خامات قطنية مصرية.',
  description_en TEXT DEFAULT 'Carefully selected streetwear crafted from premium heavyweight Egyptian cotton.',
  button_text_ar TEXT DEFAULT 'تسوق الآن',
  button_text_en TEXT DEFAULT 'Shop Now',
  button_link TEXT NOT NULL DEFAULT '/products',
  image_url TEXT NOT NULL DEFAULT '/images/hero_streetwear_editorial_1790342899745.jpg',
  badge_top_ar TEXT DEFAULT 'Style Your Zone',
  badge_top_en TEXT DEFAULT 'Style Your Zone',
  badge_bottom_ar TEXT DEFAULT 'STYLE BUILDS CONFIDENCE',
  badge_bottom_en TEXT DEFAULT 'STYLE BUILDS CONFIDENCE',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hero_slides_active_order ON public.hero_slides(is_active, sort_order);

-- Initial 4 slides
INSERT INTO public.hero_slides (
  tag_ar, tag_en,
  title_line1_ar, title_line1_en,
  title_line2_ar, title_line2_en,
  subtitle_ar, subtitle_en,
  description_ar, description_en,
  button_text_ar, button_text_en,
  button_link, image_url,
  badge_top_ar, badge_top_en,
  badge_bottom_ar, badge_bottom_en,
  sort_order, is_active
)
SELECT
  'NEW COLLECTION 2026', 'NEW COLLECTION 2026',
  'WEAR IN', 'WEAR IN',
  'THE ZONE', 'THE ZONE',
  'ستايلك له حضور', 'Presence In Every Style',
  'قطع مختارة بعناية تعكس شخصيتك وتخليك دايماً في قلب الحدث بأعلى خامات قطنية مصرية.', 'Carefully selected streetwear crafted from premium heavyweight Egyptian cotton.',
  'تسوق الآن', 'Shop Now',
  '/products', '/images/hero_streetwear_editorial_1790342899745.jpg',
  'Style Your Zone', 'Style Your Zone',
  'STYLE BUILDS CONFIDENCE', 'STYLE BUILDS CONFIDENCE',
  0, true
WHERE NOT EXISTS (SELECT 1 FROM public.hero_slides WHERE title_line2_ar = 'THE ZONE');

INSERT INTO public.hero_slides (
  tag_ar, tag_en,
  title_line1_ar, title_line1_en,
  title_line2_ar, title_line2_en,
  subtitle_ar, subtitle_en,
  description_ar, description_en,
  button_text_ar, button_text_en,
  button_link, image_url,
  badge_top_ar, badge_top_en,
  badge_bottom_ar, badge_bottom_en,
  sort_order, is_active
)
SELECT
  'BOX FIT ESSENTIALS', 'BOX FIT ESSENTIALS',
  'HEAVYWEIGHT', 'HEAVYWEIGHT',
  'COTTON 240+', 'COTTON 240+',
  'تيشيرتات Box Fit الفاخرة', 'Luxury Box Fit T-Shirts',
  'قصات مريحة وتطريز متقن صُمم ليدوم معك مع الحفاظ على رونق القماش ومقاومة الغسيل.', 'Comfortable cuts and fine craftsmanship engineered to retain luxury fabric wash after wash.',
  'اكتشف التيشيرتات', 'Explore T-Shirts',
  '/products?search=تيشيرت', '/images/product_boxfit_tee_black_1790342911897.jpg',
  'Heavyweight Fit', 'Heavyweight Fit',
  '100% EGYPTIAN COTTON', '100% EGYPTIAN COTTON',
  1, true
WHERE NOT EXISTS (SELECT 1 FROM public.hero_slides WHERE title_line2_ar = 'COTTON 240+');

INSERT INTO public.hero_slides (
  tag_ar, tag_en,
  title_line1_ar, title_line1_en,
  title_line2_ar, title_line2_en,
  subtitle_ar, subtitle_en,
  description_ar, description_en,
  button_text_ar, button_text_en,
  button_link, image_url,
  badge_top_ar, badge_top_en,
  badge_bottom_ar, badge_bottom_en,
  sort_order, is_active
)
SELECT
  'OVERSIZED STREETWEAR', 'OVERSIZED STREETWEAR',
  'EFFORTLESS', 'EFFORTLESS',
  'OVERSIZED', 'OVERSIZED',
  'تشكيلة الأوفرسايز الواسعة', 'Oversized Streetwear Drop',
  'ستايل الشارع العصري بقصات هدلة مريحة تمنحك إطلالة فريدة ومميزة طوال اليوم.', 'Contemporary urban drape giving you an iconic silhouette and effortless all-day comfort.',
  'تسوق الأوفرسايز', 'Shop Oversized',
  '/products?search=اوفرسايز', '/images/product_oversized_tee_offwhite_1790342923739.jpg',
  'Streetwear Drop', 'Streetwear Drop',
  'WEAR IN THE ZONE', 'WEAR IN THE ZONE',
  2, true
WHERE NOT EXISTS (SELECT 1 FROM public.hero_slides WHERE title_line1_ar = 'EFFORTLESS');

INSERT INTO public.hero_slides (
  tag_ar, tag_en,
  title_line1_ar, title_line1_en,
  title_line2_ar, title_line2_en,
  subtitle_ar, subtitle_en,
  description_ar, description_en,
  button_text_ar, button_text_en,
  button_link, image_url,
  badge_top_ar, badge_top_en,
  badge_bottom_ar, badge_bottom_en,
  sort_order, is_active
)
SELECT
  'URBAN INTERLOCK', 'URBAN INTERLOCK',
  'MODERN', 'MODERN',
  'POLOS & SHIRTS', 'POLOS & SHIRTS',
  'بولو وقمصان إنترلوك أنيقة', 'Interlock Polos & Resort Shirts',
  'دمج مثالي بين المظهر المهندم والطابع الكاجوال بخامة إنترلوك ناعمة وباردة ومريحة.', 'The perfect blend of smart elegance and street attitude in cooling breathable interlock.',
  'عرض التشكيلة', 'View Collection',
  '/products?category=streetwear-polos', '/images/product_interlock_polo_charcoal_1790342934447.jpg',
  'Urban Interlock', 'Urban Interlock',
  'CASH ON DELIVERY', 'CASH ON DELIVERY',
  3, true
WHERE NOT EXISTS (SELECT 1 FROM public.hero_slides WHERE title_line2_ar = 'POLOS & SHIRTS');

-- 2. CUSTOMERS TABLE (Clean start, starts from activation, strictly protected)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_phone TEXT UNIQUE NOT NULL,
  original_phone TEXT NOT NULL,
  current_name TEXT NOT NULL DEFAULT '',
  names_used JSONB NOT NULL DEFAULT '[]'::jsonb,
  has_multiple_names BOOLEAN NOT NULL DEFAULT false,
  order_count INTEGER NOT NULL DEFAULT 1,
  first_order_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_order_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS current_name TEXT DEFAULT '';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS first_order_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_customers_normalized_phone ON public.customers(normalized_phone);
CREATE INDEX IF NOT EXISTS idx_customers_has_multiple_names ON public.customers(has_multiple_names);
CREATE INDEX IF NOT EXISTS idx_customers_order_count ON public.customers(order_count);
CREATE INDEX IF NOT EXISTS idx_customers_last_order_at ON public.customers(last_order_at DESC);

-- 3. LINK ORDERS TO CUSTOMERS (Nullable, backward-compatible)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);

-- 4. MULTILINGUAL COLUMNS ON STORE CONTENT
ALTER TABLE public.store_content ADD COLUMN IF NOT EXISTS announcement_text_ar TEXT;
ALTER TABLE public.store_content ADD COLUMN IF NOT EXISTS announcement_text_en TEXT;
ALTER TABLE public.store_content ADD COLUMN IF NOT EXISTS hero_subtitle_en TEXT;
ALTER TABLE public.store_content ADD COLUMN IF NOT EXISTS hero_button_text_en TEXT;
ALTER TABLE public.store_content ADD COLUMN IF NOT EXISTS about_text_en TEXT;
ALTER TABLE public.store_content ADD COLUMN IF NOT EXISTS about_story_en TEXT;
ALTER TABLE public.store_content ADD COLUMN IF NOT EXISTS footer_text_en TEXT;

-- 5. RLS POLICIES
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- hero_slides: Public can view active slides
DROP POLICY IF EXISTS "Public can view active slides" ON public.hero_slides;
CREATE POLICY "Public can view active slides"
  ON public.hero_slides FOR SELECT
  USING (is_active = true OR public.is_admin());

-- hero_slides: Admin full access
DROP POLICY IF EXISTS "Admins can manage slides" ON public.hero_slides;
CREATE POLICY "Admins can manage slides"
  ON public.hero_slides FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- customers: Strictly restricted to admins (Never public)
DROP POLICY IF EXISTS "Admins can view customers" ON public.customers;
CREATE POLICY "Admins can view customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage customers" ON public.customers;
CREATE POLICY "Admins can manage customers"
  ON public.customers FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
