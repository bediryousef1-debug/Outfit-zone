import { Category, ContactSocialSettings, Order, OrderCreateRequest, OrderCreateResponse, Product, StoreContent, StoreSettings } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const API_BASE = '/api';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        return headers;
      }
    } catch {
      // ignore
    }
  }

  // Fallback to local admin token from localStorage
  if (typeof window !== 'undefined') {
    const localToken = localStorage.getItem('outfit_zone_admin_token');
    if (localToken) {
      headers['Authorization'] = `Bearer ${localToken}`;
    }
  }

  return headers;
}

export const api = {
  // 1. Fetch Store Settings
  async getStoreSettings(): Promise<StoreSettings> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase getStoreSettings notice:', err);
      }
    }
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('فشل جلب إعدادات المتجر');
    return res.json();
  },

  // 2. Fetch Categories
  async getCategories(): Promise<Category[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('categories').select('*').eq('is_active', true).order('created_at', { ascending: true });
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase getCategories notice:', err);
      }
    }
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('فشل جلب الأقسام');
    return res.json();
  },

  // 3. Fetch Products (Single Source of Truth: Supabase or App Server)
  async getProducts(options?: { admin?: boolean }): Promise<Product[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('products')
          .select('*, category:categories(*), images:product_images(*), variants:product_variants(*)');

        if (!options?.admin) {
          query = query.eq('is_active', true);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map((p: any) => ({
            ...p,
            images: (p.images || []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
          }));
        }
      } catch (err) {
        console.warn('Supabase getProducts notice:', err);
      }
    }

    const res = await fetch(`${API_BASE}/products${options?.admin ? '?admin=true' : ''}`);
    if (!res.ok) throw new Error('فشل جلب المنتجات');
    return res.json();
  },

  // 4. Fetch Single Product By Slug
  async getProductBySlug(slug: string): Promise<Product> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, category:categories(*), images:product_images(*), variants:product_variants(*)')
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (!error && data) {
          return {
            ...data,
            images: (data.images || []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
          };
        }
      } catch (err) {
        console.warn('Supabase getProductBySlug notice:', err);
      }
    }

    const res = await fetch(`${API_BASE}/products/${slug}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'المنتج غير متوفر');
    }
    return res.json();
  },

  // 5. Submit Guest COD Order (Atomic Database RPC with seamless fallback)
  async submitGuestOrder(orderData: OrderCreateRequest): Promise<OrderCreateResponse> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('create_guest_order', {
          p_customer_name: orderData.customer.customer_name,
          p_phone: orderData.customer.phone,
          p_governorate: orderData.customer.governorate,
          p_city: orderData.customer.city,
          p_address: orderData.customer.address,
          p_notes: orderData.customer.notes || null,
          p_items: orderData.items,
        });

        if (!error && data && data.success) {
          return data;
        }
        if (error) {
          console.warn('Supabase create_guest_order RPC failed, trying server API:', error);
        }
      } catch (rpcErr) {
        console.warn('Supabase create_guest_order call failed:', rpcErr);
      }
    }

    // Server-side order endpoint (handles DB insertion and file persistence)
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'تعذر إتمام الطلب، يرجى المحاولة مرة أخرى.');
    }
    return data;
  },

  // 6. Lookup Guest Order by Order Number (Secure receipt lookup)
  async lookupOrder(orderNumber: string): Promise<Order> {
    const cleanNum = orderNumber.trim();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('get_guest_order_receipt', {
          p_order_number: cleanNum,
        });
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase get_guest_order_receipt notice:', err);
      }
    }

    const res = await fetch(`${API_BASE}/orders/lookup/${cleanNum}`);
    if (!res.ok) throw new Error('الطلب غير موجود');
    return res.json();
  },

  // 7. Verify Admin User
  async verifyAdmin(email: string): Promise<{ authorized: boolean; user?: any; error?: string }> {
    const cleanEmail = email.toLowerCase().trim();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('id, email, created_at')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (!error && data) {
          return { authorized: true, user: data };
        }
      } catch (err) {
        console.warn('Supabase admin_users check notice:', err);
      }
    }

    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/verify`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ email: cleanEmail }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { authorized: false, error: err.error || 'غير مصرح لك بالوصول إلى لوحة التحكم.' };
    }
    return res.json();
  },

  // 8. Admin: Get Orders (RLS Enforced with server fallback)
  async adminGetOrders(filters?: { status?: string; search?: string }): Promise<Order[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        const { data, error } = await query;
        if (!error && data && Array.isArray(data)) {
          let list = data;
          if (filters?.search) {
            const s = filters.search.toLowerCase().trim();
            list = list.filter(
              (o: any) =>
                o.order_number?.toLowerCase().includes(s) ||
                o.customer_name?.toLowerCase().includes(s) ||
                o.phone?.includes(s) ||
                o.city?.toLowerCase().includes(s) ||
                o.governorate?.toLowerCase().includes(s)
            );
          }
          return list;
        }
        if (error) {
          console.warn('Supabase adminGetOrders query warning:', error);
        }
      } catch (err) {
        console.warn('Supabase adminGetOrders call warning:', err);
      }
    }

    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/orders?${params.toString()}`, {
      headers: authHeaders,
    });
    if (!res.ok) throw new Error('فشل جلب الطلبات');
    return res.json();
  },

  // 8.1 Admin: Get Order By ID
  async adminGetOrderById(orderId: string): Promise<Order> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .or(`id.eq.${orderId},order_number.eq.${orderId}`)
          .maybeSingle();

        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase getOrderById notice:', err);
      }
    }

    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/orders/${orderId}`, {
      headers: authHeaders,
    });
    if (res.ok) return res.json();

    // Fallback: search in full order list
    const all = await this.adminGetOrders();
    const found = all.find((o) => o.id === orderId || o.order_number === orderId);
    if (found) return found;

    throw new Error('الطلب غير موجود');
  },

  // 9. Admin: Update Order Status (RLS Enforced + History Audit)
  async adminUpdateOrderStatus(orderId: string, status: string, changedBy = 'admin'): Promise<Order> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', orderId)
          .select('*, order_items(*)')
          .single();

        if (!error && data) {
          await supabase.from('order_status_history').insert({
            order_id: orderId,
            status,
            changed_by: changedBy,
          });
          return data;
        }
      } catch (err) {
        console.warn('Supabase adminUpdateOrderStatus notice:', err);
      }
    }

    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status, changed_by: changedBy }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل تحديث حالة الطلب');
    }
    return res.json();
  },

  // 9.1 Admin: Delete Order (Supabase RLS & Server Enforced)
  async adminDeleteOrder(orderId: string): Promise<{ success: boolean; message?: string }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: ord } = await supabase
          .from('orders')
          .select('id, order_number')
          .or(`id.eq.${orderId},order_number.eq.${orderId}`)
          .maybeSingle();

        const targetId = ord?.id || orderId;

        // Cascade deletes
        await supabase.from('order_status_history').delete().eq('order_id', targetId);
        await supabase.from('order_items').delete().eq('order_id', targetId);
        const { error: delErr } = await supabase.from('orders').delete().eq('id', targetId);

        if (delErr) {
          console.warn('Supabase adminDeleteOrder notice:', delErr);
        }
      } catch (err) {
        console.warn('Supabase adminDeleteOrder call notice:', err);
      }
    }

    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/orders/${orderId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل حذف الطلب');
    }
    return res.json();
  },

  // 10. Admin: Create Product
  async adminCreateProduct(productData: any): Promise<Product> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: newProd, error: prodErr } = await supabase
          .from('products')
          .insert({
            name: productData.name,
            slug: productData.slug,
            description: productData.description || '',
            fabric_details: productData.fabric_details || '',
            price: productData.price,
            compare_at_price: productData.compare_at_price || null,
            category_id: productData.category_id,
            is_active: productData.is_active ?? true,
            is_featured: productData.is_featured ?? false,
            is_new: productData.is_new ?? false,
          })
          .select()
          .single();

        if (!prodErr && newProd) {
          if (Array.isArray(productData.images) && productData.images.length > 0) {
            await supabase.from('product_images').insert(
              productData.images.map((img: any, idx: number) => ({
                product_id: newProd.id,
                image_url: img.image_url,
                sort_order: idx,
                is_primary: idx === 0 || img.is_primary,
              }))
            );
          }

          if (Array.isArray(productData.variants) && productData.variants.length > 0) {
            await supabase.from('product_variants').insert(
              productData.variants.map((v: any) => ({
                product_id: newProd.id,
                color: v.color,
                size: v.size,
                stock_quantity: Number(v.stock_quantity) || 0,
              }))
            );
          }

          return newProd;
        }
      } catch (err) {
        console.warn('Supabase adminCreateProduct notice:', err);
      }
    }

    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/products`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(productData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل إنشاء المنتج');
    }
    return res.json();
  },

  // 11. Admin: Update Product
  async adminUpdateProduct(id: string, productData: any): Promise<Product> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: updatedProd, error: prodErr } = await supabase
          .from('products')
          .update({
            name: productData.name,
            slug: productData.slug,
            description: productData.description,
            fabric_details: productData.fabric_details,
            price: productData.price,
            compare_at_price: productData.compare_at_price,
            category_id: productData.category_id,
            is_active: productData.is_active,
            is_featured: productData.is_featured,
            is_new: productData.is_new,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (!prodErr && updatedProd) {
          if (Array.isArray(productData.images)) {
            await supabase.from('product_images').delete().eq('product_id', id);
            if (productData.images.length > 0) {
              await supabase.from('product_images').insert(
                productData.images.map((img: any, idx: number) => ({
                  product_id: id,
                  image_url: img.image_url,
                  sort_order: idx,
                  is_primary: idx === 0 || img.is_primary,
                }))
              );
            }
          }

          if (Array.isArray(productData.variants)) {
            await supabase.from('product_variants').delete().eq('product_id', id);
            if (productData.variants.length > 0) {
              await supabase.from('product_variants').insert(
                productData.variants.map((v: any) => ({
                  product_id: id,
                  color: v.color,
                  size: v.size,
                  stock_quantity: Number(v.stock_quantity) || 0,
                }))
              );
            }
          }

          return updatedProd;
        }
      } catch (err) {
        console.warn('Supabase adminUpdateProduct notice:', err);
      }
    }

    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/products/${id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(productData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل تحديث المنتج');
    }
    return res.json();
  },

  // 12. Admin: Archive Product (Soft Delete is_active = false)
  async adminArchiveProduct(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('products')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (!error) return;
      } catch (err) {
        console.warn('Supabase adminArchiveProduct notice:', err);
      }
    }

    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/products/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل أرشفة المنتج');
    }
  },

  // 13. Admin: Update Store Settings
  async adminUpdateSettings(settingsData: Partial<StoreSettings>): Promise<StoreSettings> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .update({
            store_name: settingsData.store_name,
            shipping_fee: settingsData.shipping_fee,
            whatsapp_number: settingsData.whatsapp_number,
            phone_number: settingsData.phone_number,
            inspection_available: settingsData.inspection_available,
            exchange_policy: settingsData.exchange_policy,
            return_policy: settingsData.return_policy,
            cod_message: settingsData.cod_message,
            updated_at: new Date().toISOString(),
          })
          .neq('id', '00000000-0000-0000-0000-000000000000')
          .select()
          .single();

        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase adminUpdateSettings notice:', err);
      }
    }

    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(settingsData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل تحديث الإعدادات');
    }
    return res.json();
  },

  // 14. Store Content CMS (Get & Admin Update)
  async getStoreContent(): Promise<StoreContent> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('store_content').select('*').limit(1).maybeSingle();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase getStoreContent notice:', err);
      }
    }
    const res = await fetch(`${API_BASE}/content`);
    if (!res.ok) throw new Error('فشل جلب محتوى المتجر');
    return res.json();
  },

  async adminUpdateStoreContent(contentData: Partial<StoreContent>): Promise<StoreContent> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('store_content')
          .update({
            ...contentData,
            updated_at: new Date().toISOString(),
          })
          .neq('id', '00000000-0000-0000-0000-000000000000')
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase adminUpdateStoreContent notice:', err);
      }
    }

    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/content`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(contentData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل تحديث محتوى المتجر');
    }
    return res.json();
  },

  // 15. Contact & Social Settings (Get & Admin Update)
  async getContactSocial(): Promise<ContactSocialSettings> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('contact_social_settings').select('*').limit(1).maybeSingle();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase getContactSocial notice:', err);
      }
    }
    const res = await fetch(`${API_BASE}/contact-social`);
    if (!res.ok) throw new Error('فشل جلب بيانات التواصل والسوشيال');
    return res.json();
  },

  async adminUpdateContactSocial(socialData: Partial<ContactSocialSettings>): Promise<ContactSocialSettings> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('contact_social_settings')
          .update({
            ...socialData,
            updated_at: new Date().toISOString(),
          })
          .neq('id', '00000000-0000-0000-0000-000000000000')
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase adminUpdateContactSocial notice:', err);
      }
    }

    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/contact-social`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(socialData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل تحديث بيانات التواصل');
    }
    return res.json();
  },

  // 16. Admin Category Management
  async adminGetCategories(): Promise<Category[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase adminGetCategories notice:', err);
      }
    }
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/categories`, { headers: authHeaders });
    if (!res.ok) throw new Error('فشل جلب الأقسام');
    return res.json();
  },

  async adminCreateCategory(catData: { name: string; slug: string; image_url?: string }): Promise<Category> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .insert({
            name: catData.name,
            slug: catData.slug,
            image_url: catData.image_url || null,
            is_active: true,
          })
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase adminCreateCategory notice:', err);
      }
    }

    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/categories`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(catData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل إضافة القسم');
    }
    return res.json();
  },

  async adminUpdateCategory(id: string, catData: Partial<Category>): Promise<Category> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .update({
            name: catData.name,
            slug: catData.slug,
            image_url: catData.image_url,
            is_active: catData.is_active,
          })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase adminUpdateCategory notice:', err);
      }
    }

    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(catData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل تحديث القسم');
    }
    return res.json();
  },

  async adminArchiveCategory(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('categories')
          .update({ is_active: false })
          .eq('id', id);
        if (!error) return;
      } catch (err) {
        console.warn('Supabase adminArchiveCategory notice:', err);
      }
    }

    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل أرشفة القسم');
    }
  },
};
