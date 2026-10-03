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
  const envVal = process.env.TELEGRAM_ADMIN_USER_IDS || '';
  return envVal
    .split(/[,;\s]+/)
    .map((s) => s.trim())
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
      return '✅ تم التأكيد';
    case 'shipped':
      return '🚚 جاري الشحن';
    case 'delivered':
      return '📦 تم التوصيل';
    case 'cancelled':
      return '❌ ملغي';
    default:
      return status ? `⏳ ${status}` : 'قيد المراجعة';
  }
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

        // Always keep in-memory db.customers strictly synced with Supabase
        db.customers = formatted;
        if (saveToFile) {
          saveToFile('customers.json', formatted);
        }
        return formatted;
      } else if (error) {
        console.warn('[Customer Management] Supabase customers select notice:', error.message);
      }
    } catch (err) {
      console.warn('[Customer Management] Supabase customers query error:', err);
    }
  }

  return db.customers;
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
    if (supabaseClient) {
      try {
        const { data: supaCust } = await supabaseClient
          .from('customers')
          .select('*')
          .eq('normalized_phone', normalized)
          .maybeSingle();

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
        } else {
          // If customer was deleted from Supabase, remove any stale copy from local memory
          db.customers = db.customers.filter((c) => c.normalized_phone !== normalized);
        }
      } catch (checkErr) {
        console.warn('[Customer Management] Supabase customer pre-check notice:', checkErr);
      }
    }

    if (!customer) {
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
  const repeatCustomers = customers.filter((c) => (c.order_count || 0) > 1).length;
  const multiNames = customers.filter(
    (c) => c.has_multiple_names || (c.names_used && c.names_used.length > 1)
  ).length;

  const text = [
    '👥 <b>إدارة العملاء - Outfit Zone</b>',
    '',
    '📊 <b>إحصائيات العملاء:</b>',
    `• إجمالي العملاء: <b>${totalCustomers}</b>`,
    `• إجمالي الطلبات: <b>${totalOrders}</b>`,
    `• العملاء المتكررون: <b>${repeatCustomers}</b>`,
    `• أسماء متعددة: <b>${multiNames}</b>`,
    '',
    'اختر من القائمة أدناه لعرض العملاء أو البحث:',
  ].join('\n');

  const inline_keyboard = [
    [
      { text: '📋 كل العملاء', callback_data: 'cust:list:1' },
      { text: '⚠️ أسماء متعددة', callback_data: 'cust:multi:1' },
    ],
    [
      { text: '🔁 العملاء المتكررون', callback_data: 'cust:repeat:1' },
      { text: '🔎 البحث عن عميل', callback_data: 'cust:search' },
    ],
    [
      { text: '🔄 تحديث الإحصائيات', callback_data: 'cust:dash' },
    ],
  ];

  return { text, replyMarkup: { inline_keyboard } };
}

/**
 * Builds Paginated All Customers View
 */
