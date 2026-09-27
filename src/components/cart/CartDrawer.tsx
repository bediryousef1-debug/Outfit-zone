import React from 'react';
import { X, Trash2, ShoppingBag, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { formatPrice } from '../../utils/constants';

interface CartDrawerProps {
  onNavigate: (path: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigate }) => {
  const { items, removeItem, updateQuantity, isCartOpen, setIsCartOpen, subtotal, itemCount } = useCart();
  const { settings } = useStore();

  const shippingFee = settings?.shipping_fee || 65;
  const grandTotal = subtotal > 0 ? subtotal + shippingFee : 0;

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#101014] border-l border-neutral-800 w-full max-w-md h-full flex flex-col shadow-2xl text-right">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-white" />
            <h3 className="text-base font-bold text-white">
              سلة الطلبات ({itemCount})
            </h3>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="إغلاق السلة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
              <ShoppingBag className="w-12 h-12 stroke-[1] mb-3 text-neutral-600" />
              <p className="text-sm font-semibold text-neutral-300 mb-1">
                سلة مشترياتك فارغة
              </p>
              <p className="text-xs text-neutral-500 mb-5">
                تصفح تشكيلة الستريت وير واختر المقاس واللون المناسب لك
              </p>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onNavigate('/products');
                }}
                className="py-2.5 px-6 bg-white text-black text-xs font-bold rounded-lg hover:bg-neutral-200 transition-colors"
              >
                تصفح المنتجات الآن
              </button>
            </div>
          ) : (
            items.map((item) => {
              const primaryImg =
                item.product.images?.find((img) => img.is_primary)?.image_url ||
                item.product.images?.[0]?.image_url ||
                '/src/assets/images/product_boxfit_tee_black_1790342911897.jpg';

              return (
                <div
                  key={item.variantId}
                  className="flex gap-3 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 items-start"
                >
                  {/* Item Image */}
                  <img
                    src={primaryImg}
                    alt={item.product.name}
                    className="w-16 h-20 object-cover rounded-lg bg-neutral-950 border border-neutral-800 shrink-0"
                  />

                  {/* Item Details */}
                  <div className="flex-1 flex flex-col justify-between h-20">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-white line-clamp-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="text-neutral-500 hover:text-red-400 p-1 transition-colors"
                          aria-label="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Variant Specs */}
                      <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                        <span>اللون: {item.color}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">المقاس: {item.size}</span>
                      </div>
                    </div>

                    {/* Quantity & Price */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center border border-neutral-800 rounded bg-neutral-950 text-xs">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="px-2 py-0.5 text-neutral-400 hover:text-white"
                        >
                          -
                        </button>
                        <span className="px-2 font-mono-numbers font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="px-2 py-0.5 text-neutral-400 hover:text-white"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-left font-mono-numbers text-xs font-bold text-white">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer & Checkout Action */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-neutral-800 bg-neutral-950 space-y-4">
            {/* Price Breakdown */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>مجموع المنتجات:</span>
                <span className="font-mono-numbers text-white font-medium">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>تكلفة الشحن لجميع المحافظات:</span>
                <span className="font-mono-numbers text-white font-medium">
                  {formatPrice(shippingFee)}
                </span>
              </div>
              <div className="pt-2 border-t border-neutral-800/80 flex justify-between text-sm font-bold text-white">
                <span>الإجمالي للدفع عند الاستلام:</span>
                <span className="font-mono-numbers text-base text-white">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            {/* Trust badge */}
            <div className="flex items-center gap-2 text-[11px] text-neutral-400 bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800/70">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>الدفع عند الاستلام مع إمكانية فتح الشحنة والمعاينة قبل الدفع.</span>
            </div>

            {/* Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onNavigate('/checkout');
                }}
                className="w-full py-3 px-4 bg-white text-black font-bold rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors shadow-sm"
              >
                <span>متابعة إتمام الطلب (الدفع عند الاستلام)</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsCartOpen(false)}
                className="w-full py-2.5 text-center text-xs text-neutral-400 hover:text-white transition-colors"
              >
                متابعة التسوق
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
