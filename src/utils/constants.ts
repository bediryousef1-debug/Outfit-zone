export const EGYPTIAN_GOVERNORATES = [
  { id: 'cairo', nameAr: 'القاهرة', nameEn: 'Cairo' },
  { id: 'giza', nameAr: 'الجيزة', nameEn: 'Giza' },
  { id: 'alexandria', nameAr: 'الإسكندرية', nameEn: 'Alexandria' },
  { id: 'qalyubia', nameAr: 'القليوبية', nameEn: 'Qalyubia' },
  { id: 'sharqia', nameAr: 'الشرقية', nameEn: 'Sharqia' },
  { id: 'dakahlia', nameAr: 'الدقهلية', nameEn: 'Dakahlia' },
  { id: 'gharbia', nameAr: 'الغربية', nameEn: 'Gharbia' },
  { id: 'monufia', nameAr: 'المنوفية', nameEn: 'Monufia' },
  { id: 'beheira', nameAr: 'البحيرة', nameEn: 'Beheira' },
  { id: 'kafr_el_sheikh', nameAr: 'كفر الشيخ', nameEn: 'Kafr El Sheikh' },
  { id: 'damietta', nameAr: 'دمياط', nameEn: 'Damietta' },
  { id: 'port_said', nameAr: 'بورسعيد', nameEn: 'Port Said' },
  { id: 'ismailia', nameAr: 'الإسماعيلية', nameEn: 'Ismailia' },
  { id: 'suez', nameAr: 'السويس', nameEn: 'Suez' },
  { id: 'fayoum', nameAr: 'الفيوم', nameEn: 'Fayoum' },
  { id: 'beni_suef', nameAr: 'بني سويف', nameEn: 'Beni Suef' },
  { id: 'minya', nameAr: 'المنيا', nameEn: 'Minya' },
  { id: 'asyut', nameAr: 'أسيوط', nameEn: 'Asyut' },
  { id: 'sohag', nameAr: 'سوهاج', nameEn: 'Sohag' },
  { id: 'qena', nameAr: 'قنا', nameEn: 'Qena' },
  { id: 'luxor', nameAr: 'الأقصر', nameEn: 'Luxor' },
  { id: 'aswan', nameAr: 'أسوان', nameEn: 'Aswan' },
  { id: 'red_sea', nameAr: 'البحر الأحمر', nameEn: 'Red Sea' },
  { id: 'new_valley', nameAr: 'الوادي الجديد', nameEn: 'New Valley' },
  { id: 'matrouh', nameAr: 'مطروح', nameEn: 'Matrouh' },
  { id: 'north_sinai', nameAr: 'شمال سيناء', nameEn: 'North Sinai' },
  { id: 'south_sinai', nameAr: 'جنوب سيناء', nameEn: 'South Sinai' },
];

export const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'قيد المراجعة', color: 'text-amber-400 bg-amber-950/40 border-amber-800/50' },
  confirmed: { label: 'تم التأكيد', color: 'text-blue-400 bg-blue-950/40 border-blue-800/50' },
  shipped: { label: 'تم الشحن', color: 'text-purple-400 bg-purple-950/40 border-purple-800/50' },
  delivered: { label: 'تم التسليم', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50' },
  cancelled: { label: 'ملغي', color: 'text-rose-400 bg-rose-950/40 border-rose-800/50' },
  returned: { label: 'مرتجع', color: 'text-orange-400 bg-orange-950/40 border-orange-800/50' },
};


export const STANDARD_SIZES = ['M', 'L', 'XL', '2XL', '3XL'];

export interface PopularColor {
  name: string;
  nameAr: string;
  nameEn: string;
  hex: string;
}

