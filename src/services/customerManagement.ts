/**
 * Outfit Zone - Telegram Customer Management Service
 *
 * Provides:
 * 1. Egyptian phone normalization (recognizes all Egyptian phone formats: 010..., +20..., 20..., 0020..., etc.)
 * 2. Automatic Customer tracking & history linking (starts clean from activation, never alters/breaks order flow)
 * 3. Multiple names tracking (records distinct names used with the same phone without penalizing customer)
 * 4. Telegram Admin authorization via TELEGRAM_ADMIN_USER_IDS
 * 5. Telegram Customer Dashboard, Pagination, Search, and Profiles (/عميل, inline keyboards, callback queries)
 */

export interface CustomerRecord {
  id: string;
  normalized_phone: string;
  original_phone: string;
  current_name: string;
  names_used: string[];
  has_multiple_names: boolean;
  order_count: number;
  first_order_at: string;
  last_order_at: string;
  created_at: string;
  updated_at: string;
}

// ==============================================================================
// 1. Egyptian Phone Normalization
// ==============================================================================

/**
 * Normalizes any Egyptian phone number into standard 11-digit mobile format (01xxxxxxxxx).
 * Handles:
 * - 01012345678 -> 01012345678
 * - +201012345678 -> 01012345678
 * - 201012345678 -> 01012345678
 * - 00201012345678 -> 01012345678
 * - 1012345678 -> 01012345678
 * - +20 10 1234 5678 -> 01012345678
 * - Arabic / Persian numerals: ٠١٠١٢٣٤٥٦٧٨ -> 01012345678
 */
export function normalizePhone(rawPhone: string | undefined | null): string {
  if (!rawPhone) return '';

  let s = String(rawPhone).trim();

  // Convert Eastern Arabic & Persian numerals to standard ASCII digits
  const easternDigits: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  };
  s = s.replace(/[٠-٩۰-۹]/g, (d) => easternDigits[d] || d);

  // Strip all non-digit characters
  let digits = s.replace(/\D/g, '');

  // Strip leading international exit codes for Egypt (0020 or 20)
  if (digits.startsWith('0020')) {
    digits = digits.slice(4);
  } else if (digits.startsWith('20')) {
    digits = digits.slice(2);
  }

  // If 10 digits starting with 10, 11, 12, 15 (Egyptian mobile prefixes missing leading 0)
  if (digits.length === 10 && /^(10|11|12|15)/.test(digits)) {
    digits = '0' + digits;
  }

  // If 11 digits starting with 01, that is standard Egyptian mobile
  if (digits.length === 11 && digits.startsWith('01')) {
    return digits;
  }

  // If starts with 0 and length 11
  if (digits.startsWith('0') && digits.length === 11) {
    return digits;
  }

  // Fallback for 10 digits
  if (digits.length === 10) {
    return '0' + digits;
  }

  return digits || s;
}

// ==============================================================================
// 2. Telegram Admin Authorization
// ==============================================================================

/**
 * Reads TELEGRAM_ADMIN_USER_IDS from environment variables.
 * Can contain multiple comma, space, or semicolon-separated Telegram user IDs.
 * Example: TELEGRAM_ADMIN_USER_IDS=123456789,987654321
 */
