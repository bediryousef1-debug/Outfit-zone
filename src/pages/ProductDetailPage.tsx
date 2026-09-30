import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  RotateCcw,
  Truck,
  MessageCircle,
  Star,
  Send,
  Zap,
} from 'lucide-react';
import {
  Product,
  ProductVariant,
  ProductReview,
  ProductComment,
} from '../types';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice } from '../utils/constants';
import { VariantSelector } from '../components/product/VariantSelector';
import { resolveImageUrl } from '../utils/imageHelper';

interface ProductDetailPageProps {
  slug: string;
  onBack: () => void;
  onNavigate: (path: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  slug,
  onBack,
  onNavigate,
}) => {
  const { addItem } = useCart();
  const { settings, getWhatsAppUrl } = useStore();
  const { isDark } = useTheme();
  const { t, isRtl } = useLanguage();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [customColorImage, setCustomColorImage] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  // Reviews / Comments
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [comments, setComments] = useState<ProductComment[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);

  // Review form
  const [reviewName, setReviewName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);

  // Comment form
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentMessage, setCommentMessage] = useState<string | null>(null);

  // Load product
  useEffect(() => {
    let isMounted = true;
    const loadProduct = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await api.getProductBySlug(slug);
        if (!isMounted) return;
        setProduct(data);

        if (data.variants && data.variants.length > 0) {
          const firstInStock =
            data.variants.find((v) => v.stock_quantity > 0) ||
            data.variants[0];

          setSelectedColor(firstInStock.color);
          if (firstInStock.image_url) {
            setCustomColorImage(firstInStock.image_url);
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Failed to load product detail:', err);
        setError(err.message || 'تعذر تحميل بيانات المنتج');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Load approved reviews/comments
  useEffect(() => {
    if (!product?.id) return;
    let isMounted = true;

    const loadReviewsAndComments = async () => {
      try {
        const [reviewsData, commentsData] = await Promise.all([
          api.getProductReviews(product.id),
          api.getProductComments(product.id),
        ]);

        if (!isMounted) return;
        setReviews(reviewsData || []);
        setComments(commentsData || []);
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load reviews/comments:', err);
        setReviews([]);
        setComments([]);
      } finally {
        if (isMounted) {
          setReviewsLoading(false);
          setCommentsLoading(false);
        }
      }
    };

    loadReviewsAndComments();
    return () => {
      isMounted = false;
    };
  }, [product?.id]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
          <div
            className={`lg:col-span-7 aspect-[3/4] rounded-3xl ${
              isDark ? 'bg-neutral-900' : 'bg-neutral-200'
            }`}
          />
          <div className="lg:col-span-5 space-y-4">
            <div
              className={`h-6 w-32 rounded ${
                isDark ? 'bg-neutral-900' : 'bg-neutral-200'
              }`}
            />
            <div
              className={`h-10 w-full rounded ${
                isDark ? 'bg-neutral-900' : 'bg-neutral-200'
              }`}
            />
            <div
              className={`h-8 w-48 rounded ${
                isDark ? 'bg-neutral-900' : 'bg-neutral-200'
              }`}
            />
            <div
              className={`h-32 w-full rounded ${
                isDark ? 'bg-neutral-900' : 'bg-neutral-200'
              }`}
            />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2
          className={`text-xl font-bold mb-2 ${
            isDark ? 'text-white' : 'text-black'
          }`}
        >
          {t('product.not_found', 'عفوًا، المنتج غير متوفر')}
        </h2>

        <p className="text-xs text-neutral-400 mb-6">
          {error || 'لم يتم العثور على هذا الموديل.'}
        </p>

        <button
          onClick={onBack}
          className={`py-2.5 px-6 font-bold text-xs rounded-xl transition-all cursor-pointer ${
            isDark
              ? 'bg-white text-black hover:bg-neutral-200'
              : 'bg-black text-white hover:bg-neutral-800'
          }`}
        >
          {t('product.back_to_products', 'العودة للمنتجات')}
        </button>
      </div>
    );
  }

  const images =
    product.images && product.images.length > 0
      ? product.images
      : [
          {
            id: 'fallback',
            image_url:
              '/images/product_boxfit_tee_black_1790342911897.jpg',
            sort_order: 0,
            is_primary: true,
          },
        ];

  const currentGalleryImage = images[selectedImageIndex] || images[0];
  const displayedImageUrl = customColorImage || currentGalleryImage.image_url;

  const variants = product.variants || [];

  const selectedVariant: ProductVariant | undefined = variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );

  const canAddToCart = Boolean(
    selectedVariant &&
      selectedVariant.stock_quantity >= quantity &&
      quantity > 0
  );

  const hasDiscount =
    product.compare_at_price !== null &&
    product.compare_at_price !== undefined &&
    product.compare_at_price > product.price;

  const averageRating =
    reviews.length > 0
      ? reviews.reduce(
          (sum, review) => sum + Number(review.rating || 0),
          0
        ) / reviews.length
      : 0;

  // Handle color selection: switch to color-specific image + clamp quantity
  const handleSelectColor = (col: string) => {
    setSelectedColor(col);

    // Look for color-specific image among variants of this color
    const colorVariantWithImg = variants.find(
      (v) => v.color === col && Boolean(v.image_url)
    );

    if (colorVariantWithImg?.image_url) {
      setCustomColorImage(colorVariantWithImg.image_url);
      const imgIdx = images.findIndex(
        (img) => img.image_url === colorVariantWithImg.image_url
      );
      if (imgIdx > -1) {
        setSelectedImageIndex(imgIdx);
      }
    } else {
      // Fallback to product primary image
      setCustomColorImage(null);
      setSelectedImageIndex(0);
    }

    // Clamp or adjust quantity if size was already selected
    if (selectedSize) {
      const newVar = variants.find(
        (v) => v.color === col && v.size === selectedSize
      );
      if (newVar && newVar.stock_quantity > 0) {
        setQuantity((prev) => Math.max(1, Math.min(prev, newVar.stock_quantity)));
      } else {
        setSelectedSize('');
        setQuantity(1);
      }
    } else {
      setQuantity(1);
    }
  };

  // Handle size selection + clamp quantity
  const handleSelectSize = (sz: string) => {
    setSelectedSize(sz);
    const newVar = variants.find(
      (v) => v.color === selectedColor && v.size === sz
    );
    if (newVar && newVar.stock_quantity > 0) {
      setQuantity((prev) => Math.max(1, Math.min(prev, newVar.stock_quantity)));
    } else {
      setQuantity(1);
    }
  };

  // 1. Direct Order — Primary Action
  const handleDirectOrder = () => {
    if (!selectedVariant || !canAddToCart) return;

    addItem(product, selectedVariant, quantity);
    onNavigate('/checkout');
  };

  // 2. Add to Cart — Secondary Action
  const handleAddToCart = () => {
    if (!selectedVariant || !canAddToCart) return;

    addItem(product, selectedVariant, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewMessage(null);

    if (!reviewName.trim()) {
      setReviewMessage('اكتب اسمك أولًا.');
      return;
    }
    if (!reviewText.trim()) {
      setReviewMessage('اكتب تقييمك أولًا.');
      return;
    }
    if (reviewRating < 1 || reviewRating > 5) {
      setReviewMessage('اختر تقييمًا من نجمة إلى 5 نجوم.');
      return;
    }

    setReviewSubmitting(true);
    try {
      await api.createProductReview({
        product_id: product.id,
        customer_name: reviewName.trim(),
        rating: reviewRating,
        review_text: reviewText.trim(),
      });

      setReviewName('');
      setReviewText('');
      setReviewRating(5);
      setReviewMessage(
        'تم إرسال تقييمك بنجاح وسيظهر بعد مراجعته من فريق Outfit Zone.'
      );
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      setReviewMessage(err.message || 'تعذر إرسال التقييم. حاول مرة أخرى.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentMessage(null);

    if (!commentName.trim()) {
      setCommentMessage('اكتب اسمك أولًا.');
      return;
    }
    if (!commentText.trim()) {
      setCommentMessage('اكتب تعليقك أولًا.');
      return;
    }

    setCommentSubmitting(true);
    try {
      await api.createProductComment({
        product_id: product.id,
        customer_name: commentName.trim(),
        comment: commentText.trim(),
      });

      setCommentName('');
      setCommentText('');
      setCommentMessage(
        'تم إرسال تعليقك بنجاح وسيظهر بعد مراجعته من الإدارة.'
      );
    } catch (err: any) {
      console.error('Failed to submit comment:', err);
      setCommentMessage(err.message || 'تعذر إرسال التعليق. حاول مرة أخرى.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const whatsappInquiryUrl = getWhatsAppUrl(
    `مرحبًا Outfit Zone، أستفسر عن الموديل: "${product.name}"، هل متوفر بلون "${selectedColor || '...'}" ومقاس "${selectedSize || '...'}"؟`
  );

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Back button */}
      <button
        onClick={onBack}
        className={`inline-flex items-center gap-2 text-xs font-semibold transition-colors mb-6 group cursor-pointer ${
          isDark
            ? 'text-neutral-400 hover:text-white'
            : 'text-neutral-600 hover:text-black'
        }`}
      >
        <BackIcon className={`w-4 h-4 transition-transform ${isRtl ? 'group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
        <span>{t('product.back_to_products', 'العودة لجميع المنتجات')}</span>
      </button>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left/Right Column: Image Gallery with Color-Specific Images */}
        <div className="lg:col-span-7 space-y-4">
          <div
            className={`relative aspect-[3/4] w-full rounded-3xl overflow-hidden border shadow-2xl transition-all duration-300 ${
              isDark
                ? 'bg-[#141418] border-neutral-800'
                : 'bg-neutral-100 border-neutral-200'
            }`}
          >
            <img
              key={displayedImageUrl}
              src={resolveImageUrl(displayedImageUrl)}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-all duration-500 ease-out hover:scale-105 motion-reduce:transition-none"
              fetchPriority="high"
            />

            {hasDiscount && (
              <span className="absolute top-4 end-4 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg font-mono-numbers">
                خصم{' '}
                {Math.round(
                  ((product.compare_at_price! - product.price) /
                    product.compare_at_price!) *
                    100
                )}
                %
              </span>
            )}
          </div>

          {/* Thumbnails row */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {images.map((img, idx) => {
                const isCurrent =
                  displayedImageUrl === img.image_url ||
                  (!customColorImage && selectedImageIndex === idx);

                return (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => {
                      setSelectedImageIndex(idx);
                      setCustomColorImage(null);
                    }}
                    className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer active:scale-95 motion-reduce:transition-none ${
                      isCurrent
                        ? isDark
                          ? 'border-white ring-2 ring-white/30 opacity-100 scale-102'
                          : 'border-black ring-2 ring-black/20 opacity-100 scale-102'
                        : isDark
                        ? 'border-neutral-800 opacity-60 hover:opacity-100'
                        : 'border-neutral-300 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={resolveImageUrl(img.image_url)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right/Left Column: Purchase Module */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {/* Category & Title */}
          <div>
            <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
              <span>{product.category?.name || 'ستريت وير'}</span>
              <span>·</span>
              <span>Outfit Zone</span>
            </div>

            <h1
              className={`text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight ${
                isDark ? 'text-white' : 'text-neutral-900'
              }`}
            >
              {product.name}
            </h1>
          </div>

          {/* Rating Summary */}
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-neutral-700'
                    }`}
                  />
                ))}
              </div>

              <span
                className={`text-sm font-bold ${
                  isDark ? 'text-white' : 'text-neutral-900'
                }`}
              >
                {averageRating.toFixed(1)}
              </span>

              <span className="text-xs text-neutral-400">
                ({reviews.length} {t('product.reviews_count', 'تقييم')})
              </span>
            </div>
          )}

          {/* Pricing */}
          <div
            className={`flex items-baseline gap-3 pb-4 border-b ${
              isDark ? 'border-neutral-800' : 'border-neutral-200'
            }`}
          >
            <span
              className={`text-3xl sm:text-4xl font-black font-mono-numbers ${
                isDark ? 'text-white' : 'text-neutral-950'
              }`}
            >
              {formatPrice(product.price)}
            </span>

            {hasDiscount && (
              <span className="text-base sm:text-lg text-neutral-400 line-through font-mono-numbers">
                {formatPrice(product.compare_at_price!)}
              </span>
            )}

            <span className="text-xs text-neutral-400 ms-auto">
              {t('product.cash_on_delivery', '(الدفع عند الاستلام)')}
            </span>
          </div>

          {/* =================================================================
              LOGICAL FLOW:
              1. Color Selector
              2. Size Selector
              3. Quantity Selector
              ================================================================= */}
          <VariantSelector
            variants={variants}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            quantity={quantity}
            onSelectColor={handleSelectColor}
            onSelectSize={handleSelectSize}
            onChangeQuantity={(qty) => setQuantity(qty)}
          />

          {/* =================================================================
              ACTIONS HIERARCHY:
              1. [ اطلب الآن ] — PRIMARY CTA (Largest, most prominent, direct)
              2. [ أضف للسلة ] — SECONDARY CTA
              3. WhatsApp size inquiry
              ================================================================= */}
          <div className="space-y-3 pt-2">
            {/* Primary CTA: DIRECT ORDER */}
            <button
              onClick={handleDirectOrder}
              disabled={!canAddToCart}
              className={`w-full py-4 sm:py-4.5 px-6 rounded-2xl font-black text-base sm:text-lg flex flex-col items-center justify-center gap-0.5 transition-all duration-200 shadow-xl cursor-pointer active:scale-[0.98] motion-reduce:transition-none ${
                !canAddToCart
                  ? isDark
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/60'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300'
                  : isDark
                  ? 'bg-white text-black hover:bg-neutral-100 shadow-white/10 hover:shadow-white/20'
                  : 'bg-black text-white hover:bg-neutral-900 shadow-black/20 hover:shadow-black/30'
              }`}
            >
              <span className="flex items-center gap-2">
                <Zap className="w-5 h-5 fill-current" />
                <span>
                  {!selectedColor
                    ? t('product.select_color', 'يرجى اختيار اللون')
                    : !selectedSize
                    ? t('product.select_size', 'يرجى تحديد المقاس')
                    : selectedVariant && selectedVariant.stock_quantity <= 0
                    ? t('product.out_of_stock', 'المقاس المختار نفد من المخزون')
                    : t('product.direct_order', 'اطلب الآن')}
                </span>
              </span>

              {canAddToCart && (
                <span className="text-[11px] opacity-80 font-normal">
                  {t(
                    'product.direct_order_sub',
                    'الدفع كاش عند الاستلام • معاينة كاملة للطلب'
                  )}
                </span>
              )}
            </button>

            {/* Secondary CTA: ADD TO CART */}
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 border transition-all duration-200 cursor-pointer active:scale-[0.98] motion-reduce:transition-none ${
                !canAddToCart
                  ? isDark
                    ? 'border-neutral-800/80 bg-neutral-900/30 text-neutral-600 cursor-not-allowed'
                    : 'border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed'
                  : justAdded
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : isDark
                  ? 'bg-neutral-900/80 border-neutral-800 text-neutral-200 hover:bg-neutral-800 hover:text-white hover:border-neutral-700'
                  : 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100 hover:border-neutral-400 shadow-xs'
              }`}
            >
              <ShoppingBag className="w-4 h-4 stroke-[2]" />
              <span>
                {justAdded
                  ? t('product.added_success', 'تمت الإضافة بنجاح! ✓')
                  : t('product.add_to_cart', 'أضف للسلة')}
              </span>
            </button>

            {/* WhatsApp Assistance */}
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="w-full py-2.5 text-center text-xs text-neutral-400 hover:text-emerald-500 flex items-center justify-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>{t('product.whatsapp_help', 'مساعدة في اختيار المقاس عبر WhatsApp')}</span>
            </a>
          </div>

          {/* Trust Highlights */}
          <div
            className={`p-4 rounded-2xl border space-y-3 text-xs transition-colors ${
              isDark
                ? 'bg-[#121216] border-neutral-800/80 text-neutral-300'
                : 'bg-neutral-50 border-neutral-200 text-neutral-700 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>توصيل لجميع المحافظات خلال 2 - 4 أيام عمل</span>
            </div>

            {settings?.inspection_available && (
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-semibold">
                  معاينة مجانية عند الاستلام قبل دفع أي جنيه
                </span>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <RotateCcw className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>
                {settings?.exchange_policy ||
                  'استبدال المقاس متاح خلال 14 يوم'}
              </span>
            </div>
          </div>

          {/* Description & Fabric Specifications */}
          <div
            className={`space-y-4 pt-4 border-t text-xs leading-relaxed ${
              isDark ? 'border-neutral-800' : 'border-neutral-200'
            }`}
          >
            {product.description && (
              <div>
                <h4
                  className={`font-bold mb-1.5 text-sm ${
                    isDark ? 'text-white' : 'text-neutral-900'
                  }`}
                >
                  {t('product.description', 'وصف الموديل والقصة:')}
                </h4>
                <p className="text-neutral-400">{product.description}</p>
              </div>
            )}

            {product.fabric_details && (
              <div>
                <h4
                  className={`font-bold mb-1.5 text-sm ${
                    isDark ? 'text-white' : 'text-neutral-900'
                  }`}
                >
                  {t('product.fabric_details', 'مواصفات الخامة والنسيج:')}
                </h4>
                <p className="text-neutral-400">{product.fabric_details}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews & Comments Section */}
      <section
        className={`mt-12 sm:mt-16 border-t pt-10 ${
          isDark ? 'border-neutral-800' : 'border-neutral-200'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Reviews List */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <div>
                <h2
                  className={`text-xl sm:text-2xl font-black ${
                    isDark ? 'text-white' : 'text-black'
                  }`}
                >
                  {t('product.reviews_tab', 'تقييمات العملاء')}
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  تجارب وآراء العملاء حول هذا المنتج
                </p>
              </div>
            </div>

            {reviewsLoading ? (
              <div className="space-y-3">
                <div
                  className={`h-28 rounded-2xl animate-pulse ${
                    isDark ? 'bg-neutral-900' : 'bg-neutral-100'
                  }`}
                />
                <div
                  className={`h-28 rounded-2xl animate-pulse ${
                    isDark ? 'bg-neutral-900' : 'bg-neutral-100'
                  }`}
                />
              </div>
            ) : reviews.length === 0 ? (
              <div
                className={`rounded-2xl border p-6 text-center ${
                  isDark
                    ? 'border-neutral-800 bg-neutral-900/40'
                    : 'border-neutral-200 bg-white shadow-xs'
                }`}
              >
                <Star className="w-7 h-7 text-neutral-400 mx-auto mb-2" />
                <p
                  className={`text-sm font-bold ${
                    isDark ? 'text-neutral-300' : 'text-neutral-700'
                  }`}
                >
                  لا توجد تقييمات حتى الآن
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  كن أول من يقيّم هذا المنتج.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <article
                    key={review.id}
                    className={`rounded-2xl border p-4 sm:p-5 ${
                      isDark
                        ? 'border-neutral-800 bg-neutral-900/50'
                        : 'border-neutral-200 bg-white shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3
                          className={`text-sm font-bold mb-1 ${
                            isDark ? 'text-white' : 'text-black'
                          }`}
                        >
                          {review.customer_name}
                        </h3>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= Number(review.rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-neutral-300 dark:text-neutral-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-neutral-400 shrink-0">
                        {new Date(review.created_at).toLocaleDateString(
                          isRtl ? 'ar-EG' : 'en-US'
                        )}
                      </span>
                    </div>
                    <p
                      className={`text-sm leading-7 ${
                        isDark ? 'text-neutral-300' : 'text-neutral-700'
                      }`}
                    >
                      {review.review_text}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Review Form */}
          <div className="lg:col-span-5">
            <div
              className={`rounded-2xl border p-5 sm:p-6 ${
                isDark
                  ? 'border-neutral-800 bg-neutral-900/40'
                  : 'border-neutral-200 bg-white shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-5 h-5 text-yellow-400" />
                <h3
                  className={`text-lg font-black ${
                    isDark ? 'text-white' : 'text-black'
                  }`}
                >
                  {t('product.write_review', 'قيّم المنتج')}
                </h3>
              </div>
              <p className="text-xs text-neutral-400 mb-5">
                شاركنا رأيك في المنتج وتجربتك معه.
              </p>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5">
                    تقييمك
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 cursor-pointer transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= reviewRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-neutral-300 dark:text-neutral-700'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5">
                    الاسم
                  </label>
                  <input
                    type="text"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    maxLength={100}
                    placeholder="اكتب اسمك"
                    className={`w-full rounded-xl border text-sm px-4 py-3 outline-none transition-colors ${
                      isDark
                        ? 'bg-neutral-950 border-neutral-800 text-white focus:border-neutral-500'
                        : 'bg-neutral-50 border-neutral-300 text-black focus:border-neutral-700'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5">
                    التقييم
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    maxLength={2000}
                    rows={4}
                    placeholder="اكتب تفاصيل تجربتك..."
                    className={`w-full rounded-xl border text-sm px-4 py-3 outline-none resize-none transition-colors ${
                      isDark
                        ? 'bg-neutral-950 border-neutral-800 text-white focus:border-neutral-500'
                        : 'bg-neutral-50 border-neutral-300 text-black focus:border-neutral-700'
                    }`}
                  />
                </div>

                {reviewMessage && (
                  <div
                    className={`rounded-xl border px-3.5 py-2.5 text-xs ${
                      isDark
                        ? 'bg-neutral-950 border-neutral-800 text-neutral-300'
                        : 'bg-neutral-100 border-neutral-300 text-neutral-700'
                    }`}
                  >
                    {reviewMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className={`w-full rounded-xl py-3.5 px-4 text-sm font-black disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    isDark
                      ? 'bg-white text-black hover:bg-neutral-200'
                      : 'bg-black text-white hover:bg-neutral-800'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {reviewSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
