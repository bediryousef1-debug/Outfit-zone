import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Calendar,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { formatPrice, ORDER_STATUS_LABELS } from '../utils/constants';

interface OrderTrackingPageProps {
  onNavigate: (path: string) => void;
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({ onNavigate }) => {
  const { t, isRtl, language } = useLanguage();
  const { isDark } = useTheme();

  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-search if query params exist in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderParam = params.get('order');
    const phoneParam = params.get('phone');

    if (orderParam && phoneParam) {
      setOrderNumber(orderParam);
      setPhone(phoneParam);
      performTrack(orderParam, phoneParam);
    }
  }, []);

  const performTrack = async (num: string, ph: string) => {
    setError(null);
    setIsLoading(true);
    setOrder(null);

    try {
      const data = await api.trackOrder(num, ph);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || t('track.error', 'لم يتم العثور على طلب مطابق لرقم الطلب ورقم الهاتف.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      setError(t('track.order_required', 'يرجى إدخال رقم الطلب (مثال: OZ-123456)'));
      return;
    }
    if (!phone.trim()) {
      setError(t('track.phone_required', 'يرجى إدخال رقم الهاتف المسجل في الطلب'));
      return;
    }
    performTrack(orderNumber, phone);
  };

  const statusKey = order?.status || 'pending';
  const statusInfo = ORDER_STATUS_LABELS[statusKey] || {
    label: statusKey,
    color: 'text-neutral-400 bg-neutral-900 border-neutral-700',
  };

  // Timeline steps
  const steps = [
    { key: 'pending', title: t('track.step_placed', 'تم استلام الطلب'), desc: t('track.step_placed_desc', 'قيد المراجعة والتأكيد') },
    { key: 'confirmed', title: t('track.step_processing', 'جاري التجهيز'), desc: t('track.step_processing_desc', 'تجهيز وتغليف الموديلات') },
    { key: 'shipped', title: t('track.step_shipped', 'خرج للشحن'), desc: t('track.step_shipped_desc', 'مع شركة الشحن في الطريق إليك') },
    { key: 'delivered', title: t('track.step_delivered', 'تم التسليم'), desc: t('track.step_delivered_desc', 'تم تسليم الطلب ومعاينته بنجاح') },
  ];

  const getStepStatus = (stepKey: string) => {
    if (statusKey === 'cancelled') return 'cancelled';
    if (statusKey === 'returned') return 'returned';

    const orderHierarchy = ['pending', 'confirmed', 'shipped', 'delivered'];
    const currentIndex = orderHierarchy.indexOf(statusKey);
    const stepIndex = orderHierarchy.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className={`min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto ${isRtl ? 'text-right' : 'text-left'}`}>
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => onNavigate('/')}
          className={`inline-flex items-center gap-2 text-xs font-medium cursor-pointer transition-colors ${
            isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black'
          }`}
        >
          <BackIcon className="w-4 h-4" />
          <span>{t('track.back_to_home', 'العودة للرئيسية')}</span>
        </button>
      </div>

      {/* Header */}
      <div data-oz-scene className="text-center mb-8 sm:mb-10">
        <div className="inline-flex p-3 rounded-2xl bg-neutral-500/10 text-neutral-300 mb-3 border border-neutral-800">
          <Truck className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {t('track.title', 'تتبع حالة طلبك')}
        </h1>
        <p className={`mt-2 text-xs sm:text-sm max-w-md mx-auto ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
          {t('track.subtitle', 'أدخل رقم الطلب ورقم الهاتف المسجل لمتابعة خط سير الشحنة لحظة بلحظة.')}
        </p>
      </div>

      {/* Search Card */}
      <div
        className={`p-6 sm:p-8 rounded-2xl border shadow-xl mb-8 ${
          isDark
            ? 'bg-[#121216] border-neutral-800 shadow-black/40'
            : 'bg-white border-neutral-200 shadow-neutral-100'
        }`}
      >
        <form onSubmit={handleSearch} className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-4 items-end">
          <div className="sm:col-span-5">
            <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
              {t('track.order_number_label', 'رقم الطلب')}
            </label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="مثال: OZ-2026-1001"
              className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none font-mono ${
                isDark
                  ? 'bg-neutral-900/90 border-neutral-700 text-white focus:border-white'
                  : 'bg-neutral-50 border-neutral-300 text-black focus:border-black'
              }`}
              dir="ltr"
            />
          </div>

          <div className="sm:col-span-4">
            <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
              {t('track.phone_label', 'رقم الهاتف')}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none font-mono ${
                isDark
                  ? 'bg-neutral-900/90 border-neutral-700 text-white focus:border-white'
                  : 'bg-neutral-50 border-neutral-300 text-black focus:border-black'
              }`}
              dir="ltr"
            />
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-5 rounded-xl bg-white text-black font-bold text-sm hover:bg-neutral-200 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>{t('track.track_btn', 'تتبع الطلب')}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Order Results */}
      {order && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Status Header Box */}
          <div
            className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#121216] border-neutral-800' : 'bg-white border-neutral-200'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-neutral-800/60">
              <div>
                <span className="text-[11px] font-mono text-neutral-400 block mb-1">
                  {t('track.order_ref', 'مرجع الشحنة')}
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
                  {order.order_number}
                </span>
                <span className="text-xs text-neutral-400 block mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  {new Date(order.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="text-right">
                <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
            </div>

            {/* Special alert if cancelled or returned */}
            {statusKey === 'cancelled' && (
              <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
                <XCircle className="w-5 h-5 shrink-0 text-rose-400" />
                <div>
                  <div className="font-bold">تم إلغاء هذا الطلب</div>
                  <div className="text-neutral-400 mt-0.5">إذا كان لديك استفسار، تواصل مع فريق الدعم عبر واتساب.</div>
                </div>
              </div>
            )}

            {statusKey === 'returned' && (
              <div className="mt-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs flex items-center gap-3">
                <RotateCcw className="w-5 h-5 shrink-0 text-orange-400" />
                <div>
                  <div className="font-bold">تم تسجيل هذا الطلب كمرتجع</div>
                  <div className="text-neutral-400 mt-0.5">تم استرجاع الشحنة بنجاح وفق سياسة الاستبدال والاسترجاع.</div>
                </div>
              </div>
            )}

            {/* Step Timeline */}
            {statusKey !== 'cancelled' && statusKey !== 'returned' && (
              <div className="mt-8">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                  {steps.map((st, idx) => {
                    const stStatus = getStepStatus(st.key);
                    const isDone = stStatus === 'completed';
                    const isCurrent = stStatus === 'current';

                    return (
                      <div
                        key={st.key}
                        className={`relative p-4 rounded-xl border transition-all ${
                          isCurrent
                            ? isDark
                              ? 'bg-neutral-800/90 border-white text-white shadow-lg'
                              : 'bg-neutral-100 border-black text-black shadow-md'
                            : isDone
                            ? isDark
                              ? 'bg-emerald-950/20 border-emerald-800/40 text-neutral-300'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : isDark
                            ? 'bg-neutral-900/40 border-neutral-800/60 text-neutral-500'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {isDone ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : isCurrent ? (
                            <div className="w-3.5 h-3.5 rounded-full bg-white animate-pulse" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-neutral-600" />
                          )}
                          <span className="text-xs font-bold">{st.title}</span>
                        </div>
                        <p className="text-[11px] leading-relaxed opacity-80">{st.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Details & Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Items Card */}
            <div
              className={`md:col-span-7 p-6 rounded-2xl border ${
                isDark ? 'bg-[#121216] border-neutral-800' : 'bg-white border-neutral-200'
              }`}
            >
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-neutral-400" />
                <span>{t('track.ordered_items', 'الموديلات المطلوبة')}</span>
              </h3>

              <div className="space-y-3">
                {(order.order_items || order.items || []).map((it: any, i: number) => {
                  const pName = it.product_name || it.product_name_snapshot || 'موديل Outfit Zone';
                  const qty = Number(it.quantity) || 1;
                  const price = Number(it.unit_price) || 0;

                  return (
                    <div
                      key={i}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                        isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold truncate text-sm">{pName}</div>
                        <div className="text-neutral-400 mt-1 flex items-center gap-3">
                          <span>المقاس: <b>{it.size || '-'}</b></span>
                          <span>اللون: <b>{it.color || '-'}</b></span>
                          <span>الكمية: <b>{qty}</b></span>
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold shrink-0">
                        {formatPrice(it.line_total || price * qty)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="mt-6 pt-4 border-t border-neutral-800 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>{t('track.subtotal', 'مجموع الموديلات')}</span>
                  <span className="font-mono">{formatPrice(order.subtotal)}</span>
                </div>

                {order.coupon_code && Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>كوبون الخصم ({order.coupon_code})</span>
                    </span>
                    <span className="font-mono">-{formatPrice(order.discount_amount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-neutral-400">
                  <span>{t('track.shipping_fee', 'الشحن والتوصيل')}</span>
                  <span className="font-mono">{formatPrice(order.shipping_fee)}</span>
                </div>

                <div className="flex justify-between text-sm font-bold pt-2 border-t border-neutral-800 text-white">
                  <span>{t('track.total_cod', 'الإجمالي (دفع عند الاستلام)')}</span>
                  <span className="font-mono text-base">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Delivery Address Card */}
            <div
              className={`md:col-span-5 p-6 rounded-2xl border flex flex-col justify-between ${
                isDark ? 'bg-[#121216] border-neutral-800' : 'bg-white border-neutral-200'
              }`}
            >
              <div>
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-neutral-400" />
                  <span>{t('track.delivery_details', 'تفاصيل الشحن والتوصيل')}</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-neutral-400 block mb-0.5">اسم المستلم:</span>
                    <span className="font-bold text-sm">{order.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block mb-0.5">رقم الهاتف:</span>
                    <span className="font-mono font-semibold" dir="ltr">{order.phone}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block mb-0.5">عنوان الشحن:</span>
                    <span className="font-medium leading-relaxed block">
                      {order.governorate} - {order.city} - {order.address}
                    </span>
                  </div>
                  {order.notes && (
                    <div>
                      <span className="text-neutral-400 block mb-0.5">ملاحظات التوصيل:</span>
                      <span className="italic text-neutral-300">{order.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => onNavigate('/products')}
                  className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold transition-colors cursor-pointer border border-neutral-800"
                >
                  {t('track.continue_shopping', 'تصفح تشكيلة الستريت وير')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