export const POPULAR_COLORS: PopularColor[] = [
  { name: 'أسود', nameAr: 'أسود', nameEn: 'Black', hex: '#111111' },
  { name: 'أسود كربوني', nameAr: 'أسود كربوني', nameEn: 'Carbon Black', hex: '#1c1c1e' },
  { name: 'أوف وايت', nameAr: 'أوف وايت', nameEn: 'Off-White', hex: '#f4f3ed' },
  { name: 'أبيض ناصع', nameAr: 'أبيض ناصع', nameEn: 'Pure White', hex: '#ffffff' },
  { name: 'كحلي', nameAr: 'كحلي', nameEn: 'Navy Blue', hex: '#1e293b' },
  { name: 'شاركول', nameAr: 'شاركول', nameEn: 'Charcoal', hex: '#2b2d42' },
  { name: 'رمادي غامق', nameAr: 'رمادي غامق', nameEn: 'Dark Grey', hex: '#374151' },
  { name: 'رمادي فاتح', nameAr: 'رمادي فاتح', nameEn: 'Light Grey', hex: '#9ca3af' },
  { name: 'رمادي شاحب', nameAr: 'رمادي شاحب', nameEn: 'Pale Grey', hex: '#cbd5e1' },
  { name: 'أخضر زيتي', nameAr: 'أخضر زيتي', nameEn: 'Olive Green', hex: '#3f4f34' },
  { name: 'زيتي شاحب', nameAr: 'زيتي شاحب', nameEn: 'Pale Olive', hex: '#58644e' },
  { name: 'بيج', nameAr: 'بيج', nameEn: 'Beige', hex: '#d6c7b2' },
  { name: 'بني شوكولاتة', nameAr: 'بني شوكولاتة', nameEn: 'Chocolate Brown', hex: '#3b2f2f' },
  { name: 'عنابي / نبيتي', nameAr: 'عنابي', nameEn: 'Burgundy', hex: '#4a1525' },
  { name: 'لافندر', nameAr: 'لافندر', nameEn: 'Lavender', hex: '#8b7da8' },
  { name: 'سماوي', nameAr: 'سماوي', nameEn: 'Baby Blue', hex: '#87ceeb' },
  { name: 'كاكي', nameAr: 'كاكي', nameEn: 'Khaki', hex: '#7c735c' },
  { name: 'خردلي', nameAr: 'خردلي', nameEn: 'Mustard', hex: '#c69214' },
];

/**
 * Splits a composite color name into separate Arabic and English names.
 * Supports "اسم عربي / English Name", "اسم عربي|English Name", or dictionary lookup.
 */
export function splitColorName(color: string | undefined | null): { ar: string; en: string } {
  if (!color) return { ar: '', en: '' };
  const trimmed = color.trim();
  if (!trimmed) return { ar: '', en: '' };

  if (trimmed.includes(' / ')) {
    const parts = trimmed.split(' / ').map((p) => p.trim());
    if (parts.length >= 2) {
      return { ar: parts[0], en: parts[1] };
    }
  }

  if (trimmed.includes('|')) {
    const parts = trimmed.split('|').map((p) => p.trim());
    if (parts.length >= 2) {
      return { ar: parts[0], en: parts[1] };
    }
  }

  if (trimmed.includes(' /')) {
    const parts = trimmed.split(' /').map((p) => p.trim());
    if (parts.length >= 2) {
      return { ar: parts[0], en: parts[1] };
    }
  }

  // Lookup in popular colors
  const matched = POPULAR_COLORS.find(
    (c) =>
      c.name.toLowerCase() === trimmed.toLowerCase() ||
      c.nameAr.toLowerCase() === trimmed.toLowerCase() ||
      c.nameEn.toLowerCase() === trimmed.toLowerCase()
  );
  if (matched) {
    return { ar: matched.nameAr, en: matched.nameEn };
  }

  // Lookup in color dictionary
  const lookup = COLOR_DICTIONARY[trimmed.toLowerCase()];
  if (lookup) {
    return { ar: lookup.ar, en: lookup.en };
  }

  // Detect if text is mostly Arabic or English
  const hasArabic = /[\u0600-\u06FF]/.test(trimmed);
  if (hasArabic) {
    return { ar: trimmed, en: '' };
  }
  return { ar: '', en: trimmed };
}

