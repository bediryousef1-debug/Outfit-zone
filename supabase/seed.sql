-- ==============================================================================
-- Outfit Zone Seed Data
-- ==============================================================================

-- 1. Initial Admin User
INSERT INTO public.admin_users (email)
VALUES ('bediryousef1@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- 2. Store Settings
INSERT INTO public.store_settings (
  store_name,
  shipping_fee,
  whatsapp_number,
  phone_number,
  inspection_available,
  exchange_policy,
  return_policy,
  cod_message
) VALUES (
  'Outfit Zone',
  65.00,
  '201012345678',
  '01012345678',
  true,
  'استبدال المقاس متاح خلال 14 يوم من تاريخ الاستلام.',
  'إرجاع المنتج متاح خلال 3 أيام في حالته الأصلية وبطاقة المنتج.',
  'الدفع عند الاستلام فقط لجميع المحافظات داخل مصر.'
) ON CONFLICT DO NOTHING;

-- 2.1 Store Content CMS
INSERT INTO public.store_content (
  hero_title,
  hero_subtitle,
  hero_button_text,
  hero_image_url,
  featured_section_title,
  new_arrivals_section_title,
  categories_section_title,
  cta_title,
  cta_text,
  announcement_text,
  show_hero,
  show_featured,
  show_new_arrivals,
  show_categories,
  show_trust,
  show_contact_cta,
  about_text,
  about_story,
  contact_text,
  footer_text,
  shipping_text,
  inspection_text,
  exchange_policy,
  return_policy,
  cod_text
) VALUES (
  'WEAR IN THE ZONE',
  'ستايل يومي بروح الشارع المصري',
  'تسوق الآن',
  '/src/assets/images/hero_streetwear_editorial_1790342899745.jpg',
  'الموديلات الأكثر طلباً',
  'وصل حديثًا',
  'تسوق حسب الستايل والقَصّة',
  'انضم إلى مجتمع Outfit Zone',
  'قصات Box Fit و Oversized مريحة مصممة بعناية من خامات قطنية ثقيلة 240+ GSM تدوم معك.',
  'الدفع عند الاستلام فقط داخل جميع محافظات مصر · معاينة مجانية للطلب قبل الدفع والاستلام',
  true,
  true,
  true,
  true,
  true,
  true,
  'براند مصري متخصص في ملابس الستريت وير الرجالي بقصات Box Fit و Oversized، مصممة بخامات قطنية ثقيلة لتمنحك الراحة والثقة يوميًا بروح الشارع.',
  'انطلق Outfit Zone لتقديم ملابس شارع مصرية بجودة استثنائية وبدون مبالغة في الأسعار.',
  'فريق خدمة عملاء Outfit Zone جاهز للرد على استفساراتك يوميًا بخصوص المقاسات والشحن.',
  'براند مصري متخصص في ملابس الستريت وير الرجالي بقصات Box Fit و Oversized، مصممة بخامات قطنية ثقيلة لتمنحك الراحة والثقة يوميًا بروح الشارع.',
  'شحن لجميع محافظات مصر خلال 2 إلى 5 أيام عمل.',
  'معاينة مجانية للمنتج قبل الدفع والاستلام.',
  'استبدال المقاس متاح خلال 14 يوم من تاريخ الاستلام.',
  'إرجاع المنتج متاح خلال 3 أيام في حالته الأصلية وبطاقة المنتج.',
  'الدفع عند الاستلام فقط لجميع المحافظات.'
) ON CONFLICT DO NOTHING;

-- 2.2 Contact & Social Settings
INSERT INTO public.contact_social_settings (
  whatsapp_number,
  phone_number,
  facebook_url,
  instagram_url,
  tiktok_url,
  messenger_url,
  facebook_enabled,
  instagram_enabled,
  tiktok_enabled,
  messenger_enabled
) VALUES (
  '201012345678',
  '01012345678',
  'https://facebook.com/outfitzone.eg',
  'https://instagram.com/outfitzone.eg',
  'https://tiktok.com/@outfitzone.eg',
  'https://m.me/outfitzone.eg',
  true,
  true,
  true,
  true
) ON CONFLICT DO NOTHING;

-- 3. Categories
INSERT INTO public.categories (id, name, slug) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'تيشيرتات Box Fit', 'box-fit-t-shirts'),
  ('a2222222-2222-2222-2222-222222222222', 'تيشيرتات Oversized', 'oversized-t-shirts'),
  ('a3333333-3333-3333-3333-333333333333', 'بولو ستريت وير', 'streetwear-polos'),
  ('a4444444-4444-4444-4444-444444444444', 'قمصان ستريت وير', 'streetwear-shirts')
