import {
  Category,
  ContactSocialSettings,
  Order,
  OrderCreateRequest,
  OrderCreateResponse,
  OrderReceipt,
  Product,
  ProductComment,
  ProductReview,
  ShippingRate,
  StoreContent,
  StoreSettings,
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { EGYPTIAN_GOVERNORATES } from '../utils/constants';

const API_BASE = '/api';

// In-memory cache to prevent repeated fetches during navigation and re-renders
const memoryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached<T>(key: string, data: T, ttlMs = 60_000): void {
  memoryCache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
}

export function invalidateApiCache(prefix?: string): void {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const k of memoryCache.keys()) {
    if (k.startsWith(prefix)) {
      memoryCache.delete(k);
    }
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        return headers;
      }
    } catch {
      // ignore
    }
  }

  return headers;
}

export const api = {
  // 1. Fetch Store Settings
  async getStoreSettings(): Promise<StoreSettings> {
    const cached = getCached<StoreSettings>('settings');
    if (cached) return cached;

    let result: StoreSettings | null = null;
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (!error && data) result = data;
      } catch (err) {
        console.warn('Supabase getStoreSettings notice:', err);
      }
    }

    if (!result) {
      try {
        const res = await fetch(`${API_BASE}/settings`);
        if (res.ok) result = await res.json();
      } catch {}
    }

    const finalSettings = result || {
      id: 'settings_default',
      store_name: 'Outfit Zone',
      shipping_fee: 65,
      whatsapp_number: '201012345678',
      phone_number: '01012345678',
      inspection_available: true,
      exchange_policy: 'استبدال المقاس متاح خلال 14 يوم من تاريخ الاستلام.',
      return_policy:
        'إرجاع المنتج متاح خلال 3 أيام في حالته الأصلية وبطاقة المنتج.',
      cod_message: 'الدفع عند الاستلام فقط لجميع المحافظات داخل مصر.',
      updated_at: new Date().toISOString(),
    };

    setCached('settings', finalSettings, 120_000);
    return finalSettings;
  },

  // 1b. Fetch Shipping Rates per Governorate
  async getShippingRates(includeInactive = false): Promise<ShippingRate[]> {
    const cacheKey = `shipping_rates_${includeInactive}`;
    const cached = getCached<ShippingRate[]>(cacheKey);
    if (cached) return cached;

    let result: ShippingRate[] | null = null;
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('shipping_rates')
          .select('*')
          .order('governorate', { ascending: true });

        if (!includeInactive) {
          query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (!error && data && data.length > 0) {
          result = data;
        }
      } catch (err) {
        console.warn('Supabase getShippingRates notice:', err);
      }
    }

    if (!result) {
      try {
        const res = await fetch(
          `${API_BASE}/shipping-rates${includeInactive ? '?all=true' : ''}`
        );

        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json) && json.length > 0) {
            result = json;
          }
        }
      } catch {}
    }

    const finalRates = result || EGYPTIAN_GOVERNORATES.map((gov) => ({
      id: `sr_${gov.id}`,
      governorate: gov.nameAr,
      shipping_fee: 65,
      is_active: true,
    }));

    setCached(cacheKey, finalRates, 120_000);
    return finalRates;
  },

  // 1c. Admin: Update Shipping Rate
  async adminUpdateShippingRate(
    id: string,
    updates: Partial<ShippingRate>
  ): Promise<ShippingRate> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('shipping_rates')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) return data;

        if (error) {
          throw new Error(error.message);
        }
      } catch (err: any) {
        console.warn(
          'Supabase adminUpdateShippingRate notice:',
          err
        );

        if (err?.message) throw err;
      }
    }

    const authHeaders = await getAuthHeaders();

    const res = await fetch(
      `${API_BASE}/admin/shipping-rates/${id}`,
      {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(updates),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));

      throw new Error(
        err.error || 'فشل تحديث سعر الشحن'
      );
    }

    return await res.json();
  },

  // 2. Fetch Categories
  async getCategories(): Promise<Category[]> {
    const cached = getCached<Category[]>('categories');
    if (cached) return cached;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .neq('is_active', false)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(
          error.code === 'PGRST205' ||
          error.message.includes('schema cache')
            ? 'جداول الأقسام غير مهيأة بعد في Supabase. يرجى تشغيل supabase/schema.sql في Supabase SQL Editor.'
            : error.message || 'تعذر جلب الأقسام من Supabase'
        );
      }

      const resData = data || [];
      setCached('categories', resData, 120_000);
      return resData;
    }

    try {
      const res = await fetch(`${API_BASE}/categories`);

      if (res.ok) {
        const json = await res.json();
        setCached('categories', json, 120_000);
        return json;
      }
    } catch {}

    return [];
  },

  // 3. Fetch Products
  async getProducts(
    options?: { admin?: boolean }
  ): Promise<Product[]> {
    const cacheKey = options?.admin ? 'products_admin' : 'products_public';
    const cached = getCached<Product[]>(cacheKey);
    if (cached) return cached;

    if (isSupabaseConfigured && supabase) {
      let prodQuery = supabase
        .from('products')
        .select('*');

      if (!options?.admin) {
        prodQuery = prodQuery.neq(
          'is_active',
          false
        );
      }

      const [
        pRes,
        imgRes,
        varRes,
        catRes,
      ] = await Promise.all([
        prodQuery.order(
          'created_at',
          { ascending: false }
        ),
        supabase
          .from('product_images')
          .select('*'),
        supabase
          .from('product_variants')
          .select('*'),
        supabase
          .from('categories')
          .select('*'),
      ]);

      if (pRes.error) {
        throw new Error(
          pRes.error.code ===
            'PGRST205' ||
          pRes.error.message.includes(
            'schema cache'
          )
            ? 'جداول المنتجات غير مهيأة بعد في Supabase. يرجى تشغيل supabase/schema.sql في Supabase SQL Editor.'
            : pRes.error.message ||
              'تعذر جلب المنتجات من Supabase'
        );
      }

      const allImages =
        imgRes.data || [];

      const allVariants =
        varRes.data || [];

      const allCategories =
        catRes.data || [];

      const result = (
        pRes.data || []
      ).map((p: any) => {
        const category =
          allCategories.find(
            (c: any) =>
              c.id ===
              p.category_id
          );

        const images =
          allImages
            .filter(
              (img: any) =>
                img.product_id ===
                p.id
            )
            .sort(
              (
                a: any,
                b: any
              ) =>
                (a.sort_order ?? 0) -
                (b.sort_order ?? 0)
            );

        const variants =
          allVariants.filter(
            (v: any) =>
              v.product_id ===
              p.id
          );

        return {
          ...p,
          category,
          images,
          variants,
        };
      });

      setCached(cacheKey, result, 60_000);
      return result;
    }

    try {
      const headers: HeadersInit = {
        'Content-Type':
          'application/json',
      };

      if (options?.admin) {
        const {
          data: {
            session,
          },
        } =
          await supabase?.auth.getSession() ||
          { data: { session: null } };

        if (
          !session?.access_token
        ) {
          throw new Error(
            'جلسة الأدمن غير صالحة.'
          );
        }

        headers.Authorization =
          `Bearer ${session.access_token}`;
      }

      const res = await fetch(
        `${API_BASE}/products${
          options?.admin
            ? '?admin=true'
            : ''
        }`,
        {
          headers,
        }
      );

      if (res.ok) {
        const json = await res.json();
        setCached(cacheKey, json, 60_000);
        return json;
      }

      if (
        options?.admin &&
        (res.status === 401 ||
          res.status === 403)
      ) {
        throw new Error(
          'غير مصرح لك بالوصول إلى المنتجات غير النشطة.'
        );
      }
    } catch (error) {
      if (
        options?.admin &&
        error instanceof Error
      ) {
        throw error;
      }
    }

    return [];
  },

  // 4. Fetch Single Product By Slug
  async getProductBySlug(slug: string): Promise<Product> {
    const cacheKey = `product_slug_${slug}`;
    const cached = getCached<Product>(cacheKey);
    if (cached) return cached;

    if (isSupabaseConfigured && supabase) {
      const { data: pData, error: pErr } =
        await supabase
          .from('products')
          .select('*')
          .eq('slug', slug)
          .neq('is_active', false)
          .maybeSingle();

      if (pErr) {
        throw new Error(
          pErr.message ||
            'تعذر جلب تفاصيل المنتج'
        );
      }

      if (!pData) {
        throw new Error(
          'المنتج غير متوفر أو تم إيقافه'
        );
      }

      const [
        imgRes,
        varRes,
        catRes,
      ] = await Promise.all([
        supabase
          .from('product_images')
          .select('*')
          .eq('product_id', pData.id),

        supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', pData.id),

        pData.category_id
          ? supabase
              .from('categories')
              .select('*')
              .eq('id', pData.category_id)
              .maybeSingle()
          : Promise.resolve({
              data: null,
            }),
      ]);

      const result = {
        ...pData,
        category:
          catRes.data ||
          undefined,
        images:
          (imgRes.data || [])
            .sort(
              (
                a: any,
                b: any
              ) =>
                (a.sort_order ?? 0) -
                (b.sort_order ?? 0)
            ),
        variants:
          varRes.data || [],
      };

      setCached(cacheKey, result, 60_000);
      return result;
    }

    const res = await fetch(
      `${API_BASE}/products/${slug}`
    );

    if (!res.ok) {
      const err =
        await res
          .json()
          .catch(() => ({}));

      throw new Error(
        err.error ||
          'المنتج غير متوفر'
      );
    }

    const json = await res.json();
    setCached(cacheKey, json, 60_000);
    return json;
  },

  // 4b. Fetch Single Product By ID
  async getProductById(id: string): Promise<Product> {
    const cacheKey = `product_id_${id}`;
    const cached = getCached<Product>(cacheKey);
    if (cached) return cached;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: pData, error: pErr } = await supabase
          .from('products')
          .select(
            '*, category:categories(*), images:product_images(*), variants:product_variants(*)'
          )
          .eq('id', id)
          .maybeSingle();

        if (!pErr && pData) {
          const result = {
            ...pData,
            images: (pData.images || []).sort(
              (a: any, b: any) =>
                (a.sort_order ?? 0) - (b.sort_order ?? 0)
            ),
          };
          setCached(cacheKey, result, 60_000);
          return result;
        }
      } catch (err) {
        console.warn('Supabase getProductById notice:', err);
      }
    }

    const res = await fetch(`${API_BASE}/products/id/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'المنتج غير متوفر');
    }
    const json = await res.json();
    setCached(cacheKey, json, 60_000);
    return json;
  },

  // 5. Submit Guest COD Order
  // Orders MUST go through the server so Telegram notification is triggered.
  async submitGuestOrder(
    orderData: OrderCreateRequest
  ): Promise<OrderCreateResponse> {
    const res = await fetch(
      `${API_BASE}/orders`,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify(orderData),
      }
    );

    const data =
      await res
        .json()
        .catch(() => ({}));

    if (
      !res.ok ||
      !data.success
    ) {
      throw new Error(
        data.error ||
          'تعذر إتمام الطلب، يرجى المحاولة مرة أخرى.'
      );
    }

    return data;
  },

  // 6. Lookup Guest Order
  async lookupOrder(
    orderNumber: string,
    receiptToken?: string
  ): Promise<OrderReceipt> {
    const cleanNum =
      orderNumber.trim();

    const cleanToken =
      receiptToken?.trim() ||
      null;

    if (
      isSupabaseConfigured &&
      supabase
    ) {
      const {
        data,
        error,
      } = await supabase.rpc(
        'get_guest_order_receipt',
        {
          p_order_number:
            cleanNum,
          p_receipt_token:
            cleanToken,
        }
      );

      if (error) {
        throw new Error(
          error.message ||
            'الطلب غير موجود'
        );
      }

      if (data) return data;

      throw new Error(
        'الطلب غير موجود'
      );
    }

    const queryParam =
      cleanToken
        ? `?t=${encodeURIComponent(
            cleanToken
          )}`
        : '';

    const res = await fetch(
      `${API_BASE}/orders/lookup/${cleanNum}${queryParam}`
    );

    if (!res.ok) {
      throw new Error(
        'الطلب غير موجود'
      );
    }

    return res.json();
  },

  // 7. Verify Admin User
  async verifyAdmin(
    email?: string
  ): Promise<{
    authorized: boolean;
    user?: any;
    error?: string;
  }> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      try {
        const {
          data,
          error,
        } = await supabase.rpc(
          'is_admin'
        );

        if (!error && data) {
          return {
            authorized: true,
          };
        }
      } catch (err) {
        console.warn(
          'Supabase is_admin check notice:',
          err
        );
      }

      return {
        authorized: false,
        error:
          'هذا الحساب غير مصرح له بالدخول إلى لوحة التحكم.',
      };
    }

    return {
      authorized: false,
      error:
        'قاعدة بيانات Supabase غير متصلة.',
    };
  },

  // 8. Admin: Get Orders
  async adminGetOrders(filters?: {
    status?: string;
    search?: string;
  }): Promise<Order[]> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      let query =
        supabase
          .from('orders')
          .select(
            '*, order_items(*)'
          )
          .order(
            'created_at',
            {
              ascending: false,
            }
          );

      if (
        filters?.status &&
        filters.status !== 'all'
      ) {
        query =
          query.eq(
            'status',
            filters.status
          );
      }

      const {
        data,
        error,
      } = await query;

      if (error) {
        throw new Error(
          error.code === 'PGRST205' ||
          error.message.includes(
            'schema cache'
          )
            ? 'جدول الطلبات غير مهيأ بعد في Supabase. شغل supabase/schema.sql'
            : error.message ||
              'فشل جلب الطلبات من Supabase'
        );
      }

      let list =
        data || [];

      if (
        filters?.search
      ) {
        const s =
          filters.search
            .toLowerCase()
            .trim();

        list =
          list.filter(
            (o: any) =>
              o.order_number
                ?.toLowerCase()
                .includes(s) ||
              o.customer_name
                ?.toLowerCase()
                .includes(s) ||
              o.phone?.includes(
                s
              ) ||
              o.city
                ?.toLowerCase()
                .includes(s) ||
              o.governorate
                ?.toLowerCase()
                .includes(s)
          );
      }

      return list;
    }

    const params =
      new URLSearchParams();

    if (filters?.status) {
      params.append(
        'status',
        filters.status
      );
    }

    if (filters?.search) {
      params.append(
        'search',
        filters.search
      );
    }

    try {
      const authHeaders =
        await getAuthHeaders();

      const res =
        await fetch(
          `${API_BASE}/admin/orders?${params.toString()}`,
          {
            headers:
              authHeaders,
          }
        );

      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn(
        'Fallback admin orders fetch notice:',
        e
      );
    }

    return [];
  },

  // 8.1 Admin: Get Order By ID
  async adminGetOrderById(
    orderId: string
  ): Promise<Order> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      try {
        const {
          data,
          error,
        } = await supabase
          .from('orders')
          .select(
            '*, order_items(*)'
          )
          .or(
            `id.eq.${orderId},order_number.eq.${orderId}`
          )
          .maybeSingle();

        if (
          !error &&
          data
        ) {
          return data;
        }
      } catch (err) {
        console.warn(
          'Supabase getOrderById notice:',
          err
        );
      }
    }

    const authHeaders =
      await getAuthHeaders();

    const res =
      await fetch(
        `${API_BASE}/admin/orders/${orderId}`,
        {
          headers:
            authHeaders,
        }
      );

    if (res.ok)
      return res.json();

    const all =
      await this.adminGetOrders();

    const found =
      all.find(
        (o) =>
          o.id === orderId ||
          o.order_number ===
            orderId
      );

    if (found)
      return found;

    throw new Error(
      'الطلب غير موجود'
    );
  },

  // 9. Admin: Update Order Status
  async adminUpdateOrderStatus(
    orderId: string,
    status: string,
    changedBy = 'admin'
  ): Promise<Order> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      try {
        const {
          data,
          error,
        } = await supabase
          .from('orders')
          .update({
            status,
            updated_at:
              new Date().toISOString(),
          })
          .eq('id', orderId)
          .select(
            '*, order_items(*)'
          )
          .single();

        if (
          !error &&
          data
        ) {
          await supabase
            .from(
              'order_status_history'
            )
            .insert({
              order_id:
                orderId,
              status,
              changed_by:
                changedBy,
            });

          return data;
        }
      } catch (err) {
        console.warn(
          'Supabase adminUpdateOrderStatus notice:',
          err
        );
      }
    }

    const authHeaders =
      await getAuthHeaders();

    const res =
      await fetch(
        `${API_BASE}/admin/orders/${orderId}/status`,
        {
          method:
            'PATCH',
          headers:
            authHeaders,
          body: JSON.stringify({
            status,
            changed_by:
              changedBy,
          }),
        }
      );

    if (!res.ok) {
      const err =
        await res
          .json()
          .catch(() => ({}));

      throw new Error(
        err.error ||
          'فشل تحديث حالة الطلب'
      );
    }

    return res.json();
  },

  // 9.1 Admin: Delete Order
  async adminDeleteOrder(
    orderId: string
  ): Promise<{
    success: boolean;
    message?: string;
  }> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      try {
        const {
          data: ord,
        } = await supabase
          .from('orders')
          .select(
            'id, order_number'
          )
          .or(
            `id.eq.${orderId},order_number.eq.${orderId}`
          )
          .maybeSingle();

        const targetId =
          ord?.id ||
          orderId;

        await supabase
          .from(
            'order_status_history'
          )
          .delete()
          .eq(
            'order_id',
            targetId
          );

        await supabase
          .from('order_items')
          .delete()
          .eq(
            'order_id',
            targetId
          );

        const {
          error: delErr,
        } = await supabase
          .from('orders')
          .delete()
          .eq(
            'id',
            targetId
          );

        if (delErr) {
          console.warn(
            'Supabase adminDeleteOrder notice:',
            delErr
          );
        }
      } catch (err) {
        console.warn(
          'Supabase adminDeleteOrder call notice:',
          err
        );
      }
    }

    const authHeaders =
      await getAuthHeaders();

    const res =
      await fetch(
        `${API_BASE}/admin/orders/${orderId}`,
        {
          method:
            'DELETE',
          headers:
            authHeaders,
        }
      );

    if (!res.ok) {
      const err =
        await res
          .json()
          .catch(() => ({}));

      throw new Error(
        err.error ||
          'فشل حذف الطلب'
      );
    }

    return res.json();
  },

  // 10. Admin: Create Product
  async adminCreateProduct(
    productData: any
  ): Promise<Product> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      try {
        const {
          data: newProd,
          error: prodErr,
        } = await supabase
          .from('products')
          .insert({
            name:
              productData.name,
            slug:
              productData.slug,
            description:
              productData.description ||
              '',
            fabric_details:
              productData.fabric_details ||
              '',
            price:
              productData.price,
            compare_at_price:
              productData.compare_at_price ||
              null,
            category_id:
              productData.category_id,
            is_active:
              productData.is_active ??
              true,
            is_featured:
              productData.is_featured ??
              false,
            is_new:
              productData.is_new ??
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
              productData.images
            ) &&
            productData.images.length >
              0
          ) {
            await supabase
              .from(
                'product_images'
              )
              .insert(
                productData.images.map(
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
              productData.variants
            ) &&
            productData.variants.length >
              0
          ) {
            await supabase
              .from(
                'product_variants'
              )
              .insert(
                productData.variants.map(
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

          return newProd;
        }
      } catch (err) {
        console.warn(
          'Supabase adminCreateProduct notice:',
          err
        );
      }
    }

    const authHeaders =
      await getAuthHeaders();

    const res =
      await fetch(
        `${API_BASE}/admin/products`,
        {
          method:
            'POST',
          headers:
            authHeaders,
          body: JSON.stringify(
            productData
          ),
        }
      );

    if (!res.ok) {
      const err =
        await res
          .json()
          .catch(() => ({}));

      throw new Error(
        err.error ||
          'فشل إنشاء المنتج'
      );
    }

    return res.json();
  },

  // 11. Admin: Update Product
  async adminUpdateProduct(
    id: string,
    productData: any
  ): Promise<Product> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      try {
        const {
          data: updatedProd,
          error: prodErr,
        } = await supabase
          .from('products')
          .update({
            name:
              productData.name,
            slug:
              productData.slug,
            description:
              productData.description,
            fabric_details:
              productData.fabric_details,
            price:
              productData.price,
            compare_at_price:
              productData.compare_at_price,
            category_id:
              productData.category_id,
            is_active:
              productData.is_active,
            is_featured:
              productData.is_featured,
            is_new:
              productData.is_new,
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
              productData.images
            )
          ) {
            await supabase
              .from(
                'product_images'
              )
              .delete()
              .eq(
                'product_id',
                id
              );

            if (
              productData.images.length >
                0
            ) {
              await supabase
                .from(
                  'product_images'
                )
                .insert(
                  productData.images.map(
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

          if (
            Array.isArray(
              productData.variants
            )
          ) {
            await supabase
              .from(
                'product_variants'
              )
              .delete()
              .eq(
                'product_id',
                id
              );

            if (
              productData
                .variants
                .length > 0
            ) {
              await supabase
                .from(
                  'product_variants'
                )
                .insert(
                  productData.variants.map(
                    (v: any) => ({
                      product_id:
                        id,
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
          }

          return updatedProd;
        }
      } catch (err) {
        console.warn(
          'Supabase adminUpdateProduct notice:',
          err
        );
      }
    }

    const authHeaders =
      await getAuthHeaders();

    const res =
      await fetch(
        `${API_BASE}/admin/products/${id}`,
        {
          method:
            'PUT',
          headers:
            authHeaders,
          body: JSON.stringify(
            productData
          ),
        }
      );

    if (!res.ok) {
      const err =
        await res
          .json()
          .catch(() => ({}));

      throw new Error(
        err.error ||
          'فشل تحديث المنتج'
      );
    }

    return res.json();
  },

  // 12. Admin: Archive Product
  async adminArchiveProduct(
    id: string
  ): Promise<void> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      try {
        const {
          error,
        } = await supabase
          .from('products')
          .update({
            is_active:
              false,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            'id',
            id
          );

        if (!error) return;
      } catch (err) {
        console.warn(
          'Supabase adminArchiveProduct notice:',
          err
        );
      }
    }

    const authHeaders =
      await getAuthHeaders();

    const res =
      await fetch(
        `${API_BASE}/admin/products/${id}/archive`,
        {
          method:
            'POST',
          headers:
            authHeaders,
        }
      );

    if (!res.ok) {
      const err =
        await res
          .json()
          .catch(() => ({}));

      throw new Error(
        err.error ||
          'فشل أرشفة المنتج'
      );
    }
  },

  // 12.1 Admin: Permanent Delete Product
  async adminDeleteProduct(
    id: string
  ): Promise<void> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      const {
        error,
      } = await supabase
        .from('products')
        .delete()
        .eq(
          'id',
          id
        );

      if (error) {
        throw new Error(
          error.message ||
            'فشل حذف المنتج من قاعدة البيانات.'
        );
      }

      return;
    }

    const authHeaders =
      await getAuthHeaders();

    const res =
      await fetch(
        `${API_BASE}/admin/products/${id}`,
        {
          method:
            'DELETE',
          headers:
            authHeaders,
        }
      );

    if (!res.ok) {
      const err =
        await res
          .json()
          .catch(() => ({}));

      throw new Error(
        err.error ||
          'فشل حذف المنتج'
      );
    }
  },

  // 13. Admin: Update Store Settings
  async adminUpdateSettings(
    settingsData: Partial<StoreSettings>
  ): Promise<StoreSettings> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      try {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'store_settings'
            )
            .update({
              store_name:
                settingsData.store_name,
              shipping_fee:
                settingsData.shipping_fee,
              whatsapp_number:
                settingsData.whatsapp_number,
              phone_number:
                settingsData.phone_number,
              inspection_available:
                settingsData.inspection_available,
              exchange_policy:
                settingsData.exchange_policy,
              return_policy:
                settingsData.return_policy,
              cod_message:
                settingsData.cod_message,
              updated_at:
                new Date().toISOString(),
            })
            .neq(
              'id',
              '00000000-0000-0000-0000-000000000000'
            )
            .select()
            .single();

        if (
          !error &&
          data
        ) {
          return data;
        }
      } catch (err) {
        console.warn(
          'Supabase adminUpdateSettings notice:',
          err
        );
      }
    }

    const authHeaders =
      await getAuthHeaders();

    const res =
      await fetch(
        `${API_BASE}/admin/settings`,
        {
          method:
            'PUT',
          headers:
            authHeaders,
          body: JSON.stringify(
            settingsData
          ),
        }
      );

    if (!res.ok) {
      const err =
        await res
          .json()
          .catch(() => ({}));

      throw new Error(
        err.error ||
          'فشل تحديث الإعدادات'
      );
    }

    return res.json();
  },

  // 14. Store Content CMS
  async getStoreContent(): Promise<StoreContent> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      try {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'store_content'
            )
            .select('*')
            .limit(1)
            .maybeSingle();

        if (
          !error &&
          data
        ) {
          return data;
        }
      } catch (err) {
        console.warn(
          'Supabase getStoreContent notice:',
          err
        );
      }
    }

    const res =
      await fetch(
        `${API_BASE}/content`
      );

    if (!res.ok) {
      throw new Error(
        'فشل جلب محتوى المتجر'
      );
    }

    return res.json();
  },

  async adminUpdateStoreContent(
    contentData: Partial<StoreContent>
  ): Promise<StoreContent> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      try {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'store_content'
            )
            .update({
              ...contentData,
              updated_at:
                new Date().toISOString(),
            })
            .neq(
              'id',
              '00000000-0000-0000-0000-000000000000'
            )
            .select()
            .single();

        if (
          !error &&
          data
        ) {
          return data;
        }
      } catch (err) {
        console.warn(
          'Supabase adminUpdateStoreContent notice:',
          err
        );
      }
    }

    const authHeaders =
      await getAuthHeaders();

    const res =
      await fetch(
        `${API_BASE}/admin/content`,
        {
          method:
            'PUT',
          headers:
            authHeaders,
          body: JSON.stringify(
            contentData
          ),
        }
      );

    if (!res.ok) {
      const err =
        await res
          .json()
          .catch(() => ({}));

      throw new Error(
        err.error ||
          'فشل تحديث محتوى المتجر'
      );
    }

    return res.json();
  },

  // 15. Contact & Social Settings
  async getContactSocial(): Promise<ContactSocialSettings> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      try {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'contact_social_settings'
            )
            .select('*')
            .limit(1)
            .maybeSingle();

        if (
          !error &&
          data
        ) {
          return data;
        }
      } catch (err) {
        console.warn(
          'Supabase getContactSocial notice:',
          err
        );
      }
    }

    const res =
      await fetch(
        `${API_BASE}/contact-social`
      );

    if (!res.ok) {
      throw new Error(
        'فشل جلب بيانات التواصل والسوشيال'
      );
    }

    return res.json();
  },

  async adminUpdateContactSocial(
    socialData: Partial<ContactSocialSettings>
  ): Promise<ContactSocialSettings> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      try {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'contact_social_settings'
            )
            .update({
              ...socialData,
              updated_at:
                new Date().toISOString(),
            })
            .neq(
              'id',
              '00000000-0000-0000-0000-000000000000'
            )
            .select()
            .single();

        if (
          !error &&
          data
        ) {
          return data;
        }
      } catch (err) {
        console.warn(
          'Supabase adminUpdateContactSocial notice:',
          err
        );
      }
    }

    const authHeaders =
      await getAuthHeaders();

    const res =
      await fetch(
        `${API_BASE}/admin/contact-social`,
        {
          method:
            'PUT',
          headers:
            authHeaders,
          body: JSON.stringify(
            socialData
          ),
        }
      );

    if (!res.ok) {
      const err =
        await res
          .json()
          .catch(() => ({}));

      throw new Error(
        err.error ||
          'فشل تحديث بيانات التواصل'
      );
    }

    return res.json();
  },

  // 16. Admin Category Management
  async adminGetCategories(): Promise<Category[]> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      try {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'categories'
            )
            .select('*')
            .order(
              'created_at',
              {
                ascending:
                  true,
              }
            );

        if (
          !error &&
          data
        ) {
          return data;
        }
      } catch (err) {
        console.warn(
          'Supabase adminGetCategories notice:',
          err
        );
      }
    }

    const authHeaders =
      await getAuthHeaders();

    const res =
      await fetch(
        `${API_BASE}/admin/categories`,
        {
          headers:
            authHeaders,
        }
      );

    if (!res.ok) {
      throw new Error(
        'فشل جلب الأقسام'
      );
    }

    return res.json();
  },

  async adminCreateCategory(
    catData: {
      name: string;
      slug: string;
      image_url?: string;
    }
  ): Promise<Category> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      try {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'categories'
            )
            .insert({
              name:
                catData.name,
              slug:
                catData.slug,
              image_url:
                catData.image_url ||
                null,
              is_active:
                true,
            })
            .select()
            .single();

        if (
          !error &&
          data
        ) {
          return data;
        }
      } catch (err) {
        console.warn(
          'Supabase adminCreateCategory notice:',
          err
        );
      }
    }

    const authHeaders =
      await getAuthHeaders();

    const res =
      await fetch(
        `${API_BASE}/admin/categories`,
        {
          method:
            'POST',
          headers:
            authHeaders,
          body: JSON.stringify(
            catData
          ),
        }
      );

    if (!res.ok) {
      const err =
        await res
          .json()
          .catch(() => ({}));

      throw new Error(
        err.error ||
          'فشل إضافة القسم'
      );
    }

    return res.json();
  },

  async adminUpdateCategory(
    id: string,
    catData: Partial<Category>
  ): Promise<Category> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      try {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'categories'
            )
            .update({
              name:
                catData.name,
              slug:
                catData.slug,
              image_url:
                catData.image_url,
              is_active:
                catData.is_active,
            })
            .eq(
              'id',
              id
            )
            .select()
            .single();

        if (
          !error &&
          data
        ) {
          return data;
        }
      } catch (err) {
        console.warn(
          'Supabase adminUpdateCategory notice:',
          err
        );
      }
    }

    const authHeaders =
      await getAuthHeaders();

    const res =
      await fetch(
        `${API_BASE}/admin/categories/${id}`,
        {
          method:
            'PUT',
          headers:
            authHeaders,
          body: JSON.stringify(
            catData
          ),
        }
      );

    if (!res.ok) {
      const err =
        await res
          .json()
          .catch(() => ({}));

      throw new Error(
        err.error ||
          'فشل تحديث القسم'
      );
    }

    return res.json();
  },

  async adminArchiveCategory(
    id: string
  ): Promise<void> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      try {
        const {
          error,
        } =
          await supabase
            .from(
              'categories'
            )
            .update({
              is_active:
                false,
            })
            .eq(
              'id',
              id
            );

        if (!error) return;
      } catch (err) {
        console.warn(
          'Supabase adminArchiveCategory notice:',
          err
        );
      }
    }

    const authHeaders =
      await getAuthHeaders();

    const res =
      await fetch(
        `${API_BASE}/admin/categories/${id}/archive`,
        {
          method:
            'POST',
          headers:
            authHeaders,
        }
      );

    if (!res.ok) {
      const err =
        await res
          .json()
          .catch(() => ({}));

      throw new Error(
        err.error ||
          'فشل أرشفة القسم'
      );
    }
  },

  // 19. Admin: Permanent Delete Category
  async adminDeleteCategory(
    id: string
  ): Promise<void> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      const {
        error:
          disassociateError,
      } = await supabase
        .from('products')
        .update({
          category_id:
            null,
        })
        .eq(
          'category_id',
          id
        );

      if (
        disassociateError
      ) {
        console.warn(
          'Disassociate products notice:',
          disassociateError
        );
      }

      const {
        error,
      } =
        await supabase
          .from(
            'categories'
          )
          .delete()
          .eq(
            'id',
            id
          );

      if (error) {
        throw new Error(
          error.message ||
            'فشل حذف القسم من قاعدة البيانات.'
        );
      }

      return;
    }

    const authHeaders =
      await getAuthHeaders();

    const res =
      await fetch(
        `${API_BASE}/admin/categories/${id}`,
        {
          method:
            'DELETE',
          headers:
            authHeaders,
        }
      );

    if (!res.ok) {
      const err =
        await res
          .json()
          .catch(() => ({}));

      throw new Error(
        err.error ||
          'فشل حذف القسم'
      );
    }
  },

  // 20. Admin: Delete Product Variant
  async adminDeleteVariant(
    variantId: string
  ): Promise<void> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      const {
        error,
      } =
        await supabase
          .from(
            'product_variants'
          )
          .delete()
          .eq(
            'id',
            variantId
          );

      if (error) {
        throw new Error(
          error.message ||
            'فشل حذف متغير المنتج.'
        );
      }

      return;
    }

    const authHeaders =
      await getAuthHeaders();

    const res =
      await fetch(
        `${API_BASE}/admin/variants/${variantId}`,
        {
          method:
            'DELETE',
          headers:
            authHeaders,
        }
      );

    if (!res.ok) {
      const err =
        await res
          .json()
          .catch(() => ({}));

      throw new Error(
        err.error ||
          'فشل حذف المتغير'
      );
    }
  },

  // 21. Product Reviews
  // Public: Get approved reviews for a product
  async getProductReviews(
    productId: string
  ): Promise<ProductReview[]> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            'product_reviews'
          )
          .select('*')
          .eq(
            'product_id',
            productId
          )
          .eq(
            'status',
            'approved'
          )
          .order(
            'created_at',
            {
              ascending:
                false,
            }
          );

      if (error) {
        throw new Error(
          error.message ||
            'تعذر جلب تقييمات المنتج'
        );
      }

      return data || [];
    }

    return [];
  },

  // Public: Get all approved reviews for the homepage
  async getPublicReviews(): Promise<ProductReview[]> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            'product_reviews'
          )
          .select('*')
          .eq(
            'status',
            'approved'
          )
          .order(
            'created_at',
            {
              ascending:
                false,
            }
          )
          .limit(20);

      if (error) {
        throw new Error(
          error.message ||
            'تعذر جلب آراء العملاء'
        );
      }

      return data || [];
    }

    return [];
  },

  // Public: Submit a customer review
  // Customer reviews are always pending.
  async createProductReview(
    data: {
      product_id?: string | null;
      customer_name: string;
      rating: number;
      review_text: string;
    }
  ): Promise<{
    success: boolean;
  }> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      const {
        error,
      } =
        await supabase
          .from(
            'product_reviews'
          )
          .insert({
            product_id:
              data.product_id ?? null,
            customer_name:
              data.customer_name.trim(),
            rating:
              Number(
                data.rating
              ),
            review_text:
              data.review_text.trim(),
            status:
              'pending',
          });

      if (error) {
        throw new Error(
          error.message ||
            'تعذر إرسال التقييم'
        );
      }

      return {
        success: true,
      };
    }

    throw new Error(
      'قاعدة بيانات Supabase غير متصلة.'
    );
  },

  // 21.1 Admin: Get All Product Reviews
  async adminGetProductReviews(
    productId?: string
  ): Promise<ProductReview[]> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      let query =
        supabase
          .from(
            'product_reviews'
          )
          .select('*')
          .order(
            'created_at',
            {
              ascending:
                false,
            }
          );

      if (productId) {
        query =
          query.eq(
            'product_id',
            productId
          );
      }

      const {
        data,
        error,
      } = await query;

      if (error) {
        throw new Error(
          error.message ||
            'فشل جلب تقييمات المنتجات'
        );
      }

      return data || [];
    }

    throw new Error(
      'قاعدة بيانات Supabase غير متصلة.'
    );
  },

  // 21.2 Admin: Create Product Review
  async adminCreateProductReview(
    data: {
      product_id?: string | null;
      customer_name: string;
      rating: number;
      review_text: string;
      status?: ProductReview['status'];
    }
  ): Promise<ProductReview> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      const {
        data: review,
        error,
      } =
        await supabase
          .from(
            'product_reviews'
          )
          .insert({
            product_id:
              data.product_id ?? null,
            customer_name:
              data.customer_name.trim(),
            rating:
              Number(
                data.rating
              ),
            review_text:
              data.review_text.trim(),
            status:
              data.status ||
              'approved',
          })
          .select()
          .single();

      if (
        error ||
        !review
      ) {
        throw new Error(
          error?.message ||
            'فشل إضافة التقييم'
        );
      }

      return review;
    }

    throw new Error(
      'قاعدة بيانات Supabase غير متصلة.'
    );
  },

  // 21.3 Admin: Update Product Review
  async adminUpdateProductReview(
    id: string,
    updates: Partial<
      Pick<
        ProductReview,
        | 'product_id'
        | 'customer_name'
        | 'rating'
        | 'review_text'
        | 'status'
      >
    >
  ): Promise<ProductReview> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      const payload: Record<
        string,
        any
      > = {
        updated_at:
          new Date().toISOString(),
      };

      if (
        updates.product_id !==
        undefined
      ) {
        payload.product_id =
          updates.product_id;
      }

      if (
        updates.customer_name !==
        undefined
      ) {
        payload.customer_name =
          updates.customer_name.trim();
      }

      if (
        updates.rating !==
        undefined
      ) {
        payload.rating =
          Number(
            updates.rating
          );
      }

      if (
        updates.review_text !==
        undefined
      ) {
        payload.review_text =
          updates.review_text.trim();
      }

      if (
        updates.status !==
        undefined
      ) {
        payload.status =
          updates.status;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'product_reviews'
          )
          .update(
            payload
          )
          .eq(
            'id',
            id
          )
          .select()
          .single();

      if (
        error ||
        !data
      ) {
        throw new Error(
          error?.message ||
            'فشل تحديث التقييم'
        );
      }

      return data;
    }

    throw new Error(
      'قاعدة بيانات Supabase غير متصلة.'
    );
  },

  // 21.4 Admin: Delete Product Review
  async adminDeleteProductReview(
    id: string
  ): Promise<void> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      const {
        error,
      } =
        await supabase
          .from(
            'product_reviews'
          )
          .delete()
          .eq(
            'id',
            id
          );

      if (error) {
        throw new Error(
          error.message ||
            'فشل حذف التقييم'
        );
      }

      return;
    }

    throw new Error(
      'قاعدة بيانات Supabase غير متصلة.'
    );
  },

  // 22. Product Comments
  // Public: Get approved comments for a product
  async getProductComments(
    productId: string
  ): Promise<ProductComment[]> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            'product_comments'
          )
          .select('*')
          .eq(
            'product_id',
            productId
          )
          .eq(
            'status',
            'approved'
          )
          .order(
            'created_at',
            {
              ascending:
                false,
            }
          );

      if (error) {
        throw new Error(
          error.message ||
            'تعذر جلب تعليقات المنتج'
        );
      }

      return data || [];
    }

    return [];
  },

  // Public: Submit a customer comment
  // Customer comments are always pending.
  async createProductComment(
    data: {
      product_id: string;
      customer_name: string;
      comment: string;
    }
  ): Promise<{
    success: boolean;
  }> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      const {
        error,
      } =
        await supabase
          .from(
            'product_comments'
          )
          .insert({
            product_id:
              data.product_id,
            customer_name:
              data.customer_name.trim(),
            comment:
              data.comment.trim(),
            status:
              'pending',
          });

      if (error) {
        throw new Error(
          error.message ||
            'تعذر إرسال التعليق'
        );
      }

      return {
        success: true,
      };
    }

    throw new Error(
      'قاعدة بيانات Supabase غير متصلة.'
    );
  },

  // 22.1 Admin: Get All Product Comments
  async adminGetProductComments(
    productId?: string
  ): Promise<ProductComment[]> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      let query =
        supabase
          .from(
            'product_comments'
          )
          .select('*')
          .order(
            'created_at',
            {
              ascending:
                false,
            }
          );

      if (productId) {
        query =
          query.eq(
            'product_id',
            productId
          );
      }

      const {
        data,
        error,
      } = await query;

      if (error) {
        throw new Error(
          error.message ||
            'فشل جلب تعليقات المنتجات'
        );
      }

      return data || [];
    }

    throw new Error(
      'قاعدة بيانات Supabase غير متصلة.'
    );
  },

  // 22.2 Admin: Create Product Comment
  async adminCreateProductComment(
    data: {
      product_id: string;
      customer_name: string;
      comment: string;
      status?: ProductComment['status'];
    }
  ): Promise<ProductComment> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      const {
        data: comment,
        error,
      } =
        await supabase
          .from(
            'product_comments'
          )
          .insert({
            product_id:
              data.product_id,
            customer_name:
              data.customer_name.trim(),
            comment:
              data.comment.trim(),
            status:
              data.status ||
              'approved',
          })
          .select()
          .single();

      if (
        error ||
        !comment
      ) {
        throw new Error(
          error?.message ||
            'فشل إضافة التعليق'
        );
      }

      return comment;
    }

    throw new Error(
      'قاعدة بيانات Supabase غير متصلة.'
    );
  },

  // 22.3 Admin: Update Product Comment
  async adminUpdateProductComment(
    id: string,
    updates: Partial<
      Pick<
        ProductComment,
        | 'customer_name'
        | 'comment'
        | 'status'
      >
    >
  ): Promise<ProductComment> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      const payload: Record<
        string,
        any
      > = {
        updated_at:
          new Date().toISOString(),
      };

      if (
        updates.customer_name !==
        undefined
      ) {
        payload.customer_name =
          updates.customer_name.trim();
      }

      if (
        updates.comment !==
        undefined
      ) {
        payload.comment =
          updates.comment.trim();
      }

      if (
        updates.status !==
        undefined
      ) {
        payload.status =
          updates.status;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'product_comments'
          )
          .update(
            payload
          )
          .eq(
            'id',
            id
          )
          .select()
          .single();

      if (
        error ||
        !data
      ) {
        throw new Error(
          error?.message ||
            'فشل تحديث التعليق'
        );
      }

      return data;
    }

    throw new Error(
      'قاعدة بيانات Supabase غير متصلة.'
    );
  },

  // 22.4 Admin: Delete Product Comment
  async adminDeleteProductComment(
    id: string
  ): Promise<void> {
    if (
      isSupabaseConfigured &&
      supabase
    ) {
      const {
        error,
      } =
        await supabase
          .from(
            'product_comments'
          )
          .delete()
          .eq(
            'id',
            id
          );

      if (error) {
        throw new Error(
          error.message ||
            'فشل حذف التعليق'
        );
      }

      return;
    }

    throw new Error(
      'قاعدة بيانات Supabase غير متصلة.'
    );
  },
};