/**
 * Formats an Arabic name and an English name into canonical composite storage format:
 * "اسم عربي / English Name"
 */
export function formatColorComposite(nameAr: string, nameEn: string): string {
  const ar = (nameAr || '').trim();
  const en = (nameEn || '').trim();
  if (ar && en) {
    return `${ar} / ${en}`;
  }
  return ar || en || '';
}

const COLOR_DICTIONARY: Record<string, { ar: string; en: string }> = {
  'أسود': { ar: 'أسود', en: 'Black' },
  'black': { ar: 'أسود', en: 'Black' },
  'أسود كربوني': { ar: 'أسود كربوني', en: 'Carbon Black' },
  'carbon black': { ar: 'أسود كربوني', en: 'Carbon Black' },
  'أوف وايت': { ar: 'أوف وايت', en: 'Off-White' },
  'off-white': { ar: 'أوف وايت', en: 'Off-White' },
  'offwhite': { ar: 'أوف وايت', en: 'Off-White' },
  'off white': { ar: 'أوف وايت', en: 'Off-White' },
  'أبيض': { ar: 'أبيض', en: 'White' },
  'أبيض ناصع': { ar: 'أبيض ناصع', en: 'Pure White' },
  'white': { ar: 'أبيض', en: 'White' },
  'pure white': { ar: 'أبيض ناصع', en: 'Pure White' },
  'كحلي': { ar: 'كحلي', en: 'Navy Blue' },
  'navy': { ar: 'كحلي', en: 'Navy Blue' },
  'navy blue': { ar: 'كحلي', en: 'Navy Blue' },
  'شاحب / كحلي': { ar: 'كحلي', en: 'Navy Blue' },
  'رمادي': { ar: 'رمادي', en: 'Grey' },
  'grey': { ar: 'رمادي', en: 'Grey' },
  'gray': { ar: 'رمادي', en: 'Grey' },
  'رمادي غامق': { ar: 'رمادي غامق', en: 'Dark Grey' },
  'dark grey': { ar: 'رمادي غامق', en: 'Dark Grey' },
  'dark gray': { ar: 'رمادي غامق', en: 'Dark Grey' },
  'رمادي فاتح': { ar: 'رمادي فاتح', en: 'Light Grey' },
  'light grey': { ar: 'رمادي فاتح', en: 'Light Grey' },
  'light gray': { ar: 'رمادي فاتح', en: 'Light Grey' },
  'رمادي شاحب': { ar: 'رمادي شاحب', en: 'Pale Grey' },
  'pale grey': { ar: 'رمادي شاحب', en: 'Pale Grey' },
  'pale gray': { ar: 'رمادي شاحب', en: 'Pale Grey' },
  'زيتي': { ar: 'زيتي', en: 'Olive Green' },
  'أخضر زيتي': { ar: 'أخضر زيتي', en: 'Olive Green' },
  'زيتي شاحب': { ar: 'زيتي شاحب', en: 'Pale Olive' },
  'olive': { ar: 'زيتي', en: 'Olive Green' },
  'olive green': { ar: 'أخضر زيتي', en: 'Olive Green' },
  'pale olive': { ar: 'زيتي شاحب', en: 'Pale Olive' },
  'بيج': { ar: 'بيج', en: 'Beige' },
  'beige': { ar: 'بيج', en: 'Beige' },
  'بيج فاتح': { ar: 'بيج فاتح', en: 'Light Beige' },
  'light beige': { ar: 'بيج فاتح', en: 'Light Beige' },
  'بني': { ar: 'بني', en: 'Brown' },
  'brown': { ar: 'بني', en: 'Brown' },
  'بني شوكولاتة': { ar: 'بني شوكولاتة', en: 'Chocolate Brown' },
  'chocolate brown': { ar: 'بني شوكولاتة', en: 'Chocolate Brown' },
  'عنابي': { ar: 'عنابي', en: 'Burgundy' },
  'نبيتي': { ar: 'نبيتي', en: 'Burgundy' },
  'عنابي / نبيتي': { ar: 'عنابي', en: 'Burgundy' },
  'burgundy': { ar: 'عنابي', en: 'Burgundy' },
  'maroon': { ar: 'نبيتي', en: 'Maroon' },
  'فحمي': { ar: 'فحمي', en: 'Charcoal' },
  'شاركول': { ar: 'شاركول', en: 'Charcoal' },
  'charcoal': { ar: 'شاركول', en: 'Charcoal' },
  'أزرق': { ar: 'أزرق', en: 'Blue' },
  'blue': { ar: 'أزرق', en: 'Blue' },
  'سماوي': { ar: 'سماوي', en: 'Baby Blue' },
  'baby blue': { ar: 'سماوي', en: 'Baby Blue' },
  'لافندر': { ar: 'لافندر', en: 'Lavender' },
  'lavender': { ar: 'لافندر', en: 'Lavender' },
  'كاكي': { ar: 'كاكي', en: 'Khaki' },
  'khaki': { ar: 'كاكي', en: 'Khaki' },
  'خردلي': { ar: 'خردلي', en: 'Mustard' },
  'mustard': { ar: 'خردلي', en: 'Mustard' },
  'بترولي': { ar: 'بترولي', en: 'Teal Blue' },
  'teal': { ar: 'بترولي', en: 'Teal Blue' },
  'أحمر': { ar: 'أحمر', en: 'Red' },
  'red': { ar: 'أحمر', en: 'Red' },
  'أخضر': { ar: 'أخضر', en: 'Green' },
  'green': { ar: 'أخضر', en: 'Green' },
  'وردي': { ar: 'وردي', en: 'Pink' },
  'pink': { ar: 'وردي', en: 'Pink' },
};

