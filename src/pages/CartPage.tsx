import React from 'react';
import gsap from 'gsap';
import {
  ArrowRight,
  Trash2,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  formatPrice,
  getLocalizedColorName,
  getLocalizedProductName,
} from '../utils/constants';
import { resolveImageUrl } from '../utils/imageHelper';

interface CartPageProps {
  onNavigate: (path: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate }) => {
  const { items, removeItem, updateQuantity, subtotal } = useCart();
  const { settings } = useStore();
  const { t, language } = useLanguage();
  const { isDark } = useTheme();

  const shippingFee = settings?.shipping_fee || 65;
  const grandTotal = subtotal + shippingFee;
  const totalRef = React.useRef<HTMLSpanElement>(null);
  const previousTotalRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const previousTotal = previousTotalRef.current;
    if (
      previousTotal !== null &&
      previousTotal !== grandTotal &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
      totalRef.current
    ) {
      gsap.fromTo(totalRef.current, { y: 4, scale: 0.97 }, {
        y: 0,
        scale: 1,
        duration: 0.24,
        ease: 'power2.out',
        clearProps: 'transform',
      });
    }
    previousTotalRef.current = grandTotal;
    return () => {
      if (totalRef.current) gsap.killTweensOf(totalRef.current);
    };
  }, [grandTotal]);

  const removeCartRow = (event: React.MouseEvent<HTMLButtonElement>, variantId: string) => {
    const row = event.currentTarget.closest<HTMLElement>('[data-oz-cart-row]');
    if (!row || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      removeItem(variantId);
      return;
    }
    row.style.overflow = 'hidden';
    const finish = () => removeItem(variantId);
    gsap.to(row, {
      height: 0,
      opacity: 0,
      y: -5,
      paddingTop: 0,
      paddingBottom: 0,
      marginTop: 0,
      marginBottom: 0,
      duration: 0.18,
      ease: 'power2.in',
      onComplete: finish,
    });
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center text-right w-full max-w-full overflow-x-hidden">
        <div
          className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto mb-4 ${
            isDark
              ? 'bg-neutral-900 border-neutral-800 text-neutral-400'
              : 'bg-neutral-100 border-neutral-200 text-neutral-600'
          }`}
        >
          <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
        </div>

        <h1
          className={`text-2xl font-extrabold mb-2 ${
            isDark ? 'text-white' : 'text-neutral-900'
          }`}
        >
          {t('cart.empty_title', 'Your cart is empty')}
        </h1>

        <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto mb-8 leading-relaxed">
          {t(
            'cart.empty_text',
            'You have not added any items to your cart yet. Browse our streetwear collection and choose your size with Cash on Delivery.'
          )}
        </p>

        <button
          onClick={() => onNavigate('/products')}
          className={`py-3 px-8 font-extrabold text-xs rounded-xl transition-colors inline-flex items-center gap-2 shadow-lg cursor-pointer ${
            isDark
              ? 'bg-white text-black hover:bg-neutral-200'
              : 'bg-black text-white hover:bg-neutral-800'
          }`}
        >
          <span>
            {t('cart.browse', 'Browse Streetwear Collection')}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div data-oz-scene className="max-w-6xl mx-auto px-3.5 sm:px-6 py-6 sm:py-8 text-right w-full max-w-full overflow-x-hidden">
      {/* Breadcrumb navigation */}
      <button
        onClick={() => onNavigate('/products')}
        className={`inline-flex items-center gap-1.5 text-xs mb-6 transition-colors cursor-pointer ${
          isDark
            ? 'text-neutral-400 hover:text-white'
            : 'text-neutral-500 hover:text-black'
        }`}
      >
        <ArrowRight className="w-4 h-4" />
        <span>
          {t(
            'cart.continue_add',
            'Continue Shopping & Add More Items'
          )}
        </span>
      </button>

      <div className="mb-8">
        <h1
          className={`text-2xl sm:text-3xl font-extrabold ${
            isDark ? 'text-white' : 'text-neutral-900'
          }`}
        >
          {t('cart.title', 'Shopping Cart')}
        </h1>

        <p className="text-xs text-neutral-400 mt-1">
          {items.length}{' '}
          {items.length === 1
            ? t('cart.item_selected', 'item selected')
            : t('cart.items_selected', 'items selected')}{' '}
          {t(
            'cart.ready_shipping',
            'ready for confirmation and shipping.'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4 min-w-0">
          {items.map((item) => {
            const primaryImg = resolveImageUrl(
              item.product.images?.[0]?.image_url
            );

            const localizedProductName = getLocalizedProductName(
              item.product,
              language
            );

            const localizedColor = getLocalizedColorName(
              item.color,
              language
            );

            return (
              <div
                key={item.variantId}
                data-oz-cart-row className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition-colors ${
                  isDark
                    ? 'bg-[#121216] border-neutral-800/80'
                    : 'bg-white border-neutral-200 shadow-sm'
                }`}
              >
                {/* Product Info */}
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto min-w-0">
                  <img
                    src={primaryImg}
                    alt={localizedProductName}
                    className="w-20 h-24 sm:w-24 sm:h-28 object-cover rounded-xl bg-neutral-900 border border-neutral-800 shrink-0 cursor-pointer"
                    onClick={() =>
                      onNavigate(
                        `/products/${item.product.slug}`
                      )
                    }
                  />

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <button
                      onClick={() =>
                        onNavigate(
                          `/products/${item.product.slug}`
                        )
                      }
                      className={`font-bold text-sm transition-colors text-right line-clamp-1 cursor-pointer ${
                        isDark
                          ? 'text-white hover:text-neutral-300'
                          : 'text-neutral-900 hover:text-neutral-600'
                      }`}
                    >
                      {localizedProductName}
                    </button>

                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <span>
                        {t('cart.color', 'Color:')}{' '}
                        <strong
                          className={
                            isDark
                              ? 'text-neutral-200'
                              : 'text-neutral-700'
                          }
                        >
                          {localizedColor}
                        </strong>
                      </span>

                      <span>·</span>

                      <span>
                        {t('cart.size', 'Size:')}{' '}
                        <strong
                          className={`font-mono ${
                            isDark
                              ? 'text-neutral-200'
                              : 'text-neutral-700'
                          }`}
                        >
                          {item.size}
                        </strong>
                      </span>
                    </div>

                    <div
                      className={`text-xs font-mono-numbers pt-1 ${
                        isDark
                          ? 'text-neutral-300'
                          : 'text-neutral-600'
                      }`}
                    >
                      {formatPrice(item.unitPrice, language)}{' '}
                      {t('cart.per_item', 'per item')}
                    </div>
                  </div>
                </div>

                {/* Controls: Quantity & Remove */}
                <div
                  className={`flex items-center justify-between sm:justify-end gap-2 xs:gap-4 sm:gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 ${
                    isDark
                      ? 'border-neutral-800/60'
                      : 'border-neutral-100'
                  }`}
                >
                  <div
                    className={`flex items-center border rounded-lg overflow-hidden ${
                      isDark
                        ? 'border-neutral-700 bg-neutral-900'
                        : 'border-neutral-300 bg-neutral-100'
                    }`}
                  >
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.variantId,
                          item.quantity - 1
                        )
                      }
                      className={`px-2.5 py-1 text-sm transition-colors cursor-pointer ${
                        isDark
                          ? 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                          : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
                      }`}
                      aria-label={t(
                        'cart.decrease',
                        'Decrease quantity'
                      )}
                    >
                      -
                    </button>

                    <span
                      data-oz-quantity className={`px-2.5 sm:px-3 py-1 text-xs font-mono-numbers font-bold min-w-[1.75rem] text-center ${
                        isDark
                          ? 'text-white'
                          : 'text-neutral-900'
                      }`}
                    >
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        updateQuantity(
                          item.variantId,
                          item.quantity + 1
                        )
                      }
                      className={`px-2.5 py-1 text-sm transition-colors cursor-pointer ${
                        isDark
                          ? 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                          : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
                      }`}
                      aria-label={t(
                        'cart.increase',
                        'Increase quantity'
                      )}
                    >
                      +
                    </button>
                  </div>

                  <div
                    className={`font-mono-numbers font-bold text-sm min-w-[4rem] sm:min-w-[5rem] text-left ${
                      isDark
                        ? 'text-white'
                        : 'text-neutral-900'
                    }`}
                  >
                    {formatPrice(
                      item.unitPrice * item.quantity,
                      language
                    )}
                  </div>

                  <button
                    onClick={(event) =>
                      removeCartRow(event, item.variantId)
                    }
                    className="p-2 text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
                    title={t(
                      'cart.remove',
                      'Remove from cart'
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Trust strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
            <div
              className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
                isDark
                  ? 'bg-neutral-950/60 border-neutral-900 text-neutral-400'
                  : 'bg-white border-neutral-200 text-neutral-600'
              }`}
            >
              <Truck className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>
                {t('cart.cod', 'Cash on Delivery')}
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
                isDark
                  ? 'bg-neutral-950/60 border-neutral-900 text-neutral-400'
                  : 'bg-white border-neutral-200 text-neutral-600'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>
                {t(
                  'cart.inspection',
                  'Inspect before payment'
                )}
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
                isDark
                  ? 'bg-neutral-950/60 border-neutral-900 text-neutral-400'
                  : 'bg-white border-neutral-200 text-neutral-600'
              }`}
            >
              <RotateCcw className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>
                {t(
                  'cart.exchange',
                  '14-day size exchange'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div
          className={`lg:col-span-4 p-5 sm:p-6 rounded-2xl border space-y-6 sticky top-24 ${
            isDark
              ? 'bg-[#121216] border-neutral-800'
              : 'bg-white border-neutral-200 shadow-sm'
          }`}
        >
          <h2
            className={`text-base font-bold pb-3 border-b ${
              isDark
                ? 'text-white border-neutral-800'
                : 'text-neutral-900 border-neutral-100'
            }`}
          >
            {t('cart.summary', 'Order Summary')}
          </h2>

          <div className="space-y-3 text-xs text-neutral-400">
            <div className="flex items-center justify-between">
              <span>
                {t('cart.products_total', 'Products Total')} (
                {items.reduce(
                  (s, i) => s + i.quantity,
                  0
                )}{' '}
                {t('cart.pieces', 'pieces')}):
              </span>

              <span
                className={`font-mono-numbers font-semibold ${
                  isDark
                    ? 'text-white'
                    : 'text-neutral-900'
                }`}
              >
                {formatPrice(subtotal, language)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>
                {t(
                  'cart.shipping',
                  'Shipping & Delivery:'
                )}
              </span>

              <span
                className={`font-mono-numbers ${
                  isDark
                    ? 'text-neutral-200'
                    : 'text-neutral-700'
                }`}
              >
                {formatPrice(shippingFee, language)}
              </span>
            </div>

            <div
              className={`pt-3 border-t flex items-baseline justify-between text-base ${
                isDark
                  ? 'border-neutral-800'
                  : 'border-neutral-100'
              }`}
            >
              <span
                className={`font-bold ${
                  isDark
                    ? 'text-white'
                    : 'text-neutral-900'
                }`}
              >
                {t('cart.grand_total', 'Grand Total:')}
              </span>

              <div className="text-left">
                <span
                  ref={totalRef}
                  className={`font-mono-numbers font-black text-xl ${
                    isDark
                      ? 'text-white'
                      : 'text-neutral-900'
                  }`}
                >
                  {formatPrice(grandTotal, language)}
                </span>

                <span className="block text-[10px] text-neutral-400 font-normal">
                  {t(
                    'cart.shipping_included',
                    'Shipping included for all governorates'
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => onNavigate('/checkout')}
              className={`w-full py-4 px-6 font-extrabold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                isDark
                  ? 'bg-white hover:bg-neutral-200 text-black'
                  : 'bg-black hover:bg-neutral-800 text-white'
              }`}
            >
              <span>
                {t(
                  'cart.checkout',
                  'Continue to Checkout'
                )}
              </span>

              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('/products')}
              className={`w-full py-3 px-4 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-800'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black border-neutral-200'
              }`}
            >
              {t(
                'cart.continue_shopping',
                'Continue Shopping'
              )}
            </button>
          </div>

          <div
            className={`pt-2 border-t text-[11px] text-neutral-400 text-center ${
              isDark
                ? 'border-neutral-800/80'
                : 'border-neutral-100'
            }`}
          >
            {t(
              'cart.cod_all_egypt',
              'Cash on Delivery only, available across all governorates in Egypt'
            )}
          </div>
        </div>
      </div>
    </div>
  );
};