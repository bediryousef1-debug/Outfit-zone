import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  RotateCcw,
  Truck,
  MessageCircle,
  Star,
  Send,
} from 'lucide-react';
import { Product, ProductVariant, ProductReview, ProductComment } from '../types';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
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
  const { addItem, setIsCartOpen } = useCart();
  const { settings, getWhatsAppUrl } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  // Reviews / Comments
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [comments, setComments] = useState<ProductComment[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);

  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);

  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentMessage, setCommentMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await api.getProductBySlug(slug);
        setProduct(data);

        if (data.variants && data.variants.length > 0) {
          const firstInStock =
            data.variants.find((v) => v.stock_quantity > 0) ||
            data.variants[0];

          setSelectedColor(firstInStock.color);
        }
      } catch (err: any) {
        console.error('Failed to load product detail:', err);
        setError(err.message || 'تعذر تحميل بيانات المنتج');
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [slug]);

  useEffect(() => {
    if (!product?.id) return;

    const loadReviewsAndComments = async () => {
      setReviewsLoading(true);
      setCommentsLoading(true);

      try {
        const [reviewsData, commentsData] = await Promise.all([
          api.getProductReviews(product.id),
          api.getProductComments(product.id),
        ]);

        setReviews(reviewsData || []);
        setComments(commentsData || []);
      } catch (err) {
        console.error('Failed to load reviews/comments:', err);
        setReviews([]);
        setComments([]);
      } finally {
        setReviewsLoading(false);
        setCommentsLoading(false);
      }
    };

    loadReviewsAndComments();
  }, [product?.id]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
          <div className="lg:col-span-7 aspect-[3/4] bg-neutral-900 rounded-2xl" />
          <div className="lg:col-span-5 space-y-4">
            <div className="h-6 w-32 bg-neutral-900 rounded" />
            <div className="h-10 w-full bg-neutral-900 rounded" />
            <div className="h-8 w-48 bg-neutral-900 rounded" />
            <div className="h-32 w-full bg-neutral-900 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white mb-2">
          عفوًا، المنتج غير متوفر
        </h2>

        <p className="text-xs text-neutral-400 mb-6">
          {error || 'لم يتم العثور على هذا الموديل.'}
        </p>

        <button
          onClick={onBack}
          className="py-2.5 px-6 bg-white text-black font-bold text-xs rounded-lg hover:bg-neutral-200 transition-colors"
        >
          العودة للمنتجات
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

  const currentImage = images[selectedImageIndex] || images[0];

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

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;

    return (
      reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
      reviews.length
    );
  }, [reviews]);

  const handleAddToCart = () => {
    if (!selectedVariant || !canAddToCart) return;

    addItem(product, selectedVariant, quantity);
    setJustAdded(true);

    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleDirectOrder = () => {
    if (!selectedVariant || !canAddToCart) return;

    addItem(product, selectedVariant, quantity);
    setIsCartOpen(true);
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
      setReviewMessage('اختر تقييمًا من 1 إلى 5 نجوم.');
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
      setReviewRating(5);
      setReviewText('');
      setReviewMessage(
        'تم إرسال تقييمك بنجاح وسيظهر بعد مراجعته من فريق Outfit Zone.'
      );
    } catch (err: any) {
      console.error('Failed to submit review:', err);

      setReviewMessage(
        err.message || 'تعذر إرسال التقييم. حاول مرة أخرى.'
      );
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
        'تم إرسال تعليقك بنجاح وسيظهر بعد مراجعته من فريق Outfit Zone.'
      );
    } catch (err: any) {
      console.error('Failed to submit comment:', err);

      setCommentMessage(
        err.message || 'تعذر إرسال التعليق. حاول مرة أخرى.'
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

  const whatsappInquiryUrl = getWhatsAppUrl(
    `مرحبًا Outfit Zone، أستفسر عن الموديل: "${product.name}"، هل متوفر بلون "${selectedColor || '...'}" ومقاس "${selectedSize || '...'}"؟`
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 text-right">
      {/* Back button breadcrumb */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors mb-6 group"
      >
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        <span>العودة لجميع المنتجات</span>
      </button>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#141418] border border-neutral-800 shadow-xl">
            <img
              src={resolveImageUrl(currentImage.image_url)}
              alt={product.name}
              className="w-full h-full object-cover object-center"
              fetchPriority="high"
            />

            {hasDiscount && (
              <span className="absolute top-4 right-4 bg-red-950/90 text-red-200 border border-red-800/60 text-xs font-bold px-2.5 py-1 rounded font-mono-numbers">
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

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 h-24 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-white ring-2 ring-white/20'
                      : 'border-neutral-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={resolveImageUrl(img.image_url)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Purchase Module */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {/* Category & Title */}
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-2">
              <span>{product.category?.name || 'ستريت وير'}</span>
              <span>·</span>
              <span>Outfit Zone</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
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

              <span className="text-sm font-bold text-white">
                {averageRating.toFixed(1)}
              </span>

              <span className="text-xs text-neutral-500">
                ({reviews.length} تقييم)
              </span>
            </div>
          )}

          {/* Pricing */}
          <div className="flex items-baseline gap-3 pb-4 border-b border-neutral-800">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono-numbers">
              {formatPrice(product.price)}
            </span>

            {hasDiscount && (
              <span className="text-sm sm:text-base text-neutral-500 line-through font-mono-numbers">
                {formatPrice(product.compare_at_price!)}
              </span>
            )}

            <span className="text-xs text-neutral-400 mr-auto">
              (الدفع عند الاستلام)
            </span>
          </div>

          {/* Variant Selector */}
          <VariantSelector
            variants={variants}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            quantity={quantity}
            onSelectColor={(col) => {
              setSelectedColor(col);
              setSelectedSize('');
            }}
            onSelectSize={(sz) => setSelectedSize(sz)}
            onChangeQuantity={(qty) => setQuantity(qty)}
          />

          {/* Actions */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className={`w-full py-4 px-6 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-lg ${
                !canAddToCart
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                  : justAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-black hover:bg-neutral-200'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />

              <span>
                {justAdded
                  ? 'تمت الإضافة بنجاح! ✓'
                  : !selectedColor
                  ? 'يرجى اختيار اللون'
                  : !selectedSize
                  ? 'يرجى تحديد المقاس'
                  : selectedVariant &&
                    selectedVariant.stock_quantity <= 0
                  ? 'المقاس المختار نفد من المخزون'
                  : 'أضف للطلب (كاش عند الاستلام)'}
              </span>
            </button>

            {canAddToCart && (
              <button
                onClick={handleDirectOrder}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors"
              >
                شراء سريع وإتمام الطلب الآن
              </button>
            )}

            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="w-full py-2.5 text-center text-xs text-neutral-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>مساعدة في اختيار المقاس عبر WhatsApp</span>
            </a>
          </div>

          {/* Trust Highlights */}
          <div className="p-4 rounded-xl bg-[#121216] border border-neutral-800/80 space-y-3 text-xs">
            <div className="flex items-center gap-2.5 text-neutral-300">
              <Truck className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>
                توصيل لجميع المحافظات خلال 2 - 4 أيام عمل (
                {settings?.shipping_fee || 65} جنيه فقط)
              </span>
            </div>

            {settings?.inspection_available && (
              <div className="flex items-center gap-2.5 text-neutral-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-white">
                  معاينة مجانية عند الاستلام قبل دفع أي جنيه
                </span>
              </div>
            )}

            <div className="flex items-center gap-2.5 text-neutral-300">
              <RotateCcw className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>
                {settings?.exchange_policy ||
                  'استبدال المقاس متاح خلال 14 يوم'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4 pt-4 border-t border-neutral-800 text-xs leading-relaxed">
            {product.description && (
              <div>
                <h4 className="font-bold text-white mb-1.5 text-sm">
                  وصف الموديل والقصة:
                </h4>

                <p className="text-neutral-400">{product.description}</p>
              </div>
            )}

            {product.fabric_details && (
              <div>
                <h4 className="font-bold text-white mb-1.5 text-sm">
                  مواصفات الخامة والنسيج:
                </h4>

                <p className="text-neutral-400">
                  {product.fabric_details}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews & Comments */}
      <section className="mt-12 sm:mt-16 border-t border-neutral-800 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Reviews */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  تقييمات العملاء
                </h2>

                <p className="text-xs text-neutral-500 mt-1">
                  آراء العملاء حول هذا الموديل
                </p>
              </div>

              {reviews.length > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />

                  <span className="text-lg font-black text-white">
                    {averageRating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {reviewsLoading ? (
              <div className="space-y-3">
                <div className="h-24 rounded-xl bg-neutral-900 animate-pulse" />
                <div className="h-24 rounded-xl bg-neutral-900 animate-pulse" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 text-center">
                <Star className="w-7 h-7 text-neutral-600 mx-auto mb-2" />

                <p className="text-sm font-bold text-neutral-300">
                  لا توجد تقييمات لهذا المنتج حتى الآن
                </p>

                <p className="text-xs text-neutral-500 mt-1">
                  كن أول من يشارك تجربته.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {review.customer_name}
                        </h3>

                        <div className="flex items-center gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-neutral-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <span className="text-[10px] text-neutral-600">
                        {new Date(review.created_at).toLocaleDateString(
                          'ar-EG'
                        )}
                      </span>
                    </div>

                    <p className="text-sm text-neutral-300 leading-7 mt-3">
                      {review.review_text}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Review Form */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 sm:p-6">
              <h3 className="text-lg font-black text-white mb-1">
                قيّم المنتج
              </h3>

              <p className="text-xs text-neutral-500 mb-5">
                شاركنا رأيك في الموديل بعد تجربته.
              </p>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-2">
                    الاسم
                  </label>

                  <input
                    type="text"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    maxLength={100}
                    placeholder="اكتب اسمك"
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm px-4 py-3 outline-none focus:border-neutral-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-2">
                    التقييم
                  </label>

                  <div className="flex items-center gap-1" dir="ltr">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        aria-label={`${star} نجوم`}
                        className="p-1"
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            star <= reviewRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-neutral-700 hover:text-neutral-500'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-2">
                    تقييمك
                  </label>

                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    maxLength={2000}
                    rows={4}
                    placeholder="اكتب تجربتك مع المنتج..."
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm px-4 py-3 outline-none resize-none focus:border-neutral-500 transition-colors"
                  />
                </div>

                {reviewMessage && (
                  <div className="rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2.5 text-xs text-neutral-300">
                    {reviewMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="w-full rounded-xl bg-white text-black py-3.5 px-4 text-sm font-black hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {reviewSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-12 pt-10 border-t border-neutral-800">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 mb-6">
              <MessageCircle className="w-5 h-5 text-neutral-400" />

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  التعليقات
                </h2>

                <p className="text-xs text-neutral-500 mt-1">
                  أسئلة وآراء العملاء حول المنتج
                </p>
              </div>
            </div>

            {commentsLoading ? (
              <div className="space-y-3">
                <div className="h-20 rounded-xl bg-neutral-900 animate-pulse" />
                <div className="h-20 rounded-xl bg-neutral-900 animate-pulse" />
              </div>
            ) : comments.length === 0 ? (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 text-center">
                <MessageCircle className="w-7 h-7 text-neutral-600 mx-auto mb-2" />

                <p className="text-sm font-bold text-neutral-300">
                  لا توجد تعليقات حتى الآن
                </p>

                <p className="text-xs text-neutral-500 mt-1">
                  اكتب أول تعليق على هذا المنتج.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <article
                    key={comment.id}
                    className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 sm:p-5"
                  >
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <h3 className="text-sm font-bold text-white">
                        {comment.customer_name}
                      </h3>

                      <span className="text-[10px] text-neutral-600">
                        {new Date(comment.created_at).toLocaleDateString(
                          'ar-EG'
                        )}
                      </span>
                    </div>

                    <p className="text-sm text-neutral-300 leading-7">
                      {comment.comment}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Comment Form */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 sm:p-6">
              <h3 className="text-lg font-black text-white mb-1">
                اترك تعليقًا
              </h3>

              <p className="text-xs text-neutral-500 mb-5">
                اكتب تعليقك أو سؤالك عن المنتج.
              </p>

              <form onSubmit={handleSubmitComment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-2">
                    الاسم
                  </label>

                  <input
                    type="text"
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                    maxLength={100}
                    placeholder="اكتب اسمك"
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm px-4 py-3 outline-none focus:border-neutral-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-2">
                    التعليق
                  </label>

                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    maxLength={2000}
                    rows={4}
                    placeholder="اكتب تعليقك..."
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm px-4 py-3 outline-none resize-none focus:border-neutral-500 transition-colors"
                  />
                </div>

                {commentMessage && (
                  <div className="rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2.5 text-xs text-neutral-300">
                    {commentMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={commentSubmitting}
                  className="w-full rounded-xl bg-white text-black py-3.5 px-4 text-sm font-black hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {commentSubmitting ? 'جاري الإرسال...' : 'إرسال التعليق'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Mobile Buy Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0e0e12]/95 backdrop-blur-md border-t border-neutral-800 p-3 flex items-center justify-between gap-3 shadow-2xl">
        <div className="text-right">
          <span className="text-[11px] text-neutral-400 block">
            الإجمالي
          </span>

          <span className="text-sm font-bold text-white font-mono-numbers">
            {formatPrice(product.price * quantity)}
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          className={`py-3 px-5 rounded-lg text-xs font-bold flex items-center gap-2 ${
            !canAddToCart
              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              : 'bg-white text-black hover:bg-neutral-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />

          <span>{!selectedSize ? 'حدد المقاس' : 'أضف للطلب'}</span>
        </button>
      </div>
    </div>
  );
};