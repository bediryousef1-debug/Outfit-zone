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
};

export const STANDARD_SIZES = ['M', 'L', 'XL', '2XL', '3XL'];

export const POPULAR_COLORS = [
  { name: 'أسود', hex: '#111111' },
  { name: 'أوف وايت', hex: '#f4f3ed' },
  { name: 'شاحب / كحلي', hex: '#1e293b' },
  { name: 'رمادي غامق', hex: '#374151' },
  { name: 'زيتي', hex: '#3f4f34' },
  { name: 'بيج', hex: '#d6c7b2' },
  { name: 'بني شوكولاتة', hex: '#3b2f2f' },
];

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

export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('ar-EG')} جنيه`;
}

export function formatPriceEn(amount: number): string {
  return `${amount} EGP`;
}
