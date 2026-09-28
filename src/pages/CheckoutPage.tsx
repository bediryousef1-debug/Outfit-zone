```tsx
import React, { useState } from 'react';
import { ShieldCheck, Truck, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { api } from '../services/api';
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

  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    governorate: 'cairo',
    city: '',
    address: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const shippingFee = settings?.shipping_fee || 65;
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

    setIsSubmitting(true);

    try {
      const selectedGovObj = EGYPTIAN_GOVERNORATES.find(
        (g) => g.id === formData.governorate
      );

      const governorateName = selectedGovObj
        ? selectedGovObj.nameAr
        : formData.governorate;

      const orderPayload = {
        customer: {
          customer_name: formData.customer_name.trim(),
          phone: formData.phone.trim(),
          governorate: governorateName,
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
        clearCart();
        onOrderSuccess(res.order_number, res.receipt_token);
      } else {
        throw new Error(
          res.error || 'تعذر تأكيد الطلب، يرجى إعادة المحاولة.'
        );
      }
    } catch (err: any) {
      console.error('Order submission error:', err);
      setSubmitError(
        err.message || 'حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center text-right">
        <h2 className="text-xl font-bold text-white mb-2">
          سلتك فارغة حاليًا
        </h2>

        <p className="text-xs text-neutral-400 mb-6">
          أضف بعض قطع الستريت وير إلى سلتك للمتابعة لإتمام الطلب.
        </p>

        <button
          onClick={() => onNavigate('/products')}
          className="py-2.5 px-6 bg-white text-black font-bold text-xs rounded-lg hover:bg-neutral-200 transition-colors"
        >
          تصفح الموديلات الآن
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-right">
      {/* Breadcrumb */}
      <button
        onClick={() => onNavigate('/products')}
        className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        <span>متابعة التسوق</span>
      </button>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          إتمام الطلب (الدفع عند الاستلام)
        </h1>

        <p className="text-xs text-neutral-400 mt-1">
          لا تحتاج لإنشاء حساب. فقط املأ بيانات التوصيل وسنقوم بتجهيز شحنتك فورًا.
        </p>
      </div>

      {submitError && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs leading-relaxed">
          {submitError}
        </div>
      )}

      <form
        noValidate
        onSubmit={handleSubmitOrder}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* Left: Delivery Details Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-[#121216] border border-neutral-800 space-y-4">
            <h2 className="text-base font-bold text-white border-b border-neutral-800/80 pb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-neutral-300" />
              <span>بيانات التوصيل والشحن</span>
            </h2>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                الاسم بالكامل <span className="text-red-400">*</span>
              </label>

              <input
                type="text"
                required
                placeholder="الاسم بالكامل"
                value={formData.customer_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customer_name: e.target.value,
                  })
                }
                className={`w-full bg-neutral-900 border rounded-lg py-2.5 px-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors ${
                  errors.customer_name
                    ? 'border-red-500'
                    : 'border-neutral-800 focus:border-white'
                }`}
              />

              {errors.customer_name && (
                <p className="text-[11px] text-red-400 mt-1">
                  {errors.customer_name}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                رقم الهاتف المحمول (لتأكيد الشحن){' '}
                <span className="text-red-400">*</span>
              </label>

              <input
                type="tel"
                required
                placeholder="01012345678"
                dir="ltr"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    phone: e.target.value,
                  })
                }
                className={`w-full bg-neutral-900 border rounded-lg py-2.5 px-3.5 text-xs text-white placeholder-neutral-500 text-right focus:outline-none transition-colors font-mono ${
                  errors.phone
                    ? 'border-red-500'
                    : 'border-neutral-800 focus:border-white'
                }`}
              />

              {errors.phone && (
                <p className="text-[11px] text-red-400 mt-1">
                  {errors.phone}
                </p>
              )}

              <p className="text-[10px] text-neutral-500 mt-1">
                سيتصل بك مندوب الشحن على هذا الرقم لتنسيق ميعاد التسليم.
              </p>
            </div>

            {/* Governorate & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
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
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none focus:border-white"
                >
                  {EGYPTIAN_GOVERNORATES.map((gov) => (
                    <option
                      key={gov.id}
                      value={gov.id}
                      className="bg-neutral-900 text-white"
                    >
                      {gov.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  المدينة / المركز / الحي{' '}
                  <span className="text-red-400">*</span>
                </label>

                <input
                  type="text"
                  required
                  placeholder="مثال: مدينة نصر / الدقي / سموحة"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      city: e.target.value,
                    })
                  }
                  className={`w-full bg-neutral-900 border rounded-lg py-2.5 px-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors ${
                    errors.city
                      ? 'border-red-500'
                      : 'border-neutral-800 focus:border-white'
                  }`}
                />

                {errors.city && (
                  <p className="text-[11px] text-red-400 mt-1">
                    {errors.city}
                  </p>
                )}
              </div>
            </div>

            {/* Detailed Address */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                العنوان بالتفصيل <span className="text-red-400">*</span>
              </label>

              <textarea
                rows={2}
                required
                placeholder="اسم الشارع، رقم العمارة، رقم الشقة، علامة مميزة قريبة..."
                value={formData.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: e.target.value,
                  })
                }
                className={`w-full bg-neutral-900 border rounded-lg py-2.5 px-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors ${
                  errors.address
                    ? 'border-red-500'
                    : 'border-neutral-800 focus:border-white'
                }`}
              />

              {errors.address && (
                <p className="text-[11px] text-red-400 mt-1">
                  {errors.address}
                </p>
              )}
            </div>

            {/* Order Notes */}
            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1.5">
                ملاحظات خاصة بالشحن (اختياري)
              </label>

              <input
                type="text"
                placeholder="مثال: الاتصال قبل الوصول بنصف ساعة، التوصيل بعد الساعة 3 مساءً..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notes: e.target.value,
                  })
                }
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2.5 px-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
              />
            </div>
          </div>

          {/* Payment Method Notice */}
          <div className="p-5 rounded-2xl bg-[#121216] border border-neutral-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>طريقة الدفع: الدفع عند الاستلام فقط (COD)</span>
            </h2>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>لا تحتاج لبطاقة بنكية أو دفع إلكتروني مسبق.</span>
              </div>

              <p className="text-neutral-400 leading-relaxed">
                ستقوم بسداد قيمة الطلب نقدًا للمندوب عند وصول الشحنة لك.
              </p>

              {settings?.inspection_available && (
                <div className="pt-2 border-t border-neutral-900 text-neutral-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    معاينة مجانية: يحق لك فتح الكيس والتأكد من الخامة والمقاس قبل
                    دفع أي جنيه.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="p-5 sm:p-6 rounded-2xl bg-[#121216] border border-neutral-800 space-y-4">
            <h2 className="text-base font-bold text-white border-b border-neutral-800 pb-3">
              ملخص طلبك ({items.length} منتجات)
            </h2>

            {/* Items list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-3 text-xs">
                  <img
                    src={
                      item.product.images?.[0]?.image_url ||
                      '/src/assets/images/product_boxfit_tee_black_1790342911897.jpg'
                    }
                    alt={item.product.name}
                    className="w-12 h-14 object-cover rounded bg-neutral-950 border border-neutral-800 shrink-0"
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-white line-clamp-1">
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

                    <div className="font-mono-numbers font-bold text-white">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cost breakdown */}
            <div className="pt-3 border-t border-neutral-800/80 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>قيمة المشتريات:</span>

                <span className="font-mono-numbers text-white font-medium">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-neutral-400">
                <span>مصاريف الشحن لجميع المحافظات:</span>

                <span className="font-mono-numbers text-white font-medium">
                  {formatPrice(shippingFee)}
                </span>
              </div>

              <div className="pt-2 border-t border-neutral-800 flex justify-between text-base font-extrabold text-white">
                <span>الإجمالي عند الاستلام:</span>

                <span className="font-mono-numbers text-lg text-white">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 bg-white hover:bg-neutral-200 text-black font-extrabold text-sm sm:text-base rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>تأكيد الطلب الآن (دفع عند الاستلام)</span>
                  <CheckCircle2 className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-neutral-500">
              بالضغط على تأكيد الطلب، فإنك توافق على سياسات الاستبدال والإرجاع
              الخاصة بـ Outfit Zone.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
```

**التغيير الوظيفي الوحيد** عن ملفك الأصلي هو إضافة:

```tsx
noValidate
```

إلى `<form>`.

بعد وضعه في `CheckoutPage.tsx`، شغّل المشروع. لو ظهر **حتى Error واحد**، ابعت نص الـError نفسه بدل ما نغير كود إضافي.
