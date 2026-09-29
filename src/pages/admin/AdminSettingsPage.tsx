import React, { useState, useEffect } from 'react';
import {
  Save,
  Check,
  Truck,
  Settings,
  ToggleLeft,
  ToggleRight,
  Search,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { useStore } from '../../context/StoreContext';
import { ShippingRate } from '../../types';
import { EGYPTIAN_GOVERNORATES } from '../../utils/constants';

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

  // Shipping Rates per Governorate state
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [searchGov, setSearchGov] = useState('');
  const [updatingRateId, setUpdatingRateId] = useState<string | null>(null);
  const [bulkPrice, setBulkPrice] = useState('');
  const [rateFeedback, setRateFeedback] = useState<string | null>(null);

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

  const loadShippingRates = async () => {
    setRatesLoading(true);
    try {
      const data = await api.getShippingRates(true);
      setShippingRates(data);
    } catch (err) {
      console.error('Failed to load shipping rates:', err);
    } finally {
      setRatesLoading(false);
    }
  };

  useEffect(() => {
    loadShippingRates();
  }, []);

  const handleSaveStoreSettings = async (e: React.FormEvent) => {
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
      setSuccessMsg('تم حفظ وتحديث إعدادات وسياسات المتجر العامة بنجاح.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'فشل تحديث الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSingleRate = async (rateId: string, updates: Partial<ShippingRate>) => {
    setUpdatingRateId(rateId);
    setRateFeedback(null);
    try {
      const updated = await api.adminUpdateShippingRate(rateId, updates);
      setShippingRates((prev) =>
        prev.map((r) => (r.id === rateId ? { ...r, ...updated } : r))
      );
      setRateFeedback('تم تحديث سعر الشحن للمحافظة بنجاح.');
      setTimeout(() => setRateFeedback(null), 2500);
    } catch (err: any) {
      alert(err.message || 'فشل تحديث سعر المحافظة');
    } finally {
      setUpdatingRateId(null);
    }
  };

  const handleToggleRateActive = async (rate: ShippingRate) => {
    await handleUpdateSingleRate(rate.id, { is_active: !rate.is_active });
  };

  const handleBulkApplyPrice = async () => {
    const numPrice = Number(bulkPrice);
    if (isNaN(numPrice) || numPrice < 0) {
      alert('يرجى إدخال سعر صحيح (0 أو أكثر).');
      return;
    }

    if (!confirm(`هل أنت متأكد من تعيين سعر ${numPrice} ج.م لجميع المحافظات الـ 27؟`)) {
      return;
    }

    setIsSaving(true);
    try {
      for (const rate of shippingRates) {
        await api.adminUpdateShippingRate(rate.id, { shipping_fee: numPrice });
      }
      await loadShippingRates();
      setRateFeedback(`تم تحديث سعر الشحن لجميع المحافظات إلى ${numPrice} ج.م بنجاح.`);
      setBulkPrice('');
      setTimeout(() => setRateFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء التحديث الجماعي');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRates = shippingRates.filter((r) => {
    if (!searchGov.trim()) return true;
    const term = searchGov.trim().toLowerCase();
    const govObj = EGYPTIAN_GOVERNORATES.find((g) => g.nameAr === r.governorate);
    return (
      r.governorate.toLowerCase().includes(term) ||
      (govObj && govObj.nameEn.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-right pb-16">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-neutral-300" />
          <span>إعدادات وسياسات المتجر ونظام الشحن</span>
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          إدارة أسعار الشحن لكل محافظة من الـ 27 محافظة مصرية، وتفعيل أو تعطيل التوصيل، وسياسات المتجر.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: SHIPPING PER GOVERNORATE (27 EGYPTIAN GOVERNORATES)
          ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#121216] border border-neutral-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-neutral-300" />
            <div>
              <h2 className="text-sm font-bold text-white">
                أسعار الشحن حسب المحافظة (Shipping per Governorate)
              </h2>
              <p className="text-[11px] text-neutral-400">
                لكل محافظة سعر شحن مستقل وحالة تفعيل/تعطيل، تعتمدها قاعدة البيانات تلقائيًا.
              </p>
            </div>
          </div>

          <button
            onClick={loadShippingRates}
            disabled={ratesLoading}
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${ratesLoading ? 'animate-spin' : ''}`} />
            <span>تحديث الأسعار</span>
          </button>
        </div>

        {rateFeedback && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{rateFeedback}</span>
          </div>
        )}

        {/* Search & Bulk Set Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6 relative">
            <input
              type="text"
              placeholder="ابحث عن محافظة (مثال: الدقهلية / القاهرة / الإسكندرية)..."
              value={searchGov}
              onChange={(e) => setSearchGov(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2 pr-9 pl-3 text-xs text-white focus:outline-none focus:border-white"
            />
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          </div>

          <div className="sm:col-span-6 flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="سعر موحد (ج.م)"
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value)}
              className="w-32 bg-neutral-900 border border-neutral-800 rounded-xl py-2 px-3 text-xs text-white text-center focus:outline-none focus:border-white font-mono"
            />
            <button
              onClick={handleBulkApplyPrice}
              disabled={!bulkPrice || isSaving}
              className="py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              تطبيق على الجميع
            </button>
          </div>
        </div>

        {/* Governorates Table */}
        <div className="border border-neutral-800/80 rounded-xl overflow-hidden">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-right text-xs">
              <thead className="bg-neutral-900/90 text-neutral-400 font-bold sticky top-0 border-b border-neutral-800 z-10">
                <tr>
                  <th className="py-3 px-4">المحافظة</th>
                  <th className="py-3 px-4">سعر الشحن (جنيه)</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 bg-neutral-950/40">
                {ratesLoading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-neutral-400">
                      جاري تحميل أسعار المحافظات...
                    </td>
                  </tr>
                ) : filteredRates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-neutral-400">
                      لا توجد محافظات مطابقة لبحثك.
                    </td>
                  </tr>
                ) : (
                  filteredRates.map((rate) => {
                    const govObj = EGYPTIAN_GOVERNORATES.find((g) => g.nameAr === rate.governorate);
                    const isUpdating = updatingRateId === rate.id;
                    return (
                      <GovernorateRow
                        key={rate.id}
                        rate={rate}
                        govObj={govObj}
                        isUpdating={isUpdating}
                        onSavePrice={(newPrice) =>
                          handleUpdateSingleRate(rate.id, { shipping_fee: newPrice })
                        }
                        onToggleActive={() => handleToggleRateActive(rate)}
                      />
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: GENERAL STORE POLICIES & CONTACT
          ========================================================================= */}
      <form onSubmit={handleSaveStoreSettings} className="space-y-6">
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

        {/* Policies */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121216] border border-neutral-800 space-y-4">
          <h2 className="text-sm font-bold text-white border-b border-neutral-800/80 pb-2">
            سياسات الاستبدال والإرجاع والمعاينة
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                سياسة الاستبدال
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
                سياسة الإرجاع
              </label>
              <input
                type="text"
                value={returnPolicy}
                onChange={(e) => setReturnPolicy(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                رسالة الدفع عند الاستلام
              </label>
              <input
                type="text"
                value={codMessage}
                onChange={(e) => setCodMessage(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="inspection"
                checked={inspectionAvailable}
                onChange={(e) => setInspectionAvailable(e.target.checked)}
                className="rounded bg-neutral-900 border-neutral-800 text-white focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="inspection" className="text-xs text-neutral-300 cursor-pointer">
                تفعيل ميزة المعاينة المجانية للطلب قبل الدفع والاستلام
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="py-3 px-8 bg-white hover:bg-neutral-200 text-black font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ سياسات المتجر</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Component for Governorate Row with editable input
const GovernorateRow: React.FC<{
  rate: ShippingRate;
  govObj?: { id: string; nameAr: string; nameEn: string };
  isUpdating: boolean;
  onSavePrice: (newPrice: number) => void;
  onToggleActive: () => void;
}> = ({ rate, govObj, isUpdating, onSavePrice, onToggleActive }) => {
  const [feeInput, setFeeInput] = useState(String(rate.shipping_fee));
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    setFeeInput(String(rate.shipping_fee));
    setHasChanged(false);
  }, [rate.shipping_fee]);

  const handlePriceChange = (val: string) => {
    setFeeInput(val);
    setHasChanged(Number(val) !== Number(rate.shipping_fee));
  };

  const handleSave = () => {
    const num = Number(feeInput);
    if (!isNaN(num) && num >= 0) {
      onSavePrice(num);
      setHasChanged(false);
    }
  };

  return (
    <tr className="hover:bg-neutral-900/50 transition-colors">
      {/* Name */}
      <td className="py-3 px-4 font-bold text-white">
        <div className="flex items-center gap-2">
          <span>{rate.governorate}</span>
          {govObj && (
            <span className="text-[10px] text-neutral-500 font-mono">
              ({govObj.nameEn})
            </span>
          )}
        </div>
      </td>

      {/* Shipping Fee Input */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="1"
            value={feeInput}
            onChange={(e) => handlePriceChange(e.target.value)}
            className="w-24 bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 px-2.5 text-xs text-white text-center focus:outline-none focus:border-white font-mono"
          />
          {hasChanged && (
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="py-1.5 px-2.5 rounded-lg bg-white text-black font-bold text-[11px] hover:bg-neutral-200 transition-colors shadow cursor-pointer"
            >
              {isUpdating ? '...' : 'حفظ'}
            </button>
          )}
        </div>
      </td>

      {/* Status Badge */}
      <td className="py-3 px-4">
        {rate.is_active ? (
          <span className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>مفعّل</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-[10px] font-bold bg-neutral-900 text-neutral-400 border border-neutral-800">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
            <span>معطّل (غير متاح)</span>
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="py-3 px-4 text-left">
        <button
          onClick={onToggleActive}
          disabled={isUpdating}
          className={`py-1.5 px-3 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border ${
            rate.is_active
              ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-red-400 hover:border-red-900'
              : 'bg-emerald-950/40 border-emerald-900 text-emerald-300 hover:bg-emerald-900/60'
          }`}
        >
          {rate.is_active ? 'تعطيل الشحن' : 'تفعيل الشحن'}
        </button>
      </td>
    </tr>
  );
};