export function buildCustomerListView(
  customers: CustomerRecord[],
  page = 1
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
    lines.push(
      `${num}. 👤 <b>${escapeHtml(c.current_name || 'عميل بدون اسم')}</b>`,
      `   📱 <code>${escapeHtml(c.normalized_phone)}</code>`,
      `   📦 عدد الطلبات: <b>${c.order_count || 1}</b>`
    );
    if (c.has_multiple_names) {
      lines.push(`   ⚠️ <i>أسماء متعددة: ${escapeHtml(c.names_used.join(' · '))}</i>`);
    }
    if (idx < pageItems.length - 1) {
      lines.push('');
    }

    customerButtons.push([
      {
        text: `👤 ${c.current_name || c.normalized_phone} (${c.order_count || 1} طلب)`,
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
  page = 1
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
    lines.push(
      `${num}. 📱 رقم الهاتف: <code>${escapeHtml(c.normalized_phone)}</code>`,
      `   👤 الاسم الحالي: <b>${escapeHtml(c.current_name)}</b>`,
      `   📝 الأسماء المستخدمة:`,
      ...(c.names_used || []).map((n) => `      • ${escapeHtml(n)}`),
      `   📦 عدد الطلبات: <b>${c.order_count}</b>`
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
  page = 1
): { text: string; replyMarkup: any } {
  const repeat = customers.filter((c) => (c.order_count || 0) > 1);
  repeat.sort((a, b) => (b.order_count || 0) - (a.order_count || 0));

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
    lines.push(
      `${num}. 👤 <b>${escapeHtml(c.current_name)}</b>`,
      `   📱 <code>${escapeHtml(c.normalized_phone)}</code>`,
      `   📦 عدد الطلبات: <b>${c.order_count} طلبات</b>`,
      `   🕒 آخر طلب: <i>${formatEgyptianDateTime(c.last_order_at)}</i>`
    );
    if (idx < pageItems.length - 1) {
      lines.push('');
    }

    customerButtons.push([
      {
        text: `👤 ملف ${c.current_name} (${c.order_count} طلب)`,
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
      normalizePhone(o.phone) === customer.normalized_phone
  );

  custOrders.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const namesList =
    customer.names_used && customer.names_used.length > 0
      ? customer.names_used.join(' · ')
      : customer.current_name || '-';

  const orderCount = Math.max(custOrders.length, customer.order_count || 1);

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
    `• <b>أول طلب:</b> <i>${formatEgyptianDateTime(customer.first_order_at || customer.created_at)}</i>`,
    `• <b>آخر طلب:</b> <i>${formatEgyptianDateTime(customer.last_order_at || customer.updated_at)}</i>`,
    '',
    '📜 <b>سجل الطلبات:</b>'
  );

  if (custOrders.length === 0) {
    lines.push('<i>لا توجد تفاصيل طلبات سابقة محفوظة لهذا العميل.</i>');
  } else {
    custOrders.forEach((o) => {
      lines.push(
        '─────────────────────────',
        `📦 <b>طلب رقم: ${escapeHtml(o.order_number)}</b>`,
        `📅 التاريخ: ${formatEgyptianDateTime(o.created_at)}`,
        `💰 المبلغ: <b>${Number(o.subtotal || o.total).toFixed(2)} جنيه</b>`,
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
    [{ text: '🔙 لوحة التحكم', callback_data: 'cust:dash' }],
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
  },
  supabaseClient?: any,
  saveToFile?: (filename: string, data: any) => void
): Promise<void> {
  if (!update) return;

  // 1. Text Message Handlers (/عميل, /customer, /start, phone search)
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
      text === '/start';

    // If it's a customer command or potential phone search
    if (isCustomerCommand || /^[0-9+٠-٩۰-۹\s-]{8,}$/.test(text)) {
      // Authorization Check
      if (!isTelegramAdmin(fromId)) {
        await telegramSendMessage(
          chatId,
          '⛔ <b>عذرًا، هذا القسم مخصص لمدراء النظام المصرح لهم فقط.</b>'
        );
        return;
      }

      // Check if command is dashboard
      if (text === '/عميل' || text === '/customer' || text === '/start') {
        const currentCustomers = await getAuthoritativeCustomers(db, supabaseClient, saveToFile);
        const view = buildCustomerDashboardView(currentCustomers, db.orders);
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

      const currentCustomers = await getAuthoritativeCustomers(db, supabaseClient, saveToFile);
      const targetCustomer = currentCustomers.find(
        (c) =>
          c.normalized_phone === normalizedQuery ||
          c.original_phone === rawQuery ||
          c.original_phone === normalizedQuery
      );

      if (targetCustomer) {
        const view = buildCustomerProfileView(targetCustomer, db.orders);
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
    const messageId = cq.message?.message_id;
    const chatId = cq.message?.chat?.id || cq.from?.id;

    // Normalize action prefixes (support both 'cust:' and 'customer:')
    let action = rawData;
    if (action.startsWith('customer:')) {
      action = 'cust:' + action.slice('customer:'.length);
    }

    const isCustomerCallback =
      action.startsWith('cust:') ||
      action === 'dash' ||
      action === 'refresh' ||
      action === 'search' ||
      action.startsWith('list') ||
      action.startsWith('multi') ||
      action.startsWith('repeat') ||
      action.startsWith('view:');

    if (!isCustomerCallback) {
      await telegramAnswerCallbackQuery(cq.id);
      return;
    }

    if (!action.startsWith('cust:')) {
      action = 'cust:' + action;
    }

    // Verify Admin Authorization
    if (!isTelegramAdmin(fromId)) {
      await telegramAnswerCallbackQuery(
        cq.id,
        '⛔ عذرًا، هذا القسم مخصص لمدراء النظام المصرح لهم فقط.',
        true
      );
      return;
    }

    // Answer immediately so Telegram stops loading spinner
    if (action === 'cust:dash' || action === 'cust:refresh') {
      await telegramAnswerCallbackQuery(cq.id, '🔄 تم تحديث لوحة التحكم');
    } else {
      await telegramAnswerCallbackQuery(cq.id);
    }

    if (action === 'cust:noop') {
      return;
    }

    if (!chatId || !messageId) {
      return;
    }

    try {
      // 1. 🔄 تحديث / لوحة التحكم
      if (action === 'cust:dash' || action === 'cust:refresh') {
        const currentCustomers = await getAuthoritativeCustomers(db, supabaseClient, saveToFile);
        const view = buildCustomerDashboardView(currentCustomers, db.orders);
        await telegramEditMessageText(chatId, messageId, view.text, view.replyMarkup);
        return;
      }

      // 2. 🔎 البحث عن عميل
      if (action === 'cust:search') {
        const view = buildCustomerSearchView();
        await telegramEditMessageText(chatId, messageId, view.text, view.replyMarkup);
        return;
      }

      // 3. 📋 كل العملاء (مع Pagination)
      if (action === 'cust:list' || action.startsWith('cust:list:')) {
        const currentCustomers = await getAuthoritativeCustomers(db, supabaseClient, saveToFile);
        const parts = action.split(':');
        const page = parseInt(parts[2] || '1', 10) || 1;
        const view = buildCustomerListView(currentCustomers, page);
        await telegramEditMessageText(chatId, messageId, view.text, view.replyMarkup);
        return;
      }

      // 4. ⚠️ أسماء متعددة (مع Pagination)
      if (action === 'cust:multi' || action.startsWith('cust:multi:')) {
        const currentCustomers = await getAuthoritativeCustomers(db, supabaseClient, saveToFile);
        const parts = action.split(':');
        const page = parseInt(parts[2] || '1', 10) || 1;
        const view = buildCustomerMultiNamesView(currentCustomers, page);
        await telegramEditMessageText(chatId, messageId, view.text, view.replyMarkup);
        return;
      }

      // 5. 🔁 العملاء المتكررون (مع Pagination)
      if (action === 'cust:repeat' || action.startsWith('cust:repeat:')) {
        const currentCustomers = await getAuthoritativeCustomers(db, supabaseClient, saveToFile);
        const parts = action.split(':');
        const page = parseInt(parts[2] || '1', 10) || 1;
        const view = buildCustomerRepeatView(currentCustomers, page);
        await telegramEditMessageText(chatId, messageId, view.text, view.replyMarkup);
        return;
      }

      // 6. 👤 عرض ملف العميل وتاريخ طلباته
      if (action.startsWith('cust:view:')) {
        const currentCustomers = await getAuthoritativeCustomers(db, supabaseClient, saveToFile);
        const targetId = action.slice('cust:view:'.length).trim();
        const targetCustomer = currentCustomers.find(
          (c) =>
            c.id === targetId ||
            c.normalized_phone === targetId ||
            c.original_phone === targetId
        );

        if (targetCustomer) {
          const view = buildCustomerProfileView(targetCustomer, db.orders);
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
    }
  }
}
