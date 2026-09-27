import React from 'react';
import { ArrowRight, Trash2, ShoppingBag, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../utils/constants';

interface CartPageProps {
  onNavigate: (path: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate }) => {
  const { items, removeItem, updateQuantity, subtotal } = useCart();
  const { settings } = useStore();

  const shippingFee = settings?.shipping_fee || 65;
  const grandTotal = subtotal + shippingFee;

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center text-right">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-400 mb-4">
          <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-2">سلة المشتريات فارغة</h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto mb-8 leading-relaxed">
          لم تقم بإضافة أي قطع إلى سلتك بعد. تصفح تشكيلة الستريت وير واختر المقاس المناسب لك بنظام الدفع عند الاستلام.
        </p>
        <button
          onClick={() => onNavigate('/products')}
          className="py-3 px-8 bg-white text-black font-extrabold text-xs rounded-xl hover:bg-neutral-200 transition-colors inline-flex items-center gap-2 shadow-lg"
        >
          <span>تصفح تشكيلة الستريت وير</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-right">
      {/* Breadcrumb navigation */}
      <button
        onClick={() => onNavigate('/products')}
        className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        <span>متابعة التسوق وإضافة موديلات أخرى</span>
      </button>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          سلة المشتريات
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          {items.length} {items.length === 1 ? 'قطعة مختارة' : 'قطع مختارة'} جاهزة للتأكيد والشحن.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => {
            const primaryImg =
              item.product.images?.[0]?.image_url ||
              '/src/assets/images/product_boxfit_tee_black_1790342911897.jpg';

            return (
              <div
                key={item.variantId}
                className="p-4 sm:p-5 rounded-2xl bg-[#121216] border border-neutral-800/80 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
              >
                {/* Product Info */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <img
                    src={primaryImg}
                    alt={item.product.name}
                    className="w-20 h-24 sm:w-24 sm:h-28 object-cover rounded-xl bg-neutral-900 border border-neutral-800 shrink-0 cursor-pointer"
                    onClick={() => onNavigate(`/products/${item.product.slug}`)}
                  />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <button
                      onClick={() => onNavigate(`/products/${item.product.slug}`)}
                      className="font-bold text-white text-sm hover:text-neutral-300 transition-colors text-right line-clamp-1"
                    >
                      {item.product.name}
                    </button>
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <span>اللون: <strong className="text-neutral-200">{item.color}</strong></span>
                      <span>·</span>
                      <span>المقاس: <strong className="text-neutral-200 font-mono">{item.size}</strong></span>
                    </div>
                    <div className="text-xs font-mono-numbers text-neutral-300 pt-1">
                      {formatPrice(item.unitPrice)} للقطعة
                    </div>
                  </div>
                </div>

                {/* Controls: Quantity & Remove */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-800/60">
                  <div className="flex items-center border border-neutral-700 rounded-lg bg-neutral-900 overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="px-2.5 py-1 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                      aria-label="تقليل الكمية"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-xs font-mono-numbers text-white font-bold min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="px-2.5 py-1 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                      aria-label="زيادة الكمية"
                    >
                      +
                    </button>
                  </div>

                  <div className="font-mono-numbers font-bold text-white text-sm min-w-[5rem] text-left">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </div>

                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="p-2 text-neutral-500 hover:text-red-400 hover:bg-neutral-900 rounded-lg transition-colors"
                    title="حذف من السلة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Trust strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-900 flex items-center gap-2.5 text-xs text-neutral-400">
              <Truck className="w-4 h-4 text-neutral-300 shrink-0" />
              <span>دفع كاش عند الاستلام</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-900 flex items-center gap-2.5 text-xs text-neutral-400">
              <ShieldCheck className="w-4 h-4 text-neutral-300 shrink-0" />
              <span>معاينة قبل الدفع</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-900 flex items-center gap-2.5 text-xs text-neutral-400">
              <RotateCcw className="w-4 h-4 text-neutral-300 shrink-0" />
              <span>استبدال المقاس 14 يوم</span>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-[#121216] border border-neutral-800 space-y-6 sticky top-24">
          <h2 className="text-base font-bold text-white border-b border-neutral-800 pb-3">
            ملخص الطلب
          </h2>

          <div className="space-y-3 text-xs text-neutral-400">
            <div className="flex items-center justify-between">
              <span>إجمالي المنتجات ({items.reduce((s, i) => s + i.quantity, 0)} قطعة):</span>
              <span className="font-mono-numbers text-white font-semibold">{formatPrice(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>مصاريف الشحن والتوصيل:</span>
              <span className="font-mono-numbers text-neutral-200">{formatPrice(shippingFee)}</span>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex items-baseline justify-between text-base">
              <span className="font-bold text-white">الإجمالي الكلي:</span>
              <div className="text-left">
                <span className="font-mono-numbers font-black text-xl text-white">
                  {formatPrice(grandTotal)}
                </span>
                <span className="block text-[10px] text-neutral-500 font-normal">
                  شامل الشحن لجميع المحافظات
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => onNavigate('/checkout')}
              className="w-full py-4 px-6 bg-white hover:bg-neutral-200 text-black font-extrabold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <span>المتابعة لإتمام الطلب</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('/products')}
              className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold rounded-xl border border-neutral-800 transition-colors"
            >
              متابعة التسوق
            </button>
          </div>

          <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-500 text-center">
            الدفع نقدًا عند الاستلام فقط لجميع المحافظات داخل مصر
          </div>
        </div>
      </div>
    </div>
  );
};