ON CONFLICT (id) DO NOTHING;

-- 4. Initial Products
-- Product 1: Heavyweight Box Fit Tee Black
INSERT INTO public.products (
  id,
  name,
  slug,
  description,
  fabric_details,
  price,
  compare_at_price,
  category_id,
  is_active,
  is_featured,
  is_new
) VALUES (
  'b1111111-1111-1111-1111-111111111111',
  'تيشيرت Interlock Box Fit - أسود كربوني',
  'interlock-box-fit-black',
  'قصة بوكس فيت مستقيمة ومريحة للأكتاف والصدر تمنح مظهرًا متناسقًا وعصريًا. مصمم للاستخدام اليومي المستمر مع ياقة معززة تحافظ على تماسكها بعد الغسيل المتكرر.',
  'قطن مصري 100% ثقيل كثافة 240 جرام/م² (240 GSM) معالج ضد الانكماش بنسيج إنترلوك فائق النعومة.',
  450.00,
  520.00,
  'a1111111-1111-1111-1111-111111111111',
  true,
  true,
  true
) ON CONFLICT (id) DO NOTHING;

-- Product 2: Oversized Heavyweight Tee Off-White
INSERT INTO public.products (
  id,
  name,
  slug,
  description,
  fabric_details,
  price,
  compare_at_price,
  category_id,
  is_active,
  is_featured,
  is_new
) VALUES (
  'b2222222-2222-2222-2222-222222222222',
  'تيشيرت Drop Shoulder Oversized - أوف وايت',
  'drop-shoulder-oversized-offwhite',
  'قصة أوفرسايز مع أكتاف منسدلة وأكمام واسعة تصل إلى الكوع. يعكس روح الشارع الكاجوال مع ثبات ممتاز للشكل وسلاسة في الحركة.',
  'قطن ميلتون صيفي فاخر 260 GSM ممشط، خيوط غزل مبروم متينة ومقاومة للوبرة.',
  480.00,
  550.00,
  'a2222222-2222-2222-2222-222222222222',
  true,
  true,
  true
) ON CONFLICT (id) DO NOTHING;

-- Product 3: Interlock Knit Streetwear Polo Charcoal
INSERT INTO public.products (
  id,
  name,
  slug,
  description,
  fabric_details,
  price,
  compare_at_price,
  category_id,
  is_active,
  is_featured,
  is_new
) VALUES (
  'b3333333-3333-3333-3333-333333333333',
  'بولو تريكو إنترلوك Boxy Fit - شاركول',
  'interlock-knit-polo-charcoal',
  'بولو بياقة ستريت وير مبسطة بدون أزرار أو بأزرار مخفية وقصة مربعة واسعة تناسب الخروج والجامعة والأمسيات.',
  'مزيج قطن إنترلوك محبوك 250 GSM ذو تهوية ممتازة ومرونة طبيعية وملمس بارد على الجسم.',
  520.00,
  590.00,
  'a3333333-3333-3333-3333-333333333333',
  true,
  true,
  false
) ON CONFLICT (id) DO NOTHING;

