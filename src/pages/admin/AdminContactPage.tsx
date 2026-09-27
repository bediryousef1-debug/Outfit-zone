import React, { useEffect, useState } from 'react';
import { ContactSocialSettings } from '../../types';
import { api } from '../../services/api';
import { useStore } from '../../context/StoreContext';
import { Share2, Save, Check, AlertCircle, RefreshCw, MessageCircle, Phone } from 'lucide-react';

export const AdminContactPage: React.FC = () => {
  const { refreshData } = useStore();
  const [social, setSocial] = useState<ContactSocialSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchContactSocial = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getContactSocial();
      setSocial(data);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل بيانات التواصل والسوشيال');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContactSocial();
  }, []);

  const handleChange = (field: keyof ContactSocialSettings, value: any) => {
    if (!social) return;
    setSocial({
      ...social,
      [field]: value,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!social) return;

    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.adminUpdateContactSocial(social);
      await refreshData();
      setSuccessMsg('تم حفظ بيانات التواصل ومنصات السوشيال في Supabase بنجاح!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'فشل حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-neutral-400 text-xs flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>جاري تحميل بيانات التواصل...</span>
      </div>
    );
  }

  if (!social) {
    return (
      <div className="p-8 text-center text-red-400 text-xs">
        لم يتم العثور على إعدادات التواصل.
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-16 z-20 bg-[#09090b]/95 backdrop-blur-md py-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Share2 className="w-6 h-6 text-neutral-300" />
            <span>بيانات التواصل والسوشيال ميديا</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            إدارة أرقام الواتساب، الهاتف، وروابط منصات التواصل مع تفعيل/تعطيل كل منصة بشكل مستقل.
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

      {/* Direct Contact Numbers */}
      <div className="p-6 rounded-2xl bg-[#0f0f13] border border-neutral-800 space-y-5 shadow-md">
        <h3 className="text-white font-bold text-sm border-b border-neutral-800/80 pb-3 flex items-center gap-2">
          <Phone className="w-4 h-4 text-neutral-300" />
          <span>أرقام التواصل المباشر والواتساب</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>رقم واتساب المتجر (WhatsApp Number)</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: 201012345678"
              value={social.whatsapp_number}
              onChange={(e) => handleChange('whatsapp_number', e.target.value)}
              dir="ltr"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors font-mono"
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              يُستخدم في زر الواتساب العائم وبانر خدمة العملاء لمحادثات المقاسات وتتبع الطلبات.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-neutral-400" />
              <span>رقم الهاتف المباشر (Phone Number)</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: 01012345678"
              value={social.phone_number}
              onChange={(e) => handleChange('phone_number', e.target.value)}
              dir="ltr"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors font-mono"
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              يظهر في صفحة تواصل معنا للاتصال الهاتفي السريع.
            </p>
          </div>
        </div>
      </div>

      {/* Social Platforms Links & Toggles */}
      <div className="p-6 rounded-2xl bg-[#0f0f13] border border-neutral-800 space-y-5 shadow-md">
        <h3 className="text-white font-bold text-sm border-b border-neutral-800/80 pb-3 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-neutral-300" />
          <span>منصات التواصل الاجتماعي (الروابط وخيار التفعيل)</span>
        </h3>

        {/* Instagram */}
        <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Instagram</span>
            <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer select-none">
              <span>مفعل على المتجر</span>
              <input
                type="checkbox"
                checked={social.instagram_enabled}
                onChange={(e) => handleChange('instagram_enabled', e.target.checked)}
                className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-white accent-white cursor-pointer"
              />
            </label>
          </div>
          <input
            type="url"
            placeholder="https://instagram.com/outfitzone.eg"
            value={social.instagram_url}
            onChange={(e) => handleChange('instagram_url', e.target.value)}
            dir="ltr"
            className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors font-mono"
          />
        </div>

        {/* Facebook */}
        <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Facebook</span>
            <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer select-none">
              <span>مفعل على المتجر</span>
              <input
                type="checkbox"
                checked={social.facebook_enabled}
                onChange={(e) => handleChange('facebook_enabled', e.target.checked)}
                className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-white accent-white cursor-pointer"
              />
            </label>
          </div>
          <input
            type="url"
            placeholder="https://facebook.com/outfitzone.eg"
            value={social.facebook_url}
            onChange={(e) => handleChange('facebook_url', e.target.value)}
            dir="ltr"
            className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors font-mono"
          />
        </div>

        {/* TikTok */}
        <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">TikTok</span>
            <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer select-none">
              <span>مفعل على المتجر</span>
              <input
                type="checkbox"
                checked={social.tiktok_enabled}
                onChange={(e) => handleChange('tiktok_enabled', e.target.checked)}
                className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-white accent-white cursor-pointer"
              />
            </label>
          </div>
          <input
            type="url"
            placeholder="https://tiktok.com/@outfitzone.eg"
            value={social.tiktok_url}
            onChange={(e) => handleChange('tiktok_url', e.target.value)}
            dir="ltr"
            className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors font-mono"
          />
        </div>

        {/* Messenger */}
        <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Messenger</span>
            <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer select-none">
              <span>مفعل على المتجر</span>
              <input
                type="checkbox"
                checked={social.messenger_enabled}
                onChange={(e) => handleChange('messenger_enabled', e.target.checked)}
                className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-white accent-white cursor-pointer"
              />
            </label>
          </div>
          <input
            type="url"
            placeholder="https://m.me/outfitzone.eg"
            value={social.messenger_url}
            onChange={(e) => handleChange('messenger_url', e.target.value)}
            dir="ltr"
            className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors font-mono"
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="py-3 px-8 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'جاري الحفظ...' : 'حفظ بيانات التواصل'}</span>
        </button>
      </div>
    </form>
  );
};