export function getTelegramAdminUserIds(): string[] {
  const envVal = (process.env.TELEGRAM_ADMIN_USER_IDS || '').trim();
  if (!envVal) return [];

  // Accept both comma-separated IDs and JSON arrays, e.g. 123,456 or ["123","456"].
  if (envVal.startsWith('[')) {
    try {
      const parsed = JSON.parse(envVal);
      if (Array.isArray(parsed)) {
        return parsed.map((id) => String(id).trim()).filter(Boolean);
      }
    } catch {
      // Fall through to the plain-text parser for malformed JSON values.
    }
  }

  return envVal
    .replace(/^[\[\]"]+|[\[\]"]+$/g, '')
    .split(/[,;\s]+/)
    .map((s) => s.replace(/^["']|["']$/g, '').trim())
    .filter(Boolean);
}

/**
 * Checks whether the given Telegram sender ID is an authorized admin.
 * If TELEGRAM_ADMIN_USER_IDS is set, checks strictly against that list.
 * Fallback: If not configured, allows TELEGRAM_CHAT_ID as authorized admin.
 */
export function isTelegramAdmin(userId: number | string | undefined | null): boolean {
  if (!userId) return false;
  const adminIds = getTelegramAdminUserIds();
  const userStr = String(userId).trim();

  if (adminIds.length > 0) {
    return adminIds.includes(userStr);
  }

  const fallbackChatId = (process.env.TELEGRAM_CHAT_ID || '').trim();
  if (fallbackChatId && userStr === fallbackChatId) {
    return true;
  }

  return false;
}

// ==============================================================================
// 3. Formatting & Helpers
// ==============================================================================

export function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatEgyptianDateTime(isoString?: string | null): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function getOrderStatusArabic(status: string | undefined | null): string {
  switch (status) {
    case 'pending':
      return '⏳ قيد المراجعة';
    case 'confirmed':
      return '📦 جاري التجهيز';
    case 'shipped':
      return '🚚 خرج للشحن';
    case 'delivered':
      return '✅ تم التسليم';
    case 'cancelled':
      return '❌ ملغي';
    case 'returned':
      return '↩️ مرتجع';
    default:
      return status ? `⏳ ${status}` : 'قيد المراجعة';
  }
}

/**
 * Builds inline keyboard for changing order status directly from Telegram
 * 🆕 جديد / 📦 تجهيز / 🚚 شحن / ✅ تسليم / ❌ إلغاء / ↩️ مرتجع
 */
export function buildOrderStatusInlineKeyboard(orderNumber: string, currentStatus?: string): any {
  const statuses = [
    { key: 'pending', label: '🆕 جديد' },
    { key: 'confirmed', label: '📦 تجهيز' },
    { key: 'shipped', label: '🚚 شحن' },
    { key: 'delivered', label: '✅ تسليم' },
    { key: 'cancelled', label: '❌ إلغاء' },
    { key: 'returned', label: '↩️ مرتجع' },
  ];

  return {
    inline_keyboard: [
      statuses.slice(0, 3).map((s) => ({
        text: currentStatus === s.key ? `• ${s.label} •` : s.label,
        callback_data: `os:${orderNumber}:${s.key}`,
      })),
      statuses.slice(3, 6).map((s) => ({
        text: currentStatus === s.key ? `• ${s.label} •` : s.label,
        callback_data: `os:${orderNumber}:${s.key}`,
      })),
    ],
  };
}


export function buildOrdersListView(orders: any[], page = 1): { text: string; replyMarkup: any } {
  const pageSize = 8;
  const sorted = [...(orders || [])].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const visible = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  const statusCounts = {
    pending: sorted.filter((o) => o.status === 'pending' || !o.status).length,
    confirmed: sorted.filter((o) => o.status === 'confirmed').length,
    shipped: sorted.filter((o) => o.status === 'shipped').length,
  };
  const lines = [
    '📦 <b>إدارة الطلبات - Outfit Zone</b>',
    '',
    `إجمالي الطلبات: <b>${sorted.length}</b>`,
    `🆕 جديدة: <b>${statusCounts.pending}</b> · 📦 تجهيز: <b>${statusCounts.confirmed}</b> · 🚚 شحن: <b>${statusCounts.shipped}</b>`,
    '',
  ];
  if (!visible.length) {
    lines.push('لا توجد طلبات مسجلة حتى الآن.');
  } else {
    lines.push(`الصفحة ${safePage} من ${totalPages} — اضغط على الطلب لعرض التفاصيل:`, '');
    visible.forEach((o, idx) => {
      const identifier = String(o.order_number || o.id || '');
      const customer = escapeHtml(o.customer_name || o.name || 'عميل');
      const total = Number(o.total ?? o.total_amount ?? 0) || 0;
      lines.push(
        `${(safePage - 1) * pageSize + idx + 1}. <b>${escapeHtml(identifier || 'طلب بدون رقم')}</b>`,
        `   ${customer} · ${total.toFixed(2)} جنيه`,
        `   ${getOrderStatusArabic(o.status)} · ${formatEgyptianDateTime(o.created_at)}`
      );
    });
  }
  const keyboard: any[] = visible.map((o) => {
    const identifier = String(o.order_number || o.id || '');
    return [{ text: `🔎 ${identifier.slice(0, 45)}`, callback_data: `order:view:${identifier}:${safePage}` }];
  });
  const nav: any[] = [];
  if (safePage > 1) nav.push({ text: '⬅️ السابق', callback_data: `order:list:${safePage - 1}` });
  if (safePage < totalPages) nav.push({ text: 'التالي ➡️', callback_data: `order:list:${safePage + 1}` });
  if (nav.length) keyboard.push(nav);
  keyboard.push([{ text: '🔄 تحديث', callback_data: `order:list:${safePage}` }, { text: '🔙 لوحة العملاء', callback_data: 'cust:dash' }]);
  return { text: lines.join('\n'), replyMarkup: { inline_keyboard: keyboard } };
}

export function buildOrderDetailView(order: any, page = 1): { text: string; replyMarkup: any } {
  const identifier = String(order.order_number || order.id || '');
  const items = Array.isArray(order.order_items) ? order.order_items : Array.isArray(order.items) ? order.items : [];
  const itemLines = items.length
    ? items.map((item: any, index: number) => {
        const name = item.product_name || item.product_name_snapshot || item.name || item.title || 'منتج';
        const quantity = Number(item.quantity || item.qty || 1);
        const price = Number(item.price ?? item.unit_price ?? (Number(item.line_total || 0) / Math.max(1, quantity)));
        const variant = [item.color, item.size].filter(Boolean).join(' / ');
        return `${index + 1}. ${escapeHtml(name)}${variant ? ` (${escapeHtml(variant)})` : ''} — ${quantity} × ${price.toFixed(2)} جنيه`;
      })
    : ['تفاصيل المنتجات غير متاحة في سجل الطلب.'];
  const lines = [
    '🧾 <b>تفاصيل الطلب</b>',
    '',
    `• رقم الطلب: <code>${escapeHtml(identifier)}</code>`,
    `• العميل: <b>${escapeHtml(order.customer_name || order.name || '-')}</b>`,
    `• الهاتف: <code>${escapeHtml(order.phone || order.customer_phone || '-')}</code>`,
    `• العنوان: ${escapeHtml(order.address || order.shipping_address || order.location || '-')}`,
    `• الحالة: ${getOrderStatusArabic(order.status)}`,
    `• الإجمالي: <b>${(Number(order.total ?? order.total_amount ?? 0) || 0).toFixed(2)} جنيه</b>`,
    `• الدفع: ${escapeHtml(order.payment_method || 'الدفع عند الاستلام')}`,
    `• تاريخ الطلب: ${formatEgyptianDateTime(order.created_at)}`,
    '',
    '<b>المنتجات:</b>',
    ...itemLines,
  ];
  if (order.notes) lines.push('', `• ملاحظات: ${escapeHtml(order.notes)}`);
  const keyboard = buildOrderStatusInlineKeyboard(identifier, order.status).inline_keyboard;
  keyboard.push([{ text: '⬅️ رجوع لقائمة الطلبات', callback_data: `order:list:${page}` }]);
  return { text: lines.join('\n'), replyMarkup: { inline_keyboard: keyboard } };
}

// ==============================================================================
// 4. Telegram API Helpers
// ==============================================================================

export async function callTelegramApi(method: string, payload: Record<string, any>) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) {
    console.warn(`[Telegram Bot] Cannot call ${method}: TELEGRAM_BOT_TOKEN is missing.`);
    return null;
  }

  const url = `https://api.telegram.org/bot${botToken}/${method}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.ok) {
      console.warn(`[Telegram Bot] Error from ${method}:`, data.description);
    }
    return data;
  } catch (err) {
    console.error(`[Telegram Bot] Network error calling ${method}:`, err);
    return null;
  }
}

export async function telegramSendMessage(
  chatId: string | number,
  text: string,
  replyMarkup?: any
) {
  return callTelegramApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
    disable_web_page_preview: true,
  });
}

export async function telegramEditMessageText(
  chatId: string | number,
  messageId: number,
  text: string,
  replyMarkup?: any
) {
  const res = await callTelegramApi('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
    disable_web_page_preview: true,
  });

  if (res && !res.ok && res.description?.includes('message is not modified')) {
    return { ok: true, not_modified: true };
  }

  // Several Telegram clients cannot edit a previously sent message in some contexts.
  // Keep buttons functional by posting the updated view as a new message if editing fails.
  if (res && !res.ok) {
    console.warn('[Telegram Bot] editMessageText failed; trying sendMessage fallback:', res.description);
    const fallback = await telegramSendMessage(chatId, text, replyMarkup);
    if (fallback?.ok) return { ok: true, fallback_sent: true };
    console.warn('[Telegram Bot] sendMessage fallback also failed:', fallback?.description || 'no Telegram response');
  }

  return res;
}

export async function telegramAnswerCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert = false
) {
  return callTelegramApi('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text,
    show_alert: showAlert,
  });
}

// ==============================================================================
// 5. Customer Record Linking & Authoritative Store
// ==============================================================================

/**
 * Dynamically derives normalized customer records from existing orders.
 * Ensures 100% data consistency even if customers table is empty or unpopulated.
 */
export function deriveCustomersFromOrders(orders: any[]): CustomerRecord[] {
  const map = new Map<
    string,
    {
      normalized_phone: string;
      original_phone: string;
      names: Set<string>;
      latestName: string;
      ordersCount: number;
      firstOrderAt: string;
      lastOrderAt: string;
    }
  >();

  for (const o of orders) {
    if (!o.phone) continue;
    const norm = normalizePhone(o.phone);
    if (!norm) continue;

    const existing = map.get(norm);
    const orderDate = o.created_at || new Date().toISOString();
    const name = (o.customer_name || '').trim();

    if (!existing) {
      const names = new Set<string>();
      if (name) names.add(name);
      map.set(norm, {
        normalized_phone: norm,
        original_phone: o.phone,
        names,
        latestName: name || 'عميل Outfit Zone',
        ordersCount: 1,
        firstOrderAt: orderDate,
        lastOrderAt: orderDate,
      });
    } else {
      if (name) existing.names.add(name);
      existing.ordersCount++;
      if (new Date(orderDate).getTime() > new Date(existing.lastOrderAt).getTime()) {
        existing.lastOrderAt = orderDate;
        if (name) existing.latestName = name;
      }
      if (new Date(orderDate).getTime() < new Date(existing.firstOrderAt).getTime()) {
        existing.firstOrderAt = orderDate;
      }
    }
  }

  const list: CustomerRecord[] = [];
  for (const [norm, data] of map.entries()) {
    const namesArr = Array.from(data.names);
    list.push({
      id: `cust_${norm}`,
      normalized_phone: norm,
      original_phone: data.original_phone,
      current_name: data.latestName,
      names_used: namesArr.length > 0 ? namesArr : [data.latestName],
      has_multiple_names: namesArr.length > 1,
      order_count: data.ordersCount,
      first_order_at: data.firstOrderAt,
      last_order_at: data.lastOrderAt,
      created_at: data.firstOrderAt,
      updated_at: data.lastOrderAt,
    });
  }

  return list;
}

/**
 * Reads customers from authoritative store (Supabase when configured, fallback to db.customers).
 * Synchronizes db.customers in-memory cache and file to eliminate stale or ghost records.
 */
export async function getAuthoritativeCustomers(
  db: {
    customers: CustomerRecord[];
    orders: any[];
  },
  supabaseClient?: any,
  saveToFile?: (filename: string, data: any) => void
): Promise<CustomerRecord[]> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('customers')
        .select('*')
        .order('last_order_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const formatted: CustomerRecord[] = data.map((item: any) => {
          let namesUsed: string[] = [];
          if (Array.isArray(item.names_used)) {
            namesUsed = item.names_used;
          } else if (typeof item.names_used === 'string') {
            try {
              const parsed = JSON.parse(item.names_used);
              namesUsed = Array.isArray(parsed) ? parsed : [item.names_used];
            } catch {
              namesUsed = [item.names_used];
            }
          }
          if (namesUsed.length === 0 && item.current_name) {
            namesUsed = [item.current_name];
          }

          return {
            id: String(item.id),
            normalized_phone: item.normalized_phone,
            original_phone: item.original_phone || item.normalized_phone,
            current_name: item.current_name || '',
            names_used: namesUsed,
            has_multiple_names: Boolean(item.has_multiple_names || namesUsed.length > 1),
            order_count: Number(item.order_count) || 1,
            first_order_at: item.first_order_at || item.created_at || new Date().toISOString(),
            last_order_at: item.last_order_at || item.updated_at || new Date().toISOString(),
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString(),
          };
        });

        db.customers = formatted;
        if (saveToFile) {
          saveToFile('customers.json', formatted);
        }
        return formatted;
      }
      if (error) {
        console.warn('[Customer Management] Supabase customers select error:', error.message);
      }
    } catch (err) {
      console.warn('[Customer Management] Supabase customers query error:', err);
    }
  }

  // Fallback: If db.customers is empty or unpopulated, derive from authoritative orders
  if ((!db.customers || db.customers.length === 0) && db.orders && db.orders.length > 0) {
    const derived = deriveCustomersFromOrders(db.orders);
    db.customers = derived;
    if (saveToFile) {
      saveToFile('customers.json', derived);
    }
  }

  return db.customers || [];
}

/**
 * Reads coupons from authoritative store (Supabase when configured, fallback to db.coupons).
 */
export async function getAuthoritativeCoupons(
  db: {
    coupons?: any[];
  },
  supabaseClient?: any,
  saveToFile?: (filename: string, data: any) => void
): Promise<any[]> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        db.coupons = data;
        if (saveToFile) {
          saveToFile('coupons.json', data);
        }
        return data;
      }
    } catch {
      // Supabase table may not exist, fallback safely
    }
  }

  return db.coupons || [];
}


/**
 * Reads actual existing orders from authoritative store (Supabase when configured, fallback to db.orders).
 * Excludes deleted orders and queries the actual rows in Supabase.
 */
export async function getAuthoritativeOrders(
  db: {
    orders: any[];
  },
  supabaseClient?: any,
  saveToFile?: (filename: string, data: any) => void
): Promise<any[]> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        db.orders = data;
        if (saveToFile) {
          saveToFile('orders.json', data);
        }
        return data;
      } else if (error) {
        console.warn('[Customer Management] Supabase orders select notice:', error.message);
      }
    } catch (err) {
      console.warn('[Customer Management] Supabase orders query error:', err);
    }
  }

  return db.orders;
}

/**
 * Calculates customer actual orders count from the authoritative orders list.
 */
export function getCustomerActualOrderCount(customer: CustomerRecord, orders?: any[]): number {
  if (orders && Array.isArray(orders)) {
    return orders.filter(
      (o) =>
        (o as any).customer_id === customer.id ||
        (customer.normalized_phone && normalizePhone(o.phone) === customer.normalized_phone) ||
        (customer.original_phone && o.phone === customer.original_phone)
    ).length;
  }
  return customer.order_count || 0;
}

/**
 * Authoritatively deletes a customer from Supabase and local cache.
 */
export async function deleteCustomerAuthoritative(
  identifier: string,
  db: {
    customers: CustomerRecord[];
    orders: any[];
  },
  supabaseClient?: any,
  saveToFile?: (filename: string, data: any) => void
): Promise<boolean> {
  const normalized = normalizePhone(identifier);

  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('customers')
        .delete()
        .or(`id.eq.${identifier},normalized_phone.eq.${normalized || identifier},original_phone.eq.${identifier}`);

      if (error) {
        console.warn('[Customer Management] Supabase delete error:', error.message);
      }
    } catch (err) {
      console.error('[Customer Management] Supabase delete error:', err);
    }
  }

  // Remove from local in-memory db
  db.customers = db.customers.filter(
    (c) =>
      c.id !== identifier &&
      c.normalized_phone !== normalized &&
      c.original_phone !== identifier
  );

  if (saveToFile) {
    saveToFile('customers.json', db.customers);
  }

  // Unlink customer from orders
  db.orders.forEach((o: any) => {
    if (o.customer_id === identifier || normalizePhone(o.phone) === normalized) {
      o.customer_id = null;
    }
  });

  if (saveToFile) {
    saveToFile('orders.json', db.orders);
  }

  return true;
}

/**
 * Updates order status authoritatively across Supabase and in-memory store.
 * Updates order_status_history and ensures Admin UI and Telegram remain in 100% sync.
 */
export async function updateOrderStatusAuthoritative(
  orderIdentifier: string,
  newStatus: string,
  db: {
    orders: any[];
    order_status_history?: any[];
  },
  supabaseClient?: any,
  saveToFile?: (filename: string, data: any) => void,
  changedBy: string = 'telegram_admin'
): Promise<any> {
  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`حالة الطلب غير صالحة: ${newStatus}`);
  }

  const nowIso = new Date().toISOString();
  let updatedOrder: any = null;

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('orders')
        .update({
          status: newStatus,
          updated_at: nowIso,
        })
        .or(`id.eq.${orderIdentifier},order_number.eq.${orderIdentifier}`)
        .select('*, order_items(*)')
        .maybeSingle();

      if (!error && data) {
        updatedOrder = data;

        const { error: historyError } = await supabaseClient
          .from('order_status_history')
          .insert({
            order_id: data.id,
            status: newStatus,
            changed_by: changedBy,
          });
        if (historyError) {
          console.warn('[Status Update] Supabase status history insert notice:', historyError.message);
        }
      }
    } catch (supaErr) {
      console.warn('[Status Update] Supabase update notice:', supaErr);
    }
  }

  // Do not report success unless the authoritative Supabase update returned the order.
  if (supabaseClient && !updatedOrder) {
    throw new Error('لم يتم حفظ تغيير الحالة في قاعدة البيانات. تأكد من رقم الطلب وصلاحيات التحديث.');
  }

  // Update in-memory db.orders
  const idx = db.orders.findIndex(
    (o: any) => o.id === orderIdentifier || o.order_number === orderIdentifier
  );

  if (idx > -1) {
    db.orders[idx].status = newStatus;
    db.orders[idx].updated_at = nowIso;
    if (!updatedOrder) {
      updatedOrder = db.orders[idx];
    }
  }

  if (saveToFile) {
    saveToFile('orders.json', db.orders);
  }

  // Append to order_status_history if exists
  if (db.order_status_history) {
    db.order_status_history.push({
      id: `hist_${Date.now()}`,
      order_id: updatedOrder?.id || orderIdentifier,
      status: newStatus,
      created_at: nowIso,
      changed_by: changedBy,
    });
    if (saveToFile) {
      saveToFile('order_status_history.json', db.order_status_history);
    }
  }

  return updatedOrder;
}

/**
 * Generates Daily Sales Summary for Telegram
 */
export function buildDailyReport(
  orders: any[],
  customers: CustomerRecord[],
  targetDateStr?: string
): { text: string; replyMarkup: any } {
  const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
  const egyptDateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(targetDate);
  const dateKey = `${egyptDateParts.find((p) => p.type === 'year')?.value}-${egyptDateParts.find((p) => p.type === 'month')?.value}-${egyptDateParts.find((p) => p.type === 'day')?.value}`;

  const todayOrders = (orders || []).filter((o) => {
    if (!o.created_at) return false;
    const orderDateParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date(o.created_at));
    const orderDateKey = `${orderDateParts.find((p) => p.type === 'year')?.value}-${orderDateParts.find((p) => p.type === 'month')?.value}-${orderDateParts.find((p) => p.type === 'day')?.value}`;
    return orderDateKey === dateKey;
  });

  const totalOrders = todayOrders.length;
  const validOrders = todayOrders.filter((o) => o.status !== 'cancelled' && o.status !== 'returned');
  const totalSales = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const deliveredCount = todayOrders.filter((o) => o.status === 'delivered').length;
  const inProgressCount = todayOrders.filter((o) => o.status === 'confirmed' || o.status === 'shipped').length;
  const pendingCount = todayOrders.filter((o) => o.status === 'pending').length;
  const cancelledCount = todayOrders.filter((o) => o.status === 'cancelled').length;
  const returnedCount = todayOrders.filter((o) => o.status === 'returned').length;

  let newCustomersCount = 0;
  let repeatCustomersCount = 0;
  const seenPhones = new Set<string>();

  todayOrders.forEach((o) => {
    const norm = normalizePhone(o.phone);
    if (!norm || seenPhones.has(norm)) return;
    seenPhones.add(norm);

    const cust = customers.find((c) => c.normalized_phone === norm);
    const count = cust ? getCustomerActualOrderCount(cust, orders) : 1;
    if (count <= 1) {
      newCustomersCount++;
    } else {
      repeatCustomersCount++;
    }
  });

  // Top products
  const productCounts: Record<string, number> = {};
  todayOrders.forEach((o) => {
    const items = o.order_items || o.items || [];
    items.forEach((item: any) => {
      const name = item.product_name || item.product_name_snapshot || 'موديل Outfit Zone';
      productCounts[name] = (productCounts[name] || 0) + (Number(item.quantity) || 1);
    });
  });

  const sortedProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topProductsLines =
    sortedProducts.length > 0
      ? sortedProducts.map(([name, qty], i) => `  ${i + 1}. <b>${escapeHtml(name)}</b>: ${qty} قطع`).join('\n')
      : '  <i>لا توجد مبيعات مسجلة حتى الآن اليوم.</i>';

  const dateFormatted = targetDate.toLocaleDateString('ar-EG', {
    timeZone: 'Africa/Cairo',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lines = [
    '📊 <b>Outfit Zone — التقرير اليومي للمبيعات</b>',
    `📅 التاريخ: <b>${dateFormatted}</b>`,
    '─────────────────────────',
    `📦 إجمالي الطلبات اليوم: <b>${totalOrders}</b>`,
    `💰 إجمالي المبيعات: <b>${totalSales.toFixed(2)} جنيه</b>`,
    `✅ طلبات تم تسليمها: <b>${deliveredCount}</b>`,
    `🚚 قيد التجهيز والشحن: <b>${inProgressCount}</b>`,
    `⏳ قيد المراجعة: <b>${pendingCount}</b>`,
    `❌ طلبات ملغاة: <b>${cancelledCount}</b>`,
    `↩️ طلبات مرتجعة: <b>${returnedCount}</b>`,
    '─────────────────────────',
    '👥 <b>حركة العملاء اليوم:</b>',
    `• عملاء جدد: <b>${newCustomersCount}</b>`,
    `• عملاء متكررون: <b>${repeatCustomersCount}</b>`,
    '─────────────────────────',
    '🔥 <b>أكثر المنتجات طلباً اليوم:</b>',
    topProductsLines,
    '─────────────────────────',
  ];

  const inline_keyboard = [
    [
      { text: '🔄 تحديث التقرير', callback_data: 'report:refresh' },
      { text: '🔙 لوحة العملاء', callback_data: 'cust:dash' },
    ],
  ];

  return { text: lines.join('\n'), replyMarkup: { inline_keyboard } };
}


export async function recordCustomerFromOrder(
  order: {
    id?: string;
    order_number: string;
    customer_name: string;
    phone: string;
    created_at?: string;
  },
  db: {
    customers: CustomerRecord[];
    orders: any[];
  },
  saveToFile: (filename: string, data: any) => void,
  supabaseClient?: any
): Promise<CustomerRecord | null> {
  try {
    const normalized = normalizePhone(order.phone);
    if (!normalized) {
      console.warn(`[Customer Management] Invalid phone for order ${order.order_number}: ${order.phone}`);
      return null;
    }

    const trimmedName = (order.customer_name || '').trim();
    const now = new Date().toISOString();
    const orderDate = order.created_at || now;

    // Check existing customer in authoritative Supabase store if available
    let customer: CustomerRecord | undefined = undefined;
    let supabaseCustomerLookupSucceeded = false;
    if (supabaseClient) {
      try {
        const { data: supaCust, error: customerLookupError } = await supabaseClient
          .from('customers')
          .select('*')
          .eq('normalized_phone', normalized)
          .maybeSingle();

        if (customerLookupError) {
          console.warn('[Customer Management] Supabase customer lookup failed:', customerLookupError.message);
        } else {
          supabaseCustomerLookupSucceeded = true;
        }

        if (supaCust) {
          customer = {
            id: String(supaCust.id),
            normalized_phone: supaCust.normalized_phone,
            original_phone: supaCust.original_phone || order.phone,
            current_name: supaCust.current_name || trimmedName,
            names_used: Array.isArray(supaCust.names_used)
              ? supaCust.names_used
              : [supaCust.current_name || trimmedName].filter(Boolean),
            has_multiple_names: Boolean(supaCust.has_multiple_names),
            order_count: Number(supaCust.order_count) || 1,
            first_order_at: supaCust.first_order_at || orderDate,
            last_order_at: supaCust.last_order_at || orderDate,
            created_at: supaCust.created_at || now,
            updated_at: supaCust.updated_at || now,
          };
        } else if (!customerLookupError) {
          // Supabase is authoritative. Do not reuse derived/local-only customers here:
          // derived IDs such as "cust_010..." are not UUIDs and cannot be inserted into customers.id.
          db.customers = db.customers.filter((c) => c.normalized_phone !== normalized);
        }
      } catch (checkErr) {
        console.warn('[Customer Management] Supabase customer pre-check notice:', checkErr);
      }
    }

    if (!customer && (!supabaseClient || !supabaseCustomerLookupSucceeded)) {
      customer = db.customers.find((c) => c.normalized_phone === normalized);
    }

    if (!customer) {
      // 1. Create new customer
      customer = {
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `cust_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        normalized_phone: normalized,
        original_phone: order.phone,
        current_name: trimmedName,
        names_used: trimmedName ? [trimmedName] : [],
        has_multiple_names: false,
        order_count: 1,
        first_order_at: orderDate,
        last_order_at: orderDate,
        created_at: now,
        updated_at: now,
      };

      db.customers.unshift(customer);
      console.log(`[Customer Management] Created new customer: ${customer.id} (${normalized})`);
    } else {
      // 2. Update existing customer
      customer.order_count = (customer.order_count || 0) + 1;
      customer.last_order_at = orderDate;
      customer.updated_at = now;
      customer.original_phone = order.phone;

      if (trimmedName) {
        customer.current_name = trimmedName;
        if (!customer.names_used.includes(trimmedName)) {
          customer.names_used.push(trimmedName);
        }
      }
      customer.has_multiple_names = customer.names_used.length > 1;

      console.log(
        `[Customer Management] Updated customer ${customer.id} (${normalized}) - total orders: ${customer.order_count}, names: ${customer.names_used.length}`
      );
    }

    // Persist to local JSON database
    saveToFile('customers.json', db.customers);

    // Link customer_id to order in db.orders
    const targetOrder = db.orders.find(
      (o) => o.order_number === order.order_number || (order.id && o.id === order.id)
    );
    if (targetOrder) {
      targetOrder.customer_id = customer.id;
      saveToFile('orders.json', db.orders);
    }

    // Safely sync to Supabase if available without throwing
    if (supabaseClient) {
      try {
        const { data: supaCust } = await supabaseClient
          .from('customers')
          .select('*')
          .eq('normalized_phone', normalized)
          .maybeSingle();

        if (supaCust) {
          const names: string[] = Array.isArray(supaCust.names_used) ? supaCust.names_used : [];
          if (trimmedName && !names.includes(trimmedName)) {
            names.push(trimmedName);
          }
          const hasMultiple = names.length > 1;

          const { data: updatedCust } = await supabaseClient
            .from('customers')
            .update({
              current_name: trimmedName || supaCust.current_name,
              names_used: names,
              has_multiple_names: hasMultiple,
              order_count: (supaCust.order_count || 0) + 1,
              last_order_at: orderDate,
              updated_at: now,
              original_phone: order.phone,
            })
            .eq('id', supaCust.id)
            .select()
            .single();

          if (updatedCust && order.id) {
            await supabaseClient
              .from('orders')
              .update({ customer_id: updatedCust.id })
              .eq('id', order.id);
          }
        } else {
          const { data: createdCust } = await supabaseClient
            .from('customers')
            .insert({
              id: customer.id,
              normalized_phone: normalized,
              original_phone: order.phone,
              current_name: trimmedName,
              names_used: trimmedName ? [trimmedName] : [],
              has_multiple_names: false,
              order_count: 1,
              first_order_at: orderDate,
              last_order_at: orderDate,
              created_at: now,
              updated_at: now,
            })
            .select()
            .single();

          if (createdCust && order.id) {
            await supabaseClient
              .from('orders')
              .update({ customer_id: createdCust.id })
              .eq('id', order.id);
          }
        }
      } catch (supaErr) {
        console.warn('[Customer Management] Supabase sync error (non-fatal):', supaErr);
      }
    }

    return customer;
  } catch (err) {
    console.error('[Customer Management] Error recording customer (non-fatal):', err);
    return null;
  }
}

