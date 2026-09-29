import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Truck,
  ArrowRight,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { ShippingRate } from '../types';
import {
  EGYPTIAN_GOVERNORATES,
  formatPrice,
  validateEgyptianPhone,
} from '../utils/constants';

interface CheckoutPageProps {
  onOrderSuccess: (orderNumber: string, receiptToken?: string) => void;
  onNavigate: (path: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onOrderSuccess,
  onNavigate,
}) => {
  const { items, subtotal, clearCart } = useCart();
  const { settings } = useStore();
  const { isDark } = useTheme();

  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    governorate: 'cairo',
    city: '',
    address: '',
    notes: '',
  });

  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load dynamic shipping rates from Supabase / API
  useEffect(() => {
    let isMounted = true;
    api
      .getShippingRates(false)
      .then((rates) => {
        if (isMounted) {
          setShippingRates(rates);
          setRatesLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setRatesLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute dynamic shipping fee based on selected Egyptian governorate
  const selectedGovObj = EGYPTIAN_GOVERNORATES.find(
    (g) => g.id === formData.governorate
  );
  const selectedGovNameAr = selectedGovObj
    ? selectedGovObj.nameAr
    : formData.governorate;

  const matchedRate = shippingRates.find(
    (r) => r.governorate === selectedGovNameAr
  );

  const isGovAvailable = matchedRate ? matchedRate.is_active : true;
  const shippingFee = matchedRate
    ? Number(matchedRate.shipping_fee)
    : Number(settings?.shipping_fee) || 65;

  const grandTotal = subtotal + shippingFee;

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (
      !formData.customer_name.trim() ||
      formData.customer_name.trim().length < 3
    ) {
      errs.customer_name = 'يرجى كتابة الاسم الثلاثي بالكامل.';
    }

    if (!formData.phone.trim()) {
      errs.phone = 'رقم الهاتف مطلوب لتأكيد الشحن.';
    } else if (!validateEgyptianPhone(formData.phone)) {
      errs.phone =
        'يرجى إدخال رقم محمول مصري صحيح يبدأ بـ 010 أو 011 أو 012 أو 015.';
    }

    if (!formData.governorate) {
      errs.governorate = 'يرجى اختيار المحافظة.';
    } else if (!isGovAvailable) {
      errs.governorate =
        'تعذر حساب تكلفة الشحن لهذه المحافظة حاليًا. يرجى المحاولة مرة أخرى.';
    }

    if (!formData.city.trim() || formData.city.trim().length < 2) {
      errs.city = 'يرجى إدخال اسم المدينة أو الحي أو المركز.';
    }

    if (!formData.address.trim() || formData.address.trim().length < 5) {
      errs.address =
        'يرجى كتابة العنوان التفصيلي (اسم الشارع، رقم العمارة، الشقة).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const playOrderSuccessSound = () => {
    try {
      const audio = new Audio('/sounds/order-success.mp3');
      audio.volume = 1;

      audio.play().catch((audioError) => {
        console.warn('Order success sound could not be played:', audioError);
      });
    } catch (audioError) {
      console.warn('Order success sound could not be initialized:', audioError);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (items.length === 0) {
      setSubmitError('سلة المشتريات فارغة.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (!isGovAvailable) {
      setSubmitError(
        'تعذر حساب تكلفة الشحن لهذه المحافظة حاليًا. يرجى المحاولة مرة أخرى.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customer: {
          customer_name: formData.customer_name.trim(),
          phone: formData.phone.trim(),
          governorate: selectedGovNameAr,
          city: formData.city.trim(),
          address: formData.address.trim(),
          notes: formData.notes.trim() || undefined,
        },
        items: items.map((i) => ({
          variant_id: i.variantId,
          product_id: i.productId,
          quantity: i.quantity,
        })),
      };

      const res = await api.submitGuestOrder(orderPayload);

      if (res.success && res.order_number) {
        // Play success sound only after the order has actually been created.
        playOrderSuccessSound();

        clearCart();
        onOrderSuccess(res.order_number, res.receipt_token);
      } else {
        throw new Error(
          res.error || 'تعذر تأكيد الطلب، يرجى إعادة المحاولة.'
        );
      }
    } catch (err: any) {
      console.error('Order submission error:', err);
      const rawMsg = err.message || '';
      if (
        rawMsg.includes('OZ_SHIPPING_GOVERNORATE_UNAVAILABLE') ||
        rawMsg.includes('OZ_SHIPPING_SETTINGS_MISSING')
      ) {
        setSubmitError(
          'تعذر حساب تكلفة الشحن لهذه المحافظة حاليًا. يرجى المحاولة مرة أخرى.'
        );
      } else if (rawMsg.includes('OZ_INSUFFICIENT_STOCK')) {
        setSubmitError('عفواً، نفدت الكمية المطلوبة من بعض المنتجات في السلة.');
      } else {
        setSubmitError(rawMsg || 'حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center text-right">
        <h2
          className={`text-xl font-bold mb-2 ${
            isDark ? 'text-white' : 'text-black'
          }`}
        >
          سلتك فارغة حاليًا
        </h2>
        <p className="text-xs text-neutral-400 mb-6">
          أضف بعض قطع الستريت وير إلى سلتك للمتابعة لإتمام الطلب.
        </p>
        <button
          onClick={() => onNavigate('/products')}
          className={`py-3 px-6 rounded-full font-bold text-xs transition-all shadow-md cursor-pointer ${
            isDark
              ? 'bg-white text-black hover:bg-neutral-200'
              : 'bg-black text-white hover:bg-neutral-800'
          }`}
        >
          تصفح الموديلات الآن
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-right">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => onNavigate('/cart')}
          className="text-xs text-neutral-400 hover:text-black dark:hover:text-white flex items-center gap-1.5 mb-3 transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>الرجوع إلى سلة المشتريات</span>
        </button>
        <h1
          className={`text-2xl sm:text-3xl font-black ${
            isDark ? 'text-white' : 'text-black'
          }`}
        >
          إتمام الطلب
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          الدفع عند الاستلام كاش · معاينة مجانية للطلب قبل الاستلام والدفع
        </p>
      </div>

      {submitError && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmitOrder}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* Left: Customer & Delivery Info */}
        <div className="lg:col-span-7 space-y-6">
          <div
            className={`p-5 sm:p-6 rounded-2xl border transition-colors ${
              isDark
                ? 'bg-[#121216] border-neutral-800'
                : 'bg-white border-neutral-200 shadow-sm'
            }`}
          >
            <h2
              className={`text-base font-bold pb-3 border-b mb-5 ${
                isDark
                  ? 'text-white border-neutral-800'
                  : 'text-black border-neutral-100'
              }`}
            >
              بيانات المستلم وعنوان التوصيل
            </h2>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isDark ? 'text-neutral-300' : 'text-neutral-700'
                  }`}
                >
                  الاسم بالكامل (ثلاثي) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال:  أكتب اسمك بالكامل "
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customer_name: e.target.value,
                    })
                  }
                  className={`w-full rounded-xl py-2.5 px-3.5 text-xs text-right focus:outline-none transition-colors border ${
                    errors.customer_name
                      ? 'border-red-500'
                      : isDark
                      ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500 focus:border-white'
                      : 'bg-neutral-50 border-neutral-300 text-black placeholder-neutral-400 focus:border-black'
                  }`}
                />
                {errors.customer_name && (
                  <p className="text-[11px] text-red-400 mt-1">
                    {errors.customer_name}
                  </p>
                )}
              </div>

              {/* Egyptian Mobile Phone */}
              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isDark ? 'text-neutral-300' : 'text-neutral-700'
                  }`}
                >
                  رقم الهاتف المحمول <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="01012345678"
                  dir="ltr"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className={`w-full rounded-xl py-2.5 px-3.5 text-xs text-right font-mono focus:outline-none transition-colors border ${
                    errors.phone
                      ? 'border-red-500'
                      : isDark
                      ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500 focus:border-white'
                      : 'bg-neutral-50 border-neutral-300 text-black placeholder-neutral-400 focus:border-black'
                  }`}
                />
                {errors.phone && (
                  <p className="text-[11px] text-red-400 mt-1">
                    {errors.phone}
                  </p>
                )}
                <p className="text-[10px] text-neutral-400 mt-1">
                  سيتصل بك مندوب الشحن على هذا الرقم لتنسيق ميعاد التسليم.
                </p>
              </div>

              {/* Governorate (Dynamic shipping rate) & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-xs font-bold mb-1.5 ${
                      isDark ? 'text-neutral-300' : 'text-neutral-700'
                    }`}
                  >
                    المحافظة <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.governorate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        governorate: e.target.value,
                      })
                    }
                    className={`w-full rounded-xl py-2.5 px-3 text-xs focus:outline-none border transition-colors ${
                      errors.governorate
                        ? 'border-red-500'
                        : isDark
                        ? 'bg-neutral-900 border-neutral-800 text-white focus:border-white'
                        : 'bg-neutral-50 border-neutral-300 text-black focus:border-black'
                    }`}
                  >
                    {EGYPTIAN_GOVERNORATES.map((gov) => {
                      const rate = shippingRates.find(
                        (r) => r.governorate === gov.nameAr
                      );
                      const feeText = rate
                        ? ` · ${rate.shipping_fee} ج.م`
                        : '';
                      const inactiveText =
                        rate && !rate.is_active ? ' (غير متاح)' : '';
                      return (
                        <option
                          key={gov.id}
                          value={gov.id}
                          disabled={rate && !rate.is_active}
                          className={
                            isDark
                              ? 'bg-neutral-900 text-white'
                              : 'bg-white text-black'
                          }
                        >
                          {gov.nameAr} {feeText} {inactiveText}
                        </option>
                      );
                    })}
                  </select>
                  {errors.governorate && (
                    <p className="text-[11px] text-red-400 mt-1">
                      {errors.governorate}
                    </p>
                  )}
                  {!isGovAvailable && (
                    <p className="text-[11px] text-red-400 mt-1">
                      الشحن لهذه المحافظة غير متاح حاليًا.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className={`block text-xs font-bold mb-1.5 ${
                      isDark ? 'text-neutral-300' : 'text-neutral-700'
                    }`}
                  >
                    المدينة / المركز / الحي{' '}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مدينة نصر / المنصورة / سموحة"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className={`w-full rounded-xl py-2.5 px-3.5 text-xs text-right focus:outline-none transition-colors border ${
                      errors.city
                        ? 'border-red-500'
                        : isDark
                        ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500 focus:border-white'
                        : 'bg-neutral-50 border-neutral-300 text-black placeholder-neutral-400 focus:border-black'
                    }`}
                  />
                  {errors.city && (
                    <p className="text-[11px] text-red-400 mt-1">
                      {errors.city}
                    </p>
                  )}
                </div>
              </div>

              {/* Detailed Street Address */}
              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isDark ? 'text-neutral-300' : 'text-neutral-700'
                  }`}
                >
                  العنوان بالتفصيل <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="اسم الشارع، رقم العمارة، الدور، رقم الشقة، علامة مميزة"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className={`w-full rounded-xl py-2.5 px-3.5 text-xs text-right focus:outline-none transition-colors border ${
                    errors.address
                      ? 'border-red-500'
                      : isDark
                      ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500 focus:border-white'
                      : 'bg-neutral-50 border-neutral-300 text-black placeholder-neutral-400 focus:border-black'
                  }`}
                />
                {errors.address && (
                  <p className="text-[11px] text-red-400 mt-1">
                    {errors.address}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isDark ? 'text-neutral-300' : 'text-neutral-700'
                  }`}
                >
                  ملاحظات إضافية للتوصيل (اختياري)
                </label>
                <textarea
                  rows={2}
                  placeholder="أي تعليمات للمندوب مثل مواعيد الاتصال أو علامة مميزة بجوار المنزل"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className={`w-full rounded-xl py-2 px-3.5 text-xs text-right focus:outline-none transition-colors border ${
                    isDark
                      ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500 focus:border-white'
                      : 'bg-neutral-50 border-neutral-300 text-black placeholder-neutral-400 focus:border-black'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Payment Method Badge */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              isDark
                ? 'bg-neutral-900/50 border-neutral-800 text-white'
                : 'bg-neutral-50 border-neutral-200 text-black'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <div>
                <span className="text-xs font-bold block">
                  الدفع عند الاستلام كاش (COD)
                </span>
                <span className="text-[11px] text-neutral-400">
                  تدفع ثمن طلبك للمندوب بعد معاينة الشحنة والتأكد من مطابقتها.
                </span>
              </div>
            </div>
            <Lock className="w-4 h-4 text-neutral-400" />
          </div>
        </div>

        {/* Right: Order Summary with Dynamic Shipping */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div
            className={`p-5 sm:p-6 rounded-2xl border space-y-4 transition-colors ${
              isDark
                ? 'bg-[#121216] border-neutral-800'
                : 'bg-white border-neutral-200 shadow-sm'
            }`}
          >
            <h2
              className={`text-base font-bold pb-3 border-b ${
                isDark
                  ? 'text-white border-neutral-800'
                  : 'text-black border-neutral-100'
              }`}
            >
              ملخص طلبك ({items.length} منتجات)
            </h2>

            {/* Items list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-3 text-xs">
                  <img
                    src={
                      item.product.images?.[0]?.image_url ||
                      '/images/product_boxfit_tee_black_1790342911897.jpg'
                    }
                    alt={item.product.name}
                    className="w-12 h-14 object-cover rounded-lg bg-neutral-900 border border-neutral-800 shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4
                        className={`font-bold line-clamp-1 ${
                          isDark ? 'text-white' : 'text-black'
                        }`}
                      >
                        {item.product.name}
                      </h4>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                        <span>{item.color}</span>
                        <span>·</span>
                        <span className="font-mono">{item.size}</span>
                        <span>·</span>
                        <span>الكمية: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="font-mono-numbers font-bold">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dynamic Cost breakdown */}
            <div
              className={`pt-3 border-t space-y-2 text-xs ${
                isDark
                  ? 'border-neutral-800/80 text-neutral-400'
                  : 'border-neutral-100 text-neutral-600'
              }`}
            >
              <div className="flex justify-between">
                <span>قيمة المشتريات:</span>
                <span
                  className={`font-mono-numbers font-medium ${
                    isDark ? 'text-white' : 'text-black'
                  }`}
                >
                  {formatPrice(subtotal)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>مصاريف الشحن ({selectedGovNameAr}):</span>
                <span
                  className={`font-mono-numbers font-medium ${
                    isDark ? 'text-white' : 'text-black'
                  }`}
                >
                  {ratesLoading ? 'جاري الحساب...' : formatPrice(shippingFee)}
                </span>
              </div>

              <div
                className={`pt-2 border-t flex justify-between text-base font-extrabold ${
                  isDark
                    ? 'border-neutral-800 text-white'
                    : 'border-neutral-100 text-black'
                }`}
              >
                <span>الإجمالي عند الاستلام:</span>
                <span className="font-mono-numbers text-lg">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || !isGovAvailable}
              className={`w-full py-4 px-6 font-extrabold text-sm sm:text-base rounded-full transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50 ${
                isDark
                  ? 'bg-white text-black hover:bg-neutral-200'
                  : 'bg-black text-white hover:bg-neutral-800'
              }`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>تأكيد الطلب الآن (دفع عند الاستلام)</span>
                  <CheckCircle2 className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-[10px] text-center text-neutral-400">
              بالضغط على تأكيد الطلب، فإنك توافق على سياسات الاستبدال والإرجاع
              الخاصة بـ Outfit Zone.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};