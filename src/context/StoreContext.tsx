import React, { createContext, useContext, useEffect, useState } from 'react';
import { Category, ContactSocialSettings, StoreContent, StoreSettings } from '../types';
import { api } from '../services/api';

interface StoreContextType {
  settings: StoreSettings | null;
  content: StoreContent | null;
  contactSocial: ContactSocialSettings | null;
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  getWhatsAppUrl: (contextualMessage?: string) => string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    messenger?: string;
  };
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [content, setContent] = useState<StoreContent | null>(null);
  const [contactSocial, setContactSocial] = useState<ContactSocialSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [settingsData, categoriesData, contentData, socialData] = await Promise.all([
        api.getStoreSettings().catch(() => ({
          id: 'default',
          store_name: 'Outfit Zone',
          shipping_fee: 65,
          whatsapp_number: '201012345678',
          phone_number: '01012345678',
          inspection_available: true,
          exchange_policy: 'استبدال المقاس متاح خلال 14 يوم من تاريخ الاستلام.',
          return_policy: 'إرجاع المنتج متاح خلال 3 أيام في حالته الأصلية وبطاقة المنتج.',
          cod_message: 'الدفع عند الاستلام فقط لجميع المحافظات داخل مصر.',
        })),
        api.getCategories().catch(() => []),
        api.getStoreContent().catch(() => ({
          id: 'default',
          hero_title: 'WEAR IN THE ZONE',
          hero_subtitle: 'ستايل يومي بروح الشارع المصري',
          hero_button_text: 'تسوق الآن',
          hero_image_url: '/src/assets/images/hero_streetwear_editorial_1790342899745.jpg',
          featured_section_title: 'الموديلات الأكثر طلباً',
          new_arrivals_section_title: 'وصل حديثًا',
          categories_section_title: 'تسوق حسب الستايل والقَصّة',
          cta_title: 'انضم إلى مجتمع Outfit Zone',
          cta_text: 'قصات Box Fit و Oversized مريحة مصممة بعناية من خامات قطنية ثقيلة 240+ GSM تدوم معك.',
          announcement_text: 'الدفع عند الاستلام فقط داخل جميع محافظات مصر · معاينة مجانية للطلب قبل الدفع والاستلام',
          show_hero: true,
          show_featured: true,
          show_new_arrivals: true,
          show_categories: true,
          show_trust: true,
          show_contact_cta: true,
          about_text: 'براند مصري متخصص في ملابس الستريت وير الرجالي بقصات Box Fit و Oversized، مصممة بخامات قطنية ثقيلة لتمنحك الراحة والثقة يوميًا بروح الشارع.',
          about_story: 'انطلق Outfit Zone لتقديم ملابس شارع مصرية بجودة استثنائية وبدون مبالغة في الأسعار.',
          contact_text: 'فريق خدمة عملاء Outfit Zone جاهز للرد على استفساراتك يوميًا بخصوص المقاسات والشحن.',
          footer_text: 'براند مصري متخصص في ملابس الستريت وير الرجالي بقصات Box Fit و Oversized، مصممة بخامات قطنية ثقيلة لتمنحك الراحة والثقة يوميًا بروح الشارع.',
          shipping_text: 'شحن لجميع محافظات مصر خلال 2 إلى 5 أيام عمل.',
          inspection_text: 'معاينة مجانية للمنتج قبل الدفع والاستلام.',
          exchange_policy: 'استبدال المقاس متاح خلال 14 يوم من تاريخ الاستلام.',
          return_policy: 'إرجاع المنتج متاح خلال 3 أيام في حالته الأصلية وبطاقة المنتج.',
          cod_text: 'الدفع عند الاستلام فقط لجميع المحافظات.',
        })),
        api.getContactSocial().catch(() => ({
          id: 'default',
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
        })),
      ]);

      setSettings(settingsData);
      setCategories(categoriesData);
      setContent(contentData);
      setContactSocial(socialData);
    } catch (err: any) {
      console.error('Failed to load store metadata:', err);
      setError(err.message || 'حدث خطأ في جلب بيانات المتجر');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getWhatsAppUrl = (contextualMessage?: string): string => {
    const rawNumber = contactSocial?.whatsapp_number || settings?.whatsapp_number || '201012345678';
    const cleanNumber = rawNumber.replace(/[\s+-]/g, '');
    const defaultMsg = 'مرحبًا Outfit Zone، أريد الاستفسار عن الموديلات والمقاسات المتاحة.';
    const text = contextualMessage || defaultMsg;
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
  };

  const socialLinks = {
    instagram: contactSocial?.instagram_enabled ? contactSocial.instagram_url : undefined,
    facebook: contactSocial?.facebook_enabled ? contactSocial.facebook_url : undefined,
    tiktok: contactSocial?.tiktok_enabled ? contactSocial.tiktok_url : undefined,
    messenger: contactSocial?.messenger_enabled ? contactSocial.messenger_url : undefined,
  };

  return (
    <StoreContext.Provider
      value={{
        settings,
        content,
        contactSocial,
        categories,
        isLoading,
        error,
        refreshData: loadData,
        getWhatsAppUrl,
        socialLinks,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