// ==============================================================================
// 6. Telegram Views & UI Components
// ==============================================================================

/**
 * Builds the main Dashboard View (/عميل)
 */
export function buildCustomerDashboardView(
  customers: CustomerRecord[],
  orders: any[]
): { text: string; replyMarkup: any } {
  const totalCustomers = customers.length;
  const totalOrders = orders.length;
  const repeatCustomers = customers.filter(
    (c) => getCustomerActualOrderCount(c, orders) > 1
  ).length;
  const multiNames = customers.filter(
    (c) => c.has_multiple_names || (c.names_used && c.names_used.length > 1)
  ).length;

  const couponOrders = orders.filter((o) => o.coupon_code && Number(o.discount_amount) > 0);
  const totalCouponUses = couponOrders.length;
  const totalDiscountsValue = couponOrders.reduce(
    (sum, o) => sum + (Number(o.discount_amount) || 0),
    0
  );

  const text = [
    '👥 <b>إدارة العملاء والكوبونات - Outfit Zone</b>',
    '',
    '📊 <b>إحصائيات Dashboard (بيانات فعلية مباشرة):</b>',
    `• إجمالي العملاء: <b>${totalCustomers}</b>`,
    `• إجمالي الطلبات: <b>${totalOrders}</b>`,
    `• العملاء المتكررون: <b>${repeatCustomers}</b>`,
    `• أسماء متعددة: <b>${multiNames}</b>`,
    `• إجمالي استخدام الكوبونات: <b>${totalCouponUses}</b> مرة`,
    `• إجمالي قيمة الخصومات: <b>${totalDiscountsValue.toFixed(2)} جنيه</b>`,
    '',
    'اختر من القائمة أدناه لعرض العملاء أو الكوبونات أو البحث:',
  ].join('\n');

  const inline_keyboard = [
    [
      { text: '📋 كل العملاء', callback_data: 'cust:list:1' },
      { text: '🎟️ إدارة الكوبونات', callback_data: 'cust:coupons' },
    ],
    [
      { text: '🔁 العملاء المتكررون', callback_data: 'cust:repeat:1' },
      { text: '⚠️ أسماء متعددة', callback_data: 'cust:multi:1' },
    ],
    [
      { text: '📦 إدارة الطلبات', callback_data: 'order:list:1' },
      { text: '🔎 البحث عن عميل', callback_data: 'cust:search' },
    ],
    [
      { text: '🔄 تحديث الإحصائيات', callback_data: 'cust:dash' },
    ],
  ];

  return { text, replyMarkup: { inline_keyboard } };
}