/**
 * Returns the localized color name based on the current active language.
 * Supports composite format (e.g. "أسود / Black" or "أسود|Black") and automatic translation dictionary.
 */
export function getLocalizedColorName(
  color: string | undefined | null,
  lang: 'ar' | 'en' = 'ar'
): string {
  if (!color) return '';
  const trimmed = color.trim();
  if (!trimmed) return '';

  // Check if string contains explicit dual-language separator
  if (trimmed.includes(' / ')) {
    const parts = trimmed.split(' / ').map((p) => p.trim());
    if (parts.length >= 2) {
      return lang === 'ar' ? parts[0] : parts[1];
    }
  }

  if (trimmed.includes('|')) {
    const parts = trimmed.split('|').map((p) => p.trim());
    if (parts.length >= 2) {
      return lang === 'ar' ? parts[0] : parts[1];
    }
  }

  // Check POPULAR_COLORS table
  const matched = POPULAR_COLORS.find(
    (c) =>
      c.name.toLowerCase() === trimmed.toLowerCase() ||
      c.nameAr.toLowerCase() === trimmed.toLowerCase() ||
      c.nameEn.toLowerCase() === trimmed.toLowerCase()
  );

  if (matched) {
    return lang === 'ar' ? matched.nameAr : matched.nameEn;
  }

  const lookup = COLOR_DICTIONARY[trimmed.toLowerCase()];
  if (lookup) {
    return lang === 'ar' ? lookup.ar : lookup.en;
  }

  return trimmed;
}

/**
 * Returns the localized category name based on the active language.
 */