-- Product 4: Relaxed Streetwear Shirt Olive
INSERT INTO public.products (
  id,
  name,
  slug,
  description,
  fabric_details,
  price,
  compare_at_price,
  category_id,
  is_active,
  is_featured,
  is_new
) VALUES (
  'b4444444-4444-4444-4444-444444444444',
  'قميص ستريت وير بياقة كوبية - زيتي شاحب',
  'streetwear-resort-shirt-olive',
  'قميص صيفي واسع بياقة مفتوحة وأكمام نصفية، يمكن ارتداؤه مفتوحًا فوق تيشيرت بيسيك أو مغلقًا لمظهر ستريت وير أنيق.',
  'قطن تويل خفيف الوزن منسوج بنقشة بارزة وتهوية عالية مقاوم للتجعد السريع.',
  580.00,
  NULL,
  'a4444444-4444-4444-4444-444444444444',
  true,
  true,
  true
) ON CONFLICT (id) DO NOTHING;

-- 5. Product Images
INSERT INTO public.product_images (product_id, image_url, sort_order, is_primary) VALUES
  ('b1111111-1111-1111-1111-111111111111', '/src/assets/images/product_boxfit_tee_black_1790342911897.jpg', 0, true),
  ('b2222222-2222-2222-2222-222222222222', '/src/assets/images/product_oversized_tee_offwhite_1790342923739.jpg', 0, true),
  ('b3333333-3333-3333-3333-333333333333', '/src/assets/images/product_interlock_polo_charcoal_1790342934447.jpg', 0, true),
  ('b4444444-4444-4444-4444-444444444444', '/src/assets/images/product_streetwear_shirt_olive_1790342946975.jpg', 0, true)
ON CONFLICT DO NOTHING;

-- 6. Product Variants (Color & Sizes with Stock)
-- For Product 1 (Black Box Fit)
INSERT INTO public.product_variants (product_id, color, size, stock_quantity) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'أسود كربوني', 'M', 8),
  ('b1111111-1111-1111-1111-111111111111', 'أسود كربوني', 'L', 12),
  ('b1111111-1111-1111-1111-111111111111', 'أسود كربوني', 'XL', 6),
  ('b1111111-1111-1111-1111-111111111111', 'أسود كربوني', '2XL', 4),
  ('b1111111-1111-1111-1111-111111111111', 'أوف وايت', 'M', 5),
  ('b1111111-1111-1111-1111-111111111111', 'أوف وايت', 'L', 7),
  ('b1111111-1111-1111-1111-111111111111', 'أوف وايت', 'XL', 0) -- out of stock variant example
ON CONFLICT DO NOTHING;

-- For Product 2 (Off-White Oversized)
INSERT INTO public.product_variants (product_id, color, size, stock_quantity) VALUES
  ('b2222222-2222-2222-2222-222222222222', 'أوف وايت', 'M', 10),
  ('b2222222-2222-2222-2222-222222222222', 'أوف وايت', 'L', 14),
  ('b2222222-2222-2222-2222-222222222222', 'أوف وايت', 'XL', 9),
  ('b2222222-2222-2222-2222-222222222222', 'أوف وايت', '2XL', 3)
ON CONFLICT DO NOTHING;

-- For Product 3 (Charcoal Polo)
INSERT INTO public.product_variants (product_id, color, size, stock_quantity) VALUES
  ('b3333333-3333-3333-3333-333333333333', 'شاركول', 'M', 6),
  ('b3333333-3333-3333-3333-333333333333', 'شاركول', 'L', 8),
  ('b3333333-3333-3333-3333-333333333333', 'شاركول', 'XL', 5),
  ('b3333333-3333-3333-3333-333333333333', 'شاركول', '2XL', 2)
ON CONFLICT DO NOTHING;

-- For Product 4 (Olive Shirt)
INSERT INTO public.product_variants (product_id, color, size, stock_quantity) VALUES
  ('b4444444-4444-4444-4444-444444444444', 'زيتي شاحب', 'M', 4),
  ('b4444444-4444-4444-4444-444444444444', 'زيتي شاحب', 'L', 6),
  ('b4444444-4444-4444-4444-444444444444', 'زيتي شاحب', 'XL', 4),
  ('b4444444-4444-4444-4444-444444444444', 'زيتي شاحب', '2XL', 0)
ON CONFLICT DO NOTHING;
