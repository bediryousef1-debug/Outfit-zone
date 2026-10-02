import React, { useEffect, useState } from 'react';
import { StoreContent } from '../../types';
import { api } from '../../services/api';
import { useStore } from '../../context/StoreContext';
import { FileText, Save, Check, AlertCircle, RefreshCw, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';

export const AdminContentPage: React.FC = () => {
  const { refreshData } = useStore();
  const [content, setContent] = useState<StoreContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchContent = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getStoreContent();
      setContent(data);
    } catch (err: any) {
      setError(err.message || 'فشل جلب محتوى المتجر');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleChange = (field: keyof StoreContent, value: any) => {
    if (!content) return;
    setContent({
      ...content,
      [field]: value,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;

    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.adminUpdateStoreContent(content);
      await refreshData();
      setSuccessMsg('تم حفظ وتحديث محتوى المتجر في Supabase بنجاح!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'فشل حفظ محتوى المتجر');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-neutral-400 text-xs flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>جاري تحميل محتوى المتجر...</span>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="p-8 text-center text-red-400 text-xs">
        لم يتم العثور على محتوى المتجر.
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header & Save Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-16 z-20 bg-[#09090b]/95 backdrop-blur-md py-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-neutral-300" />
            <span>نظام إدارة محتوى المتجر (CMS)</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            التحكم الكامل في نصوص الواجهة، الأقسام، الشعار، والسياسات مع الحفظ الفوري في Supabase.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="py-2.5 px-6 rounded-xl bg-white hover:bg-neutral-200 text-black font-black text-xs transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 flex items-center gap-2.5 text-xs text-emerald-200 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-800 flex items-center gap-2.5 text-xs text-red-200 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Homepage Section Visibility Toggles */}
      <div className="p-6 rounded-2xl bg-[#0f0f13] border border-neutral-800 space-y-4 shadow-md">
        <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-neutral-800/80 pb-3">
          <ToggleRight className="w-4 h-4 text-neutral-300" />
          <span>التحكم في إظهار وإخفاء أقسام الصفحة الرئيسية (Section Toggles)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {[
            { key: 'show_hero', label: 'قسم الواجهة الرئيسي (Hero Banner)' },
            { key: 'show_featured', label: 'قسم الموديلات المميزة (Featured)' },
            { key: 'show_new_arrivals', label: 'قسم وصل حديثًا (New Arrivals)' },
            { key: 'show_categories', label: 'قسم استعراض الأقسام (Categories)' },
            { key: 'show_trust', label: 'قسم قصة البراند والخامات (Trust/Story)' },
            { key: 'show_contact_cta', label: 'بانر التواصل والدعم السريع (Contact CTA)' },
          ].map((item) => {
            const isEnabled = (content as any)[item.key];
            return (
              <label
                key={item.key}
                className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer select-none"
              >
                <span className="text-xs font-semibold text-neutral-200">{item.label}</span>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => handleChange(item.key as any, e.target.checked)}
                  className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-white accent-white cursor-pointer"
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* 2. Hero Section & Announcement Bar */}
      <div className="p-6 rounded-2xl bg-[#0f0f13] border border-neutral-800 space-y-5 shadow-md">
        <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-neutral-800/80 pb-3">
          <Sparkles className="w-4 h-4 text-neutral-300" />
          <span>الواجهة الرئيسية وشريط الإعلانات (Hero & Announcement)</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            نص شريط الإعلان العلوي (Announcement Bar)
          </label>
          <input
            type="text"
            value={content.announcement_text}
            onChange={(e) => handleChange('announcement_text', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              عنوان البانر الرئيسي بالإنجليزية (Hero Title)
            </label>
            <input
              type="text"
              value={content.hero_title}
              onChange={(e) => handleChange('hero_title', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              العنوان الفرعي بالعربية (Hero Subtitle)
            </label>
            <input
              type="text"
              value={content.hero_subtitle}
              onChange={(e) => handleChange('hero_subtitle', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              نص زر الشراء الرئيسي (Hero Button Text)
            </label>
            <input
              type="text"
              value={content.hero_button_text}
              onChange={(e) => handleChange('hero_button_text', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              رابط صورة البانر الرئيسي (Hero Image URL)
            </label>
            <input
              type="text"
              value={content.hero_image_url}
              onChange={(e) => handleChange('hero_image_url', e.target.value)}
              dir="ltr"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors font-mono"
            />
          </div>
        </div>
      </div>

      {/* 3. Section Titles & CTA Texts */}
      <div className="p-6 rounded-2xl bg-[#0f0f13] border border-neutral-800 space-y-5 shadow-md">
        <h3 className="text-white font-bold text-sm border-b border-neutral-800/80 pb-3">
          عناوين الأقسام الرئيسية في الصفحة الأولى
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              عنوان قسم المميز (Featured Section Title)
            </label>
            <input
              type="text"
              value={content.featured_section_title}
              onChange={(e) => handleChange('featured_section_title', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              عنوان قسم وصل حديثًا (New Arrivals Title)
            </label>
            <input
              type="text"
              value={content.new_arrivals_section_title}
              onChange={(e) => handleChange('new_arrivals_section_title', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              عنوان قسم الأقسام (Categories Title)
            </label>
            <input
              type="text"
              value={content.categories_section_title}
              onChange={(e) => handleChange('categories_section_title', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              عنوان بانر التواصل والدعوة (CTA Title)
            </label>
            <input
              type="text"
              value={content.cta_title}
              onChange={(e) => handleChange('cta_title', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              نص الدعوة التفصيلي (CTA Description Text)
            </label>
            <input
              type="text"
              value={content.cta_text}
              onChange={(e) => handleChange('cta_text', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 4. Pages Text (About & Contact) */}
      <div className="p-6 rounded-2xl bg-[#0f0f13] border border-neutral-800 space-y-5 shadow-md">
        <h3 className="text-white font-bold text-sm border-b border-neutral-800/80 pb-3">
          نصوص صفحات الموقع (About & Contact)
        </h3>

        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            مقدمة صفحة من نحن (About Page Text)
          </label>
          <textarea
            rows={2}
            value={content.about_text}
            onChange={(e) => handleChange('about_text', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            قصة البراند والخامات بالتفصيل (Brand Story & Fabrics)
          </label>
          <textarea
            rows={3}
            value={content.about_story}
            onChange={(e) => handleChange('about_story', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            نص صفحة تواصل معنا (Contact Page Text)
          </label>
          <textarea
            rows={2}
            value={content.contact_text}
            onChange={(e) => handleChange('contact_text', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors leading-relaxed"
          />
        </div>
      </div>

      {/* 5. Policies & Footer Texts */}
      <div className="p-6 rounded-2xl bg-[#0f0f13] border border-neutral-800 space-y-5 shadow-md">
        <h3 className="text-white font-bold text-sm border-b border-neutral-800/80 pb-3">
          سياسات المتجر، الشحن، والفوتر (Policies & Footer)
        </h3>

        {/* Shipping */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              نص الشحن والتوصيل بالعربية (Shipping Text AR)
            </label>
            <input
              type="text"
              value={content.shipping_text}
              onChange={(e) => handleChange('shipping_text', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              نص الشحن والتوصيل بالإنجليزية (Shipping Text EN)
            </label>
            <input
              type="text"
              value={content.shipping_text_en || ''}
              onChange={(e) => handleChange('shipping_text_en', e.target.value)}
              dir="ltr"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors"
            />
          </div>
        </div>

        {/* Inspection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              نص المعاينة المجانية بالعربية (Inspection Text AR)
            </label>
            <input
              type="text"
              value={content.inspection_text}
              onChange={(e) => handleChange('inspection_text', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              نص المعاينة المجانية بالإنجليزية (Inspection Text EN)
            </label>
            <input
              type="text"
              value={content.inspection_text_en || ''}
              onChange={(e) => handleChange('inspection_text_en', e.target.value)}
              dir="ltr"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors"
            />
          </div>
        </div>

        {/* Exchange Policy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              سياسة استبدال المقاس بالعربية (Exchange Policy AR)
            </label>
            <input
              type="text"
              value={content.exchange_policy}
              onChange={(e) => handleChange('exchange_policy', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              سياسة استبدال المقاس بالإنجليزية (Exchange Policy EN)
            </label>
            <input
              type="text"
              value={content.exchange_policy_en || ''}
              onChange={(e) => handleChange('exchange_policy_en', e.target.value)}
              dir="ltr"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors"
            />
          </div>
        </div>

        {/* Return Policy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              سياسة الإرجاع بالعربية (Return Policy AR)
            </label>
            <input
              type="text"
              value={content.return_policy}
              onChange={(e) => handleChange('return_policy', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              سياسة الإرجاع بالإنجليزية (Return Policy EN)
            </label>
            <input
              type="text"
              value={content.return_policy_en || ''}
              onChange={(e) => handleChange('return_policy_en', e.target.value)}
              dir="ltr"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              نص الدفع عند الاستلام (COD Text)
            </label>
            <input
              type="text"
              value={content.cod_text}
              onChange={(e) => handleChange('cod_text', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              نبذة أسفل الصفحة في الفوتر (Footer Text)
            </label>
            <input
              type="text"
              value={content.footer_text}
              onChange={(e) => handleChange('footer_text', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="py-3 px-8 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات في Supabase'}</span>
        </button>
      </div>
    </form>
  );
};