/**
 * Builds Coupons List View for Telegram (/كوبونات or cust:coupons)
 */
export function buildCouponsListView(
  coupons: any[],
  orders: any[]
): { text: string; replyMarkup: any } {
  const lines: string[] = [
    '🎟️ <b>إدارة الكوبونات - Outfit Zone</b>',
    '─────────────────────────',
  ];

  if (!coupons || coupons.length === 0) {
    lines.push('<i>لا توجد أي كوبونات مسجلة في النظام حاليًا.</i>');
  } else {
    lines.push(`إجمالي الكوبونات: <b>${coupons.length}</b>\n`);

    coupons.forEach((c, idx) => {
      const isExpired = c.expires_at ? new Date(c.expires_at).getTime() < Date.now() : false;
      const statusIcon = !c.is_active ? '🔴 معطّل' : isExpired ? '⏳ منتهي' : '🟢 نشط';

      const matchingOrders = orders.filter(
        (o) =>
          o.coupon_code &&
          o.coupon_code.toUpperCase() === String(c.code).toUpperCase() &&
          Number(o.discount_amount) > 0
      );
      const actualUses = matchingOrders.length > 0 ? matchingOrders.length : (c.used_count || 0);
      const totalDiscount = matchingOrders.reduce(
        (sum, o) => sum + (Number(o.discount_amount) || 0),
        0
      );

      const discountLabel =
        c.discount_type === 'percentage'
          ? `${c.discount_value}%`
          : `${Number(c.discount_value).toFixed(2)} جنيه`;

      const perCustomer = c.max_uses_per_customer
        ? `${c.max_uses_per_customer} مرة لكل عميل`
        : 'غير محدود';

      lines.push(
        `${idx + 1}. 🎟️ <b>${escapeHtml(c.code)}</b> (${statusIcon})`,
        `   • الخصم: <b>${discountLabel}</b>`,
        `   • مرات الاستخدام: <b>${actualUses}</b> مرة`,
        `   • الحد لكل عميل: <b>${perCustomer}</b>`,
        `   • إجمالي الخصومات: <b>${totalDiscount.toFixed(2)} جنيه</b>`
      );
      if (idx < coupons.length - 1) {
        lines.push('');
      }
    });
  }

  lines.push('─────────────────────────');
  lines.push('💡 <i>اضغط على أي كوبون أدناه لعرض تفاصيل استخدامه والطلبات المرتبطة به.</i>');

  const couponButtons = (coupons || []).map((c) => [
    {
      text: `🔍 تفاصيل ${c.code} (${c.is_active ? 'نشط' : 'معطل'})`,
      callback_data: `cust:cpndetail:${c.id}`,
    },
  ]);

  const inline_keyboard = [
    ...couponButtons,
    [
      { text: '🔄 تحديث الكوبونات', callback_data: 'cust:coupons' },
      { text: '🔙 لوحة التحكم', callback_data: 'cust:dash' },
    ],
  ];

  return {
    text: lines.join('\n'),
    replyMarkup: { inline_keyboard },
  };
}

/**
 * Builds Detailed View of a specific Coupon
 */
