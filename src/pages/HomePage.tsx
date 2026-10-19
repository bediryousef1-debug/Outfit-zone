import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  Percent,
  Headphones,
  RotateCcw,
  AlertCircle,
  Star,
  Send,
  X,
} from 'lucide-react';
import { Product, ProductReview, HeroSlide } from '../types';
import { api } from '../services/api';
import { ProductCard } from '../components/product/ProductCard';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { resolveImageUrl } from '../utils/imageHelper';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onSelectProduct: (slug: string) => void;
}

interface HomepageReview extends ProductReview {
  product?: {
    id: string;
    name: string;
    slug: string;
  };
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onSelectProduct,
}) => {
  const { categories, content, heroSlides, isLoading: storeLoading } = useStore();
  const { isDark } = useTheme();
  const { isRtl, t, language } = useLanguage();

  const isRTL = isRtl;

  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<HomepageReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  /*
   * ==========================================================================
   * HERO SWIPE / DRAG
   * ==========================================================================
   */

  const heroPointerStartX = useRef<number | null>(null);
  const heroPointerStartY = useRef<number | null>(null);
  const heroPointerId = useRef<number | null>(null);
  const heroSwipeDetected = useRef(false);

  const SWIPE_THRESHOLD = 50;

  /*
   * ==========================================================================
   * REVIEW FORM
   * ==========================================================================
   */

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const currentSlides = storeLoading
    ? []
    : heroSlides
        .filter((slide) => slide.is_active !== false)
        .sort((a, b) => a.sort_order - b.sort_order);

  const currentSlide = currentSlides[activeSlide] || currentSlides[0];

  /*
   * ==========================================================================
   * LOCALIZED HERO CONTENT
   * ==========================================================================
   */

  const localizedTag =
    currentSlide
      ? !isRTL && currentSlide.tag_en
        ? currentSlide.tag_en
        : currentSlide.tag_ar
      : '';

  const localizedTitleLine1 =
    currentSlide
      ? !isRTL && currentSlide.title_line1_en
        ? currentSlide.title_line1_en
        : currentSlide.title_line1_ar
      : '';

  const localizedTitleLine2 =
    currentSlide
      ? !isRTL && currentSlide.title_line2_en
        ? currentSlide.title_line2_en
        : currentSlide.title_line2_ar
      : '';

  const localizedSubtitle =
    currentSlide
      ? !isRTL && currentSlide.subtitle_en
        ? currentSlide.subtitle_en
        : currentSlide.subtitle_ar
      : '';

  const localizedDescription =
    currentSlide
      ? !isRTL && currentSlide.description_en
        ? currentSlide.description_en
        : currentSlide.description_ar
      : '';

  const localizedCta =
    currentSlide
      ? !isRTL && currentSlide.button_text_en
        ? currentSlide.button_text_en
        : currentSlide.button_text_ar
      : '';

  const localizedBadgeTop =
    currentSlide
      ? !isRTL && currentSlide.badge_top_en
        ? currentSlide.badge_top_en
        : currentSlide.badge_top_ar
      : '';

  const localizedBadgeBottom =
    currentSlide
      ? !isRTL && currentSlide.badge_bottom_en
        ? currentSlide.badge_bottom_en
        : currentSlide.badge_bottom_ar
      : '';

  /*
   * ==========================================================================
   * HERO NAVIGATION
   * ==========================================================================
   */

  const nextSlide = () => {
    if (currentSlides.length <= 1) return;

    setActiveSlide((prev) => (prev + 1) % currentSlides.length);
  };

  const prevSlide = () => {
    if (currentSlides.length <= 1) return;

    setActiveSlide(
      (prev) => (prev - 1 + currentSlides.length) % currentSlides.length
    );
  };

  /*
   * ==========================================================================
   * HERO POINTER SWIPE / MOUSE DRAG
   * ==========================================================================
   */

  const handleHeroPointerDown = (
    event: React.PointerEvent<HTMLElement>
  ) => {
    if (currentSlides.length <= 1) return;

    // Do not start swipe/drag tracking when clicking
    // an interactive element such as slider buttons or links.
    const target = event.target as HTMLElement;

    if (target.closest('button, a, input, textarea, select')) {
      heroSwipeDetected.current = false;
      return;
    }

    heroPointerStartX.current = event.clientX;
    heroPointerStartY.current = event.clientY;
    heroPointerId.current = event.pointerId;
    heroSwipeDetected.current = false;

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Ignore unsupported pointer-capture errors.
    }
  };

  const handleHeroPointerMove = (
    event: React.PointerEvent<HTMLElement>
  ) => {
    if (
      heroPointerStartX.current === null ||
      heroPointerStartY.current === null ||
      heroPointerId.current !== event.pointerId
    ) {
      return;
    }

    const deltaX = event.clientX - heroPointerStartX.current;
    const deltaY = event.clientY - heroPointerStartY.current;

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }

    if (Math.abs(deltaX) >= SWIPE_THRESHOLD) {
      heroSwipeDetected.current = true;

      if (deltaX < 0) {
        nextSlide();
      } else {
        prevSlide();
      }

      heroPointerStartX.current = null;
      heroPointerStartY.current = null;
    }
  };

  const handleHeroPointerUp = (
    event: React.PointerEvent<HTMLElement>
  ) => {
    if (heroPointerId.current === event.pointerId) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore pointer-capture errors.
      }
    }

    heroPointerStartX.current = null;
    heroPointerStartY.current = null;
    heroPointerId.current = null;
  };

  const handleHeroClickCapture = (
    event: React.MouseEvent<HTMLElement>
  ) => {
    if (heroSwipeDetected.current) {
      event.preventDefault();
      event.stopPropagation();
      heroSwipeDetected.current = false;
    }
  };

  /*
   * ==========================================================================
   * HERO AUTOPLAY
   * ==========================================================================
   */

  useEffect(() => {
    if (isPaused || currentSlides.length <= 1) return;

    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % currentSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, currentSlides.length]);

  /*
   * ==========================================================================
   * KEEP ACTIVE SLIDE VALID
   * ==========================================================================
   */

  useEffect(() => {
    if (activeSlide >= currentSlides.length) {
      setActiveSlide(0);
    }
  }, [activeSlide, currentSlides.length]);

  /*
   * ==========================================================================
   * LOAD PRODUCTS
   * ==========================================================================
   */

  const loadProducts = async () => {
    setIsLoading(true);
    setReviewsLoading(true);
    setError(null);

    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err: any) {
      console.error('Error fetching homepage products:', err);
      setError(
        err.message ||
          t(
            'home.error_products',
            'Unable to load products right now.'
          )
      );
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  /*
   * ==========================================================================
   * LOAD PUBLIC HOMEPAGE REVIEWS
   * ==========================================================================
   */

  const loadReviews = async () => {
    setReviewsLoading(true);

    try {
      const publicReviews = await api.getPublicReviews();

      const productMap = new Map(
        products.map((product) => [
          product.id,
          {
            id: product.id,
            name: product.name,
            slug: product.slug,
          },
        ])
      );

      const homepageReviews: HomepageReview[] = publicReviews
        .map((review) => ({
          ...review,
          product: review.product_id
            ? productMap.get(review.product_id)
            : undefined,
        }))
        .slice(0, 6);

      setReviews(homepageReviews);
    } catch (err) {
      console.error('Error fetching homepage reviews:', err);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      loadReviews();
    }
  }, [isLoading, products]);

  const featuredProducts = products.some((p) => p.is_featured)
    ? products.filter((p) => p.is_featured).slice(0, 8)
    : products.slice(0, 8);

  /*
   * ==========================================================================
   * REAL CATEGORIES
   * ==========================================================================
   */

  const activeCategories = (categories || []).filter(
    (category) => category.is_active !== false
  );

  /*
   * ==========================================================================
   * TRUST FEATURES
   * ==========================================================================
   */

  const trustFeatures = [
    {
      id: 'cod',
      title: t('home.trust.cod_title', 'Cash on Delivery'),
      subtitle: t('home.trust.cod_subtitle', 'Cash'),
      icon: ShieldCheck,
    },
    {
      id: 'shipping',
      title: t('home.trust.shipping_title', 'Fast Shipping'),
      subtitle: t(
        'home.trust.shipping_subtitle',
        'Across All Governorates'
      ),
      icon: Truck,
    },
    {
      id: 'discounts',
      title: t('home.trust.discounts_title', 'Exclusive Discounts'),
      subtitle: t('home.trust.discounts_subtitle', 'Limited Time'),
      icon: Percent,
    },
    {
      id: 'support',
      title: t('home.trust.support_title', 'Customer Support'),
      subtitle: t('home.trust.support_subtitle', 'Around the Clock'),
      icon: Headphones,
    },
  ];

  /*
   * ==========================================================================
   * CATEGORY NAVIGATION
   * ==========================================================================
   */

  const handleCategoryNavigate = (categoryId: string) => {
    onNavigate(
      `/products?category=${encodeURIComponent(categoryId)}`
    );
  };

  /*
   * ==========================================================================
   * REVIEW NAVIGATION
   * ==========================================================================
   */

  const handleReviewProduct = (slug?: string) => {
    if (!slug) return;

    onSelectProduct(slug);
  };

  /*
   * ==========================================================================
   * REVIEW FORM
   * ==========================================================================
   */

  const openReviewForm = () => {
    setReviewMessage(null);
    setReviewError(null);
    setShowReviewForm(true);
  };

  const closeReviewForm = () => {
    if (reviewSubmitting) return;

    setShowReviewForm(false);
    setReviewError(null);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    setReviewMessage(null);
    setReviewError(null);

    const cleanName = reviewName.trim();
    const cleanText = reviewText.trim();

    if (!cleanName) {
      setReviewError(
        t('home.review_name_required', 'Please enter your name.')
      );
      return;
    }

    if (cleanName.length < 2) {
      setReviewError(
        t(
          'home.review_name_short',
          'Name must be at least 2 characters.'
        )
      );
      return;
    }

    if (!cleanText) {
      setReviewError(
        t(
          'home.review_text_required',
          'Please enter your review.'
        )
      );
      return;
    }

    if (cleanText.length < 5) {
      setReviewError(
        t(
          'home.review_text_short',
          'Your review must be at least 5 characters.'
        )
      );
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError(
        t(
          'home.review_rating_required',
          'Please select a rating from 1 to 5 stars.'
        )
      );
      return;
    }

    setReviewSubmitting(true);

    try {
      const result = await api.createProductReview({
        product_id: null,
        customer_name: cleanName,
        rating: reviewRating,
        review_text: cleanText,
      });

      if (!result.success) {
        throw new Error(
          t(
            'home.error_review',
            'Unable to submit your review right now.'
          )
        );
      }

      setReviewName('');
      setReviewRating(5);
      setReviewText('');
      setShowReviewForm(false);

      setReviewMessage(
        t(
          'home.review_success',
          'Thank you for your review ❤️ It will be reviewed and approved before appearing on the website.'
        )
      );
    } catch (err: any) {
      console.error('Error submitting homepage review:', err);

      setReviewError(
        err.message ||
          t(
            'home.error_review',
            'Unable to submit your review right now.'
          )
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  /*
   * ==========================================================================
   * HERO DIRECTION
   * ==========================================================================
   */

  const PreviousArrow = ChevronRight;
  const NextArrow = ChevronLeft;

  return (
    <div className="space-y-12 sm:space-y-16 w-full max-w-full overflow-x-hidden">
      {/* =====================================================================
          1. HERO SECTION & SLIDER
          ===================================================================== */}

      {currentSlide && (
      <section
        className={`relative overflow-hidden transition-colors ${
          isDark
            ? 'bg-gradient-to-b from-[#111115] via-[#09090b] to-[#000000]'
            : 'bg-gradient-to-b from-[#f3f4f6] via-[#f9fafb] to-[#ffffff]'
        }`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        onPointerDown={handleHeroPointerDown}
        onPointerMove={handleHeroPointerMove}
        onPointerUp={handleHeroPointerUp}
        onPointerCancel={handleHeroPointerUp}
        onClickCapture={handleHeroClickCapture}
        style={{
          touchAction: 'pan-y',
          cursor:
            currentSlides.length > 1
              ? heroPointerId.current !== null
                ? 'grabbing'
                : 'grab'
              : 'default',
        }}
        aria-roledescription="carousel"
        aria-label={
          isRTL
            ? 'عروض وتشكيلات Outfit Zone'
            : 'Outfit Zone offers and collections'
        }
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-6 text-right order-2 lg:order-1 transition-all duration-300 oz-hero-copy">
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold tracking-widest uppercase text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-[1px] bg-neutral-500" />

                  <span className="font-mono tracking-wider">
                    {localizedTag}
                  </span>
                </div>

                <div className="font-mono text-xs opacity-75">
                  0{activeSlide + 1} / 0{currentSlides.length}
                </div>
              </div>

              <div className="space-y-1 min-h-[140px] sm:min-h-[180px] flex flex-col justify-center">
                <h1 className="font-syne text-[30px] xs:text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-[0.95] break-words hyphens-auto">
                  <span
                    className={`block transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-black'
                    }`}
                  >
                    {localizedTitleLine1}
                  </span>

                  <span
                    className={`block transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-black'
                    }`}
                  >
                    {localizedTitleLine2}
                  </span>
                </h1>

                <h2
                  className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold pt-2 transition-colors duration-300 ${
                    isDark ? 'text-neutral-100' : 'text-neutral-900'
                  }`}
                >
                  {localizedSubtitle}
                </h2>
              </div>

              <p
                className={`text-sm sm:text-base leading-relaxed max-w-md min-h-[48px] transition-colors duration-300 ${
                  isDark ? 'text-neutral-300' : 'text-neutral-600'
                }`}
              >
                {localizedDescription}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onNavigate(currentSlide.button_link)}
                  className={`oz-btn-press py-3.5 px-8 rounded-full font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-3 shadow-lg cursor-pointer ${
                    isDark
                      ? 'bg-white text-black hover:bg-neutral-200 shadow-white/10'
                      : 'bg-black text-white hover:bg-neutral-800 shadow-black/20'
                  }`}
                >
                  <span>{localizedCta}</span>
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-neutral-200/40 dark:border-neutral-800/60 max-w-md">
                <div
                  className="flex items-center gap-2"
                  role="tablist"
                  aria-label={isRTL ? 'شرائح السلايدر' : 'Slider slides'}
                >
                  {currentSlides.map((slide, idx) => {
                    const isActive = activeSlide === idx;

                    const slideTitle =
                      !isRTL && slide.title_line1_en
                        ? slide.title_line1_en
                        : slide.title_line1_ar;

                    return (
                      <button
                        key={slide.id}
                        onClick={() => setActiveSlide(idx)}
                        role="tab"
                        aria-selected={isActive}
                        aria-label={
                          isRTL
                            ? `الشريحة ${idx + 1}: ${slideTitle}`
                            : `Slide ${idx + 1}: ${slideTitle}`
                        }
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          isActive
                            ? `w-8 ${
                                isDark
                                  ? 'bg-white shadow-sm shadow-white/30'
                                  : 'bg-black shadow-sm shadow-black/30'
                              }`
                            : `w-3 hover:w-5 ${
                                isDark
                                  ? 'bg-neutral-700 hover:bg-neutral-500'
                                  : 'bg-neutral-300 hover:bg-neutral-500'
                              }`
                        }`}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={prevSlide}
                    aria-label={
                      isRTL ? 'الشريحة السابقة' : 'Previous slide'
                    }
                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200 cursor-pointer ${
                      isDark
                        ? 'border-neutral-800 bg-neutral-900/80 text-white hover:bg-white hover:text-black hover:border-white'
                        : 'border-neutral-300 bg-white text-black hover:bg-black hover:text-white hover:border-black shadow-xs'
                    }`}
                  >
                    <PreviousArrow className="w-4 h-4" />
                  </button>

                  <button
                    onClick={nextSlide}
                    aria-label={
                      isRTL ? 'الشريحة التالية' : 'Next slide'
                    }
                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200 cursor-pointer ${
                      isDark
                        ? 'border-neutral-800 bg-neutral-900/80 text-white hover:bg-white hover:text-black hover:border-white'
                        : 'border-neutral-300 bg-white text-black hover:bg-black hover:text-white hover:border-black shadow-xs'
                    }`}
                  >
                    <NextArrow className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 relative order-1 lg:order-2 oz-hero-visual">
              <div
                onClick={() => onNavigate(currentSlide.button_link)}
                className={`group relative aspect-[4/5] sm:aspect-[4/4.5] rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 border cursor-pointer ${
                  isDark
                    ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                    : 'bg-neutral-100 border-neutral-200 hover:border-neutral-300'
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onNavigate(currentSlide.button_link);
                  }
                }}
                aria-label={
                  isRTL
                    ? `عرض ${localizedSubtitle}`
                    : `View ${localizedSubtitle}`
                }
              >
                <img
                  key={currentSlide.image_url}
                  src={resolveImageUrl(currentSlide.image_url)}
                  alt={localizedSubtitle}
                  onError={(event) => {
                    const image = event.currentTarget;
                    if (image.dataset.fallbackApplied !== 'true') {
                      image.dataset.fallbackApplied = 'true';
                      image.src = resolveImageUrl('/images/hero_streetwear_editorial_1790342899745.jpg');
                    }
                  }}
                  className="w-full h-full object-cover object-top sm:object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  fetchPriority="high"
                  draggable={false}
                />

                <div
                  className={`absolute inset-0 pointer-events-none ${
                    isDark
                      ? 'bg-gradient-to-t from-black/70 via-black/10 to-transparent'
                      : 'bg-gradient-to-t from-black/40 via-transparent to-transparent'
                  }`}
                />

                <div className="absolute top-6 left-6 pointer-events-none select-none opacity-85 rotate-[-8deg] transition-all duration-500">
                  <span className="font-serif italic text-lg sm:text-2xl text-white/90 drop-shadow-md">
                    {localizedBadgeTop}
                  </span>
                </div>

                <div className="absolute bottom-6 right-6 pointer-events-none select-none text-right transition-all duration-500">
                  <span className="text-[10px] sm:text-xs uppercase font-mono tracking-widest text-white/90 block drop-shadow-sm">
                    {localizedBadgeBottom}
                  </span>

                  <div className="w-8 h-0.5 bg-white/80 mt-1 mr-auto" />
                </div>

                <div className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white border border-white/20">
                    {isRTL ? 'استكشف الموديل' : 'Explore'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* =====================================================================
          2. TRUST FEATURES
          ===================================================================== */}

      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div
          className={`rounded-2xl p-6 sm:p-8 border grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-4 text-center divide-y md:divide-y-0 md:divide-x md:divide-x-reverse transition-colors ${
            isDark
              ? 'bg-[#111115] border-neutral-800 divide-neutral-800/80 text-white'
              : 'bg-white border-neutral-200 divide-neutral-200 text-black shadow-sm'
          }`}
        >
          {trustFeatures.map((feat) => {
            const Icon = feat.icon;

            return (
              <div
                key={feat.id}
                className="flex flex-col items-center justify-center pt-4 md:pt-0 first:pt-0 px-2"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
                    isDark
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-black'
                  }`}
                >
                  <Icon className="w-6 h-6 stroke-[1.5]" />
                </div>

                <h4 className="text-sm sm:text-base font-bold mb-0.5">
                  {feat.title}
                </h4>

                <p className="text-xs text-neutral-400 font-medium">
                  {feat.subtitle}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          3. REAL CATEGORIES
          ===================================================================== */}

      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center my-6">
          <div className="inline-flex items-center gap-3 text-lg sm:text-2xl font-black tracking-tight">
            <span className="w-8 sm:w-12 h-[2px] bg-neutral-400 dark:bg-neutral-600" />
            <h2 className={isDark ? 'text-white' : 'text-black'}>
              {t('home.categories_title', 'Shop by Category')}
            </h2>
            <span className="w-8 sm:w-12 h-[2px] bg-neutral-400 dark:bg-neutral-600" />
          </div>
          <p className="mt-3 text-sm text-neutral-500">
            {language === 'en'
              ? 'Explore the fits and styles that match your everyday look.'
              : 'اكتشف القصّات والستايلات اللي تناسب إطلالتك اليومية.'}
          </p>
        </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {activeCategories.map((cat) => {
              const categoryImage = cat.image_url
                ? resolveImageUrl(cat.image_url)
                : null;

              const localizedCategoryName =
                language === 'en'
                  ? cat.name_en || cat.name
                  : cat.name;

              return (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryNavigate(cat.id)}
                  className={`group cursor-pointer oz-card-hover rounded-2xl overflow-hidden border flex flex-col ${
                    isDark
                      ? 'bg-[#121216] border-neutral-800 hover:border-neutral-600 shadow-md'
                      : 'bg-white border-neutral-200 hover:border-neutral-400 hover:shadow-lg'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCategoryNavigate(cat.id);
                    }
                  }}
                  aria-label={`${t(
                    'home.browse_category',
                    'Browse category'
                  )} ${localizedCategoryName}`}
                >
                  <div className="relative aspect-[4/4.5] sm:aspect-[4/5] w-full overflow-hidden bg-neutral-900/10">
                    {categoryImage ? (
                      <img
                        src={categoryImage}
                        alt={localizedCategoryName}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex flex-col items-center justify-center ${
                          isDark
                            ? 'bg-neutral-900 text-neutral-500'
                            : 'bg-neutral-100 text-neutral-400'
                        }`}
                      >
                        <span className="text-3xl font-black opacity-20">
                          OZ
                        </span>

                        <span className="text-xs mt-2">
                          {t('home.no_image', 'No image')}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  <div className="p-3.5 sm:p-4 flex items-center justify-between">
                    <div className="text-right min-w-0">
                      <h3
                        className={`text-sm sm:text-base font-bold transition-colors truncate ${
                          isDark
                            ? 'text-white group-hover:text-neutral-200'
                            : 'text-black group-hover:text-neutral-800'
                        }`}
                      >
                        {localizedCategoryName}
                      </h3>

                      <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase block mt-0.5">
                        {cat.slug}
                      </span>
                    </div>

                    <div
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:-translate-x-1 ${
                        isDark
                          ? 'bg-neutral-800 text-white group-hover:bg-white group-hover:text-black'
                          : 'bg-neutral-200 text-black group-hover:bg-black group-hover:text-white'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
      </section>

      {/* =====================================================================
          4. EDITORIAL PROMO BANNER
          ===================================================================== */}

      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div
          className={`relative rounded-3xl overflow-hidden border p-6 sm:p-10 lg:p-12 transition-colors ${
            isDark
              ? 'bg-[#111115] border-neutral-800 text-white'
              : 'bg-neutral-900 border-neutral-800 text-white'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7 space-y-4 text-right z-10">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-neutral-400">
                <span className="w-8 h-[1px] bg-neutral-500" />
                <span>OUTFIT ZONE</span>
              </div>

              <div className="space-y-1">
                <p className="text-sm sm:text-base text-neutral-300 font-medium">
                  {language === 'en'
                    ? content?.editorial_subtitle_en ||
                      '...More Than Just Clothes'
                    : content?.editorial_subtitle_ar ||
                      '...أكثر من مجرد ملابس'}
                </p>

                <h3 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                  {language === 'en'
                    ? content?.editorial_title_en ||
                      'It is a Presence'
                    : content?.editorial_title_ar ||
                      'إنه حضور'}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-neutral-400 max-w-md leading-relaxed">
                {language === 'en'
                  ? content?.editorial_description_en ||
                    'Designs that reflect your modern taste, with refined details and premium cotton fabrics made for every moment of your day.'
                  : content?.editorial_description_ar ||
                    'تصاميم تعكس ذوقك العصري، بتفاصيل راقية وخامات قطنية فاخرة تناسب كل لحظة في يومك.'}
              </p>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate('/about')}
                  className="oz-btn-press py-3 px-7 rounded-full bg-white text-black font-extrabold text-xs sm:text-sm transition-all hover:bg-neutral-200 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>
                    {language === 'en'
                      ? content?.editorial_button_text_en ||
                        'Discover More'
                      : content?.editorial_button_text_ar ||
                        'اكتشف المزيد'}
                  </span>

                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="md:col-span-5 relative flex justify-center md:justify-end">
              <div className="relative w-full max-w-sm aspect-[4/3] rounded-2xl overflow-hidden border border-neutral-800 shadow-xl bg-black">
                <img
                  src={resolveImageUrl(
                    content?.editorial_image_url ||
                      '/images/hero_streetwear_editorial_1790342899745.jpg'
                  )}
                  alt={
                    language === 'en'
                      ? content?.editorial_title_en ||
                        'Streetwear Detail'
                      : content?.editorial_title_ar ||
                        'تفاصيل ستايل'
                  }
                  className="w-full h-full object-cover object-bottom opacity-80"
                  loading="lazy"
                />

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] bg-black/95 text-white border-2 border-neutral-700/80 px-4 py-2 rounded shadow-2xl font-syne font-black tracking-[0.2em] text-sm text-center">
                  <div>OUTFIT</div>
                  <div>ZONE</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product grid appears once real products are active. */}

        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div className="text-right">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                {t('home.latest_collection', 'Latest Collection')}
              </span>
  
              <h2
                className={`text-xl sm:text-2xl font-black ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                {t(
                  'home.most_requested',
                  'Most Requested Styles'
                )}
              </h2>
            </div>
  
            <button
              onClick={() => onNavigate('/products')}
              className="text-xs font-bold text-neutral-400 hover:text-black dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>
                {t(
                  'home.view_all_products',
                  'View All Products'
                )}
              </span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
  
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-[3/4] bg-neutral-900/10 dark:bg-neutral-900/40 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 rounded-2xl border text-center space-y-3 bg-neutral-900/10 border-neutral-200 dark:bg-neutral-900/40 dark:border-neutral-800">
              <AlertCircle className="w-8 h-8 text-neutral-400 mx-auto" />
  
              <p className="text-sm text-neutral-400">{error}</p>
  
              <button
                onClick={loadProducts}
                className="inline-flex items-center gap-2 py-2 px-5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
  
                <span>{t('home.retry', 'Try Again')}</span>
              </button>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div
              className={`p-8 rounded-2xl border text-center ${
                isDark
                  ? 'bg-neutral-900/40 border-neutral-800 text-neutral-400'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-500'
              }`}
            >
              {t(
                'home.no_products',
                'No products available right now.'
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={(slug) => onSelectProduct(slug)}
                />
              ))}
            </div>
          )}
        </section>

      {/* Reviews appear after real customer reviews are approved. */}

        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-8">
            <div className="text-right">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                {t('home.reviews_title', 'Customer Reviews')}
              </span>
  
              <h2
                className={`text-xl sm:text-2xl font-black ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                {t(
                  'home.reviews_subtitle',
                  'Real Experiences from Our Customers'
                )}
              </h2>
            </div>
  
            {!showReviewForm && (
              <button
                type="button"
                onClick={openReviewForm}
                className={`oz-btn-press inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full font-bold text-sm cursor-pointer ${
                  isDark
                    ? 'bg-white text-black hover:bg-neutral-200 shadow-white/10'
                    : 'bg-black text-white hover:bg-neutral-800 shadow-black/20'
                }`}
              >
                <Star className="w-4 h-4" />
                <span>
                  {t(
                    'home.share_review',
                    'Share Your Review'
                  )}
                </span>
              </button>
            )}
          </div>
  
          {reviewMessage && (
            <div
              className={`mb-6 rounded-2xl border p-4 text-sm text-right ${
                isDark
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-200'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-700'
              }`}
            >
              {reviewMessage}
            </div>
          )}
  
          {showReviewForm && (
            <div
              className={`mb-8 rounded-3xl border p-5 sm:p-7 ${
                isDark
                  ? 'bg-[#111115] border-neutral-800'
                  : 'bg-white border-neutral-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="text-right">
                  <h3
                    className={`text-lg font-black ${
                      isDark ? 'text-white' : 'text-black'
                    }`}
                  >
                    {t(
                      'home.review_form_title',
                      'Share Your Experience'
                    )}
                  </h3>
  
                  <p className="text-xs text-neutral-400 mt-1">
                    {t(
                      'home.review_form_desc',
                      'Your feedback matters and helps our customers know what to expect.'
                    )}
                  </p>
                </div>
  
                <button
                  type="button"
                  onClick={closeReviewForm}
                  disabled={reviewSubmitting}
                  aria-label={t(
                    'home.close_review',
                    'Close review form'
                  )}
                  className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
                    isDark
                      ? 'border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                      : 'border-neutral-200 text-neutral-500 hover:bg-neutral-100'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
  
              <form
                onSubmit={handleSubmitReview}
                className="space-y-5"
                dir="rtl"
              >
                <div>
                  <label
                    className={`block text-sm font-bold mb-2 ${
                      isDark ? 'text-white' : 'text-black'
                    }`}
                  >
                    {t('home.name', 'Name')}
                  </label>
  
                  <input
                    type="text"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder={t(
                      'home.name_placeholder',
                      'Enter your name'
                    )}
                    maxLength={100}
                    disabled={reviewSubmitting}
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${
                      isDark
                        ? 'bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-neutral-500'
                        : 'bg-white border-neutral-200 text-black placeholder:text-neutral-400 focus:border-neutral-500'
                    }`}
                  />
                </div>
  
                <div>
                  <label
                    className={`block text-sm font-bold mb-3 ${
                      isDark ? 'text-white' : 'text-black'
                    }`}
                  >
                    {t('home.rating', 'Your Rating')}
                  </label>
  
                  <div className="flex items-center gap-1" dir="ltr">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const selected = star <= reviewRating;
  
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          disabled={reviewSubmitting}
                          aria-label={t(
                            'home.rating_aria',
                            'Rating {star} out of 5'
                          ).replace('{star}', String(star))}
                          className="p-1 cursor-pointer transition-transform hover:scale-110 disabled:cursor-not-allowed"
                        >
                          <Star
                            className={`w-7 h-7 transition-colors ${
                              selected
                                ? 'fill-yellow-400 text-yellow-400'
                                : isDark
                                  ? 'text-neutral-700'
                                  : 'text-neutral-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
  
                <div>
                  <label
                    className={`block text-sm font-bold mb-2 ${
                      isDark ? 'text-white' : 'text-black'
                    }`}
                  >
                    {t('home.review', 'Your Review')}
                  </label>
  
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder={t(
                      'home.review_placeholder',
                      'Share your experience with Outfit Zone...'
                    )}
                    maxLength={1000}
                    rows={5}
                    disabled={reviewSubmitting}
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none resize-none transition-colors ${
                      isDark
                        ? 'bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-neutral-500'
                        : 'bg-white border-neutral-200 text-black placeholder:text-neutral-400 focus:border-neutral-500'
                    }`}
                  />
  
                  <div className="text-[10px] text-neutral-400 mt-1 text-left">
                    {reviewText.length}/1000
                  </div>
                </div>
  
                {reviewError && (
                  <div
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      isDark
                        ? 'bg-red-950/20 border-red-900/50 text-red-300'
                        : 'bg-red-50 border-red-200 text-red-600'
                    }`}
                  >
                    {reviewError}
                  </div>
                )}
  
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button
                    type="button"
                    onClick={closeReviewForm}
                    disabled={reviewSubmitting}
                    className={`py-3 px-6 rounded-xl border font-bold text-sm transition-colors cursor-pointer ${
                      isDark
                        ? 'border-neutral-800 text-neutral-300 hover:bg-neutral-900'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {t('home.cancel', 'Cancel')}
                  </button>
  
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className={`py-3 px-7 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                      isDark
                        ? 'bg-white text-black hover:bg-neutral-200'
                        : 'bg-black text-white hover:bg-neutral-800'
                    }`}
                  >
                    <Send className="w-4 h-4" />
  
                    <span>
                      {reviewSubmitting
                        ? t('home.submitting', 'Submitting...')
                        : t(
                            'home.submit_review',
                            'Submit Review'
                          )}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}
  
          {reviewsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-44 rounded-2xl animate-pulse ${
                    isDark ? 'bg-neutral-900/60' : 'bg-neutral-100'
                  }`}
                />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div
              className={`rounded-2xl border p-8 text-center ${
                isDark
                  ? 'bg-[#111115] border-neutral-800 text-neutral-400'
                  : 'bg-white border-neutral-200 text-neutral-500'
              }`}
            >
              <Star className="w-8 h-8 mx-auto mb-4 text-neutral-400" />
  
              <h3
                className={`text-base font-black ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                {t(
                  'home.first_review_title',
                  'Be the First to Share Your Experience'
                )}
              </h3>
  
              <p className="text-xs mt-2 text-neutral-400">
                {t(
                  'home.first_review_desc',
                  'Tried Outfit Zone? Share your review and rating. Your review may appear here after approval.'
                )}
              </p>
  
              {!showReviewForm && (
                <button
                  type="button"
                  onClick={openReviewForm}
                  className={`mt-5 inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full font-bold text-sm transition-all hover:scale-[1.02] cursor-pointer ${
                    isDark
                      ? 'bg-white text-black hover:bg-neutral-200'
                      : 'bg-black text-white hover:bg-neutral-800'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  <span>
                    {t(
                      'home.share_review',
                      'Share Your Review'
                    )}
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.map((review) => {
                const productSlug = review.product?.slug;
  
                return (
                  <article
                    key={review.id}
                    onClick={() =>
                      handleReviewProduct(productSlug)
                    }
                    className={`group oz-card-hover rounded-2xl border p-5 ${
                      productSlug ? 'cursor-pointer' : ''
                    } ${
                      isDark
                        ? 'bg-[#111115] border-neutral-800 hover:border-neutral-600'
                        : 'bg-white border-neutral-200 hover:border-neutral-400 hover:shadow-lg'
                    }`}
                  >
                    <div
                      className="flex items-center gap-0.5 mb-4"
                      dir="ltr"
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Number(review.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : isDark
                                ? 'text-neutral-700'
                                : 'text-neutral-300'
                          }`}
                        />
                      ))}
                    </div>
  
                    <p
                      className={`text-sm leading-7 min-h-[84px] ${
                        isDark
                          ? 'text-neutral-200'
                          : 'text-neutral-700'
                      }`}
                    >
                      "{review.review_text}"
                    </p>
  
                    <div
                      className={`mt-5 pt-4 border-t flex items-center justify-between gap-3 ${
                        isDark
                          ? 'border-neutral-800'
                          : 'border-neutral-200'
                      }`}
                    >
                      <div className="text-right min-w-0">
                        <p
                          className={`text-sm font-bold truncate ${
                            isDark ? 'text-white' : 'text-black'
                          }`}
                        >
                          {review.customer_name}
                        </p>
  
                        {review.product?.name && (
                          <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                            {review.product.name}
                          </p>
                        )}
                      </div>
  
                      {productSlug && (
                        <div
                          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:-translate-x-1 ${
                            isDark
                              ? 'bg-neutral-800 text-white group-hover:bg-white group-hover:text-black'
                              : 'bg-neutral-100 text-black group-hover:bg-black group-hover:text-white'
                          }`}
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
    </div>
  );
};