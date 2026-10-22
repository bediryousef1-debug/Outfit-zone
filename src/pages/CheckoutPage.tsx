import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Truck,
  ArrowRight,
  ArrowLeft,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Ticket,
  X,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { resolveImageUrl } from '../utils/imageHelper';
import { ShippingRate } from '../types';
import { getOrderSource } from '../utils/sourceTracker';
import {
  EGYPTIAN_GOVERNORATES,
  formatPrice,
  validateEgyptianPhone,
  getLocalizedColorName,
  getLocalizedProductName,
} from '../utils/constants';


interface CheckoutPageProps {
  onOrderSuccess: (orderNumber: string, receiptToken?: string) => void;
  onNavigate: (path: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onOrderSuccess,
  onNavigate,
}) => {
  const { t, isRtl, language } = useLanguage();
  const BackIcon = ArrowRight;
  const { items, subtotal, clearCart, removeItem, updateQuantity } = useCart();
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

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Track checkout started for Product Analytics & Abandonment
  useEffect(() => {
    api.logAnalyticsEvent({ event_type: 'checkout_started' });
    api.startCheckout({
      items_count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal,
    });
  }, []);

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

  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
  const grandTotal = discountedSubtotal + shippingFee;

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCouponError(null);
    const clean = couponInput.trim().toUpperCase();
    if (!clean) return;

    setCouponLoading(true);
    try {
      const res = await api.validateCoupon(clean, subtotal, formData.phone);
      if (res.valid && res.coupon) {
        setAppliedCoupon(res.coupon);
        setCouponDiscount(Number(res.discount_amount) || 0);
        setCouponError(null);
      } else {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponError(res.error || 'كوبون الخصم غير صالح أو منتهي الصلاحية');
      }
    } catch (err: any) {
      setCouponError(err.message || 'تعذر التحقق من الكوبون');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponInput('');
    setCouponError(null);
  };

  // Re-validate applied coupon if subtotal changes (e.g. cart items modified)
  useEffect(() => {
    if (appliedCoupon?.code && subtotal > 0) {
      api.validateCoupon(appliedCoupon.code, subtotal, formData.phone).then((res) => {
        if (res.valid && res.coupon) {
          setAppliedCoupon(res.coupon);
          setCouponDiscount(Number(res.discount_amount) || 0);
          setCouponError(null);
        } else {
          setAppliedCoupon(null);
          setCouponDiscount(0);
          setCouponError(res.error || null);
        }
      }).catch(() => {
        // Keep current state on network flicker
      });
    }
  }, [subtotal]);


  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (
      !formData.customer_name.trim() ||
      formData.customer_name.trim().length < 3
    ) {
      errs.customer_name = t(
        'checkout.name_required',
        'Please enter your full name.'
      );
    }

    if (!formData.phone.trim()) {
      errs.phone = t(
        'checkout.phone_required',
        'Phone number is required to confirm delivery.'
      );
    } else if (!validateEgyptianPhone(formData.phone)) {
      errs.phone = t(
        'checkout.phone_invalid',
        'Please enter a valid Egyptian mobile number starting with 010, 011, 012, or 015.'
      );
    }

    if (!formData.governorate) {
      errs.governorate = t(
        'checkout.governorate_required',
        'Please select your governorate.'
      );
    } else if (!isGovAvailable) {
      errs.governorate = t(
        'checkout.shipping_error',
        'We could not calculate shipping for this governorate right now. Please try again.'
      );
    }

    if (!formData.city.trim() || formData.city.trim().length < 2) {
      errs.city = t(
        'checkout.city_required',
        'Please enter the city, district, or area.'
      );
    }

    if (!formData.address.trim() || formData.address.trim().length < 5) {
      errs.address = t(
        'checkout.address_required',
        'Please enter the detailed address (street, building, and apartment).'
      );
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const playOrderSuccessSound = () => {
    try {
      const audio = new Audio('/sounds/order-success.mp3');
      audio.volume = 1;

      audio.play().catch((audioError) => {
        console.warn(
          'Order success sound could not be played:',
          audioError
        );
      });
    } catch (audioError) {
      console.warn(
        'Order success sound could not be initialized:',
        audioError
      );
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (items.length === 0) {
      setSubmitError(
        t('checkout.empty_cart', 'Your shopping cart is empty.')
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (!isGovAvailable) {
      setSubmitError(
        t(
          'checkout.shipping_error',
          'We could not calculate shipping for this governorate right now. Please try again.'
        )
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Refresh product and variant stock before creating an order.
      // If the cart is stale, update it and ask the customer to review before retrying.
      let currentProducts: any[];
      try {
        currentProducts = await api.getProducts({ fresh: true });
      } catch {
        setSubmitError(
          isRtl
            ? 'تعذر التحقق من توفر المنتجات الآن. لم يتم إرسال الطلب ولم يتم تغيير السلة. حاول مرة أخرى.'
            : 'We could not verify product availability. Your order was not submitted and your cart was not changed. Please try again.'
        );
        return;
      }

      if (!Array.isArray(currentProducts) || currentProducts.length === 0) {
        setSubmitError(
          isRtl
            ? 'تعذر التحقق من المخزون حاليًا. لم يتم إرسال الطلب ولم يتم تغيير السلة. حاول مرة أخرى بعد قليل.'
            : 'Stock could not be verified right now. Your order was not submitted and your cart was not changed. Please try again shortly.'
        );
        return;
      }

      const unavailableItems: string[] = [];
      let cartWasUpdated = false;

      for (const cartItem of items) {
        const currentProduct = currentProducts.find(
          (product: any) => String(product.id) === String(cartItem.productId)
        );
        const currentVariant = currentProduct?.variants?.find(
          (variant: any) => String(variant.id) === String(cartItem.variantId)
        );

        if (!currentProduct || !currentVariant) {
          removeItem(cartItem.variantId);
          unavailableItems.push(
            getLocalizedProductName(cartItem.product, language) || cartItem.product?.name || 'منتج'
          );
          cartWasUpdated = true;
          continue;
        }

        const availableStock = Math.max(0, Math.floor(Number(currentVariant.stock_quantity) || 0));
        if (availableStock < cartItem.quantity) {
          if (availableStock === 0) {
            removeItem(cartItem.variantId);
          } else {
            updateQuantity(cartItem.variantId, availableStock);
          }
          unavailableItems.push(
            `${getLocalizedProductName(cartItem.product, language) || cartItem.product?.name || 'منتج'} (${cartItem.size} / ${cartItem.color})`
          );
          cartWasUpdated = true;
        }
      }

      if (cartWasUpdated) {
        setSubmitError(
          isRtl
            ? `حدّثنا سلتك لأن بعض المنتجات لم تعد متاحة أو أن الكمية المتاحة أقل من المطلوبة: ${unavailableItems.join('، ')}. راجع السلة والإجمالي، ثم اضغط إتمام الطلب مرة أخرى لتأكيد الطلب بالمنتجات المتاحة.`
            : `Your cart was updated because some products are unavailable or have less stock than requested: ${unavailableItems.join(', ')}. Review your cart and total, then submit again to confirm the updated order.`
        );
        return;
      }

      const orderPayload = {
        customer: {
          customer_name: formData.customer_name.trim(),
          phone: formData.phone.trim(),

          // Keep governorate in Arabic because the shipping system
          // matches against the Arabic governorate name in Supabase.
          governorate: selectedGovNameAr,

          city: formData.city.trim(),
          address: formData.address.trim(),
          notes: formData.notes.trim() || undefined,
        },

        items: items.map((i) => ({
          variant_id: i.variantId,
          product_id: i.productId,
          quantity: i.quantity,

          // Store the product name according to the customer's language.
          product_name:
            getLocalizedProductName(i.product, language) ||
            i.product?.name,

          // Store the category name according to the customer's language.
          category_name:
            language === 'en'
              ? i.product?.category?.name_en ||
                i.product?.category?.name
              : i.product?.category?.name,

          // Store the selected color according to the customer's language.
          color: getLocalizedColorName(i.color, language),

          size: i.size,
          unit_price: i.unitPrice,
          line_total: i.unitPrice * i.quantity,
        })),
        coupon_code: appliedCoupon?.code || (couponInput.trim() ? couponInput.trim().toUpperCase() : undefined),
      };

      const res = await api.submitGuestOrder(orderPayload);

      if (res.success && res.order_number) {
        // Play success sound only after the order has actually been created.
        playOrderSuccessSound();

        clearCart();
        onOrderSuccess(res.order_number, res.receipt_token);
      } else {
        throw new Error(
          res.error ||
            t(
              'checkout.order_error',
              'An error occurred while submitting your order. Please try again.'
            )
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
          t(
            'checkout.shipping_error',
            'We could not calculate shipping for this governorate right now. Please try again.'
          )
        );
      } else if (rawMsg.includes('OZ_INSUFFICIENT_STOCK')) {
        setSubmitError(
          t(
            'checkout.out_of_stock',
            'Some products in your cart do not have enough stock.'
          )
        );
      } else {
        setSubmitError(
          rawMsg ||
            t(
              'checkout.order_error',
              'An error occurred while submitting your order. Please try again.'
            )
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center text-start">
        {submitError && (
          <p className="text-sm text-red-500 mb-4">{submitError}</p>
        )}
        <h2
          className={`text-xl font-bold mb-2 ${
            isDark ? 'text-white' : 'text-black'
          }`}
        >
          {t(
            'checkout.empty_title',
            'Your cart is currently empty'
          )}
        </h2>

        <p className="text-xs text-neutral-400 mb-6">
          {t(
            'checkout.empty_text',
            'Add some streetwear pieces to your cart to continue checkout.'
          )}
        </p>

        <button
          onClick={() => onNavigate('/products')}
          className={`py-3 px-6 rounded-full font-bold text-xs transition-all shadow-md cursor-pointer ${
            isDark
              ? 'bg-white text-black hover:bg-neutral-200'
              : 'bg-black text-white hover:bg-neutral-800'
          }`}
        >
          {t(
            'checkout.browse_products',
            'Browse Products Now'
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-6 sm:py-12 text-start w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => onNavigate('/cart')}
          className="text-xs text-neutral-400 hover:text-black dark:hover:text-white flex items-center gap-1.5 mb-3 transition-colors cursor-pointer"
        >
          <BackIcon className="w-4 h-4" />

          <span>
            {t('checkout.back_to_cart', 'Back to Cart')}
          </span>
        </button>

        <h1
          className={`text-2xl sm:text-3xl font-black ${
            isDark ? 'text-white' : 'text-black'
          }`}
        >
          {t('checkout.page_title', 'Checkout')}
        </h1>

        <p className="text-xs text-neutral-400 mt-1">
          {t(
            'checkout.cod_description',
            'Cash on Delivery · Free order inspection before receiving and paying'
          )}
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
        <div className="lg:col-span-7 space-y-6 min-w-0">
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
              {t(
                'checkout.shipping_info',
                'Recipient and Delivery Information'
              )}
            </h2>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isDark
                      ? 'text-neutral-300'
                      : 'text-neutral-700'
                  }`}
                >
                  {t('checkout.full_name', 'Full Name')}{' '}
                  <span className="text-red-400">*</span>
                </label>

                <input
                  type="text"
                  required
                  placeholder={t(
                    'checkout.customer_name_placeholder',
                    'Enter your full name'
                  )}
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customer_name: e.target.value,
                    })
                  }
                  className={`w-full rounded-xl py-2.5 px-3.5 text-xs text-start focus:outline-none transition-colors border ${
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
                    isDark
                      ? 'text-neutral-300'
                      : 'text-neutral-700'
                  }`}
                >
                  {t(
                    'checkout.phone_label',
                    'Mobile Phone Number'
                  )}{' '}
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
                  className={`w-full rounded-xl py-2.5 px-3.5 text-xs text-start font-mono focus:outline-none transition-colors border ${
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
                  {t(
                    'checkout.phone_help',
                    'The courier will call this number to arrange your delivery time.'
                  )}
                </p>
              </div>

              {/* Governorate & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-xs font-bold mb-1.5 ${
                      isDark
                        ? 'text-neutral-300'
                        : 'text-neutral-700'
                    }`}
                  >
                    {t(
                      'checkout.governorate',
                      'Governorate'
                    )}{' '}
                    <span className="text-red-400">*</span>
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
                        ? ` · ${rate.shipping_fee} ${
                            isRtl ? 'جنيه' : 'EGP'
                          }`
                        : '';

                      const inactiveText =
                        rate && !rate.is_active
                          ? ` (${t(
                              'checkout.shipping_unavailable',
                              'Unavailable'
                            )})`
                          : '';

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
                          {isRtl
                            ? gov.nameAr
                            : gov.nameEn}{' '}
                          {feeText} {inactiveText}
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
                      {t(
                        'checkout.shipping_unavailable',
                        'Shipping to this governorate is currently unavailable.'
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className={`block text-xs font-bold mb-1.5 ${
                      isDark
                        ? 'text-neutral-300'
                        : 'text-neutral-700'
                    }`}
                  >
                    {t(
                      'checkout.city',
                      'City / District / Area'
                    )}{' '}
                    <span className="text-red-400">*</span>
                  </label>

                  <input
                    type="text"
                    required
                    placeholder={t(
                      'checkout.city_placeholder',
                      'e.g. Nasr City / Mansoura / Smouha'
                    )}
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        city: e.target.value,
                      })
                    }
                    className={`w-full rounded-xl py-2.5 px-3.5 text-xs text-start focus:outline-none transition-colors border ${
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
                    isDark
                      ? 'text-neutral-300'
                      : 'text-neutral-700'
                  }`}
                >
                  {t(
                    'checkout.address',
                    'Detailed Address'
                  )}{' '}
                  <span className="text-red-400">*</span>
                </label>

                <input
                  type="text"
                  required
                  placeholder={t(
                    'checkout.address_placeholder',
                    'Street, building, floor, apartment, landmark'
                  )}
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: e.target.value,
                    })
                  }
                  className={`w-full rounded-xl py-2.5 px-3.5 text-xs text-start focus:outline-none transition-colors border ${
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
                    isDark
                      ? 'text-neutral-300'
                      : 'text-neutral-700'
                  }`}
                >
                  {t(
                    'checkout.additional_notes',
                    'Additional Delivery Notes (Optional)'
                  )}
                </label>

                <textarea
                  rows={2}
                  placeholder={t(
                    'checkout.notes_placeholder',
                    'Any instructions for the courier, such as call times or a nearby landmark'
                  )}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notes: e.target.value,
                    })
                  }
                  className={`w-full rounded-xl py-2 px-3.5 text-xs text-start focus:outline-none transition-colors border ${
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
                  {t(
                    'checkout.cod_title',
                    'Cash on Delivery (COD)'
                  )}
                </span>

                <span className="text-[11px] text-neutral-400">
                  {t(
                    'checkout.cod_description_full',
                    'Pay the courier after inspecting the package and confirming it matches your order.'
                  )}
                </span>
              </div>
            </div>

            <Lock className="w-4 h-4 text-neutral-400" />
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 min-w-0">
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
              {t(
                'checkout.order_summary',
                'Your Order Summary'
              )}{' '}
              ({items.length}{' '}
              {t('checkout.items_count', 'items')})
            </h2>

            {/* Items list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => {
                const localizedProductName =
                  getLocalizedProductName(
                    item.product,
                    language
                  ) || item.product?.name;

                const localizedColor =
                  getLocalizedColorName(
                    item.color,
                    language
                  );

                return (
                  <div
                    key={item.variantId}
                    className="flex gap-3 text-xs"
                  >
                    <img
                      src={resolveImageUrl(
                        item.product?.images?.find(
                          (img) => img.is_primary
                        )?.image_url ||
                          item.product?.images?.[0]
                            ?.image_url
                      )}
                      alt={localizedProductName || ''}
                      className="w-12 h-14 object-cover rounded-lg bg-neutral-900 border border-neutral-800 shrink-0"
                    />

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4
                          className={`font-bold line-clamp-1 ${
                            isDark
                              ? 'text-white'
                              : 'text-black'
                          }`}
                        >
                          {localizedProductName}
                        </h4>

                        <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                          <span>{localizedColor}</span>

                          <span>·</span>

                          <span className="font-mono">
                            {item.size}
                          </span>

                          <span>·</span>

                          <span>
                            {t(
                              'checkout.quantity',
                              'Quantity:'
                            )}{' '}
                            {item.quantity}
                          </span>
                        </div>
                      </div>

                      <div className="font-mono-numbers font-bold">
                        {formatPrice(
                          item.unitPrice * item.quantity,
                          language
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coupon Code Section */}
            <div
              className={`pt-3 border-t ${
                isDark ? 'border-neutral-800/80' : 'border-neutral-100'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Ticket className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-xs font-bold text-neutral-400">
                  {t('checkout.coupon_section', 'Discount Coupon')}
                </span>
              </div>

              {appliedCoupon ? (
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                    isDark
                      ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-300'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs uppercase tracking-wider">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                          {appliedCoupon.discount_type === 'percentage'
                            ? `${appliedCoupon.discount_value}%`
                            : `${appliedCoupon.discount_value} ج.م`}
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400/80 block mt-0.5">
                        {t('checkout.coupon_applied', 'Coupon applied successfully!')}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs flex items-center gap-1 cursor-pointer shrink-0"
                    title={t('checkout.remove_coupon', 'Remove')}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium hidden sm:inline">
                      {t('checkout.remove_coupon', 'Remove')}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          if (couponError) setCouponError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                        placeholder={t(
                          'checkout.coupon_placeholder',
                          'Enter coupon code (e.g. OZ10)'
                        )}
                        className={`w-full rounded-xl py-2 px-3 text-xs uppercase tracking-wider font-mono text-start focus:outline-none transition-colors border ${
                          couponError
                            ? 'border-red-500'
                            : isDark
                            ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500 focus:border-white'
                            : 'bg-neutral-50 border-neutral-300 text-black placeholder-neutral-400 focus:border-black'
                        }`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyCoupon()}
                      disabled={couponLoading || !couponInput.trim()}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition-all shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        isDark
                          ? 'bg-white text-black hover:bg-neutral-200'
                          : 'bg-black text-white hover:bg-neutral-800'
                      }`}
                    >
                      {couponLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        t('checkout.apply_coupon', 'Apply')
                      )}
                    </button>
                  </div>

                  {couponError && (
                    <p className="text-[11px] text-red-400 flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>{couponError}</span>
                    </p>
                  )}
                </div>
              )}
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
                <span>
                  {t(
                    'checkout.products_value',
                    'Products Value:'
                  )}
                </span>

                <span
                  className={`font-mono-numbers font-medium ${
                    isDark
                      ? 'text-white'
                      : 'text-black'
                  }`}
                >
                  {formatPrice(subtotal, language)}
                </span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-500 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>
                      {t('checkout.coupon_discount', 'Coupon Discount:')}{' '}
                      {appliedCoupon?.code ? `(${appliedCoupon.code})` : ''}
                    </span>
                  </span>

                  <span className="font-mono-numbers">
                    -{formatPrice(couponDiscount, language)}
                  </span>
                </div>
              )}

              {couponDiscount > 0 && (
                <div className="flex justify-between text-neutral-400 text-[11px]">
                  <span>
                    {t(
                      'checkout.subtotal_after_discount',
                      'Subtotal after discount:'
                    )}
                  </span>

                  <span
                    className={`font-mono-numbers ${
                      isDark ? 'text-neutral-200' : 'text-neutral-700'
                    }`}
                  >
                    {formatPrice(discountedSubtotal, language)}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span>
                  {t(
                    'checkout.shipping_by_governorate',
                    'Shipping Fee'
                  )}{' '}
                  (
                  {isRtl
                    ? selectedGovNameAr
                    : selectedGovObj?.nameEn ||
                      selectedGovNameAr}
                  ):
                </span>

                <span
                  className={`font-mono-numbers font-medium ${
                    isDark
                      ? 'text-white'
                      : 'text-black'
                  }`}
                >
                  {ratesLoading
                    ? t(
                        'checkout.calculating',
                        'Calculating...'
                      )
                    : formatPrice(
                        shippingFee,
                        language
                      )}
                </span>
              </div>

              <div
                className={`pt-2 border-t flex justify-between text-base font-extrabold ${
                  isDark
                    ? 'border-neutral-800 text-white'
                    : 'border-neutral-100 text-black'
                }`}
              >
                <span>
                  {t(
                    'checkout.total_on_delivery',
                    'Total on Delivery:'
                  )}
                </span>

                <span className="font-mono-numbers text-lg text-emerald-500">
                  {formatPrice(
                    grandTotal,
                    language
                  )}
                </span>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={
                isSubmitting || !isGovAvailable
              }
              className={`w-full py-4 px-3 sm:px-6 font-extrabold text-xs sm:text-base rounded-full transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50 ${
                isDark
                  ? 'bg-white text-black hover:bg-neutral-200'
                  : 'bg-black text-white hover:bg-neutral-800'
              }`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {t(
                      'checkout.confirm_cod',
                      'Confirm Order Now (Cash on Delivery)'
                    )}
                  </span>

                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                </>
              )}
            </button>

            <p className="text-[10px] text-center text-neutral-400">
              {t(
                'checkout.policy_agreement',
                'By confirming your order, you agree to Outfit Zone exchange and return policies.'
              )}
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};