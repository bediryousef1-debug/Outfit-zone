import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  direction: 'rtl' | 'ltr';
  isRtl: boolean;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Navigation & Header
    'nav.home': 'الرئيسية',
    'nav.products': 'الموديلات',
    'nav.about': 'عن البراند',
    'nav.contact': 'تواصل معنا',
    'nav.cart': 'عربة التسوق',
    'nav.track': 'تتبع طلبك',
    'nav.search_placeholder': 'ابحث عن تيشيرت، بولو، أو قميص...',
    'nav.menu': 'القائمة الرئيسية',
    'nav.search': 'البحث',

    // Product Detail
    'product.direct_order': 'اطلب الآن',
    'product.direct_order_sub': 'الدفع كاش عند الاستلام • معاينة كاملة للطلب',
    'product.add_to_cart': 'أضف للسلة',
    'product.added_success': 'تمت الإضافة بنجاح! ✓',
    'product.select_color': 'يرجى اختيار اللون',
    'product.select_size': 'يرجى تحديد المقاس',
    'product.out_of_stock': 'المقاس المختار نفد من المخزون',
    'product.color': 'اللون:',
    'product.size': 'المقاس:',
    'product.quantity': 'الكمية:',
    'product.cash_on_delivery': '(الدفع عند الاستلام)',
    'product.cod_notice': 'كاش عند الاستلام',
    'product.inspection_notice': 'معاينة قبل الاستلام',
    'product.exchange_notice': 'استبدال المقاس متاح',
    'product.whatsapp_help': 'مساعدة في اختيار المقاس عبر WhatsApp',
    'product.fabric_details': 'مواصفات الخامة',
    'product.description': 'وصف الموديل',
    'product.reviews_tab': 'آراء العملاء',
    'product.comments_tab': 'الاستفسارات والتعليقات',
    'product.reviews_count': 'تقييم',
    'product.back_to_products': 'العودة للمنتجات',
    'product.not_found': 'عفوًا، المنتج غير متوفر',
    'product.write_review': 'أضف تقييمك للموديل',
    'product.write_comment': 'أضف استفسارك',
    'product.available': 'متوفر',
    'product.remaining': 'باقي',

    // Cart & Drawer
    'cart.title': 'عربة التسوق',
    'cart.empty': 'عربة التسوق فارغة',
    'cart.empty_desc': 'لم تقم بإضافة أي قطع إلى سلة مشترياتك بعد.',
    'cart.start_shopping': 'تصفح التشكيلة',
    'cart.subtotal': 'المجموع الجزئي:',
    'cart.shipping_calc': 'الشحن يُحسب عند إتمام الطلب',
    'cart.checkout_btn': 'متابعة إتمام الطلب',
    'cart.remove': 'حذف القطعة',
    'cart.view_bag': 'عرض عربة التسوق',
    'cart.total_items': 'منتجات',

    // Checkout
    'checkout.page_title': 'إتمام الطلب السريع',
    'checkout.subtitle': 'الدفع عند الاستلام كاش مع إمكانية المعاينة قبل الاستلام',
    'checkout.customer_name': 'الاسم بالكامل (ثلاثي)',
    'checkout.customer_name_placeholder': 'مثال: أحمد محمد علي',
    'checkout.phone': 'رقم الموبايل (واتساب متاح)',
    'checkout.phone_placeholder': '01012345678',
    'checkout.governorate': 'المحافظة',
    'checkout.select_governorate': 'اختر محافظتك',
    'checkout.city': 'المدينة / المركز / الحي',
    'checkout.city_placeholder': 'مثال: المعادي أو مدينة نصر',
    'checkout.address': 'العنوان بالتفصيل',
    'checkout.address_placeholder': 'اسم الشارع، رقم العمارة، رقم الشقة أو علامة مميزة',
    'checkout.notes': 'ملاحظات إضافية لشركة الشحن (اختياري)',
    'checkout.notes_placeholder': 'أي تعليمات بخصوص الموعد أو مكان التسليم...',
    'checkout.summary_title': 'ملخص الطلب',
    'checkout.subtotal': 'المجموع:',
    'checkout.shipping': 'الشحن:',
    'checkout.total': 'الإجمالي المطلوب دفعه:',
    'checkout.free_shipping': 'شحن مجاني',
    'checkout.submit_order': 'تأكيد الطلب الآن',
    'checkout.submitting': 'جاري تأكيد الطلب...',
    'checkout.cod_badge': 'الدفع كاش عند الاستلام',
    'checkout.inspection_badge': 'حق المعاينة قبل الاستلام',

    // Order Success
    'order.success_title': 'تم استلام طلبك بنجاح!',
    'order.success_desc': 'شكرًا لاختيارك Outfit Zone. سيقوم فريقنا بمراجعة الطلب وشحنه في أسرع وقت.',
    'order.number': 'رقم الطلب:',
    'order.keep_number': 'احتفظ برقم الطلب لتتبع شحنتك.',
    'order.track_btn': 'تتبع حالة الطلب',
    'order.continue_shopping': 'العودة للتسوق',

    // Trust Features
    'trust.cod_title': 'الدفع عند الاستلام',
    'trust.cod_desc': 'ادفع كاش فقط عند وصول المندوب لباب بيتك',
    'trust.inspection_title': 'حق المعاينة أولاً',
    'trust.inspection_desc': 'عاين الخامة والمقاس قبل الاستلام',
    'trust.fabric_title': 'قطن مصري 100%',
    'trust.fabric_desc': 'خامات قطنية ثقيلة ومعالجة ضد الانكماش',
    'trust.exchange_title': 'استبدال سريع',
    'trust.exchange_desc': 'استبدال سهل للمقاس خلال 14 يومًا',

    // Footer
    'footer.rights': 'جميع الحقوق محفوظة.',
    'footer.brand_desc': 'براند ملابس ستريت وير رجالي مصري يقدم أرقى تصاميم الـ Box Fit و Oversized بأعلى خامات قطنية مصرية.',
    'footer.quick_links': 'روابط سريعة',
    'footer.customer_service': 'خدمة العملاء',
    'footer.contact_us': 'تواصل معنا مباشرة',
    'footer.whatsapp_chat': 'محادثة عبر واتساب',
  },
  en: {
    // Navigation & Header
    'nav.home': 'Home',
    'nav.products': 'Collection',
    'nav.about': 'About Us',
    'nav.contact': 'Contact Us',
    'nav.cart': 'Shopping Bag',
    'nav.track': 'Track Order',
    'nav.search_placeholder': 'Search t-shirts, polos, shirts...',
    'nav.menu': 'Main Menu',
    'nav.search': 'Search',

    // Product Detail
    'product.direct_order': 'Order Now',
    'product.direct_order_sub': 'Cash on Delivery • Open Package Inspection',
    'product.add_to_cart': 'Add to Bag',
    'product.added_success': 'Added to Bag! ✓',
    'product.select_color': 'Please select a color',
    'product.select_size': 'Please select a size',
    'product.out_of_stock': 'Selected size is out of stock',
    'product.color': 'Color:',
    'product.size': 'Size:',
    'product.quantity': 'Quantity:',
    'product.cash_on_delivery': '(Cash on Delivery)',
    'product.cod_notice': 'Cash on Delivery',
    'product.inspection_notice': 'Inspection on Delivery',
    'product.exchange_notice': 'Size Exchange Available',
    'product.whatsapp_help': 'Need size help via WhatsApp?',
    'product.fabric_details': 'Fabric Details',
    'product.description': 'Product Description',
    'product.reviews_tab': 'Customer Reviews',
    'product.comments_tab': 'Questions & Comments',
    'product.reviews_count': 'reviews',
    'product.back_to_products': 'Back to Products',
    'product.not_found': 'Product not found',
    'product.write_review': 'Write a Review',
    'product.write_comment': 'Leave a Question',
    'product.available': 'In Stock',
    'product.remaining': 'Only',

    // Cart & Drawer
    'cart.title': 'Shopping Bag',
    'cart.empty': 'Your bag is empty',
    'cart.empty_desc': 'You have not added any streetwear pieces to your bag yet.',
    'cart.start_shopping': 'Explore Collection',
    'cart.subtotal': 'Subtotal:',
    'cart.shipping_calc': 'Shipping calculated at checkout',
    'cart.checkout_btn': 'Proceed to Checkout',
    'cart.remove': 'Remove',
    'cart.view_bag': 'View Bag',
    'cart.total_items': 'items',

    // Checkout
    'checkout.page_title': 'Fast Direct Checkout',
    'checkout.subtitle': 'Cash on Delivery across Egypt • Full package inspection before paying',
    'checkout.customer_name': 'Full Name',
    'checkout.customer_name_placeholder': 'e.g. Omar Ahmed Hassan',
    'checkout.phone': 'Phone Number (WhatsApp preferred)',
    'checkout.phone_placeholder': '01012345678',
    'checkout.governorate': 'Governorate',
    'checkout.select_governorate': 'Select your governorate',
    'checkout.city': 'City / District',
    'checkout.city_placeholder': 'e.g. Maadi, New Cairo, or Nasr City',
    'checkout.address': 'Detailed Address',
    'checkout.address_placeholder': 'Street name, building number, apartment, landmarks',
    'checkout.notes': 'Courier Delivery Notes (Optional)',
    'checkout.notes_placeholder': 'Any specific delivery timing or location notes...',
    'checkout.summary_title': 'Order Summary',
    'checkout.subtotal': 'Subtotal:',
    'checkout.shipping': 'Shipping Fee:',
    'checkout.total': 'Total to Pay:',
    'checkout.free_shipping': 'Free Shipping',
    'checkout.submit_order': 'Confirm Order Now',
    'checkout.submitting': 'Confirming your order...',
    'checkout.cod_badge': 'Cash on Delivery',
    'checkout.inspection_badge': 'Inspect Before Paying',

    // Order Success
    'order.success_title': 'Order Placed Successfully!',
    'order.success_desc': 'Thank you for choosing Outfit Zone. Our team will review and ship your order promptly.',
    'order.number': 'Order Number:',
    'order.keep_number': 'Please keep this order number to track your shipment.',
    'order.track_btn': 'Track Your Order',
    'order.continue_shopping': 'Continue Shopping',

    // Trust Features
    'trust.cod_title': 'Cash on Delivery',
    'trust.cod_desc': 'Pay in cash only when your order arrives at your door',
    'trust.inspection_title': 'Inspect First',
    'trust.inspection_desc': 'Check fabric and size before accepting the order',
    'trust.fabric_title': '100% Egyptian Cotton',
    'trust.fabric_desc': 'Heavyweight premium pre-shrunk cotton fabric',
    'trust.exchange_title': 'Hassle-Free Exchange',
    'trust.exchange_desc': 'Easy size replacement within 14 days',

    // Footer
    'footer.rights': 'All rights reserved.',
    'footer.brand_desc': 'Egyptian streetwear clothing brand delivering modern Box Fit and Oversized silhouettes crafted with high-grade Egyptian cotton.',
    'footer.quick_links': 'Quick Links',
    'footer.customer_service': 'Customer Care',
    'footer.contact_us': 'Contact Us',
    'footer.whatsapp_chat': 'Chat on WhatsApp',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'ar';
  try {
    const saved = localStorage.getItem('oz_lang');
    if (saved === 'ar' || saved === 'en') return saved;
  } catch {}
  return 'ar';
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const direction: 'rtl' | 'ltr' = language === 'ar' ? 'rtl' : 'ltr';
  const isRtl = language === 'ar';

  useEffect(() => {
    try {
      document.documentElement.dir = direction;
      document.documentElement.lang = language;
      localStorage.setItem('oz_lang', language);
    } catch {}
  }, [language, direction]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const t = (key: string, fallback?: string): string => {
    const langDict = translations[language] || translations.ar;
    return langDict[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        direction,
        isRtl,
        setLanguage,
        toggleLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
