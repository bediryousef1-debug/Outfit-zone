export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  name_en?: string;
  slug: string;
  image_url?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
  created_at?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  color: string;
  color_hex: string;
  size: 'M' | 'L' | 'XL' | '2XL' | '3XL' | string;
  stock_quantity: number;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HeroSlide {
  id: string;
  tag_ar?: string;
  tag_en?: string;
  title_line1_ar: string;
  title_line1_en?: string;
  title_line2_ar: string;
  title_line2_en?: string;
  subtitle_ar: string;
  subtitle_en?: string;
  description_ar: string;
  description_en?: string;
  button_text_ar: string;
  button_text_en?: string;
  button_link: string;
  image_url: string;
  badge_top_ar?: string;
  badge_top_en?: string;
  badge_bottom_ar?: string;
  badge_bottom_en?: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  normalized_phone: string;
  original_phone: string;
  names_used: string[];
  has_multiple_names: boolean;
  order_count: number;
  last_order_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  name_en?: string;
  slug: string;
  description: string;
  description_en?: string;
  fabric_details: string;
  fabric_details_en?: string;
  price: number;
  compare_at_price: number | null;
  category_id: string;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  created_at?: string;
  updated_at?: string;
  category?: Category;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name_snapshot: string;
  color: string;
  size: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  created_at: string;
  changed_by: string;
}

export interface Order {
  id: string;
  order_number: string;
  receipt_token?: string;
  has_full_access?: boolean;
  customer_name: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
  notes?: string | null;
  subtotal: number;
  shipping_fee: number;
  total: number;
  status: OrderStatus;
  order_source?: string;
  coupon_code?: string | null;
  discount_amount?: number;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  status_history?: OrderStatusHistory[];
}

export type OrderReceipt = Partial<Order> & {
  order_number: string;
  status: OrderStatus;
  created_at: string;
  has_full_access: boolean;
};

export interface ShippingRate {
  id: string;
  governorate: string;
  shipping_fee: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type ReviewCommentStatus =
  | 'pending'
  | 'approved'
  | 'hidden';

export interface ProductReview {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  review_text: string;
  status: ReviewCommentStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductComment {
  id: string;
  product_id: string;
  customer_name: string;
  comment: string;
  status: ReviewCommentStatus;
  created_at: string;
  updated_at: string;
}

export interface StoreSettings {
  id: string;
  store_name: string;
  shipping_fee: number;
  whatsapp_number: string;
  phone_number?: string;
  inspection_available: boolean;
  exchange_policy: string;
  return_policy: string;
  cod_message?: string;
  updated_at?: string;
}

export interface StoreContent {
  id: string;

  // Hero Section
  hero_title: string;
  hero_title_en?: string;
  hero_subtitle: string;
  hero_subtitle_en?: string;
  hero_button_text: string;
  hero_button_text_en?: string;
  hero_image_url: string;

  // Section Titles
  featured_section_title: string;
  featured_section_title_en?: string;
  new_arrivals_section_title: string;
  new_arrivals_section_title_en?: string;
  categories_section_title: string;
  categories_section_title_en?: string;
  cta_title: string;
  cta_title_en?: string;
  cta_text: string;
  cta_text_en?: string;
  announcement_text: string;
  announcement_text_ar?: string;
  announcement_text_en?: string;

  // Editorial Promo Section
  editorial_subtitle_ar?: string;
  editorial_subtitle_en?: string;
  editorial_title_ar?: string;
  editorial_title_en?: string;
  editorial_description_ar?: string;
  editorial_description_en?: string;
  editorial_button_text_ar?: string;
  editorial_button_text_en?: string;
  editorial_image_url?: string;

  // Visibility Toggles
  show_hero: boolean;
  show_featured: boolean;
  show_new_arrivals: boolean;
  show_categories: boolean;
  show_trust: boolean;
  show_contact_cta: boolean;

  // Pages
  about_text: string;
  about_text_en?: string;
  about_story: string;
  about_story_en?: string;
  contact_text: string;
  contact_text_en?: string;

  // Policies & Footer
  footer_text: string;
  footer_text_en?: string;
  shipping_text: string;
  shipping_text_en?: string;
  inspection_text: string;
  inspection_text_en?: string;
  exchange_policy: string;
  exchange_policy_en?: string;
  return_policy: string;
  return_policy_en?: string;
  cod_text: string;
  cod_text_en?: string;

  updated_at?: string;
}

export interface ContactSocialSettings {
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
  updated_at?: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  variantId: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

export interface CheckoutFormData {
  customer_name: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
  notes?: string;
}

export interface OrderCreateRequest {
  customer: CheckoutFormData;
  items: {
    variant_id: string;
    product_id: string;
    quantity: number;
    product_name?: string;
    category_name?: string;
    color?: string;
    size?: string;
    unit_price?: number;
    line_total?: number;
  }[];
  coupon_code?: string;
  order_source?: string;
}

export interface OrderCreateResponse {
  success: boolean;
  order?: Order;
  order_id?: string;
  order_number?: string;
  receipt_token?: string;
  subtotal?: number;
  shipping_fee?: number;
  total?: number;
  discount_amount?: number;
  coupon_code?: string;
  error?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  max_uses_per_customer?: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  coupon?: {
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
  };
  discount_amount?: number;
}

export interface AnalyticsEvent {
  id?: string;
  event_type: 'product_view' | 'add_to_cart' | 'checkout_started' | 'order_completed';
  product_id?: string;
  product_name?: string;
  metadata?: any;
  created_at?: string;
}

export interface AbandonedCheckout {
  id: string;
  session_id?: string;
  items_count: number;
  subtotal: number;
  customer_name?: string;
  phone?: string;
  status: 'abandoned' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface AnalyticsSummary {
  views: number;
  add_to_cart: number;
  checkout_started: number;
  orders_completed: number;
  cart_conversion_rate: number;
  checkout_conversion_rate: number;
  order_conversion_rate: number;
  overall_conversion_rate: number;
  abandoned_checkouts_count: number;
  abandonment_rate: number;
  top_viewed: { product_id: string; name: string; count: number }[];
  top_carted: { product_id: string; name: string; count: number }[];
}
