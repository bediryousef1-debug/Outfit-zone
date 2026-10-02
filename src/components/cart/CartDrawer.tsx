import React from 'react';
import { X, Trash2, ShoppingBag, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { resolveImageUrl } from '../../utils/imageHelper';
import { formatPrice, getLocalizedColorName, getLocalizedProductName } from '../../utils/constants';

interface CartDrawerProps {
  onNavigate: (path: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigate }) => {
  const { items, removeItem, updateQuantity, isCartOpen, setIsCartOpen, subtotal, itemCount } = useCart();
  const { settings } = useStore();
  const { t, language } = useLanguage();
  const CheckoutArrow = ArrowLeft;

  const shippingFee = settings?.shipping_fee || 65;
  const grandTotal = subtotal > 0 ? subtotal + shippingFee : 0;

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#101014] border-l border-neutral-800 w-full max-w-md h-full flex flex-col shadow-2xl text-start">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-white" />
            <h3 className="text-base font-bold text-white">
              {t('cart.title', 'Shopping Bag')} ({itemCount})
            </h3>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label={t('cart.close', 'Close cart')}
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
                {t('cart.empty', 'Your bag is empty')}
              </p>
              <p className="text-xs text-neutral-500 mb-5">
                {t('cart.empty_desc', 'You have not added any streetwear pieces to your bag yet.')}
              </p>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onNavigate('/products');
                }}
                className="py-2.5 px-6 bg-white text-black text-xs font-bold rounded-lg hover:bg-neutral-200 transition-colors"
              >
                {t('checkout.browse_products', 'Browse Products Now')}
              </button>
            </div>
          ) : (
            items.map((item) => {
              const primaryImg = resolveImageUrl(
                item.product?.images?.find((img) => img.is_primary)?.image_url ||
                  item.product?.images?.[0]?.image_url
              );

              return (
                <div
                  key={item.variantId}
                  className="flex gap-3 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 items-start"
                >
                  {/* Item Image */}
                  <img
                    src={primaryImg}
                    alt={item.product?.name || ''}
                    className="w-16 h-20 object-cover rounded-lg bg-neutral-950 border border-neutral-800 shrink-0"
                  />

                  {/* Item Details */}
                  <div className="flex-1 flex flex-col justify-between h-20">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-white line-clamp-1">
                          {getLocalizedProductName(item.product, language) || item.product?.name}
                        </h4>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="text-neutral-500 hover:text-red-400 p-1 transition-colors"
                          aria-label={t('cart.remove', 'Remove')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Variant Specs */}
                      <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                        <span>{t('cart.color', 'Color:')} {getLocalizedColorName(item.color, language)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{t('cart.size', 'Size:')} {item.size}</span>
                      </div>
                    </div>

                    {/* Quantity & Price */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center border border-neutral-800 rounded bg-neutral-950 text-xs">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="px-2 py-0.5 text-neutral-400 hover:text-white"
                          aria-label={t('cart.decrease', 'Decrease quantity')}
                        >
                          -
                        </button>
                        <span className="px-2 font-mono-numbers font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="px-2 py-0.5 text-neutral-400 hover:text-white"
                          aria-label={t('cart.increase', 'Increase quantity')}
                        >
                          +
                        </button>
                      </div>

                      <div className="text-left font-mono-numbers text-xs font-bold text-white">
                        {formatPrice(item.unitPrice * item.quantity, language)}
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
                <span>{t('cart.subtotal', 'Subtotal:')}</span>
                <span className="font-mono-numbers text-white font-medium">
                  {formatPrice(subtotal, language)}
                </span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>{t('cart.shipping', 'Shipping & Delivery:')}</span>
                <span className="font-mono-numbers text-white font-medium">
                  {formatPrice(shippingFee, language)}
                </span>
              </div>
              <div className="pt-2 border-t border-neutral-800/80 flex justify-between text-sm font-bold text-white">
                <span>{t('checkout.total_on_delivery', 'Total on Delivery:')}</span>
                <span className="font-mono-numbers text-base text-white">
                  {formatPrice(grandTotal, language)}
                </span>
              </div>
            </div>

            {/* Trust badge */}
            <div className="flex items-center gap-2 text-[11px] text-neutral-400 bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800/70">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t('about.trust_text', 'Cash on delivery with the option to open the package and check the size and fabric before making any payment.')}</span>
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
                <span>{t('cart.drawer_checkout', 'Proceed to Checkout (Cash on Delivery)')}</span>
                <CheckoutArrow className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsCartOpen(false)}
                className="w-full py-2.5 text-center text-xs text-neutral-400 hover:text-white transition-colors"
              >
                {t('cart.continue_shopping', 'Continue Shopping')}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
