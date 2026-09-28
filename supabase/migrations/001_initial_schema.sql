-- ==============================================================================
-- Migration 001: Initial Outfit Zone Schema Baseline
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- 10. store_content
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