export function getLocalizedCategoryName(
  categoryName: string | undefined | null,
  lang: 'ar' | 'en' = 'ar'
): string {
  if (!categoryName) return '';
  const trimmed = categoryName.trim();
  if (!trimmed) return '';

  if (trimmed.includes(' / ')) {
    const parts = trimmed.split(' / ').map((p) => p.trim());
    if (parts.length >= 2) {
      return lang === 'ar' ? parts[0] : parts[1];
    }
  }

  const catMap: Record<string, { ar: string; en: string }> = {
    'تيشيرتات box fit': { ar: 'تيشيرتات Box Fit', en: 'Box Fit T-Shirts' },
    'box fit t-shirts': { ar: 'تيشيرتات Box Fit', en: 'Box Fit T-Shirts' },
    'box-fit-t-shirts': { ar: 'تيشيرتات Box Fit', en: 'Box Fit T-Shirts' },
    'تيشيرتات oversized': { ar: 'تيشيرتات Oversized', en: 'Oversized T-Shirts' },
    'oversized t-shirts': { ar: 'تيشيرتات Oversized', en: 'Oversized T-Shirts' },
    'oversized-t-shirts': { ar: 'تيشيرتات Oversized', en: 'Oversized T-Shirts' },
    'بولو ستريت وير': { ar: 'بولو ستريت وير', en: 'Streetwear Polos' },
    'streetwear polos': { ar: 'بولو ستريت وير', en: 'Streetwear Polos' },
    'streetwear-polos': { ar: 'بولو ستريت وير', en: 'Streetwear Polos' },
    'قمصان ستريت وير': { ar: 'قمصان ستريت وير', en: 'Streetwear Shirts' },
    'streetwear shirts': { ar: 'قمصان ستريت وير', en: 'Streetwear Shirts' },
    'streetwear-shirts': { ar: 'قمصان ستريت وير', en: 'Streetwear Shirts' },
    'ستريت وير': { ar: 'ستريت وير', en: 'Streetwear' },
    'streetwear': { ar: 'ستريت وير', en: 'Streetwear' },
  };

  const lookup = catMap[trimmed.toLowerCase()];
  if (lookup) {
    return lang === 'ar' ? lookup.ar : lookup.en;
  }

  return trimmed;
}

/**
 * Returns the localized product name based on the active language.
 */
export function getLocalizedProductName(
  product: { name: string; name_ar?: string; name_en?: string } | null | undefined,
  lang: 'ar' | 'en' = 'ar'
): string {
  if (!product) return '';
  if (lang === 'en' && product.name_en) return product.name_en;
  if (lang === 'ar' && product.name_ar) return product.name_ar;

  const rawName = (product.name || '').trim();
  if (rawName.includes(' / ')) {
    const parts = rawName.split(' / ').map((p) => p.trim());
    if (parts.length >= 2) {
      return lang === 'ar' ? parts[0] : parts[1];
    }
  }

  const catalogTranslations: Record<string, { ar: string; en: string }> = {
    'تيشيرت interlock box fit - أسود كربوني': {
      ar: 'تيشيرت Interlock Box Fit - أسود كربوني',
      en: 'Interlock Box Fit T-Shirt - Carbon Black',
    },
    'تيشيرت drop shoulder oversized - أوف وايت': {
      ar: 'تيشيرت Drop Shoulder Oversized - أوف وايت',
      en: 'Drop Shoulder Oversized T-Shirt - Off-White',
    },
    'بولو تريكو إنترلوك boxy fit - شاركول': {
      ar: 'بولو تريكو إنترلوك Boxy Fit - شاركول',
      en: 'Interlock Knit Boxy Polo - Charcoal',
    },
    'قمصان ستريت وير بياقة كوبية - زيتي شاحب': {
      ar: 'قمصان ستريت وير بياقة كوبية - زيتي شاحب',
      en: 'Resort Collar Streetwear Shirt - Pale Olive',
    },
    'تيشيرت ستريت وير هيفي قطن - رمادي شاحب': {
      ar: 'تيشيرت ستريت وير هيفي قطن - رمادي شاحب',
      en: 'Heavy Cotton Streetwear Tee - Pale Grey',
    },
    'تيشيرت box fit هيفي قطن مصري': {
      ar: 'تيشيرت Box Fit هيفي قطن مصري',
      en: 'Heavy Box Fit Egyptian Cotton Tee',
    },
    'تيشيرت أوفرسايز دروب شولدر': {
      ar: 'تيشيرت أوفرسايز دروب شولدر',
      en: 'Drop Shoulder Oversized Tee',
    },
    'قميص صيفي ستريت وير خفيف': {
      ar: 'قميص صيفي ستريت وير خفيف',
      en: 'Lightweight Streetwear Summer Shirt',
    },
    'بولو أوفرسايز قطن بي كيه': {
      ar: 'بولو أوفرسايز قطن بي كيه',
      en: 'Pique Cotton Oversized Polo',
    },
    'تيشيرت بوكس فيت مطبوع': {
      ar: 'تيشيرت بوكس فيت مطبوع',
      en: 'Graphic Box Fit T-Shirt',
    },
    'تيشيرت أسود بيسيك قطن مصري': {
      ar: 'تيشيرت أسود بيسيك قطن مصري',
      en: 'Basic Black Egyptian Cotton Tee',
    },
    'تيشيرت أوفرسايز أوف وايت ناعم': {
      ar: 'تيشيرت أوفرسايز أوف وايت ناعم',
      en: 'Soft Off-White Oversized Tee',
    },
    'بولو بي كيه كحلي ستريت وير': {
      ar: 'بولو بي كيه كحلي ستريت وير',
      en: 'Streetwear Navy Pique Polo',
    },
    'تيشيرت بوكس فيت زيتي شاحب': {
      ar: 'تيشيرت بوكس فيت زيتي شاحب',
      en: 'Pale Olive Box Fit T-Shirt',
    },
  };

  const match = catalogTranslations[rawName.toLowerCase()];
  if (match) {
    return lang === 'ar' ? match.ar : match.en;
  }

  return rawName;
}

