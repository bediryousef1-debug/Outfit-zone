export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
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
  size: 'M' | 'L' | 'XL' | '2XL' | string;
  stock_quantity: number;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
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
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  status_history?: OrderStatusHistory[];
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
  hero_subtitle: string;
  hero_button_text: string;
  hero_image_url: string;
  // Section Titles
  featured_section_title: string;
  new_arrivals_section_title: string;
  categories_section_title: string;
  cta_title: string;
  cta_text: string;
  announcement_text: string;
  // Visibility Toggles
  show_hero: boolean;
  show_featured: boolean;
  show_new_arrivals: boolean;
  show_categories: boolean;
  show_trust: boolean;
  show_contact_cta: boolean;
  // Pages
  about_text: string;
  about_story: string;
  contact_text: string;
  // Policies & Footer
  footer_text: string;
  shipping_text: string;
  inspection_text: string;
  exchange_policy: string;
  return_policy: string;
  cod_text: string;
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
  }[];
}

export interface OrderCreateResponse {
  success: boolean;
  order?: Order;
  order_number?: string;
  error?: string;
}
