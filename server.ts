import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  CustomerRecord,
  normalizePhone,
  recordCustomerFromOrder,
  handleTelegramUpdate,
  getTelegramAdminUserIds,
} from './src/services/customerManagement.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Supabase configuration
const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  '';

const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';

const hasSupabase = Boolean(
  supabaseUrl &&
  (supabaseAnonKey || supabaseServiceKey) &&
  !supabaseUrl.includes('your-project')
);

const supabaseClient = hasSupabase
  ? createClient(
      supabaseUrl,
      supabaseServiceKey || supabaseAnonKey
    )
  : null;

// ==============================================================================
// Dynamic Data Store (Mirrors Supabase PostgreSQL tables + Disk Persistence)
// ==============================================================================

const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
  is_active?: boolean;
  created_at: string;
}

interface ProductRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  fabric_details: string;
  price: number;
  compare_at_price: number | null;
  category_id: string;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductImageRecord {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

interface ProductVariantRecord {
  id: string;
  product_id: string;
  color: string;
  color_hex: string;
  image_url?: string | null;
  size: string;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

interface OrderRecord {
  id: string;
  order_number: string;
  customer_id?: string | null;
  receipt_token?: string;
  customer_name: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
  notes?: string | null;
  subtotal: number;
  shipping_fee: number;
  total: number;
  status:
    | 'pending'
    | 'confirmed'
    | 'shipped'
    | 'delivered'
    | 'cancelled';
  created_at: string;
  updated_at: string;
}

interface OrderItemRecord {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  color: string;
  size: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface OrderStatusHistoryRecord {
  id: string;
  order_id: string;
  status:
    | 'pending'
    | 'confirmed'
    | 'shipped'
    | 'delivered'
    | 'cancelled';
  created_at: string;
  changed_by: string;
}

interface ShippingRateRecord {
  id: string;
  governorate: string;
  shipping_fee: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface StoreSettingsRecord {
  id: string;
  store_name: string;
  shipping_fee: number;
  whatsapp_number: string;
  phone_number: string;
  inspection_available: boolean;
  exchange_policy: string;
  return_policy: string;
  cod_message: string;
  updated_at: string;
}

interface StoreContentRecord {
  id: string;
  hero_title: string;
  hero_subtitle: string;
  hero_button_text: string;
  hero_image_url: string;
  featured_section_title: string;
  new_arrivals_section_title: string;
  categories_section_title: string;
  cta_title: string;
  cta_text: string;
  announcement_text: string;
  show_hero: boolean;
  show_featured: boolean;
  show_new_arrivals: boolean;
  show_categories: boolean;
  show_trust: boolean;
  show_contact_cta: boolean;
  about_text: string;
  about_story: string;
  contact_text: string;
  footer_text: string;
  shipping_text: string;
  inspection_text: string;
  exchange_policy: string;
  return_policy: string;
  cod_text: string;
  updated_at: string;
}

interface ContactSocialRecord {
  id: string;
  whatsapp_number: string;
  phone_number: string;
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
  messenger_url: string;
  facebook_enabled: boolean;
  instagram_enabled: boolean;
  tiktok_enabled: boolean;
  messenger_enabled: boolean;
  updated_at: string;
}

interface AdminUserRecord {
  id: string;
  email: string;
  created_at: string;
}

// ==============================================================================
// Memory Database
// ==============================================================================

const db = {
  admin_users: [
    {
      id: 'adm_1111111-1111-1111-1111-111111111111',
      email: 'bediryousef1@gmail.com',
      created_at: '2026-09-01T00:00:00.000Z',
    },
  ] as AdminUserRecord[],

  store_settings: {
    id: 'settings_default',
    store_name: 'Outfit Zone',
    shipping_fee: 65,
    whatsapp_number:
      process.env.VITE_WHATSAPP_NUMBER || '201012345678',
    phone_number: '01012345678',
    inspection_available: true,
    exchange_policy:
      'استبدال المقاس متاح خلال 14 يوم من تاريخ الاستلام.',
    return_policy:
      'إرجاع المنتج متاح خلال 3 أيام في حالته الأصلية وبطاقة المنتج.',
    cod_message:
      'الدفع عند الاستلام فقط لجميع المحافظات داخل مصر.',
    updated_at: new Date().toISOString(),
  } as StoreSettingsRecord,

  store_content: {
    id: 'content_default',
    hero_title: 'WEAR IN THE ZONE',
    hero_subtitle: 'ستايل يومي بروح الشارع المصري',
    hero_button_text: 'تسوق الآن',
    hero_image_url:
      '/src/assets/images/hero_streetwear_editorial_1790342899745.jpg',
    featured_section_title: 'الموديلات الأكثر طلباً',
    new_arrivals_section_title: 'وصل حديثًا',
    categories_section_title: 'تسوق حسب الستايل والقَصّة',
    cta_title: 'انضم إلى مجتمع Outfit Zone',
    cta_text:
      'قصات Box Fit و Oversized مريحة مصممة بعناية من خامات قطنية ثقيلة 240+ GSM تدوم معك.',
    announcement_text:
      'الدفع عند الاستلام فقط داخل جميع محافظات مصر · معاينة مجانية للطلب قبل الدفع والاستلام',
    show_hero: true,
    show_featured: true,
    show_new_arrivals: true,
    show_categories: true,
    show_trust: true,
    show_contact_cta: true,
    about_text:
      'براند مصري متخصص في ملابس الستريت وير الرجالي بقصات Box Fit و Oversized، مصممة بخامات قطنية ثقيلة لتمنحك الراحة والثقة يوميًا بروح الشارع.',
    about_story:
      'انطلق Outfit Zone لتقديم ملابس شارع مصرية بجودة استثنائية وبدون مبالغة في الأسعار.',
    contact_text:
      'فريق خدمة عملاء Outfit Zone جاهز للرد على استفساراتك يوميًا بخصوص المقاسات والشحن.',
    footer_text:
      'براند مصري متخصص في ملابس الستريت وير الرجالي بقصات Box Fit و Oversized، مصممة بخامات قطنية ثقيلة لتمنحك الراحة والثقة يوميًا بروح الشارع.',
    shipping_text:
      'شحن لجميع محافظات مصر خلال 2 إلى 5 أيام عمل.',
    inspection_text:
      'معاينة مجانية للمنتج قبل الدفع والاستلام.',
    exchange_policy:
      'استبدال المقاس متاح خلال 14 يوم من تاريخ الاستلام.',
    return_policy:
      'إرجاع المنتج متاح خلال 3 أيام في حالته الأصلية وبطاقة المنتج.',
    cod_text:
      'الدفع عند الاستلام فقط لجميع المحافظات.',
    updated_at: new Date().toISOString(),
  } as StoreContentRecord,

  contact_social: {
    id: 'contact_social_default',
    whatsapp_number: '201012345678',
    phone_number: '01012345678',
    facebook_url: 'https://facebook.com/outfitzone.eg',
    instagram_url: 'https://instagram.com/outfitzone.eg',
    tiktok_url: 'https://tiktok.com/@outfitzone.eg',
    messenger_url: 'https://m.me/outfitzone.eg',
    facebook_enabled: true,
    instagram_enabled: true,
    tiktok_enabled: true,
    messenger_enabled: true,
    updated_at: new Date().toISOString(),
  } as ContactSocialRecord,

  categories: [
    {
      id: 'a1111111-1111-1111-1111-111111111111',
      name: 'تيشيرتات Box Fit',
      slug: 'box-fit-t-shirts',
      created_at: new Date().toISOString(),
    },
    {
      id: 'a2222222-2222-2222-2222-222222222222',
      name: 'تيشيرتات Oversized',
      slug: 'oversized-t-shirts',
      created_at: new Date().toISOString(),
    },
    {
      id: 'a3333333-3333-3333-3333-333333333333',
      name: 'بولو ستريت وير',
      slug: 'streetwear-polos',
      created_at: new Date().toISOString(),
    },
    {
      id: 'a4444444-4444-4444-4444-444444444444',
      name: 'قمصان ستريت وير',
      slug: 'streetwear-shirts',
      created_at: new Date().toISOString(),
    },
  ] as CategoryRecord[],

  products: [] as ProductRecord[],
  product_images: [] as ProductImageRecord[],
  product_variants: [] as ProductVariantRecord[],
  orders: [] as OrderRecord[],
  order_items: [] as OrderItemRecord[],
  order_status_history: [] as OrderStatusHistoryRecord[],
  shipping_rates: [] as ShippingRateRecord[],
  customers: [] as CustomerRecord[],
};

// ==============================================================================
// File Persistence Helpers
// ==============================================================================

function saveToFile(filename: string, data: any) {
  try {
    fs.writeFileSync(
      path.join(DATA_DIR, filename),
      JSON.stringify(data, null, 2),
      'utf8'
    );
  } catch (err) {
    console.error(`Failed to save ${filename}:`, err);
  }
}

function loadFromFile<T>(filename: string, fallback: T): T {
  try {
    const filePath = path.join(DATA_DIR, filename);

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Failed to load ${filename}:`, err);
  }

  return fallback;
}

// ==============================================================================
// Initialize Catalog
// ==============================================================================

function initializeCatalog() {
  const persistedOrders = loadFromFile<OrderRecord[]>(
    'orders.json',
    []
  );

  const persistedCustomers = loadFromFile<CustomerRecord[]>(
    'customers.json',
    []
  );

  const persistedOrderItems = loadFromFile<OrderItemRecord[]>(
    'order_items.json',
    []
  );

  const persistedHistory =
    loadFromFile<OrderStatusHistoryRecord[]>(
      'order_status_history.json',
      []
    );

  const persistedProducts = loadFromFile<ProductRecord[]>(
    'products.json',
    []
  );

  const persistedImages =
    loadFromFile<ProductImageRecord[]>(
      'product_images.json',
      []
    );

  const persistedVariants =
    loadFromFile<ProductVariantRecord[]>(
      'product_variants.json',
      []
    );

  const persistedCategories =
    loadFromFile<CategoryRecord[]>(
      'categories.json',
      []
    );

  const persistedSettings =
    loadFromFile<StoreSettingsRecord | null>(
      'store_settings.json',
      null
    );

  const persistedContent =
    loadFromFile<StoreContentRecord | null>(
      'store_content.json',
      null
    );

  const persistedSocial =
    loadFromFile<ContactSocialRecord | null>(
      'contact_social.json',
      null
    );

  if (persistedOrders.length > 0) {
    db.orders = persistedOrders;
  }

  if (persistedCustomers.length > 0) {
    db.customers = persistedCustomers;
  }

  if (persistedOrderItems.length > 0) {
    db.order_items = persistedOrderItems;
  }

  if (persistedHistory.length > 0) {
    db.order_status_history = persistedHistory;
  }

  if (persistedCategories.length > 0) {
    db.categories = persistedCategories;
  }

  if (persistedSettings) {
    db.store_settings = persistedSettings;
  }

  if (persistedContent) {
    db.store_content = persistedContent;
  }

  if (persistedSocial) {
    db.contact_social = persistedSocial;
  }

  const defaultShippingRates: ShippingRateRecord[] = [
    { id: 'sr_cairo', governorate: 'القاهرة', shipping_fee: 65, is_active: true },
    { id: 'sr_giza', governorate: 'الجيزة', shipping_fee: 65, is_active: true },
    { id: 'sr_alexandria', governorate: 'الإسكندرية', shipping_fee: 65, is_active: true },
    { id: 'sr_qalyubia', governorate: 'القليوبية', shipping_fee: 65, is_active: true },
    { id: 'sr_sharqia', governorate: 'الشرقية', shipping_fee: 65, is_active: true },
    { id: 'sr_dakahlia', governorate: 'الدقهلية', shipping_fee: 65, is_active: true },
    { id: 'sr_gharbia', governorate: 'الغربية', shipping_fee: 65, is_active: true },
    { id: 'sr_monufia', governorate: 'المنوفية', shipping_fee: 65, is_active: true },
    { id: 'sr_beheira', governorate: 'البحيرة', shipping_fee: 65, is_active: true },
    { id: 'sr_kafr_el_sheikh', governorate: 'كفر الشيخ', shipping_fee: 65, is_active: true },
    { id: 'sr_damietta', governorate: 'دمياط', shipping_fee: 65, is_active: true },
    { id: 'sr_port_said', governorate: 'بورسعيد', shipping_fee: 65, is_active: true },
    { id: 'sr_ismailia', governorate: 'الإسماعيلية', shipping_fee: 65, is_active: true },
    { id: 'sr_suez', governorate: 'السويس', shipping_fee: 65, is_active: true },
    { id: 'sr_fayoum', governorate: 'الفيوم', shipping_fee: 65, is_active: true },
    { id: 'sr_beni_suef', governorate: 'بني سويف', shipping_fee: 65, is_active: true },
    { id: 'sr_minya', governorate: 'المنيا', shipping_fee: 65, is_active: true },
    { id: 'sr_asyut', governorate: 'أسيوط', shipping_fee: 65, is_active: true },
    { id: 'sr_sohag', governorate: 'سوهاج', shipping_fee: 65, is_active: true },
    { id: 'sr_qena', governorate: 'قنا', shipping_fee: 65, is_active: true },
    { id: 'sr_luxor', governorate: 'الأقصر', shipping_fee: 65, is_active: true },
    { id: 'sr_aswan', governorate: 'أسوان', shipping_fee: 65, is_active: true },
    { id: 'sr_red_sea', governorate: 'البحر الأحمر', shipping_fee: 65, is_active: true },
    { id: 'sr_new_valley', governorate: 'الوادي الجديد', shipping_fee: 65, is_active: true },
    { id: 'sr_matrouh', governorate: 'مطروح', shipping_fee: 65, is_active: true },
    { id: 'sr_north_sinai', governorate: 'شمال سيناء', shipping_fee: 65, is_active: true },
    { id: 'sr_south_sinai', governorate: 'جنوب سيناء', shipping_fee: 65, is_active: true }
  ];
  db.shipping_rates = loadFromFile<ShippingRateRecord[]>('shipping_rates.json', defaultShippingRates);
  if (!db.shipping_rates || db.shipping_rates.length === 0) {
    db.shipping_rates = defaultShippingRates;
    saveToFile('shipping_rates.json', defaultShippingRates);
  }

  if (persistedProducts.length > 0) {
    db.products = persistedProducts;
    db.product_images = persistedImages;
    db.product_variants = persistedVariants;
    return;
  }

  const initialProducts: {
    product: ProductRecord;
    images: string[];
    variants: {
      color: string;
      color_hex: string;
      size: string;
      stock: number;
    }[];
  }[] = [
    {
      product: {
        id: 'b1111111-1111-1111-1111-111111111111',
        name: 'تيشيرت Interlock Box Fit - أسود كربوني',
        slug: 'interlock-box-fit-black',
        description:
          'قصة بوكس فيت مستقيمة ومريحة للأكتاف والصدر تمنح مظهرًا متناسقًا وعصريًا. مصمم للاستخدام اليومي المستمر مع ياقة معززة تحافظ على تماسكها بعد الغسيل المتكرر.',
        fabric_details:
          'قطن مصري 100% ثقيل كثافة 240 جرام/م² (240 GSM) معالج ضد الانكماش بنسيج إنترلوك فائق النعومة.',
        price: 450,
        compare_at_price: 520,
        category_id:
          'a1111111-1111-1111-1111-111111111111',
        is_active: true,
        is_featured: true,
        is_new: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      images: [
        '/src/assets/images/product_boxfit_tee_black_1790342911897.jpg',
      ],
      variants: [
        {
          color: 'أسود كربوني',
          color_hex: '#333333',
          size: 'M',
          stock: 8,
        },
        {
          color: 'أسود كربوني',
          color_hex: '#333333',
          size: 'L',
          stock: 12,
        },
        {
          color: 'أسود كربوني',
          color_hex: '#333333',
          size: 'XL',
          stock: 6,
        },
        {
          color: 'أسود كربوني',
          color_hex: '#333333',
          size: '2XL',
          stock: 4,
        },
        {
          color: 'أوف وايت',
          color_hex: '#F5F5F0',
          size: 'M',
          stock: 5,
        },
        {
          color: 'أوف وايت',
          color_hex: '#F5F5F0',
          size: 'L',
          stock: 7,
        },
        {
          color: 'أوف وايت',
          color_hex: '#F5F5F0',
          size: 'XL',
          stock: 0,
        },
      ],
    },

    {
      product: {
        id: 'b2222222-2222-2222-2222-222222222222',
        name: 'تيشيرت Drop Shoulder Oversized - أوف وايت',
        slug: 'drop-shoulder-oversized-offwhite',
        description:
          'قصة أوفرسايز مع أكتاف منسدلة وأكمام واسعة تصل إلى الكوع. يعكس روح الشارع الكاجوال مع ثبات ممتاز للشكل وسلاسة في الحركة.',
        fabric_details:
          'قطن ميلتون صيفي فاخر 260 GSM ممشط، خيوط غزل مبروم متينة ومقاومة للوبرة.',
        price: 480,
        compare_at_price: 550,
        category_id:
          'a2222222-2222-2222-2222-222222222222',
        is_active: true,
        is_featured: true,
        is_new: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      images: [
        '/src/assets/images/product_oversized_tee_offwhite_1790342923739.jpg',
      ],
      variants: [
        {
          color: 'أوف وايت',
          color_hex: '#F5F5F0',
          size: 'M',
          stock: 10,
        },
        {
          color: 'أوف وايت',
          color_hex: '#F5F5F0',
          size: 'L',
          stock: 14,
        },
        {
          color: 'أوف وايت',
          color_hex: '#F5F5F0',
          size: 'XL',
          stock: 9,
        },
        {
          color: 'أوف وايت',
          color_hex: '#F5F5F0',
          size: '2XL',
          stock: 3,
        },
      ],
    },

    {
      product: {
        id: 'b3333333-3333-3333-3333-333333333333',
        name: 'بولو تريكو إنترلوك Boxy Fit - شاركول',
        slug: 'interlock-knit-polo-charcoal',
        description:
          'بولو بياقة ستريت وير مبسطة وقصة مربعة واسعة تناسب الخروج والجامعة والأمسيات.',
        fabric_details:
          'مزيج قطن إنترلوك محبوك 250 GSM ذو تهوية ممتازة ومرونة طبيعية وملمس بارد على الجسم.',
        price: 520,
        compare_at_price: 590,
        category_id:
          'a3333333-3333-3333-3333-333333333333',
        is_active: true,
        is_featured: true,
        is_new: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      images: [
        '/src/assets/images/product_interlock_polo_charcoal_1790342934447.jpg',
      ],
      variants: [
        {
          color: 'شاركول',
          color_hex: '#36454F',
          size: 'M',
          stock: 6,
        },
        {
          color: 'شاركول',
          color_hex: '#36454F',
          size: 'L',
          stock: 8,
        },
        {
          color: 'شاركول',
          color_hex: '#36454F',
          size: 'XL',
          stock: 5,
        },
        {
          color: 'شاركول',
          color_hex: '#36454F',
          size: '2XL',
          stock: 2,
        },
      ],
    },

    {
      product: {
        id: 'b4444444-4444-4444-4444-444444444444',
        name: 'قمصان ستريت وير بياقة كوبية - زيتي شاحب',
        slug: 'streetwear-resort-shirt-olive',
        description:
          'قميص صيفي واسع بياقة مفتوحة وأكمام نصفية، يمكن ارتداؤه مفتوحًا فوق تيشيرت بيسيك أو مغلقًا لمظهر ستريت وير أنيق.',
        fabric_details:
          'قطن تويل خفيف الوزن منسوج بنقشة بارزة وتهوية عالية مقاوم للتجعد السريع.',
        price: 580,
        compare_at_price: null,
        category_id:
          'a4444444-4444-4444-4444-444444444444',
        is_active: true,
        is_featured: true,
        is_new: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      images: [
        '/src/assets/images/product_streetwear_shirt_olive_1790342946975.jpg',
      ],
      variants: [
        {
          color: 'زيتي شاحب',
          color_hex: '#808000',
          size: 'M',
          stock: 4,
        },
        {
          color: 'زيتي شاحب',
          color_hex: '#808000',
          size: 'L',
          stock: 6,
        },
        {
          color: 'زيتي شاحب',
          color_hex: '#808000',
          size: 'XL',
          stock: 4,
        },
        {
          color: 'زيتي شاحب',
          color_hex: '#808000',
          size: '2XL',
          stock: 0,
        },
      ],
    },
  ];

  for (const item of initialProducts) {
    db.products.push(item.product);

    item.images.forEach((url, idx) => {
      db.product_images.push({
        id: `img_${item.product.id}_${idx}`,
        product_id: item.product.id,
        image_url: url,
        sort_order: idx,
        is_primary: idx === 0,
        created_at: new Date().toISOString(),
      });
    });

    item.variants.forEach((v, idx) => {
      db.product_variants.push({
        id: `var_${item.product.id}_${idx}`,
        product_id: item.product.id,
        color: v.color,
        color_hex: v.color_hex || '#333333',
        size: v.size,
        stock_quantity: v.stock,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
  }

  saveToFile('products.json', db.products);
  saveToFile('product_images.json', db.product_images);
  saveToFile('product_variants.json', db.product_variants);
  saveToFile('categories.json', db.categories);
}

initializeCatalog();

function generateOrderNumber(): string {
  const dateStr = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');

  const existingToday = db.orders.filter((o) =>
    o.order_number.startsWith(`OZ-${dateStr}`)
  ).length;

  const seq = String(1001 + existingToday).padStart(4, '0');

  return `OZ-${dateStr}-${seq}`;
}

// ==============================================================================
// Admin Authorization Middleware
// ==============================================================================

async function requireAdmin(
  req: Request,
  res: Response,
  next: express.NextFunction
) {
  const authHeader =
    req.headers.authorization;

  if (
    !authHeader ||
    !authHeader.startsWith(
      'Bearer '
    )
  ) {
    return res.status(401).json({
      error:
        'غير مصرح لك بالوصول. يرجى تسجيل الدخول كمسؤول.',
    });
  }

  const token =
    authHeader
      .slice(7)
      .trim();

  if (!token) {
    return res.status(401).json({
      error:
        'جلسة الدخول غير صالحة.',
    });
  }

  if (!supabaseClient) {
    return res.status(503).json({
      error:
        'خدمة المصادقة غير متاحة.',
    });
  }

  try {
    const {
      data: { user },
      error: authError,
    } =
      await supabaseClient.auth.getUser(
        token
      );

    if (
      authError ||
      !user?.email
    ) {
      return res.status(401).json({
        error:
          'جلسة الدخول غير صالحة.',
      });
    }

    const {
      data: adminRecord,
      error: adminError,
    } =
      await supabaseClient
        .from('admin_users')
        .select(
          'id, email'
        )
        .ilike(
          'email',
          user.email
        )
        .maybeSingle();

    if (adminError) {
      console.error(
        '[Admin Authorization] Supabase error:',
        adminError
      );

      return res.status(500).json({
        error:
          'تعذر التحقق من صلاحيات الأدمن.',
      });
    }

    if (!adminRecord) {
      return res.status(403).json({
        error:
          'غير مصرح لك بالوصول إلى لوحة التحكم.',
      });
    }

    (req as any).adminUser =
      adminRecord;

    return next();
  } catch (error) {
    console.error(
      '[Admin Authorization] Unexpected error:',
      error
    );

    return res.status(500).json({
      error:
        'حدث خطأ أثناء التحقق من صلاحيات الأدمن.',
    });
  }
}

// ==============================================================================
// API Endpoints
// ==============================================================================

// 1. Store Settings

app.get(
  '/api/settings',
  async (_req: Request, res: Response) => {
    if (supabaseClient) {
      const { data, error } =
        await supabaseClient
          .from('store_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

      if (!error && data) {
        return res.json(data);
      }
    }

    res.json(db.store_settings);
  }
);

// 1b. Shipping Rates per Governorate

app.get(
  '/api/shipping-rates',
  async (req: Request, res: Response) => {
    const includeInactive =
      req.query.all === 'true';

    // Inactive shipping rates are admin-only.
    if (includeInactive) {
      const authHeader =
        req.headers.authorization;

      if (
        !authHeader?.startsWith(
          'Bearer '
        )
      ) {
        return res.status(401).json({
          error:
            'غير مصرح لك بالوصول إلى أسعار الشحن غير النشطة.',
        });
      }

      const accessToken =
        authHeader
          .slice(7)
          .trim();

      if (
        !accessToken ||
        !supabaseClient
      ) {
        return res.status(401).json({
          error:
            'جلسة الأدمن غير صالحة.',
        });
      }

      try {
        const {
          data: {
            user,
          },
          error: authError,
        } =
          await supabaseClient.auth.getUser(
            accessToken
          );

        if (
          authError ||
          !user?.email
        ) {
          return res.status(401).json({
            error:
              'جلسة الأدمن غير صالحة.',
          });
        }

        const {
          data: adminRecord,
          error: adminError,
        } =
          await supabaseClient
            .from('admin_users')
            .select('id, email')
            .ilike(
              'email',
              user.email
            )
            .maybeSingle();

        if (adminError) {
          console.error(
            '[Shipping Rates Admin Auth] Supabase error:',
            adminError
          );

          return res.status(500).json({
            error:
              'تعذر التحقق من صلاحيات الأدمن.',
          });
        }

        if (!adminRecord) {
          return res.status(403).json({
            error:
              'غير مصرح لك بالوصول إلى أسعار الشحن غير النشطة.',
          });
        }
      } catch (authErr) {
        console.error(
          '[Shipping Rates Admin Auth] Unexpected error:',
          authErr
        );

        return res.status(500).json({
          error:
            'حدث خطأ أثناء التحقق من صلاحيات الأدمن.',
        });
      }
    }

    if (supabaseClient) {
      try {
        let query = supabaseClient
          .from('shipping_rates')
          .select('*')
          .order(
            'governorate',
            {
              ascending: true,
            }
          );

        if (!includeInactive) {
          query = query.eq(
            'is_active',
            true
          );
        }

        const {
          data,
          error,
        } = await query;

        if (error) {
          console.error(
            '[Shipping Rates] Supabase error:',
            error
          );

          return res.status(500).json({
            error:
              'تعذر جلب أسعار الشحن.',
          });
        }

        if (data) {
          return res.json(data);
        }
      } catch (err) {
        console.error(
          '[Shipping Rates] Query failed:',
          err
        );

        return res.status(500).json({
          error:
            'تعذر جلب أسعار الشحن.',
        });
      }
    }

    const rates = includeInactive
      ? db.shipping_rates
      : db.shipping_rates.filter(
          (r) => r.is_active
        );

    res.json(rates);
  }
);

// 1.1 Store Content CMS

app.get(
  '/api/content',
  async (_req: Request, res: Response) => {
    if (supabaseClient) {
      const { data, error } =
        await supabaseClient
          .from('store_content')
          .select('*')
          .limit(1)
          .maybeSingle();

      if (!error && data) {
        return res.json(data);
      }
    }

    res.json(db.store_content);
  }
);

app.put(
  '/api/admin/content',
  requireAdmin,
  async (req: Request, res: Response) => {
    const contentData = req.body;

    if (supabaseClient) {
      const { data, error } =
        await supabaseClient
          .from('store_content')
          .update({
            ...contentData,
            updated_at: new Date().toISOString(),
          })
          .neq(
            'id',
            '00000000-0000-0000-0000-000000000000'
          )
          .select()
          .single();

      if (!error && data) {
        db.store_content = data;
        saveToFile(
          'store_content.json',
          db.store_content
        );
        return res.json(data);
      }
    }

    db.store_content = {
      ...db.store_content,
      ...contentData,
      updated_at: new Date().toISOString(),
    };

    saveToFile(
      'store_content.json',
      db.store_content
    );

    res.json(db.store_content);
  }
);

// 1.2 Contact & Social Settings

app.get(
  '/api/contact-social',
  async (_req: Request, res: Response) => {
    if (supabaseClient) {
      const { data, error } =
        await supabaseClient
          .from('contact_social_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

      if (!error && data) {
        return res.json(data);
      }
    }

    res.json(db.contact_social);
  }
);

app.put(
  '/api/admin/contact-social',
  requireAdmin,
  async (req: Request, res: Response) => {
    const socialData = req.body;

    if (supabaseClient) {
      const { data, error } =
        await supabaseClient
          .from('contact_social_settings')
          .update({
            ...socialData,
            updated_at: new Date().toISOString(),
          })
          .neq(
            'id',
            '00000000-0000-0000-0000-000000000000'
          )
          .select()
          .single();

      if (!error && data) {
        db.contact_social = data;
        saveToFile(
          'contact_social.json',
          db.contact_social
        );
        return res.json(data);
      }
    }

    db.contact_social = {
      ...db.contact_social,
      ...socialData,
      updated_at: new Date().toISOString(),
    };

    saveToFile(
      'contact_social.json',
      db.contact_social
    );

    res.json(db.contact_social);
  }
);

// ==============================================================================

// ==============================================================================
// Hero Slider
// ==============================================================================

app.get(
  '/api/hero-slides',
  async (_req: Request, res: Response) => {
    if (!supabaseClient) {
      return res.json([]);
    }

    const { data, error } = await supabaseClient
      .from('hero_slides')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  }
);

app.get(
  '/api/admin/hero-slides',
  requireAdmin,
  async (_req: Request, res: Response) => {
    if (!supabaseClient) {
      return res.json([]);
    }

    const { data, error } = await supabaseClient
      .from('hero_slides')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  }
);

app.post(
  '/api/admin/hero-slides',
  requireAdmin,
  async (req: Request, res: Response) => {
    if (!supabaseClient) {
      return res.status(503).json({
        error: 'Supabase is not configured',
      });
    }

    const { data, error } = await supabaseClient
      .from('hero_slides')
      .insert(req.body)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  }
);

app.put(
  '/api/admin/hero-slides/:id',
  requireAdmin,
  async (req: Request, res: Response) => {
    if (!supabaseClient) {
      return res.status(503).json({
        error: 'Supabase is not configured',
      });
    }

    const { data, error } = await supabaseClient
      .from('hero_slides')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  }
);

app.delete(
  '/api/admin/hero-slides/:id',
  requireAdmin,
  async (req: Request, res: Response) => {
    if (!supabaseClient) {
      return res.status(503).json({
        error: 'Supabase is not configured',
      });
    }

    const { error } = await supabaseClient
      .from('hero_slides')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  }
);

app.post(
  '/api/admin/hero-slides/reorder',
  requireAdmin,
  async (req: Request, res: Response) => {
    if (!supabaseClient) {
      return res.status(503).json({
        error: 'Supabase is not configured',
      });
    }

    const slides = Array.isArray(req.body)
      ? req.body
      : req.body.slides;

    if (!Array.isArray(slides)) {
      return res.status(400).json({
        error: 'Invalid slides data',
      });
    }

    for (const slide of slides) {
      const { error } = await supabaseClient
        .from('hero_slides')
        .update({
          sort_order: slide.sort_order,
        })
        .eq('id', slide.id);

      if (error) {
        return res.status(500).json({
          error: error.message,
        });
      }
    }

    res.json({ success: true });
  }
);

// Categories
// ==============================================================================

app.get(
  '/api/categories',
  async (_req: Request, res: Response) => {
    if (supabaseClient) {
      const { data, error } =
        await supabaseClient
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('created_at', {
            ascending: true,
          });

      if (!error && data) {
        return res.json(data);
      }
    }

    res.json(
      db.categories.filter(
        (c) => c.is_active !== false
      )
    );
  }
);

app.get(
  '/api/admin/categories',
  requireAdmin,
  async (_req: Request, res: Response) => {
    if (supabaseClient) {
      const { data, error } =
        await supabaseClient
          .from('categories')
          .select('*')
          .order('created_at', {
            ascending: true,
          });

      if (!error && data) {
        return res.json(data);
      }
    }

    res.json(db.categories);
  }
);

app.post(
  '/api/admin/categories',
  requireAdmin,
  async (req: Request, res: Response) => {
    const { name, slug, image_url } =
      req.body;

    if (!name || !slug) {
      return res.status(400).json({
        error:
          'اسم القسم والرابط مطلوبان.',
      });
    }

    if (supabaseClient) {
      const { data, error } =
        await supabaseClient
          .from('categories')
          .insert({
            name,
            slug,
            image_url: image_url || null,
            is_active: true,
          })
          .select()
          .single();

      if (!error && data) {
        db.categories.push(data);

        saveToFile(
          'categories.json',
          db.categories
        );

        return res.status(201).json(data);
      }
    }

    const newCat: CategoryRecord = {
      id: `cat_${Date.now()}`,
      name,
      slug,
      image_url,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    db.categories.push(newCat);

    saveToFile(
      'categories.json',
      db.categories
    );

    res.status(201).json(newCat);
  }
);

app.put(
  '/api/admin/categories/:id',
  requireAdmin,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      name,
      slug,
      image_url,
      is_active,
    } = req.body;

    if (supabaseClient) {
      const { data, error } =
        await supabaseClient
          .from('categories')
          .update({
            name,
            slug,
            image_url,
            is_active:
              is_active !== undefined
                ? Boolean(is_active)
                : undefined,
          })
          .eq('id', id)
          .select()
          .single();

      if (!error && data) {
        const idx =
          db.categories.findIndex(
            (c) => c.id === id
          );

        if (idx > -1) {
          db.categories[idx] = data;
        }

        saveToFile(
          'categories.json',
          db.categories
        );

        return res.json(data);
      }
    }

    const cat = db.categories.find(
      (c) => c.id === id
    );

    if (!cat) {
      return res.status(404).json({
        error: 'القسم غير موجود.',
      });
    }

    cat.name = name ?? cat.name;
    cat.slug = slug ?? cat.slug;

    cat.image_url =
      image_url !== undefined
        ? image_url
        : cat.image_url;

    cat.is_active =
      is_active !== undefined
        ? Boolean(is_active)
        : cat.is_active;

    saveToFile(
      'categories.json',
      db.categories
    );

    res.json(cat);
  }
);

// Archive Category

app.post(
  '/api/admin/categories/:id/archive',
  requireAdmin,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (supabaseClient) {
      await supabaseClient
        .from('categories')
        .update({ is_active: false })
        .eq('id', id);
    }

    const cat = db.categories.find(
      (c) => c.id === id
    );

    if (cat) {
      cat.is_active = false;
    }

    saveToFile(
      'categories.json',
      db.categories
    );

    res.json({
      success: true,
      message: 'تم أرشفة القسم بنجاح.',
    });
  }
);

// Permanent Delete Category

app.delete(
  '/api/admin/categories/:id',
  requireAdmin,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (supabaseClient) {
      try {
        await supabaseClient
          .from('products')
          .update({ category_id: null })
          .eq('category_id', id);

        const { error } =
          await supabaseClient
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) {
          return res.status(400).json({
            error:
              error.message ||
              'فشل حذف القسم من Supabase.',
          });
        }
      } catch (err: any) {
        return res.status(500).json({
          error:
            err.message ||
            'خطأ أثناء حذف القسم.',
        });
      }
    }

    db.products.forEach((p) => {
      if (p.category_id === id) {
        p.category_id = '';
      }
    });

    saveToFile(
      'products.json',
      db.products
    );

    db.categories =
      db.categories.filter(
        (c) => c.id !== id
      );

    saveToFile(
      'categories.json',
      db.categories
    );

    res.json({
      success: true,
      message: 'تم حذف القسم بنجاح.',
    });
  }
);

// ==============================================================================
// Admin Login
// ==============================================================================

app.post(
  '/api/admin/login',
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        authorized: false,
        error:
          'يرجى إدخال البريد الإلكتروني وكلمة المرور.',
      });
    }

    const cleanEmail =
      email.toLowerCase().trim();

    if (!supabaseClient) {
      return res.status(503).json({
        authorized: false,
        error:
          'خدمة المصادقة غير متاحة.',
      });
    }

    try {
      const {
        data: authData,
        error: authErr,
      } =
        await supabaseClient.auth.signInWithPassword(
          {
            email: cleanEmail,
            password,
          }
        );

      if (
        authErr ||
        !authData?.user ||
        !authData.session?.access_token
      ) {
        return res.status(401).json({
          authorized: false,
          error:
            authErr?.message ===
            'Invalid login credentials'
              ? 'بيانات الدخول غير صحيحة (البريد الإلكتروني أو كلمة المرور خاطئة).'
              : authErr?.message ||
                'فشل التحقق من جلسة الدخول.',
        });
      }

      const {
        data: adminRecord,
        error: adminError,
      } =
        await supabaseClient
          .from('admin_users')
          .select(
            'id, email, created_at'
          )
          .ilike(
            'email',
            cleanEmail
          )
          .maybeSingle();

      if (adminError) {
        console.error(
          '[Admin Login] Supabase admin check error:',
          adminError
        );

        await supabaseClient.auth.signOut();

        return res.status(500).json({
          authorized: false,
          error:
            'تعذر التحقق من صلاحيات الأدمن.',
        });
      }

      if (!adminRecord) {
        await supabaseClient.auth.signOut();

        return res.status(403).json({
          authorized: false,
          error:
            'هذا الحساب غير مصرح له بالدخول إلى لوحة التحكم.',
        });
      }

      return res.json({
        authorized: true,
        email: adminRecord.email,
        token:
          authData.session.access_token,
      });
    } catch (err: any) {
      console.error(
        '[Admin Login] Unexpected error:',
        err
      );

      return res.status(500).json({
        authorized: false,
        error:
          err.message ||
          'حدث خطأ في الخادم.',
      });
    }
  }
);
// ==============================================================================
// Products
// ==============================================================================

app.get(
  '/api/products',
  async (req: Request, res: Response) => {
    const includeInactive =
      req.query.admin === 'true';

    // Admin-only access for inactive products.
    if (includeInactive) {
      const authHeader =
        req.headers.authorization;

      if (
        !authHeader?.startsWith(
          'Bearer '
        )
      ) {
        return res.status(401).json({
          error:
            'غير مصرح لك بالوصول إلى المنتجات غير النشطة.',
        });
      }

      const accessToken =
        authHeader
          .slice(7)
          .trim();

      if (
        !accessToken ||
        !supabaseClient
      ) {
        return res.status(401).json({
          error:
            'جلسة الأدمن غير صالحة.',
        });
      }

      try {
        const {
          data: {
            user,
          },
          error: authError,
        } =
          await supabaseClient.auth.getUser(
            accessToken
          );

        if (
          authError ||
          !user?.email
        ) {
          return res.status(401).json({
            error:
              'جلسة الأدمن غير صالحة.',
          });
        }

        const {
          data: adminRecord,
          error: adminError,
        } =
          await supabaseClient
            .from('admin_users')
            .select('id, email')
            .ilike(
              'email',
              user.email
            )
            .maybeSingle();

        if (adminError) {
          console.error(
            '[Products Admin Auth] Supabase error:',
            adminError
          );

          return res.status(500).json({
            error:
              'تعذر التحقق من صلاحيات الأدمن.',
          });
        }

        if (!adminRecord) {
          return res.status(403).json({
            error:
              'غير مصرح لك بالوصول إلى المنتجات غير النشطة.',
          });
        }
      } catch (authErr) {
        console.error(
          '[Products Admin Auth] Unexpected error:',
          authErr
        );

        return res.status(500).json({
          error:
            'حدث خطأ أثناء التحقق من صلاحيات الأدمن.',
        });
      }
    }

    if (supabaseClient) {
      let query = supabaseClient
        .from('products')
        .select(
          '*, category:categories(*), images:product_images(*), variants:product_variants(*)'
        );

      if (!includeInactive) {
        query = query.eq(
          'is_active',
          true
        );
      }

      const {
        data,
        error,
      } = await query.order(
        'created_at',
        {
          ascending: false,
        }
      );

      if (error) {
        console.error(
          '[Products] Supabase error:',
          error
        );

        return res.status(500).json({
          error:
            'تعذر جلب المنتجات.',
        });
      }

      if (data) {
        const enriched =
          data.map((p: any) => ({
            ...p,
            images: (
              p.images || []
            ).sort(
              (
                a: any,
                b: any
              ) =>
                (a.sort_order ?? 0) -
                (b.sort_order ?? 0)
            ),
          }));

        return res.json(
          enriched
        );
      }
    }

    const products =
      db.products
        .filter(
          (p) =>
            includeInactive ||
            p.is_active
        )
        .map((product) => {
          const category =
            db.categories.find(
              (c) =>
                c.id ===
                product.category_id
            );

          const images =
            db.product_images
              .filter(
                (img) =>
                  img.product_id ===
                  product.id
              )
              .sort(
                (a, b) =>
                  a.sort_order -
                  b.sort_order
              );

          const variants =
            db.product_variants.filter(
              (v) =>
                v.product_id ===
                product.id
            );

          return {
            ...product,
            category,
            images,
            variants,
          };
        });

    res.json(products);
  }
);

app.get(
  '/api/products/id/:id',
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (supabaseClient) {
      try {
        const { data, error } =
          await supabaseClient
            .from('products')
            .select(
              '*, category:categories(*), images:product_images(*), variants:product_variants(*)'
            )
            .eq('id', id)
            .maybeSingle();

        if (!error && data) {
          return res.json({
            ...data,
            images: (
              data.images || []
            ).sort(
              (
                a: any,
                b: any
              ) =>
                (a.sort_order ?? 0) -
                (b.sort_order ?? 0)
            ),
          });
        }
      } catch (err) {
        console.warn('Supabase product by id error:', err);
      }
    }

    const product =
      db.products.find(
        (p) => p.id === id
      );

    if (!product) {
      return res.status(404).json({
        error:
          'المنتج غير موجود',
      });
    }

    const category =
      db.categories.find(
        (c) =>
          c.id ===
          product.category_id
      );

    const images =
      db.product_images
        .filter(
          (img) =>
            img.product_id === product.id
        )
        .sort(
          (a, b) =>
            a.sort_order -
            b.sort_order
        );

    const variants =
      db.product_variants.filter(
        (v) =>
          v.product_id === product.id
      );

    res.json({
      ...product,
      category,
      images,
      variants,
    });
  }
);

// Product by Slug

app.get(
  '/api/products/:slug',
  async (req: Request, res: Response) => {
    let slug = String(req.params.slug || '');

    // Defensive: tolerate a slug that is still percent-encoded (double-encoded URLs).
    if (slug.includes('%')) {
      try {
        slug = decodeURIComponent(slug);
      } catch {
        // keep as-is
      }
    }

    if (supabaseClient) {
      const { data, error } =
        await supabaseClient
          .from('products')
          .select(
            '*, category:categories(*), images:product_images(*), variants:product_variants(*)'
          )
          .eq('slug', slug)
          .neq(
            'is_active',
            false
          )
          .maybeSingle();

      if (!error && data) {
        return res.json({
          ...data,
          images: (
            data.images || []
          ).sort(
            (
              a: any,
              b: any
            ) =>
              (a.sort_order ?? 0) -
              (b.sort_order ?? 0)
          ),
        });
      }
    }

    const product =
      db.products.find(
        (p) =>
          p.slug === slug &&
          p.is_active !== false
      );

    if (!product) {
      return res.status(404).json({
        error:
          'المنتج غير موجود',
      });
    }

    const category =
      db.categories.find(
        (c) =>
          c.id ===
          product.category_id
      );

    const images =
      db.product_images
        .filter(
          (img) =>
            img.product_id ===
            product.id
        )
        .sort(
          (a, b) =>
            a.sort_order -
            b.sort_order
        );

    const variants =
      db.product_variants.filter(
        (v) =>
          v.product_id ===
          product.id
      );

    res.json({
      ...product,
      category,
      images,
      variants,
    });
  }
);

// ==============================================================================
// SECURE GUEST ORDER CREATION
// ==============================================================================

app.post(
  '/api/orders',
  async (req: Request, res: Response) => {
    const {
      customer,
      items,
    } = req.body;

    if (
      !customer ||
      !customer.customer_name ||
      !customer.phone ||
      !customer.governorate ||
      !customer.city ||
      !customer.address
    ) {
      return res.status(400).json({
        error:
          'يرجى استكمال جميع بيانات العميل المطلوبة.',
      });
    }

    const cleanPhone =
      customer.phone.replace(
        /[\s-]/g,
        ''
      );

    const egyptPhoneRegex =
      /^(010|011|012|015)[0-9]{8}$/;

    const isEgyptNumber =
      egyptPhoneRegex.test(
        cleanPhone
      ) ||
      (
        cleanPhone.startsWith('+20') &&
        egyptPhoneRegex.test(
          '0' +
            cleanPhone.slice(3)
        )
      ) ||
      (
        cleanPhone.startsWith('20') &&
        cleanPhone.length === 12 &&
        egyptPhoneRegex.test(
          '0' +
            cleanPhone.slice(2)
        )
      );

    if (!isEgyptNumber) {
      return res.status(400).json({
        error:
          'يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678).',
      });
    }

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        error:
          'سلة المشتريات فارغة.',
      });
    }

    // Resolve authoritative product and category details for Telegram and order processing
    const enrichedItems = items.map((item: any) => {
      let productName = item.product_name || '';
      let categoryName = item.category_name || '';
      let color = item.color || '';
      let size = item.size || '';
      let unitPrice = Number(item.unit_price) || 0;

      // Authoritative lookup from memory/files
      const variant = db.product_variants.find(
        (v: any) => v.id === item.variant_id
      );
      const product = db.products.find(
        (p: any) => p.id === (item.product_id || variant?.product_id)
      );
      const category = product
        ? db.categories.find((c: any) => c.id === product.category_id)
        : null;

      if (product) {
        if (!productName) productName = product.name;
        if (!unitPrice) unitPrice = product.price;
      }
      if (category && !categoryName) {
        categoryName = category.name;
      }
      if (variant) {
        if (!color) color = variant.color;
        if (!size) size = variant.size;
      }

      const quantity = Number(item.quantity) || 1;
      const lineTotal = Number(item.line_total) || (unitPrice * quantity);

      return {
        ...item,
        product_name: productName || 'تيشيرت ستريت وير',
        category_name: categoryName || 'الملابس الرجالي',
        color: color || '-',
        size: size || '-',
        quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
      };
    });

    // ==========================================================================
// Supabase RPC
// ==========================================================================

if (supabaseClient) {
  try {
    const {
      data,
      error,
    } = await supabaseClient.rpc(
      'create_guest_order',
      {
        p_customer_name:
          customer.customer_name,
        p_phone:
          cleanPhone,
        p_governorate:
          customer.governorate,
        p_city:
          customer.city,
        p_address:
          customer.address,
        p_notes:
          customer.notes ||
          null,
        p_items:
          items,
      }
    );

    if (
      !error &&
      data &&
      data.success
    ) {
      const orderRecord: OrderRecord = {
        id:
          data.order_id ||
          `ord_${Date.now()}`,
        order_number:
          data.order_number,
        customer_name:
          customer.customer_name.trim(),
        phone:
          cleanPhone,
        governorate:
          customer.governorate,
        city:
          customer.city.trim(),
        address:
          customer.address.trim(),
        notes:
          customer.notes?.trim() ||
          null,
        subtotal:
          data.subtotal,
        shipping_fee:
          data.shipping_fee,
        total:
          data.total,
        status:
          'pending',
        created_at:
          new Date().toISOString(),
        updated_at:
          new Date().toISOString(),
      };

      db.orders.unshift(
        orderRecord
      );

      saveToFile(
        'orders.json',
        db.orders
      );

      // Customer Management: safely link and update customer history without blocking order
      await recordCustomerFromOrder(
        {
          id: (data as any)?.id || orderRecord.id,
          order_number: data.order_number,
          customer_name: customer.customer_name.trim(),
          phone: cleanPhone,
          created_at: (data as any)?.created_at || orderRecord.created_at,
        },
        db,
        saveToFile,
        supabaseClient
      );

      // IMPORTANT:
      // Await Telegram so the serverless function has time to complete
      // the notification before returning the response.
      await sendTelegramOrderNotification(
        {
          order_number:
            data.order_number,
          customer_name:
            customer.customer_name.trim(),
          phone:
            cleanPhone,
          governorate:
            customer.governorate,
          city:
            customer.city.trim(),
          address:
            customer.address.trim(),
          notes:
            customer.notes?.trim() ||
            null,
          subtotal:
            Number(
              data.subtotal
            ) || 0,
          shipping_fee:
            Number(
              data.shipping_fee
            ) || 0,
          total:
            Number(
              data.total
            ) || 0,
          items: enrichedItems,
        }
      );

      return res.json(data);
    }

    if (error) {
      const errMsg =
        error.message || '';

      if (
        errMsg.includes(
          'OZ_SHIPPING_GOVERNORATE_UNAVAILABLE'
        ) ||
        errMsg.includes(
          'OZ_SHIPPING_SETTINGS_MISSING'
        )
      ) {
        return res.status(400).json({
          error:
            'تعذر حساب تكلفة الشحن لهذه المحافظة حاليًا. يرجى المحاولة مرة أخرى.',
        });
      }

      if (
        errMsg.includes(
          'OZ_INSUFFICIENT_STOCK'
        )
      ) {
        return res.status(400).json({
          error:
            'عفواً، نفدت الكمية المطلوبة من بعض المنتجات في السلة.',
        });
      }

      console.warn(
        '[Orders] Supabase RPC notice, falling through to local database:',
        error.message
      );
    }
  } catch (rpcErr: any) {
    console.warn(
      '[Orders] Supabase RPC execution notice, falling through to local database:',
      rpcErr?.message || rpcErr
    );
  }
}
    // ==========================================================================
// Authoritative server-side stock & price verification
// ==========================================================================

let subtotal = 0;

const cleanGov = (customer.governorate || '').trim();

const rateRecord = (db.shipping_rates || []).find(
  (r) => r.governorate === cleanGov
);

if (!rateRecord) {
  return res.status(400).json({
    error:
      'تعذر حساب تكلفة الشحن لهذه المحافظة حاليًا. يرجى المحاولة مرة أخرى.',
  });
}

if (!rateRecord.is_active) {
  return res.status(400).json({
    error:
      'تعذر حساب تكلفة الشحن لهذه المحافظة حاليًا. يرجى المحاولة مرة أخرى.',
  });
}

const shippingFee = Number(rateRecord.shipping_fee);

const validatedItems: {
  variant: ProductVariantRecord;
  product: ProductRecord;
  quantity: number;
  unit_price: number;
  line_total: number;
}[] = [];

for (const item of items) {
  const qty = Number(item.quantity);

  if (!qty || qty <= 0) {
    return res.status(400).json({
      error:
        'الكمية المطلوبة غير صحيحة.',
    });
  }

  let variant =
    db.product_variants.find(
      (v) =>
        v.id === item.variant_id
    );

  if (
    !variant &&
    item.product_id
  ) {
    variant =
      db.product_variants.find(
        (v) =>
          v.product_id ===
            item.product_id &&
          v.color === item.color &&
          v.size === item.size
      );
  }

  if (!variant) {
    return res.status(400).json({
      error:
        'القطعة المحددة غير موجودة بالمخزون.',
    });
  }

  if (
    variant.stock_quantity <
    qty
  ) {
    return res.status(400).json({
      error: `عفوًا، المقاس واللون المطلوبين (${variant.color} - ${variant.size}) غير متوفرين بالكمية المطلوبة (المتاح: ${variant.stock_quantity}).`,
    });
  }

  const product =
    db.products.find(
      (p) =>
        p.id === variant.product_id &&
        p.is_active
    );

  if (!product) {
    return res.status(400).json({
      error:
        'المنتج غير متاح حاليًا.',
    });
  }

  const unitPrice =
    product.price;

  const lineTotal =
    unitPrice * qty;

  subtotal += lineTotal;

  validatedItems.push({
    variant,
    product,
    quantity: qty,
    unit_price: unitPrice,
    line_total: lineTotal,
  });
}

const total =
  subtotal + shippingFee;

const orderNumber =
  generateOrderNumber();

const orderId =
  `ord_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 7)}`;

const receiptToken =
  'rec_' +
  Math.random()
    .toString(36)
    .substring(2) +
  Date.now().toString(36);

const newOrder: OrderRecord = {
  id: orderId,
  order_number:
    orderNumber,
  receipt_token:
    receiptToken,
  customer_name:
    customer.customer_name.trim(),
  phone: cleanPhone,
  governorate:
    customer.governorate,
  city:
    customer.city.trim(),
  address:
    customer.address.trim(),
  notes:
    customer.notes?.trim() ||
    null,
  subtotal,
  shipping_fee:
    shippingFee,
  total,
  status: 'pending',
  created_at:
    new Date().toISOString(),
  updated_at:
    new Date().toISOString(),
};

db.orders.unshift(
  newOrder
);
    // ==========================================================================
    // Insert snapshot items + decrement inventory
    // ==========================================================================

    for (const val of validatedItems) {
      db.order_items.push({
        id:
          `item_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 7)}`,
        order_id:
          orderId,
        product_id:
          val.product.id,
        product_name_snapshot:
          val.product.name,
        color:
          val.variant.color,
        size:
          val.variant.size,
        quantity:
          val.quantity,
        unit_price:
          val.unit_price,
        line_total:
          val.line_total,
      });

      val.variant.stock_quantity -=
        val.quantity;

      val.variant.updated_at =
        new Date().toISOString();
    }

    // ==========================================================================
    // Audit history
    // ==========================================================================

    db.order_status_history.push(
      {
        id:
          `hist_${Date.now()}`,
        order_id:
          orderId,
        status: 'pending',
        created_at:
          new Date().toISOString(),
        changed_by:
          'guest_checkout',
      }
    );

    // ==========================================================================
    // Persist to disk immediately
    // ==========================================================================

    saveToFile(
      'orders.json',
      db.orders
    );

    saveToFile(
      'order_items.json',
      db.order_items
    );

    saveToFile(
      'order_status_history.json',
      db.order_status_history
    );

    saveToFile(
      'product_variants.json',
      db.product_variants
    );

    // Customer Management: safely link and update customer history without blocking order
    await recordCustomerFromOrder(
      {
        id: orderId,
        order_number: orderNumber,
        customer_name: customer.customer_name.trim(),
        phone: cleanPhone,
        created_at: newOrder.created_at,
      },
      db,
      saveToFile,
      supabaseClient
    );

    // ==========================================================================
    // Telegram Notification
    // ==========================================================================

    // IMPORTANT:
    // Await the request instead of using void.
    // The Telegram helper catches its own errors, so a Telegram failure
    // will NOT fail or rollback the customer's order.
    await sendTelegramOrderNotification(
      {
        order_number:
          orderNumber,
        customer_name:
          customer.customer_name.trim(),
        phone: cleanPhone,
        governorate:
          customer.governorate,
        city:
          customer.city.trim(),
        address:
          customer.address.trim(),
        notes:
          customer.notes?.trim() ||
          null,
        subtotal,
        shipping_fee:
          shippingFee,
        total,
        items:
          validatedItems.map(
            (val) => {
              const cat = val.product.category_id
                ? db.categories.find(
                    (c: any) =>
                      c.id ===
                      val.product
                        .category_id
                  )
                : null;

              return {
                product_name:
                  val.product.name,
                category_name:
                  cat?.name ||
                  'الملابس الرجالي',
                color:
                  val.variant.color,
                size:
                  val.variant.size,
                quantity:
                  val.quantity,
                unit_price:
                  val.unit_price,
                line_total:
                  val.line_total,
              };
            }
          ),
      }
    );

    return res.json({
      success: true,
      order_id:
        orderId,
      order_number:
        orderNumber,
      receipt_token:
        receiptToken,
      subtotal,
      shipping_fee:
        shippingFee,
      total,
    });
  }
);

// ==============================================================================
// Get Order Receipt
// ==============================================================================

app.get(
  '/api/orders/lookup/:orderNumber',
  async (req: Request, res: Response) => {
    const {
      orderNumber,
    } = req.params;

    const token =
      (req.query.t as string)
        ?.trim() || null;

    if (supabaseClient) {
      try {
        const {
          data,
          error,
        } =
          await supabaseClient.rpc(
            'get_guest_order_receipt',
            {
              p_order_number:
                orderNumber.trim(),
              p_receipt_token:
                token,
            }
          );

        if (!error && data) {
          return res.json(data);
        }
      } catch {
        // Continue to local lookup
      }
    }

    const order =
      db.orders.find(
        (o) =>
          o.order_number ===
          orderNumber.trim()
      );

    if (!order) {
      return res.status(404).json({
        error:
          'الطلب غير موجود.',
      });
    }

    const isAuthorized =
      Boolean(
        token &&
          order.receipt_token &&
          token ===
            order.receipt_token
      );

    if (
      !isAuthorized &&
      order.receipt_token
    ) {
      return res.json({
        order_number:
          order.order_number,
        status:
          order.status,
        created_at:
          order.created_at,
        has_full_access:
          false,
      });
    }

    const items =
      db.order_items.filter(
        (item) =>
          item.order_id ===
          order.id
      );

    res.json({
      ...order,
      has_full_access: true,
      order_items:
        items,
    });
  }
);

// ==============================================================================
// ADMIN: List Orders
// ==============================================================================

app.get(
  '/api/admin/orders',
  requireAdmin,
  async (req: Request, res: Response) => {
    const {
      status,
      search,
    } = req.query;

    let remoteOrders: any[] =
      [];

    if (supabaseClient) {
      try {
        let query =
          supabaseClient
            .from('orders')
            .select(
              '*, order_items(*)'
            )
            .order(
              'created_at',
              {
                ascending:
                  false,
              }
            );

        if (
          status &&
          status !== 'all'
        ) {
          query =
            query.eq(
              'status',
              status as string
            );
        }

        const {
          data,
          error,
        } = await query;

        if (
          !error &&
          data &&
          data.length > 0
        ) {
          remoteOrders =
            data;
        }
      } catch (err) {
        console.warn(
          'Supabase orders fetch warning:',
          err
        );
      }
    }

    const combinedMap =
      new Map<string, any>();

    for (const o of db.orders) {
      combinedMap.set(
        o.order_number,
        {
          ...o,
          order_items:
            db.order_items.filter(
              (item) =>
                item.order_id ===
                o.id
            ),
        }
      );
    }

    for (const ro of remoteOrders) {
      combinedMap.set(
        ro.order_number,
        ro
      );
    }

    let results =
      Array.from(
        combinedMap.values()
      );

    results.sort(
      (a, b) =>
        new Date(
          b.created_at
        ).getTime() -
        new Date(
          a.created_at
        ).getTime()
    );

    if (
      status &&
      status !== 'all'
    ) {
      results =
        results.filter(
          (o) =>
            o.status ===
            status
        );
    }

    if (search) {
      const term =
        (
          search as string
        )
          .toLowerCase()
          .trim();

      results =
        results.filter(
          (o) =>
            o.order_number
              ?.toLowerCase()
              .includes(term) ||
            o.customer_name
              ?.toLowerCase()
              .includes(term) ||
            o.phone?.includes(
              term
            ) ||
            o.city
              ?.toLowerCase()
              .includes(term) ||
            o.governorate
              ?.toLowerCase()
              .includes(term)
        );
    }

    res.json(results);
  }
);

// ==============================================================================
// ADMIN: Single Order
// ==============================================================================

app.get(
  '/api/admin/orders/:id',
  requireAdmin,
  async (req: Request, res: Response) => {
    const { id } =
      req.params;

    if (supabaseClient) {
      try {
        const {
          data,
          error,
        } =
          await supabaseClient
            .from('orders')
            .select(
              '*, order_items(*)'
            )
            .or(
              `id.eq.${id},order_number.eq.${id}`
            )
            .maybeSingle();

        if (
          !error &&
          data
        ) {
          return res.json(
            data
          );
        }
      } catch {
        // Continue to local lookup
      }
    }

    const order =
      db.orders.find(
        (o) =>
          o.id === id ||
          o.order_number ===
            id
      );

    if (!order) {
      return res.status(404).json({
        error:
          'الطلب غير موجود.',
      });
    }

    const items =
      db.order_items.filter(
        (item) =>
          item.order_id ===
          order.id
      );

    res.json({
      ...order,
      order_items:
        items,
    });
  }
);

// ==============================================================================
// ADMIN: Update Order Status
// ==============================================================================

app.patch(
  '/api/admin/orders/:id/status',
  requireAdmin,
  async (req: Request, res: Response) => {
    const { id } =
      req.params;

    const {
      status,
      changed_by,
    } = req.body;

    const validStatuses = [
      'pending',
      'confirmed',
      'shipped',
      'delivered',
      'cancelled',
    ];

    if (
      !validStatuses.includes(
        status
      )
    ) {
      return res.status(400).json({
        error:
          'حالة الطلب غير صالحة.',
      });
    }

    if (supabaseClient) {
      try {
        const {
          data: updatedOrder,
          error: updateErr,
        } =
          await supabaseClient
            .from('orders')
            .update({
              status,
              updated_at:
                new Date().toISOString(),
            })
            .or(
              `id.eq.${id},order_number.eq.${id}`
            )
            .select(
              '*, order_items(*)'
            )
            .single();

        if (
          !updateErr &&
          updatedOrder
        ) {
          await supabaseClient
            .from(
              'order_status_history'
            )
            .insert({
              order_id:
                updatedOrder.id,
              status,
              changed_by:
                changed_by ||
                'admin',
            });

          const idx =
            db.orders.findIndex(
              (o) =>
                o.id ===
                  updatedOrder.id ||
                o.order_number ===
                  updatedOrder.order_number
            );

          if (idx > -1) {
            db.orders[idx].status =
              status;
          }

          saveToFile(
            'orders.json',
            db.orders
          );

          return res.json(
            updatedOrder
          );
        }
      } catch (err) {
        console.warn(
          'Supabase status update warning:',
          err
        );
      }
    }

    const order =
      db.orders.find(
        (o) =>
          o.id === id ||
          o.order_number ===
            id
      );

    if (!order) {
      return res.status(404).json({
        error:
          'الطلب غير موجود.',
      });
    }

    order.status =
      status;

    order.updated_at =
      new Date().toISOString();

    db.order_status_history.push(
      {
        id:
          `hist_${Date.now()}`,
        order_id:
          order.id,
        status,
        created_at:
          new Date().toISOString(),
        changed_by:
          changed_by ||
          'admin',
      }
    );

    saveToFile(
      'orders.json',
      db.orders
    );

    saveToFile(
      'order_status_history.json',
      db.order_status_history
    );

    const items =
      db.order_items.filter(
        (item) =>
          item.order_id ===
          order.id
      );

    res.json({
      ...order,
      order_items:
        items,
    });
  }
);

// ==============================================================================
// ADMIN: Delete Order
// ==============================================================================

app.delete(
  '/api/admin/orders/:id',
  requireAdmin,
  async (req: Request, res: Response) => {
    const { id } =
      req.params;

    let targetOrderId =
      id;

    let targetOrderNumber =
      id;

    const localOrder =
      db.orders.find(
        (o) =>
          o.id === id ||
          o.order_number ===
            id
      );

    if (localOrder) {
      targetOrderId =
        localOrder.id;

      targetOrderNumber =
        localOrder.order_number;
    }

    if (supabaseClient) {
      try {
        const {
          data: remoteOrder,
        } =
          await supabaseClient
            .from('orders')
            .select(
              'id, order_number'
            )
            .or(
              `id.eq.${id},order_number.eq.${id}`
            )
            .maybeSingle();

        if (remoteOrder) {
          targetOrderId =
            remoteOrder.id;

          targetOrderNumber =
            remoteOrder.order_number;
        }

        await supabaseClient
          .from(
            'order_status_history'
          )
          .delete()
          .eq(
            'order_id',
            targetOrderId
          );

        await supabaseClient
          .from(
            'order_items'
          )
          .delete()
          .eq(
            'order_id',
            targetOrderId
          );

        const {
          error: delErr,
        } =
          await supabaseClient
            .from('orders')
            .delete()
            .or(
              `id.eq.${targetOrderId},order_number.eq.${targetOrderNumber}`
            );

        if (delErr) {
          console.warn(
            'Supabase order delete warning:',
            delErr
          );
        }
      } catch (err) {
        console.warn(
          'Supabase order delete error:',
          err
        );
      }
    }

    db.orders =
      db.orders.filter(
        (o) =>
          o.id !==
            targetOrderId &&
          o.order_number !==
            targetOrderNumber &&
          o.id !== id &&
          o.order_number !==
            id
      );

    db.order_items =
      db.order_items.filter(
        (item) =>
          item.order_id !==
            targetOrderId &&
          item.order_id !== id
      );

    db.order_status_history =
      db.order_status_history.filter(
        (hist) =>
          hist.order_id !==
            targetOrderId &&
          hist.order_id !== id
      );

    saveToFile(
      'orders.json',
      db.orders
    );

    saveToFile(
      'order_items.json',
      db.order_items
    );

    saveToFile(
      'order_status_history.json',
      db.order_status_history
    );

    res.json({
      success: true,
      message:
        'تم حذف الطلب بنجاح',
      deletedOrderId:
        targetOrderId,
    });
  }
);

// ==============================================================================
// ADMIN: Product Management
// ==============================================================================

app.post(
  '/api/admin/products',
  requireAdmin,
  async (req: Request, res: Response) => {
    const {
      name,
      slug,
      description,
      fabric_details,
      price,
      compare_at_price,
      category_id,
      is_active,
      is_featured,
      is_new,
      images,
      variants,
    } = req.body;

    if (
      !name ||
      !slug ||
      price === undefined
    ) {
      return res.status(400).json({
        error:
          'اسم المنتج، الرابط (slug)، والسعر حقول مطلوبة.',
      });
    }

    if (supabaseClient) {
      try {
        const {
          data: newProd,
          error: prodErr,
        } =
          await supabaseClient
            .from('products')
            .insert({
              name,
              slug,
              description:
                description || '',
              fabric_details:
                fabric_details ||
                '',
              price:
                Number(price),
              compare_at_price:
                compare_at_price
                  ? Number(
                      compare_at_price
                    )
                  : null,
              category_id:
                category_id ||
                null,
              is_active:
                is_active ??
                true,
              is_featured:
                is_featured ??
                false,
              is_new:
                is_new ??
                false,
            })
            .select()
            .single();

        if (
          !prodErr &&
          newProd
        ) {
          if (
            Array.isArray(
              images
            ) &&
            images.length > 0
          ) {
            await supabaseClient
              .from(
                'product_images'
              )
              .insert(
                images.map(
                  (
                    img: any,
                    idx: number
                  ) => ({
                    product_id:
                      newProd.id,
                    image_url:
                      img.image_url,
                    sort_order:
                      idx,
                    is_primary:
                      idx === 0 ||
                      img.is_primary,
                  })
                )
              );
          }

          if (
            Array.isArray(
              variants
            ) &&
            variants.length > 0
          ) {
            await supabaseClient
              .from(
                'product_variants'
              )
              .insert(
                variants.map(
                  (v: any) => ({
                    product_id:
                      newProd.id,
                    color:
                      v.color,
                    color_hex:
                      v.color_hex ||
                      '#333333',
                    size:
                      v.size,
                    stock_quantity:
                      Number(
                        v.stock_quantity
                      ) || 0,
                  })
                )
              );
          }

          db.products.unshift(
            newProd
          );

          saveToFile(
            'products.json',
            db.products
          );

          return res
            .status(201)
            .json(
              newProd
            );
        }
      } catch (err) {
        console.warn(
          'Supabase product create warning:',
          err
        );
      }
    }

    const productId =
      `prod_${Date.now()}`;

    const newProduct: ProductRecord =
      {
        id: productId,
        name,
        slug,
        description:
          description || '',
        fabric_details:
          fabric_details ||
          '',
        price:
          Number(price),
        compare_at_price:
          compare_at_price
            ? Number(
                compare_at_price
              )
            : null,
        category_id,
        is_active:
          is_active ?? true,
        is_featured:
          is_featured ??
          false,
        is_new:
          is_new ?? false,
        created_at:
          new Date().toISOString(),
        updated_at:
          new Date().toISOString(),
      };

    db.products.unshift(
      newProduct
    );

    if (
      Array.isArray(images)
    ) {
      images.forEach(
        (
          img: any,
          idx: number
        ) => {
          db.product_images.push(
            {
              id:
                `img_${Date.now()}_${idx}`,
              product_id:
                productId,
              image_url:
                img.image_url,
              sort_order:
                idx,
              is_primary:
                idx === 0 ||
                img.is_primary,
              created_at:
                new Date().toISOString(),
            }
          );
        }
      );
    }

    if (
      Array.isArray(variants)
    ) {
      variants.forEach(
        (
          v: any,
          idx: number
        ) => {
          db.product_variants.push(
            {
              id:
                `var_${Date.now()}_${idx}`,
              product_id:
                productId,
              color:
                v.color,
              color_hex:
                v.color_hex ||
                '#333333',
              image_url:
                v.image_url ||
                null,
              size:
                v.size,
              stock_quantity:
                Number(
                  v.stock_quantity
                ) || 0,
              created_at:
                new Date().toISOString(),
              updated_at:
                new Date().toISOString(),
            }
          );
        }
      );
    }

    saveToFile(
      'products.json',
      db.products
    );

    saveToFile(
      'product_images.json',
      db.product_images
    );

    saveToFile(
      'product_variants.json',
      db.product_variants
    );

    res
      .status(201)
      .json(newProduct);
  }
);

app.put(
  '/api/admin/products/:id',
  requireAdmin,
  async (req: Request, res: Response) => {
    const { id } =
      req.params;

    const {
      name,
      slug,
      description,
      fabric_details,
      price,
      compare_at_price,
      category_id,
      is_active,
      is_featured,
      is_new,
      images,
      variants,
    } = req.body;

    if (supabaseClient) {
      try {
        const {
          data: updatedProd,
          error: prodErr,
        } =
          await supabaseClient
            .from('products')
            .update({
              name,
              slug,
              description,
              fabric_details,
              price:
                price !== undefined
                  ? Number(price)
                  : undefined,
              compare_at_price:
                compare_at_price !==
                undefined
                  ? compare_at_price
                    ? Number(
                        compare_at_price
                      )
                    : null
                  : undefined,
              category_id:
                category_id || null,
              is_active:
                is_active !==
                undefined
                  ? Boolean(
                      is_active
                    )
                  : undefined,
              is_featured:
                is_featured !==
                undefined
                  ? Boolean(
                      is_featured
                    )
                  : undefined,
              is_new:
                is_new !==
                undefined
                  ? Boolean(is_new)
                  : undefined,
              updated_at:
                new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (
          !prodErr &&
          updatedProd
        ) {
          if (
            Array.isArray(
              images
            )
          ) {
            await supabaseClient
              .from(
                'product_images'
              )
              .delete()
              .eq(
                'product_id',
                id
              );

            if (
              images.length >
              0
            ) {
              await supabaseClient
                .from(
                  'product_images'
                )
                .insert(
                  images.map(
                    (
                      img: any,
                      idx: number
                    ) => ({
                      product_id:
                        id,
                      image_url:
                        img.image_url,
                      sort_order:
                        idx,
                      is_primary:
                        idx === 0 ||
                        img.is_primary,
                    })
                  )
                );
            }
          }

          if (Array.isArray(variants)) {
            const { error: variantsDeleteError } = await supabaseClient
              .from('product_variants')
              .delete()
              .eq('product_id', id);

            if (variantsDeleteError) {
              throw variantsDeleteError;
            }

            if (variants.length > 0) {
              const { error: variantsInsertError } = await supabaseClient
                .from('product_variants')
                .insert(
                  variants.map((v: any) => ({
                    product_id: id,
                    color: v.color,
                    size: v.size,
                    stock_quantity: Number(v.stock_quantity) || 0,
                  }))
                );

              if (variantsInsertError) {
                throw variantsInsertError;
              }
            }
          }

          const pIdx =
            db.products.findIndex(
              (p) =>
                p.id === id
            );

          if (pIdx > -1) {
            db.products[
              pIdx
            ] =
              updatedProd;
          }

          saveToFile(
            'products.json',
            db.products
          );

          return res.json(
            updatedProd
          );
        }
      } catch (err) {
        console.warn(
          'Supabase product update warning:',
          err
        );
      }
    }

    const product =
      db.products.find(
        (p) =>
          p.id === id
      );

    if (!product) {
      return res.status(404).json({
        error:
          'المنتج غير موجود.',
      });
    }

    product.name =
      name ?? product.name;

    product.slug =
      slug ?? product.slug;

    product.description =
      description ??
      product.description;

    product.fabric_details =
      fabric_details ??
      product.fabric_details;

    product.price =
      price !== undefined
        ? Number(price)
        : product.price;

    product.compare_at_price =
      compare_at_price !==
      undefined
        ? compare_at_price
          ? Number(
              compare_at_price
            )
          : null
        : product.compare_at_price;

    product.category_id =
      category_id ??
      product.category_id;

    product.is_active =
      is_active !==
      undefined
        ? Boolean(
            is_active
          )
        : product.is_active;

    product.is_featured =
      is_featured !==
      undefined
        ? Boolean(
            is_featured
          )
        : product.is_featured;

    product.is_new =
      is_new !==
      undefined
        ? Boolean(
            is_new
          )
        : product.is_new;

    product.updated_at =
      new Date().toISOString();

    if (
      Array.isArray(images)
    ) {
      db.product_images =
        db.product_images.filter(
          (img) =>
            img.product_id !==
            id
        );

      images.forEach(
        (
          img: any,
          idx: number
        ) => {
          db.product_images.push(
            {
              id:
                img.id ||
                `img_${Date.now()}_${idx}`,
              product_id:
                id,
              image_url:
                img.image_url,
              sort_order:
                idx,
              is_primary:
                idx === 0 ||
                img.is_primary,
              created_at:
                new Date().toISOString(),
            }
          );
        }
      );
    }

    if (
      Array.isArray(
        variants
      )
    ) {
      db.product_variants =
        db.product_variants.filter(
          (v) =>
            v.product_id !==
            id
        );

      variants.forEach(
        (
          v: any,
          idx: number
        ) => {
          db.product_variants.push(
            {
              id:
                v.id ||
                `var_${Date.now()}_${idx}`,
              product_id:
                id,
              color:
                v.color,
              color_hex:
                v.color_hex ||
                '#333333',
              image_url:
                v.image_url ||
                null,
              size:
                v.size,
              stock_quantity:
                Number(
                  v.stock_quantity
                ) || 0,
              created_at:
                new Date().toISOString(),
              updated_at:
                new Date().toISOString(),
            }
          );
        }
      );
    }

    saveToFile(
      'products.json',
      db.products
    );

    saveToFile(
      'product_images.json',
      db.product_images
    );

    saveToFile(
      'product_variants.json',
      db.product_variants
    );

    res.json(product);
  }
);

// ==============================================================================
// Archive Product
// ==============================================================================

app.post(
  '/api/admin/products/:id/archive',
  requireAdmin,
  async (req: Request, res: Response) => {
    const { id } =
      req.params;

    if (supabaseClient) {
      try {
        await supabaseClient
          .from('products')
          .update({
            is_active: false,
            updated_at:
              new Date().toISOString(),
          })
          .eq('id', id);
      } catch {}
    }

    const product =
      db.products.find(
        (p) =>
          p.id === id
      );

    if (!product) {
      return res.status(404).json({
        error:
          'المنتج غير موجود.',
      });
    }

    product.is_active =
      false;

    product.updated_at =
      new Date().toISOString();

    saveToFile(
      'products.json',
      db.products
    );

    res.json({
      success: true,
      message:
        'تم أرشفة المنتج بنجاح.',
    });
  }
);

// ==============================================================================
// Permanent Delete Product
// ==============================================================================

app.delete(
  '/api/admin/products/:id',
  requireAdmin,
  async (req: Request, res: Response) => {
    const { id } =
      req.params;

    if (supabaseClient) {
      try {
        const {
          error,
        } =
          await supabaseClient
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
          return res.status(400).json({
            error:
              error.message ||
              'فشل حذف المنتج من Supabase.',
          });
        }
      } catch (err: any) {
        return res.status(500).json({
          error:
            err.message ||
            'خطأ أثناء حذف المنتج.',
        });
      }
    }

    db.order_items.forEach(
      (item) => {
        if (
          item.product_id ===
          id
        ) {
          item.product_id =
            null;
        }
      }
    );

    saveToFile(
      'order_items.json',
      db.order_items
    );

    db.product_images =
      db.product_images.filter(
        (img) =>
          img.product_id !==
          id
      );

    db.product_variants =
      db.product_variants.filter(
        (v) =>
          v.product_id !==
          id
      );

    db.products =
      db.products.filter(
        (p) =>
          p.id !== id
      );

    saveToFile(
      'product_images.json',
      db.product_images
    );

    saveToFile(
      'product_variants.json',
      db.product_variants
    );

    saveToFile(
      'products.json',
      db.products
    );

    res.json({
      success: true,
      message:
        'تم حذف المنتج بنجاح.',
    });
  }
);

// ==============================================================================
// Delete Variant
// ==============================================================================

app.delete(
  '/api/admin/variants/:id',
  requireAdmin,
  async (req: Request, res: Response) => {
    const { id } =
      req.params;

    if (supabaseClient) {
      try {
        const {
          error,
        } =
          await supabaseClient
            .from(
              'product_variants'
            )
            .delete()
            .eq('id', id);

        if (error) {
          return res.status(400).json({
            error:
              error.message ||
              'فشل حذف المتغير.',
          });
        }
      } catch (err: any) {
        return res.status(500).json({
          error:
            err.message ||
            'خطأ أثناء حذف المتغير.',
        });
      }
    }

    db.product_variants =
      db.product_variants.filter(
        (v) =>
          v.id !== id
      );

    saveToFile(
      'product_variants.json',
      db.product_variants
    );

    res.json({
      success: true,
      message:
        'تم حذف المتغير بنجاح.',
    });
  }
);

// ==============================================================================
// System Health
// ==============================================================================

app.get(
  '/api/health',
  (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      brand: 'Outfit Zone',
      supabaseConnected:
        hasSupabase,
      supabaseUrlConfigured:
        Boolean(
          supabaseUrl
        ),
      telegramConfigured:
        Boolean(
          process.env.TELEGRAM_BOT_TOKEN?.trim() &&
          process.env.TELEGRAM_CHAT_ID?.trim()
        ),
      ordersCount:
        db.orders.length,
      customersCount:
        db.customers.length,
      timestamp:
        new Date().toISOString(),
    });
  }
);

// ==============================================================================
// Telegram Webhook & Customer Management Routes
// ==============================================================================

app.post(
  ['/api/telegram-webhook', '/api/telegram/webhook'],
  async (req: Request, res: Response) => {
    // Immediate 200 response to acknowledge receipt to Telegram
    res.status(200).json({ ok: true });

    try {
      const update = req.body;
      if (!update) return;
      await handleTelegramUpdate(update, db);
    } catch (err) {
      console.error('[Telegram Webhook] Error processing update:', err);
    }
  }
);

app.get(
  '/api/telegram/webhook-info',
  async (_req: Request, res: Response) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
    if (!botToken) {
      return res.status(400).json({
        error: 'TELEGRAM_BOT_TOKEN is not configured.',
      });
    }

    try {
      const [meRes, whRes] = await Promise.all([
        fetch(`https://api.telegram.org/bot${botToken}/getMe`).then((r) => r.json()),
        fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`).then((r) => r.json()),
      ]);

      res.json({
        bot: meRes,
        webhook: whRes,
        adminUserIds: getTelegramAdminUserIds(),
        customersCount: db.customers.length,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.post(
  '/api/telegram/set-webhook',
  requireAdmin,
  async (req: Request, res: Response) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
    if (!botToken) {
      return res.status(400).json({
        error: 'TELEGRAM_BOT_TOKEN is not configured.',
      });
    }

    const { url } = req.body;
    if (!url) {
      return res.status(400).json({
        error: 'url is required in request body.',
      });
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          drop_pending_updates: false,
          allowed_updates: ['message', 'callback_query'],
        }),
      }).then((r) => r.json());

      res.json(response);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Admin Customer Management API endpoints
app.get(
  '/api/admin/customers',
  requireAdmin,
  async (_req: Request, res: Response) => {
    try {
      const customersWithStats = db.customers.map((c) => {
        const matchingOrders = db.orders.filter(
          (o) => (o as any).customer_id === c.id || normalizePhone(o.phone) === c.normalized_phone
        );
        return {
          ...c,
          actual_orders_count: matchingOrders.length || c.order_count || 1,
        };
      });

      res.json({
        total: customersWithStats.length,
        customers: customersWithStats,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.get(
  '/api/admin/customers/:identifier',
  requireAdmin,
  async (req: Request, res: Response) => {
    const { identifier } = req.params;
    const normalized = normalizePhone(identifier);

    const customer = db.customers.find(
      (c) =>
        c.id === identifier ||
        c.normalized_phone === normalized ||
        c.original_phone === identifier
    );

    if (!customer) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    const orders = db.orders.filter(
      (o) => (o as any).customer_id === customer.id || normalizePhone(o.phone) === customer.normalized_phone
    );

    res.json({
      customer,
      orders,
    });
  }
);

// ==============================================================================
// Vite Dev Server / Static Hosting
// ==============================================================================

async function startServer() {
  if (!isProduction) {
    const { createServer } =
      await import('vite');

    const vite =
      await createServer({
        server: {
          middlewareMode: true,
        },
        appType: 'spa',
      });

    app.use(
      vite.middlewares
    );
  } else {
    app.use(
      express.static(
        path.join(
          __dirname,
          'dist'
        )
      )
    );

    app.get(
      '*',
      (_req: Request, res: Response) => {
        res.sendFile(
          path.join(
            __dirname,
            'dist',
            'index.html'
          )
        );
      }
    );
  }

  // On Vercel the exported app is invoked per request; binding a port is only for
  // local development and self-hosted production.
  if (!process.env.VERCEL) {
    app.listen(
      PORT,
      () => {
        console.log(
          `[Outfit Zone] Server running on port ${PORT} (Production: ${isProduction})`
        );
      }
    );
  }
}

startServer();

export default app;

// ==============================================================================
// Telegram Order Notifications
// ==============================================================================

async function sendTelegramOrderNotification(order: {
  order_number: string;
  customer_name: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
  notes?: string | null;
  subtotal: number;
  shipping_fee: number;
  total: number;
  items?: any[];
}) {
  const botToken =
    process.env.TELEGRAM_BOT_TOKEN?.trim();

  const chatId =
    process.env.TELEGRAM_CHAT_ID?.trim();

  if (!botToken || !chatId) {
    console.warn(
      '[Telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID. Notification skipped.'
    );
    return;
  }

  const itemsText =
    (order.items || [])
      .map(
        (
          item: any,
          index: number
        ) => {
          const productName =
            item.product_name ||
            item.product_name_snapshot ||
            item.name ||
            'منتج Outfit Zone';

          const category =
            item.category_name ||
            item.category ||
            'ملابس ستريت وير';

          const color =
            item.color || '-';

          const size =
            item.size || '-';

          const quantity =
            Number(
              item.quantity
            ) || 1;

          const unitPrice =
            Number(
              item.unit_price
            ) || 0;

          const lineTotal =
            Number(
              item.line_total
            ) || (unitPrice * quantity);

          return [
            `• ${productName}`,
            `  القسم: ${category}`,
            `  اللون: ${color}`,
            `  المقاس: ${size}`,
            `  الكمية: ${quantity}`,
            `  السعر: ${unitPrice} جنيه`,
            `  الإجمالي: ${lineTotal} جنيه`,
          ].join('\n');
        }
      )
      .join('\n\n');

  const message = [
    '🔔 طلب جديد - Outfit Zone',
    '',
    `📦 رقم الطلب: ${order.order_number}`,
    '',
    `👤 العميل: ${order.customer_name}`,
    `📱 الهاتف: ${order.phone}`,
    `📍 المحافظة: ${order.governorate}`,
    `🏙️ المدينة: ${order.city}`,
    `🏠 العنوان: ${order.address}`,
    order.notes
      ? `📝 ملاحظات: ${order.notes}`
      : null,
    '',
    '🛍️ المنتجات:',
    itemsText ||
      'لا توجد تفاصيل منتجات متاحة.',
    '',
    `💰 المجموع: ${Number(
      order.subtotal
    ).toFixed(2)} جنيه`,
    `🚚 الشحن: ${Number(
      order.shipping_fee
    ).toFixed(2)} جنيه`,
    `💵 الإجمالي: ${Number(
      order.total
    ).toFixed(2)} جنيه`,
    '',
    '💳 الدفع: عند الاستلام',
    '⏳ الحالة: قيد المراجعة',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const telegramUrl =
      `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response =
      await fetch(
        telegramUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
          }),
        }
      );

    if (!response.ok) {
      const errorText =
        await response
          .text()
          .catch(() => '');

      console.warn(
        `[Telegram] Failed to send order notification (${response.status}): ${errorText}`
      );

      return;
    }

    console.log(
      `[Telegram] Order notification sent for ${order.order_number}`
    );
  } catch (error) {
    console.warn(
      '[Telegram] Notification error:',
      error
    );
  }
}