export function buildCouponDetailView(
  coupon: any,
  orders: any[]
): { text: string; replyMarkup: any } {
  const isExpired = coupon.expires_at
    ? new Date(coupon.expires_at).getTime() < Date.now()
    : false;
  const statusStr = !coupon.is_active
    ? '🔴 معطّل'
    : isExpired
    ? '⏳ منتهي الصلاحية'
    : '🟢 نشط ومفعّل';

  const discountLabel =
    coupon.discount_type === 'percentage'
      ? `${coupon.discount_value}%`
      : `${Number(coupon.discount_value).toFixed(2)} جنيه (خصم ثابت)`;

  const matchingOrders = orders.filter(
    (o) =>
      o.coupon_code &&
      o.coupon_code.toUpperCase() === String(coupon.code).toUpperCase() &&
      Number(o.discount_amount) > 0
  );

  const actualUses = matchingOrders.length > 0 ? matchingOrders.length : (coupon.used_count || 0);
  const totalDiscount = matchingOrders.reduce(
    (sum, o) => sum + (Number(o.discount_amount) || 0),
    0
  );

  const lines: string[] = [
    '🎟️ <b>تفاصيل الكوبون</b>',
    '',
    `• <b>كود الكوبون:</b> <code>${escapeHtml(coupon.code)}</code>`,
    `• <b>الحالة:</b> ${statusStr}`,
    `• <b>نوع وقيمة الخصم:</b> <b>${discountLabel}</b>`,
    `• <b>الحد الأدنى للطلب:</b> ${
      coupon.min_order_amount > 0 ? `${coupon.min_order_amount} جنيه` : 'بدون حد أدنى'
    }`,
    `• <b>إجمالي مرات الاستخدام:</b> <b>${actualUses}</b> مرة${
      coupon.usage_limit || coupon.max_uses ? ` (الحد الأقصى الكلي: ${coupon.usage_limit || coupon.max_uses})` : ''
    }`,
    `• <b>الحد الأقصى لكل عميل:</b> <b>${
      coupon.max_uses_per_customer
        ? `${coupon.max_uses_per_customer} ${coupon.max_uses_per_customer === 1 ? 'مرة واحدة' : 'مرات'}`
        : 'غير محدود'
    }</b>`,
    `• <b>تاريخ الانتهاء:</b> ${
      coupon.expires_at ? formatEgyptianDateTime(coupon.expires_at) : 'مفتوح دائماً'
    }`,
    `• <b>إجمالي قيمة الخصومات الناتجة:</b> <b>${totalDiscount.toFixed(2)} جنيه</b>`,
    '',
    '📦 <b>الطلبات التي استخدمت هذا الكوبون:</b>',
  ];

  if (matchingOrders.length === 0) {
    lines.push('<i>لم يُستخدم هذا الكوبون في أي طلبات حتى الآن.</i>');
  } else {
    const recent = matchingOrders.slice(0, 10);
    recent.forEach((o, i) => {
      lines.push(
        `${i + 1}. 📦 <b>طلب ${escapeHtml(o.order_number)}</b>`,
        `   👤 العميل: ${escapeHtml(o.customer_name || 'غير محدد')}`,
        `   📱 الهاتف: <code>${escapeHtml(o.phone || '-')}</code>`,
        `   🏷️ الخصم: <b>-${Number(o.discount_amount).toFixed(2)} جنيه</b> (الإجمالي: ${Number(o.total).toFixed(2)} ج.م)`,
        `   🕒 التاريخ: <i>${formatEgyptianDateTime(o.created_at)}</i>`
      );
    });
    if (matchingOrders.length > 10) {
      lines.push(`<i>... وهناك ${matchingOrders.length - 10} طلبات إضافية</i>`);
    }
  }

  const inline_keyboard = [
    [
      { text: '🔙 قائمة الكوبونات', callback_data: 'cust:coupons' },
      { text: '🔙 لوحة التحكم', callback_data: 'cust:dash' },
    ],
  ];

  return {
    text: lines.join('\n'),
    replyMarkup: { inline_keyboard },
  };
}

/**
 * Builds Paginated All Customers View
 */
export function buildCustomerListView(
  customers: CustomerRecord[],
  page = 1,
  orders?: any[]
): { text: string; replyMarkup: any } {
  const pageSize = 5;
  const total = customers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.max(1, Math.min(page, totalPages));

  if (total === 0) {
    return {
      text: [
        '📋 <b>كل العملاء</b>',
        '',
        'لا يوجد عملاء مسجلين حتى الآن.',
        'قاعدة العملاء تبدأ تلقائيًا مع أول طلب جديد يمر عبر الموقع.',
      ].join('\n'),
      replyMarkup: {
        inline_keyboard: [[{ text: '🔙 لوحة التحكم', callback_data: 'cust:dash' }]],
      },
    };
  }

  const startIdx = (currentPage - 1) * pageSize;
  const pageItems = customers.slice(startIdx, startIdx + pageSize);

  const lines: string[] = [
    `📋 <b>كل العملاء</b> (صفحة ${currentPage} من ${totalPages})`,
    `إجمالي العملاء: <b>${total}</b>`,
    '─────────────────────────',
  ];

  const customerButtons: any[] = [];

  pageItems.forEach((c, idx) => {
    const num = startIdx + idx + 1;
    const actualOrderCount = getCustomerActualOrderCount(c, orders);
    lines.push(
      `${num}. 👤 <b>${escapeHtml(c.current_name || 'عميل بدون اسم')}</b>`,
      `   📱 <code>${escapeHtml(c.normalized_phone)}</code>`,
      `   📦 عدد الطلبات: <b>${actualOrderCount}</b>`
    );
    if (c.has_multiple_names) {
      lines.push(`   ⚠️ <i>أسماء متعددة: ${escapeHtml(c.names_used.join(' · '))}</i>`);
    }
    if (idx < pageItems.length - 1) {
      lines.push('');
    }

    customerButtons.push([
      {
        text: `👤 ${c.current_name || c.normalized_phone} (${actualOrderCount} طلب)`,
        callback_data: `cust:view:${c.id}`,
      },
    ]);
  });

  lines.push('─────────────────────────');

  const paginationRow: any[] = [];
  if (currentPage > 1) {
    paginationRow.push({
      text: '◀️ السابق',
      callback_data: `cust:list:${currentPage - 1}`,
    });
  }
  paginationRow.push({
    text: `${currentPage} / ${totalPages}`,
    callback_data: 'cust:noop',
  });
  if (currentPage < totalPages) {
    paginationRow.push({
      text: 'التالي ▶️',
      callback_data: `cust:list:${currentPage + 1}`,
    });
  }

  const inline_keyboard = [
    ...customerButtons,
    paginationRow,
    [{ text: '🔙 لوحة التحكم', callback_data: 'cust:dash' }],
  ];

  return {
    text: lines.join('\n'),
    replyMarkup: { inline_keyboard },
  };
}

/**
 * Builds Multiple Names View (⚠️ أسماء متعددة)
 */
export function buildCustomerMultiNamesView(
  customers: CustomerRecord[],
  page = 1,
  orders?: any[]
): { text: string; replyMarkup: any } {
  const multi = customers.filter(
    (c) => c.has_multiple_names || (c.names_used && c.names_used.length > 1)
  );

  const pageSize = 5;
  const total = multi.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.max(1, Math.min(page, totalPages));

  if (total === 0) {
    return {
      text: [
        '⚠️ <b>أسماء متعددة</b>',
        '',
        '✅ لا يوجد عملاء بأسماء متعددة حتى الآن.',
        'عندما يطلب نفس رقم الهاتف بأسماء مختلفة، سيتم إدراج العميل هنا تلقائيًا.',
      ].join('\n'),
      replyMarkup: {
        inline_keyboard: [[{ text: '🔙 لوحة التحكم', callback_data: 'cust:dash' }]],
      },
    };
  }

  const startIdx = (currentPage - 1) * pageSize;
  const pageItems = multi.slice(startIdx, startIdx + pageSize);

  const lines: string[] = [
    `⚠️ <b>أسماء متعددة</b> (صفحة ${currentPage} من ${totalPages})`,
    `عملاء ظهروا بأكثر من اسم: <b>${total}</b>`,
    '─────────────────────────',
  ];

  const customerButtons: any[] = [];

  pageItems.forEach((c, idx) => {
    const num = startIdx + idx + 1;
    const actualOrderCount = getCustomerActualOrderCount(c, orders);
    lines.push(
      `${num}. 📱 رقم الهاتف: <code>${escapeHtml(c.normalized_phone)}</code>`,
      `   👤 الاسم الحالي: <b>${escapeHtml(c.current_name)}</b>`,
      `   📝 الأسماء المستخدمة:`,
      ...(c.names_used || []).map((n) => `      • ${escapeHtml(n)}`),
      `   📦 عدد الطلبات: <b>${actualOrderCount}</b>`
    );
    if (idx < pageItems.length - 1) {
      lines.push('');
    }

    customerButtons.push([
      {
        text: `👤 ملف ${c.current_name} (${(c.names_used || []).length} أسماء)`,
        callback_data: `cust:view:${c.id}`,
      },
    ]);
  });

  lines.push('─────────────────────────');

  const paginationRow: any[] = [];
  if (currentPage > 1) {
    paginationRow.push({
      text: '◀️ السابق',
      callback_data: `cust:multi:${currentPage - 1}`,
    });
  }
  paginationRow.push({
    text: `${currentPage} / ${totalPages}`,
    callback_data: 'cust:noop',
  });
  if (currentPage < totalPages) {
    paginationRow.push({
      text: 'التالي ▶️',
      callback_data: `cust:multi:${currentPage + 1}`,
    });
  }

  const inline_keyboard = [
    ...customerButtons,
    paginationRow,
    [{ text: '🔙 لوحة التحكم', callback_data: 'cust:dash' }],
  ];

  return {
    text: lines.join('\n'),
    replyMarkup: { inline_keyboard },
  };
}

/**
 * Builds Repeat Customers View (🔁 العملاء المتكررون)
 */