// Egyptian mobile phone regex: starts with 010, 011, 012, or 015 followed by 8 digits
export const EGYPT_PHONE_REGEX = /^(010|011|012|015)[0-9]{8}$/;

/**
 * Normalizes an Egyptian phone number to canonical 11-digit local format: 01XXXXXXXXX
 * Handles:
 * - 01012345678 -> 01012345678
 * - +201012345678 -> 01012345678
 * - 201012345678 -> 01012345678
 * - 1012345678 -> 01012345678
 */
export function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return '';
  let cleaned = rawPhone.toString().trim().replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.startsWith('+20')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('0020')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('20') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(2);
  } else if (cleaned.length === 10 && (cleaned.startsWith('10') || cleaned.startsWith('11') || cleaned.startsWith('12') || cleaned.startsWith('15'))) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
}

export function validateEgyptianPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/[\s-]/g, '');
  // Also handle +20 or 20 prefix
  if (cleanPhone.startsWith('+20')) {
    return EGYPT_PHONE_REGEX.test('0' + cleanPhone.slice(3));
  }
  if (cleanPhone.startsWith('20') && cleanPhone.length === 12) {
    return EGYPT_PHONE_REGEX.test('0' + cleanPhone.slice(2));
  }
  return EGYPT_PHONE_REGEX.test(cleanPhone);
}

export function formatEgyptianPhone(phone: string): string {
  const cleanPhone = phone.replace(/[\s-]/g, '');
  if (cleanPhone.startsWith('+20')) {
    return '0' + cleanPhone.slice(3);
  }
  if (cleanPhone.startsWith('20') && cleanPhone.length === 12) {
    return '0' + cleanPhone.slice(2);
  }
  return cleanPhone;
}

export function formatPrice(amount: number, lang: 'ar' | 'en' = 'ar'): string {
  if (lang === 'en') {
    return `${amount.toLocaleString('en-US')} EGP`;
  }
  return `${amount.toLocaleString('ar-EG')} جنيه`;
}

export function formatPriceEn(amount: number): string {
  return `${amount.toLocaleString('en-US')} EGP`;
}
