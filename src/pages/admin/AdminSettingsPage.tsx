import React, { useState, useEffect } from 'react';
import { Save, Check, Database, Copy, CheckCheck, Settings } from 'lucide-react';
import { api } from '../../services/api';
import { useStore } from '../../context/StoreContext';
import { isSupabaseConfigured } from '../../lib/supabase';

export const AdminSettingsPage: React.FC = () => {
  const { settings, refreshData } = useStore();

  const [storeName, setStoreName] = useState('Outfit Zone');
  const [whatsappNumber, setWhatsappNumber] = useState('201012345678');
  const [phoneNumber, setPhoneNumber] = useState('01012345678');
  const [shippingFee, setShippingFee] = useState('65');
  const [inspectionAvailable, setInspectionAvailable] = useState(true);
  const [exchangePolicy, setExchangePolicy] = useState('استبدال المقاس متاح خلال 14 يوم من تاريخ الاستلام.');
  const [returnPolicy, setReturnPolicy] = useState('إرجاع المنتج متاح خلال 3 أيام في حالته الأصلية وبطاقة المنتج.');
  const [codMessage, setCodMessage] = useState('الدفع عند الاستلام فقط لجميع المحافظات داخل مصر.');

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (settings) {
      setStoreName(settings.store_name);
      setWhatsappNumber(settings.whatsapp_number);
      setPhoneNumber(settings.phone_number || '01012345678');
      setShippingFee(String(settings.shipping_fee));
      setInspectionAvailable(settings.inspection_available);
      setExchangePolicy(settings.exchange_policy);
      setReturnPolicy(settings.return_policy);
      setCodMessage(settings.cod_message || 'الدفع عند الاستلام فقط لجميع المحافظات داخل مصر.');
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);

    try {
      await api.adminUpdateSettings({
        store_name: storeName.trim(),
        whatsapp_number: whatsappNumber.trim(),
        phone_number: phoneNumber.trim(),
        shipping_fee: Number(shippingFee),
        inspection_available: inspectionAvailable,
        exchange_policy: exchangePolicy.trim(),
        return_policy: returnPolicy.trim(),
        cod_message: codMessage.trim(),
      });

      await refreshData();
      setSuccessMsg('تم حفظ وتحديث إعدادات وسياسات المتجر في Supabase بنجاح.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'فشل تحديث الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  const copyMigrationSql = () => {
    const sql = `-- Outfit Zone Supabase SQL Schema
-- See /supabase/schema.sql and /supabase/seed.sql in project root
SELECT 'Outfit Zone tables and RLS policies created successfully!';`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-right pb-12">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-neutral-300" />
          <span>إعدادات وسياسات المتجر العامة</span>
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          التحكم في مصاريف الشحن، أرقام التواصل، وسياسات المعاينة والاستبدال المخزنة في Supabase.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Brand Settings */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121216] border border-neutral-800 space-y-4">
          <h2 className="text-sm font-bold text-white border-b border-neutral-800/80 pb-2">
            بيانات المتجر وأرقام التواصل
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                اسم البراند / المتجر
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                رقم WhatsApp الرسمي (مع كود 20)
              </label>
              <input
                type="text"
                required
                dir="ltr"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="201012345678"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white text-left focus:outline-none focus:border-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                رقم الهاتف المباشر
              </label>
              <input
                type="text"
                required
                dir="ltr"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="01012345678"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white text-left focus:outline-none focus:border-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Shipping & Inspection Settings */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121216] border border-neutral-800 space-y-4">
          <h2 className="text-sm font-bold text-white border-b border-neutral-800/80 pb-2">
            الشحن وتكلفة التوصيل وسياسة المعاينة والدفع عند الاستلام
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                مصاريف الشحن لجميع المحافظات (جنيه)
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={shippingFee}
                onChange={(e) => setShippingFee(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-white font-mono"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                تُحسب هذه القيمة تلقائيًا على جميع طلبات الدفع عند الاستلام.
              </p>
            </div>

            <div className="flex flex-col justify-center">
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <input
                  type="checkbox"
                  checked={inspectionAvailable}
                  onChange={(e) => setInspectionAvailable(e.target.checked)}
                  className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 accent-white cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-white block">
                    تفعيل "معاينة مجانية عند الاستلام"
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    إظهار رسالة المعاينة للعميل في المتجر وصفحة إتمام الطلب.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              رسالة الدفع عند الاستلام (COD Message)
            </label>
            <input
              type="text"
              value={codMessage}
              onChange={(e) => setCodMessage(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                نص سياسة استبدال المقاس
              </label>
              <input
                type="text"
                value={exchangePolicy}
                onChange={(e) => setExchangePolicy(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                نص سياسة الإرجاع
              </label>
              <input
                type="text"
                value={returnPolicy}
                onChange={(e) => setReturnPolicy(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-white"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="py-3 px-8 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات في Supabase'}</span>
          </button>
        </div>
      </form>

      {/* Supabase Integration Status */}
      <div className="p-6 rounded-2xl bg-[#121216] border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white">حالة الاتصال بقاعدة بيانات Supabase</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
            {isSupabaseConfigured ? 'مفعل ومتصل (Live Supabase)' : 'وضع المحاكاة الآمن (Local Engine)'}
          </span>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed">
          جميع البيانات (الموديلات، الألوان، المقاسات، المخزون، والطلبات) تُدار ومحمية بسياسات RLS الأمنية لمنع وصول غير المصرح لهم.
        </p>

        <div className="pt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={copyMigrationSql}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {copiedSql ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'تم النسخ!' : 'نسخ مرجع كود SQL'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