export function buildCustomerRepeatView(
  customers: CustomerRecord[],
  page = 1,
  orders?: any[]
): { text: string; replyMarkup: any } {
  const repeat = customers.filter(
    (c) => getCustomerActualOrderCount(c, orders) > 1
  );
  repeat.sort(
    (a, b) =>
      getCustomerActualOrderCount(b, orders) - getCustomerActualOrderCount(a, orders)
  );

  const pageSize = 5;
  const total = repeat.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.max(1, Math.min(page, totalPages));

  if (total === 0) {
    return {
      text: [
        '🔁 <b>العملاء المتكررون</b>',
        '',
        'ℹ️ لا يوجد عملاء متكررون حتى الآن.',
        'العملاء الذين لديهم أكثر من طلب سيظهرون هنا تلقائيًا.',
      ].join('\n'),
      replyMarkup: {
        inline_keyboard: [[{ text: '🔙 لوحة التحكم', callback_data: 'cust:dash' }]],
      },
    };
  }

  const startIdx = (currentPage - 1) * pageSize;
  const pageItems = repeat.slice(startIdx, startIdx + pageSize);

  const lines: string[] = [
    `🔁 <b>العملاء المتكررون</b> (صفحة ${currentPage} من ${totalPages})`,
    `إجمالي العملاء المتكررين: <b>${total}</b>`,
    '─────────────────────────',
  ];

  const customerButtons: any[] = [];

  pageItems.forEach((c, idx) => {
    const num = startIdx + idx + 1;
    const actualOrderCount = getCustomerActualOrderCount(c, orders);
    lines.push(
      `${num}. 👤 <b>${escapeHtml(c.current_name)}</b>`,
      `   📱 <code>${escapeHtml(c.normalized_phone)}</code>`,
      `   📦 عدد الطلبات: <b>${actualOrderCount} طلبات</b>`,
      `   🕒 آخر طلب: <i>${formatEgyptianDateTime(c.last_order_at)}</i>`
    );
    if (idx < pageItems.length - 1) {
      lines.push('');
    }

    customerButtons.push([
      {
        text: `👤 ملف ${c.current_name} (${actualOrderCount} طلب)`,
        callback_data: `cust:view:${c.id}`,
      },
    ]);
  });

  lines.push('─────────────────────────');

  const paginationRow: any[] = [];
  if (currentPage > 1) {
    paginationRow.push({
      text: '◀️ السابق',
      callback_data: `cust:repeat:${currentPage - 1}`,
    });
  }
  paginationRow.push({
    text: `${currentPage} / ${totalPages}`,
    callback_data: 'cust:noop',
  });
  if (currentPage < totalPages) {
    paginationRow.push({
      text: 'التالي ▶️',
      callback_data: `cust:repeat:${currentPage + 1}`,
    });
  }

  const inline_keyboard = [
    ...customerButtons,
    paginationRow,
    [{ text: '🔙 لوحة التحكم', callback_data: 'cust:dash' }],
  ];

  return {
    text: lines.join('\n'),
    replyMarkup: { inline_keyboard },
  };
}

/**
 * Builds Search Prompt View
 */
export function buildCustomerSearchView(): { text: string; replyMarkup: any } {
  const text = [
    '🔎 <b>البحث عن عميل</b>',
    '',
    'للبحث عن أي عميل، أرسل الأمر مع رقم الهاتف:',
    '<code>/عميل 01012345678</code>',
    '',
    'أو أرسل رقم الهاتف مباشرة في المحادثة.',
    '',
    '⚡ <b>دعم الصيغ المختلفة:</b>',
    'يتعرف النظام تلقائيًا على جميع صيغ أرقام مصر (010..., +20..., 20..., 0020...).',
  ].join('\n');

  return {
    text,
    replyMarkup: {
      inline_keyboard: [
        [{ text: '📋 كل العملاء', callback_data: 'cust:list:1' }],
        [{ text: '🔙 لوحة التحكم', callback_data: 'cust:dash' }],
      ],
    },
  };
}

/**
 * Builds Customer Profile View (ملف العميل وسجل طلباته)
 */
export function buildCustomerProfileView(
  customer: CustomerRecord,
  orders: any[]
): { text: string; replyMarkup: any } {
  const custOrders = orders.filter(
    (o) =>
      (o as any).customer_id === customer.id ||
      (customer.normalized_phone && normalizePhone(o.phone) === customer.normalized_phone) ||
      (customer.original_phone && o.phone === customer.original_phone)
  );

  custOrders.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const namesList =
    customer.names_used && customer.names_used.length > 0
      ? customer.names_used.join(' · ')
      : customer.current_name || '-';

  // Customer profiles show actual order count based on their existing orders
  const orderCount = custOrders.length;
  const totalSpent = custOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // Analyze coupons used by this customer
  const couponUsageMap = new Map<string, { count: number; totalDiscount: number; lastUsedAt: string }>();
  let lastCouponUsed: { code: string; date: string } | null = null;

  for (const o of custOrders) {
    if (o.coupon_code && Number(o.discount_amount) > 0) {
      const code = String(o.coupon_code).trim().toUpperCase();
      const orderDate = o.created_at || '';
      const discount = Number(o.discount_amount) || 0;
      const existing = couponUsageMap.get(code);
      if (!existing) {
        couponUsageMap.set(code, { count: 1, totalDiscount: discount, lastUsedAt: orderDate });
      } else {
        existing.count += 1;
        existing.totalDiscount += discount;
        if (new Date(orderDate).getTime() > new Date(existing.lastUsedAt).getTime()) {
          existing.lastUsedAt = orderDate;
        }
      }

      if (!lastCouponUsed || new Date(orderDate).getTime() > new Date(lastCouponUsed.date).getTime()) {
        lastCouponUsed = { code, date: orderDate };
      }
    }
  }

  const lines: string[] = [
    '👤 <b>ملف العميل</b>',
    '',
    `• <b>الاسم الحالي:</b> ${escapeHtml(customer.current_name || 'غير محدد')}`,
    `• <b>رقم الهاتف:</b> <code>${escapeHtml(customer.normalized_phone)}</code>`,
  ];

  if (customer.original_phone && customer.original_phone !== customer.normalized_phone) {
    lines.push(`• <b>الرقم الأصلي:</b> <code>${escapeHtml(customer.original_phone)}</code>`);
  }

  lines.push(
    `• <b>الأسماء المستخدمة:</b> ${escapeHtml(namesList)}`,
    `• <b>عدد الطلبات:</b> <b>${orderCount}</b> طلب`,
    `• <b>إجمالي المشتريات:</b> <b>${totalSpent.toFixed(2)} جنيه</b>`,
    `• <b>أول طلب:</b> <i>${formatEgyptianDateTime(customer.first_order_at || customer.created_at)}</i>`,
    `• <b>آخر طلب:</b> <i>${formatEgyptianDateTime(customer.last_order_at || customer.updated_at)}</i>`,
    '',
    '🎟️ <b>ملخص الكوبونات المستخدمة:</b>'
  );

  if (couponUsageMap.size === 0) {
    lines.push('• <i>لم يسبق لهذا العميل استخدام أي كوبونات خصم.</i>');
  } else {
    lines.push(
      `• <b>آخر كوبون مستخدم:</b> <code>${escapeHtml(lastCouponUsed?.code || '-')}</code> <i>(${formatEgyptianDateTime(lastCouponUsed?.date)})</i>`,
      '• <b>تفاصيل الكوبونات المستخدمة:</b>'
    );
    couponUsageMap.forEach((data, code) => {
      lines.push(
        `   ▫️ كود <code>${escapeHtml(code)}</code>: استُخدم <b>${data.count}</b> ${data.count === 1 ? 'مرة واحدة' : 'مرات'} (وفّر: ${data.totalDiscount.toFixed(2)} ج.م)`
      );
    });
  }

  lines.push('', '📜 <b>سجل الطلبات:</b>');

  if (custOrders.length === 0) {
    lines.push('<i>لا توجد تفاصيل طلبات سابقة محفوظة لهذا العميل.</i>');
  } else {
    custOrders.forEach((o) => {
      lines.push(
        '─────────────────────────',
        `📦 <b>طلب رقم: ${escapeHtml(o.order_number)}</b>`,
        `📅 التاريخ: ${formatEgyptianDateTime(o.created_at)}`,
        `💰 المبلغ: <b>${Number(o.subtotal || o.total).toFixed(2)} جنيه</b>`
      );
      if (o.coupon_code && Number(o.discount_amount) > 0) {
        lines.push(
          `🎟️ الكوبون: <code>${escapeHtml(o.coupon_code)}</code> (خصم: -${Number(o.discount_amount).toFixed(2)} جنيه)`
        );
      }
      lines.push(
        `🚚 الشحن: <b>${Number(o.shipping_fee || 0).toFixed(2)} جنيه</b>`,
        `💵 الإجمالي: <b>${Number(o.total).toFixed(2)} جنيه</b>`,
        `📍 العنوان: ${escapeHtml(o.governorate)} - ${escapeHtml(o.city)}`,
        `⏳ حالة الطلب: <b>${getOrderStatusArabic(o.status)}</b>`
      );
    });
    lines.push('─────────────────────────');
  }

  const inline_keyboard = [
    [
      { text: '📋 كل العملاء', callback_data: 'cust:list:1' },
      { text: '🔁 العملاء المتكررون', callback_data: 'cust:repeat:1' },
    ],
    [
      { text: '🎟️ قائمة الكوبونات', callback_data: 'cust:coupons' },
      { text: '🔙 لوحة التحكم', callback_data: 'cust:dash' },
    ],
  ];

  return {
    text: lines.join('\n'),
    replyMarkup: { inline_keyboard },
  };
}

// ==============================================================================
// 7. Telegram Webhook Update Processor
// ==============================================================================

export async function handleTelegramUpdate(
  update: any,
  db: {
    customers: CustomerRecord[];
    orders: any[];
    coupons?: any[];
  },
  supabaseClient?: any,
  saveToFile?: (filename: string, data: any) => void
): Promise<void> {
  if (!update) return;

  // 1. Text Message Handlers (/عميل, /customer, /coupons, /كوبونات, /start, phone search)
  if (update.message) {
    const msg = update.message;
    const fromId = msg.from?.id;
    const chatId = msg.chat?.id;
    const text = (msg.text || '').trim();

    if (!text || !chatId) return;

    const isCustomerCommand =
      text === '/عميل' ||
      text.startsWith('/عميل ') ||
      text === '/customer' ||
      text.startsWith('/customer ') ||
      text === '/coupons' ||
      text === '/كوبونات' ||
      text === '/report' ||
      text === '/تقرير' ||
      text === '/daily_report' ||
      text === '/طلبات' ||
      text === '/orders' ||
      text === '/start';

    // If it's a customer or report command or potential phone search
    if (isCustomerCommand || /^[0-9+٠-٩۰-۹\s-]{8,}$/.test(text)) {
      // Authorization Check
      if (!isTelegramAdmin(fromId)) {
        await telegramSendMessage(
          chatId,
          '⛔ <b>عذرًا، هذا القسم مخصص لمدراء النظام المصرح لهم فقط.</b>'
        );
        return;
      }

      // Order management command
      if (text === '/طلبات' || text === '/orders') {
        const currentOrders = await getAuthoritativeOrders(db, supabaseClient, saveToFile);
        const view = buildOrdersListView(currentOrders, 1);
        await telegramSendMessage(chatId, view.text, view.replyMarkup);
        return;
      }

      // Check if command is Coupons List
      if (text === '/coupons' || text === '/كوبونات') {
        const [currentCoupons, currentOrders] = await Promise.all([
          getAuthoritativeCoupons(db, supabaseClient, saveToFile),
          getAuthoritativeOrders(db, supabaseClient, saveToFile),
        ]);
        const view = buildCouponsListView(currentCoupons, currentOrders);
        await telegramSendMessage(chatId, view.text, view.replyMarkup);
        return;
      }

      // Check if command is Daily Report
      if (text === '/report' || text === '/تقرير' || text === '/daily_report') {
        const [currentCustomers, currentOrders] = await Promise.all([
          getAuthoritativeCustomers(db, supabaseClient, saveToFile),
          getAuthoritativeOrders(db, supabaseClient, saveToFile),
        ]);
        let effectiveCustomers = currentCustomers;
        if (effectiveCustomers.length === 0 && currentOrders.length > 0) {
          effectiveCustomers = deriveCustomersFromOrders(currentOrders);
          db.customers = effectiveCustomers;
          if (saveToFile) saveToFile('customers.json', effectiveCustomers);
        }
        const report = buildDailyReport(currentOrders, effectiveCustomers);
        await telegramSendMessage(chatId, report.text, report.replyMarkup);
        return;
      }

      // Check if command is dashboard
      if (text === '/عميل' || text === '/customer' || text === '/start') {
        const [currentCustomers, currentOrders] = await Promise.all([
          getAuthoritativeCustomers(db, supabaseClient, saveToFile),
          getAuthoritativeOrders(db, supabaseClient, saveToFile),
        ]);
        let effectiveCustomers = currentCustomers;
        if (effectiveCustomers.length === 0 && currentOrders.length > 0) {
          effectiveCustomers = deriveCustomersFromOrders(currentOrders);
          db.customers = effectiveCustomers;
          if (saveToFile) saveToFile('customers.json', effectiveCustomers);
        }
        const view = buildCustomerDashboardView(effectiveCustomers, currentOrders);
        await telegramSendMessage(chatId, view.text, view.replyMarkup);
        return;
      }

      // Customer search by phone
      let rawQuery = text;
      if (text.startsWith('/عميل ')) {
        rawQuery = text.replace(/^\/عميل\s+/, '').trim();
      } else if (text.startsWith('/customer ')) {
        rawQuery = text.replace(/^\/customer\s+/, '').trim();
      }

      const normalizedQuery = normalizePhone(rawQuery);

      if (!normalizedQuery || normalizedQuery.length < 8) {
        await telegramSendMessage(
          chatId,
          '⚠️ يرجى إدخال رقم هاتف صحيح للبحث، مثال: <code>/عميل 01012345678</code>'
        );
        return;
      }

      const [currentCustomers, currentOrders] = await Promise.all([
        getAuthoritativeCustomers(db, supabaseClient, saveToFile),
        getAuthoritativeOrders(db, supabaseClient, saveToFile),
      ]);
      let effectiveCustomers = currentCustomers;
      if (effectiveCustomers.length === 0 && currentOrders.length > 0) {
        effectiveCustomers = deriveCustomersFromOrders(currentOrders);
        db.customers = effectiveCustomers;
        if (saveToFile) saveToFile('customers.json', effectiveCustomers);
      }
      const targetCustomer = effectiveCustomers.find(
        (c) =>
          c.normalized_phone === normalizedQuery ||
          c.original_phone === rawQuery ||
          c.original_phone === normalizedQuery
      );

      if (targetCustomer) {
        const view = buildCustomerProfileView(targetCustomer, currentOrders);
        await telegramSendMessage(chatId, view.text, view.replyMarkup);
      } else {
        await telegramSendMessage(
          chatId,
          [
            `❌ لم يتم العثور على عميل مسجل بالرقم: <code>${escapeHtml(normalizedQuery)}</code>`,
            '',
            '💡 ملاحظة: قاعدة العملاء تسجل العملاء تلقائيًا من الطلبات الجديدة بعد تفعيل النظام.',
          ].join('\n'),
          {
            inline_keyboard: [
              [{ text: '📋 كل العملاء', callback_data: 'cust:list:1' }],
              [{ text: '🔙 لوحة التحكم', callback_data: 'cust:dash' }],
            ],
          }
        );
      }
    }
  }

  // 2. Callback Queries (Inline keyboard buttons)
  if (update.callback_query) {
    const cq = update.callback_query;
    const fromId = cq.from?.id;
    const rawData = String(cq.data || '').trim();
    // Acknowledge order buttons immediately, before authorization or database work.
    const isOrderManagementRaw = rawData.startsWith('order:list:') || rawData.startsWith('order:view:');
    if (isOrderManagementRaw) {
      const ack = await telegramAnswerCallbackQuery(cq.id);
      console.log('[Telegram Order Management] Immediate acknowledgement:', ack?.ok === true);
    }
    console.log('[Telegram Callback] Received:', rawData, 'from:', fromId);
    const messageId = cq.message?.message_id;
    const chatId = cq.message?.chat?.id || cq.from?.id;

    // Normalize action prefixes (support both 'cust:' and 'customer:')
    let action = rawData;
    if (action.startsWith('customer:')) {
      action = 'cust:' + action.slice('customer:'.length);
    }

    // Compact callback payload keeps Telegram callback_data below its 64-byte limit.
    if (action.startsWith('os:')) action = 'order:status:' + action.slice(3);

    const isOrderStatusCallback = action.startsWith('order:status:');
    const isOrderManagementCallback = action.startsWith('order:list:') || action.startsWith('order:view:');
    const isReportCallback = action === 'report:refresh' || action === 'report:today';
    const isCustomerCallback =
      action.startsWith('cust:') ||
      action === 'dash' ||
      action === 'refresh' ||
      action === 'search' ||
      action.startsWith('list') ||
      action.startsWith('multi') ||
      action.startsWith('repeat') ||
      action.startsWith('view:');

    if (!isOrderStatusCallback && !isOrderManagementCallback && !isReportCallback && !isCustomerCallback) {
      await telegramAnswerCallbackQuery(cq.id);
      return;
    }

    // Verify Admin Authorization
    if (!isTelegramAdmin(fromId)) {
      await telegramAnswerCallbackQuery(
        cq.id,
        '⛔ عذرًا، هذا الإجراء مخصص لمدراء النظام المصرح لهم فقط.',
        true
      );
      return;
    }

    if (!chatId || !messageId) {
      await telegramAnswerCallbackQuery(cq.id);
      return;
    }

    // 1. Order management callbacks: acknowledge immediately and fall back to a new message if editing fails.
    if (isOrderManagementCallback) {
      console.log('[Telegram Order Management] Processing:', action, 'chat:', chatId, 'message:', messageId);
      try {
        const currentOrders = await getAuthoritativeOrders(db, supabaseClient, saveToFile);
        if (action.startsWith('order:list:')) {
          const page = parseInt(action.split(':')[2] || '1', 10) || 1;
          const view = buildOrdersListView(currentOrders, page);
          const editResult = await telegramEditMessageText(chatId, messageId, view.text, view.replyMarkup);
          if (!editResult || editResult.ok === false) {
            await telegramSendMessage(chatId, view.text, view.replyMarkup);
          }
          return;
        }

        const parts = action.split(':');
        const orderIdentifier = parts.slice(2, -1).join(':');
        const page = parseInt(parts[parts.length - 1] || '1', 10) || 1;
        const targetOrder = currentOrders.find((o: any) =>
          String(o.order_number || '') === orderIdentifier || String(o.id || '') === orderIdentifier
        );

        if (targetOrder) {
          const view = buildOrderDetailView(targetOrder, page);
          const editResult = await telegramEditMessageText(chatId, messageId, view.text, view.replyMarkup);
          if (!editResult || editResult.ok === false) {
            await telegramSendMessage(chatId, view.text, view.replyMarkup);
          }
        } else {
          const notFoundText = `❌ لم يتم العثور على الطلب (${escapeHtml(orderIdentifier)}). حدّث القائمة وحاول مرة أخرى.`;
          const markup = { inline_keyboard: [[{ text: '⬅️ رجوع لقائمة الطلبات', callback_data: `order:list:${page}` }]] };
          const editResult = await telegramEditMessageText(chatId, messageId, notFoundText, markup);
          if (!editResult || editResult.ok === false) await telegramSendMessage(chatId, notFoundText, markup);
        }
      } catch (error: any) {
        console.error('[Telegram Order Management] Callback failed:', error?.message || error);
        await telegramSendMessage(chatId, `❌ تعذر فتح تفاصيل الطلب: ${escapeHtml(error?.message || 'خطأ غير معروف')}`);
      }
      return;
    }

    if (isOrderStatusCallback) {
      const parts = action.split(':');
      const orderNumber = parts[2];
      const targetStatus = parts[3];
      if (!orderNumber || !targetStatus) {
        await telegramAnswerCallbackQuery(cq.id, '❌ بيانات الطلب غير مكتملة.', true);
        return;
      }

      try {
        await updateOrderStatusAuthoritative(
          orderNumber,
          targetStatus,
          db,
          supabaseClient,
          saveToFile,
          `telegram_${fromId}`
        );

        await telegramAnswerCallbackQuery(
          cq.id,
          `✅ تم تحديث حالة الطلب إلى: ${getOrderStatusArabic(targetStatus)}`
        );

        const currentMsgText = cq.message?.text || '';
        const statusRegex = /(⏳\s*الحالة:|الحالة:)[^\n]+/u;
        let updatedText = currentMsgText;
        if (statusRegex.test(updatedText)) {
          updatedText = updatedText.replace(statusRegex, `⏳ الحالة: ${getOrderStatusArabic(targetStatus)}`);
        } else {
          updatedText += `\n\n⏳ الحالة: ${getOrderStatusArabic(targetStatus)}`;
        }

        const newKeyboard = buildOrderStatusInlineKeyboard(orderNumber, targetStatus);
        await telegramEditMessageText(chatId, messageId, updatedText, newKeyboard);
      } catch (err: any) {
        await telegramAnswerCallbackQuery(cq.id, `❌ تعذر تحديث الحالة: ${err.message || 'خطأ'}`, true);
      }
      return;
    }

    // 2. Daily Report Refresh
    if (isReportCallback) {
      await telegramAnswerCallbackQuery(cq.id, '🔄 تم تحديث التقرير اليومي');
      const [currentCustomers, currentOrders] = await Promise.all([
        getAuthoritativeCustomers(db, supabaseClient, saveToFile),
        getAuthoritativeOrders(db, supabaseClient, saveToFile),
      ]);
      let effectiveCustomers = currentCustomers;
      if (effectiveCustomers.length === 0 && currentOrders.length > 0) {
        effectiveCustomers = deriveCustomersFromOrders(currentOrders);
        db.customers = effectiveCustomers;
        if (saveToFile) saveToFile('customers.json', effectiveCustomers);
      }
      const report = buildDailyReport(currentOrders, effectiveCustomers);
      await telegramEditMessageText(chatId, messageId, report.text, report.replyMarkup);
      return;
    }

    if (!action.startsWith('cust:')) {
      action = 'cust:' + action;
    }

    // Answer immediately so Telegram stops loading spinner
    if (action === 'cust:dash' || action === 'cust:refresh') {
      await telegramAnswerCallbackQuery(cq.id, '🔄 تم تحديث لوحة التحكم');
    } else if (action === 'cust:coupons') {
      await telegramAnswerCallbackQuery(cq.id, '🔄 جاري تحميل الكوبونات');
    } else {
      await telegramAnswerCallbackQuery(cq.id);
    }

    if (action === 'cust:noop') {
      return;
    }

    try {
      // 1. 🔄 تحديث / لوحة التحكم
      if (action === 'cust:dash' || action === 'cust:refresh') {
        const [currentCustomers, currentOrders] = await Promise.all([
          getAuthoritativeCustomers(db, supabaseClient, saveToFile),
          getAuthoritativeOrders(db, supabaseClient, saveToFile),
        ]);
        let effectiveCustomers = currentCustomers;
        if (effectiveCustomers.length === 0 && currentOrders.length > 0) {
          effectiveCustomers = deriveCustomersFromOrders(currentOrders);
          db.customers = effectiveCustomers;
          if (saveToFile) saveToFile('customers.json', effectiveCustomers);
        }
        const view = buildCustomerDashboardView(effectiveCustomers, currentOrders);
        await telegramEditMessageText(chatId, messageId, view.text, view.replyMarkup);
        return;
      }

      // 2. 🎟️ إدارة الكوبونات
      if (action === 'cust:coupons') {
        const [currentCoupons, currentOrders] = await Promise.all([
          getAuthoritativeCoupons(db, supabaseClient, saveToFile),
          getAuthoritativeOrders(db, supabaseClient, saveToFile),
        ]);
        const view = buildCouponsListView(currentCoupons, currentOrders);
        await telegramEditMessageText(chatId, messageId, view.text, view.replyMarkup);
        return;
      }

      // 3. 🔍 تفاصيل كوبون محدد
      if (action.startsWith('cust:cpndetail:')) {
        const cpnId = action.slice('cust:cpndetail:'.length).trim();
        const [currentCoupons, currentOrders] = await Promise.all([
          getAuthoritativeCoupons(db, supabaseClient, saveToFile),
          getAuthoritativeOrders(db, supabaseClient, saveToFile),
        ]);
        const targetCoupon = currentCoupons.find((c) => c.id === cpnId || c.code === cpnId);
        if (targetCoupon) {
          const view = buildCouponDetailView(targetCoupon, currentOrders);
          await telegramEditMessageText(chatId, messageId, view.text, view.replyMarkup);
        } else {
          await telegramEditMessageText(
            chatId,
            messageId,
            '❌ لم يتم العثور على هذا الكوبون.',
            {
              inline_keyboard: [
                [{ text: '🔙 قائمة الكوبونات', callback_data: 'cust:coupons' }],
                [{ text: '🔙 لوحة التحكم', callback_data: 'cust:dash' }],
              ],
            }
          );
        }
        return;
      }

      // 4. 🔎 البحث عن عميل
      if (action === 'cust:search') {
        const view = buildCustomerSearchView();
        await telegramEditMessageText(chatId, messageId, view.text, view.replyMarkup);
        return;
      }

      // 5. 📋 كل العملاء (مع Pagination)
      if (action === 'cust:list' || action.startsWith('cust:list:')) {
        const [currentCustomers, currentOrders] = await Promise.all([
          getAuthoritativeCustomers(db, supabaseClient, saveToFile),
          getAuthoritativeOrders(db, supabaseClient, saveToFile),
        ]);
        let effectiveCustomers = currentCustomers;
        if (effectiveCustomers.length === 0 && currentOrders.length > 0) {
          effectiveCustomers = deriveCustomersFromOrders(currentOrders);
          db.customers = effectiveCustomers;
          if (saveToFile) saveToFile('customers.json', effectiveCustomers);
        }
        const parts = action.split(':');
        const page = parseInt(parts[2] || '1', 10) || 1;
        const view = buildCustomerListView(effectiveCustomers, page, currentOrders);
        await telegramEditMessageText(chatId, messageId, view.text, view.replyMarkup);
        return;
      }

      // 6. ⚠️ أسماء متعددة (مع Pagination)
      if (action === 'cust:multi' || action.startsWith('cust:multi:')) {
        const [currentCustomers, currentOrders] = await Promise.all([
          getAuthoritativeCustomers(db, supabaseClient, saveToFile),
          getAuthoritativeOrders(db, supabaseClient, saveToFile),
        ]);
        let effectiveCustomers = currentCustomers;
        if (effectiveCustomers.length === 0 && currentOrders.length > 0) {
          effectiveCustomers = deriveCustomersFromOrders(currentOrders);
          db.customers = effectiveCustomers;
          if (saveToFile) saveToFile('customers.json', effectiveCustomers);
        }
        const parts = action.split(':');
        const page = parseInt(parts[2] || '1', 10) || 1;
        const view = buildCustomerMultiNamesView(effectiveCustomers, page, currentOrders);
        await telegramEditMessageText(chatId, messageId, view.text, view.replyMarkup);
        return;
      }

      // 7. 🔁 العملاء المتكررون (مع Pagination)
      if (action === 'cust:repeat' || action.startsWith('cust:repeat:')) {
        const [currentCustomers, currentOrders] = await Promise.all([
          getAuthoritativeCustomers(db, supabaseClient, saveToFile),
          getAuthoritativeOrders(db, supabaseClient, saveToFile),
        ]);
        let effectiveCustomers = currentCustomers;
        if (effectiveCustomers.length === 0 && currentOrders.length > 0) {
          effectiveCustomers = deriveCustomersFromOrders(currentOrders);
          db.customers = effectiveCustomers;
          if (saveToFile) saveToFile('customers.json', effectiveCustomers);
        }
        const parts = action.split(':');
        const page = parseInt(parts[2] || '1', 10) || 1;
        const view = buildCustomerRepeatView(effectiveCustomers, page, currentOrders);
        await telegramEditMessageText(chatId, messageId, view.text, view.replyMarkup);
        return;
      }

      // 8. 👤 عرض ملف العميل وتاريخ طلباته
      if (action.startsWith('cust:view:')) {
        const [currentCustomers, currentOrders] = await Promise.all([
          getAuthoritativeCustomers(db, supabaseClient, saveToFile),
          getAuthoritativeOrders(db, supabaseClient, saveToFile),
        ]);
        let effectiveCustomers = currentCustomers;
        if (effectiveCustomers.length === 0 && currentOrders.length > 0) {
          effectiveCustomers = deriveCustomersFromOrders(currentOrders);
          db.customers = effectiveCustomers;
          if (saveToFile) saveToFile('customers.json', effectiveCustomers);
        }
        const targetId = action.slice('cust:view:'.length).trim();
        const targetCustomer = effectiveCustomers.find(
          (c) =>
            c.id === targetId ||
            c.normalized_phone === targetId ||
            c.original_phone === targetId
        );

        if (targetCustomer) {
          const view = buildCustomerProfileView(targetCustomer, currentOrders);
          await telegramEditMessageText(chatId, messageId, view.text, view.replyMarkup);
        } else {
          await telegramEditMessageText(
            chatId,
            messageId,
            '❌ لم يتم العثور على ملف هذا العميل.',
            {
              inline_keyboard: [
                [{ text: '🔙 لوحة التحكم', callback_data: 'cust:dash' }],
              ],
            }
          );
        }
        return;
      }
    } catch (btnErr) {
      console.error('[Telegram Bot] Error processing button callback:', btnErr);
      // Surface the failure in Telegram instead of silently leaving the admin with a dead button.
      await telegramSendMessage(
        chatId,
        '❌ حصل خطأ أثناء تنفيذ الزر. جرّب مرة أخرى، ولو استمرت المشكلة راجع سجل Vercel.'
      );
    }
  }
}
