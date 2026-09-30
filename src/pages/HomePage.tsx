```tsx
import React, { useEffect, useMemo, useState } from 'react';
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
import { Product, ProductReview } from '../types';
import { api } from '../services/api';
import { ProductCard } from '../components/product/ProductCard';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
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
  const { categories, content } = useStore();
  const { isDark } = useTheme();

  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<HomepageReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

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

  /*
   * ==========================================================================
   * HERO SLIDES
   * ==========================================================================
   *
   * Kept as a memoized value so the autoplay effect does not depend on a
   * newly-created array on every render.
   */

  const heroSlides = useMemo(
    () => [
      {
        id: 'slide-main',
        tag: 'NEW COLLECTION 2026',
        titleLine1: 'WEAR IN',
        titleLine2: 'THE ZONE',
        subtitleAr: content?.hero_subtitle || 'ستايلك له حضور',
        description:
          'قطع مختارة بعناية تعكس شخصيتك وتخليك دايماً في قلب الحدث بأعلى خامات قطنية مصرية.',
        ctaText: content?.hero_button_text || 'تسوق الآن',
        ctaLink: '/products',
        imageUrl:
          content?.hero_image_url ||
          '/images/hero_streetwear_editorial_1790342899745.jpg',
        badgeTop: 'Style Your Zone',
        badgeBottom: 'STYLE BUILDS CONFIDENCE',
        alt: 'Outfit Zone Editorial Campaign',
      },
      {
        id: 'slide-boxfit',
        tag: 'BOX FIT ESSENTIALS',
        titleLine1: 'HEAVYWEIGHT',
        titleLine2: 'COTTON 240+',
        subtitleAr: 'تيشيرتات Box Fit الفاخرة',
        description:
          'قصات مريحة وتطريز متقن صُمم ليدوم معك مع الحفاظ على رونق القماش ومقاومة الغسيل.',
        ctaText: 'اكتشف التيشيرتات',
        ctaLink: '/products?search=تيشيرت',
        imageUrl: '/images/product_boxfit_tee_black_1790342911897.jpg',
        badgeTop: 'Heavyweight Fit',
        badgeBottom: '100% EGYPTIAN COTTON',
        alt: 'Box Fit T-Shirt Black',
      },
      {
        id: 'slide-oversized',
        tag: 'OVERSIZED STREETWEAR',
        titleLine1: 'EFFORTLESS',
        titleLine2: 'OVERSIZED',
        subtitleAr: 'تشكيلة الأوفرسايز الواسعة',
        description:
          'ستايل الشارع العصري بقصات هدلة مريحة تمنحك إطلالة فريدة ومميزة طوال اليوم.',
        ctaText: 'تسوق الأوفرسايز',
        ctaLink: '/products?search=اوفرسايز',
        imageUrl: '/images/product_oversized_tee_offwhite_1790342923739.jpg',
        badgeTop: 'Streetwear Drop',
        badgeBottom: 'WEAR IN THE ZONE',
        alt: 'Oversized Tee Offwhite',
      },
      {
        id: 'slide-polos',
        tag: 'URBAN INTERLOCK',
        titleLine1: 'MODERN',
        titleLine2: 'POLOS & SHIRTS',
        subtitleAr: 'بولو وقمصان إنترلوك أنيقة',
        description:
          'دمج مثالي بين المظهر المهندم والطابع الكاجوال بخامة إنترلوك ناعمة وباردة ومريحة.',
        ctaText: 'عرض التشكيلة',
        ctaLink: '/products?category=streetwear-polos',
        imageUrl: '/images/product_interlock_polo_charcoal_1790342934447.jpg',
        badgeTop: 'Urban Interlock',
        badgeBottom: 'CASH ON DELIVERY',
        alt: 'Streetwear Polo Charcoal',
      },
    ],
    [content?.hero_subtitle, content?.hero_button_text, content?.hero_image_url]
  );

  const currentSlide = heroSlides[activeSlide] || heroSlides[0];

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setActiveSlide(
      (prev) => (prev - 1 + heroSlides.length) % heroSlides.length
    );
  };

  /*
   * ==========================================================================
   * HERO AUTOPLAY
   * ==========================================================================
   */

  useEffect(() => {
    if (isPaused || heroSlides.length <= 1) return;

    const interval = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [isPaused, heroSlides.length]);

  /*
   * Keep active slide valid if the number of slides ever changes.
   */

  useEffect(() => {
    if (activeSlide >= heroSlides.length) {
      setActiveSlide(0);
    }
  }, [activeSlide, heroSlides.length]);

  /*
   * ==========================================================================
   * LOAD PRODUCTS
   * ==========================================================================
   */

  const loadProducts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err: any) {
      console.error('Error fetching homepage products:', err);
      setError(err.message || 'تعذر تحميل المنتجات حاليًا');
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
      title: 'دفع عند الاستلام',
      subtitle: 'كاش',
      icon: ShieldCheck,
    },
    {
      id: 'shipping',
      title: 'شحن سريع',
      subtitle: 'لجميع المحافظات',
      icon: Truck,
    },
    {
      id: 'discounts',
      title: 'خصومات حصرية',
      subtitle: 'ولمدة محدودة',
      icon: Percent,
    },
    {
      id: 'support',
      title: 'دعم العملاء',
      subtitle: 'علي مدار الساعة',
      icon: Headphones,
    },
  ];

  /*
   * ==========================================================================
   * CATEGORY NAVIGATION
   * ==========================================================================
   */

  const handleCategoryNavigate = (slug: string) => {
    onNavigate(`/products?category=${encodeURIComponent(slug)}`);
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
      setReviewError('من فضلك اكتب اسمك.');
      return;
    }

    if (cleanName.length < 2) {
      setReviewError('الاسم يجب أن يكون حرفين على الأقل.');
      return;
    }

    if (!cleanText) {
      setReviewError('من فضلك اكتب رأيك.');
      return;
    }

    if (cleanText.length < 5) {
      setReviewError('اكتب رأيك في 5 أحرف على الأقل.');
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError('اختار تقييم من نجمة إلى 5 نجوم.');
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
        throw new Error('تعذر إرسال رأيك حاليًا.');
      }

      setReviewName('');
      setReviewRating(5);
      setReviewText('');
      setShowReviewForm(false);

      setReviewMessage(
        'شكرًا لرأيك ❤️ سيتم مراجعته واعتماده قبل ظهوره على الموقع.'
      );
    } catch (err: any) {
      console.error('Error submitting homepage review:', err);

      setReviewError(
        err.message || 'تعذر إرسال رأيك حاليًا. حاول مرة أخرى.'
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-12 overflow-x-hidden sm:space-y-16">
      {/* =====================================================================
          1. HERO SECTION & SLIDER
          ===================================================================== */}

      <section
        className={`relative w-full min-w-0 max-w-full overflow-hidden transition-colors ${
          isDark
            ? 'bg-gradient-to-b from-[#111115] via-[#09090b] to-[#000000]'
            : 'bg-gradient-to-b from-[#f3f4f6] via-[#f9fafb] to-[#ffffff]'
        }`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        aria-roledescription="carousel"
        aria-label="عروض وتشكيلات Outfit Zone"
      >
        <div className="w-full max-w-7xl min-w-0 mx-auto px-4 pt-5 pb-8 sm:px-6 sm:py-12 lg:py-16">
          <div className="grid w-full min-w-0 grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
            {/* =================================================================
                HERO CONTENT
                ================================================================= */}

            <div className="order-1 min-w-0 max-w-full space-y-5 text-right lg:col-span-6 lg:order-1 lg:space-y-6">
              {/* Top metadata */}

              <div className="flex min-w-0 max-w-full items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400 sm:text-xs sm:tracking-widest">
                <div className="flex min-w-0 max-w-[75%] items-center gap-2">
                  <span className="h-px w-6 shrink-0 bg-neutral-500 sm:w-8" />

                  <span className="min-w-0 wrap-anywhere font-mono tracking-wider">
                    {currentSlide.tag}
                  </span>
                </div>

                <div className="shrink-0 font-mono text-[10px] opacity-75 sm:text-xs">
                  0{activeSlide + 1} / 0{heroSlides.length}
                </div>
              </div>

              {/* Main heading */}

              <div className="min-w-0 max-w-full space-y-2">
                <h1
                  className={`min-w-0 max-w-full wrap-anywhere font-syne text-[clamp(2.15rem,10vw,4.5rem)] font-black uppercase leading-[0.92] tracking-[-0.035em] sm:text-6xl lg:text-7xl ${
                    isDark ? 'text-white' : 'text-black'
                  }`}
                >
                  <span className="block min-w-0 max-w-full wrap-anywhere">
                    {currentSlide.titleLine1}
                  </span>

                  <span className="block min-w-0 max-w-full wrap-anywhere">
                    {currentSlide.titleLine2}
                  </span>
                </h1>

                <h2
                  className={`min-w-0 max-w-full wrap-anywhere pt-2 text-xl font-extrabold leading-tight sm:text-3xl lg:text-4xl ${
                    isDark ? 'text-neutral-100' : 'text-neutral-900'
                  }`}
                >
                  {currentSlide.subtitleAr}
                </h2>
              </div>

              {/* Description */}

              <p
                className={`w-full max-w-md min-w-0 wrap-anywhere text-sm leading-7 sm:text-base sm:leading-relaxed ${
                  isDark ? 'text-neutral-300' : 'text-neutral-600'
                }`}
              >
                {currentSlide.description}
              </p>

              {/* CTA */}

              <div className="flex w-full max-w-full flex-wrap items-center gap-3 pt-1 sm:gap-4 sm:pt-2">
                <button
                  onClick={() => onNavigate(currentSlide.ctaLink)}
                  className={`inline-flex max-w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-lg transition-all hover:scale-[1.02] sm:px-8 sm:py-3.5 sm:text-base ${
                    isDark
                      ? 'bg-white text-black hover:bg-neutral-200 shadow-white/10'
                      : 'bg-black text-white hover:bg-neutral-800 shadow-black/20'
                  }`}
                >
                  <span className="min-w-0 wrap-anywhere">
                    {currentSlide.ctaText}
                  </span>

                  <ArrowLeft className="h-4 w-4 shrink-0" />
                </button>
              </div>

              {/* Slider controls */}

              <div
                className={`flex w-full max-w-md min-w-0 items-center justify-between gap-4 border-t pt-5 ${
                  isDark
                    ? 'border-neutral-800/60'
                    : 'border-neutral-200/70'
                }`}
              >
                {/* Indicators */}

                <div
                  className="flex min-w-0 shrink items-center gap-1.5"
                  role="tablist"
                  aria-label="شرائح السلايدر"
                >
                  {heroSlides.map((slide, idx) => {
                    const isActive = activeSlide === idx;

                    return (
                      <button
                        key={slide.id}
                        onClick={() => setActiveSlide(idx)}
                        role="tab"
                        aria-selected={isActive}
                        aria-label={`الشريحة ${idx + 1}: ${slide.titleLine1}`}
                        className={`h-2 shrink-0 rounded-full transition-all duration-300 ${
                          isActive
                            ? `w-7 sm:w-8 ${
                                isDark
                                  ? 'bg-white shadow-sm shadow-white/30'
                                  : 'bg-black shadow-sm shadow-black/30'
                              }`
                            : `w-2.5 sm:w-3 ${
                                isDark
                                  ? 'bg-neutral-700 hover:bg-neutral-500'
                                  : 'bg-neutral-300 hover:bg-neutral-500'
                              }`
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Previous / Next */}

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={prevSlide}
                    aria-label="الشريحة السابقة"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                      isDark
                        ? 'border-neutral-800 bg-neutral-900/80 text-white hover:border-white hover:bg-white hover:text-black'
                        : 'border-neutral-300 bg-white text-black shadow-xs hover:border-black hover:bg-black hover:text-white'
                    }`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  <button
                    onClick={nextSlide}
                    aria-label="الشريحة التالية"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                      isDark
                        ? 'border-neutral-800 bg-neutral-900/80 text-white hover:border-white hover:bg-white hover:text-black'
                        : 'border-neutral-300 bg-white text-black shadow-xs hover:border-black hover:bg-black hover:text-white'
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* =================================================================
                HERO IMAGE
                ================================================================= */}

            <div className="order-2 min-w-0 w-full max-w-full lg:col-span-6 lg:order-2">
              <div
                onClick={() => onNavigate(currentSlide.ctaLink)}
                className={`group relative mx-auto w-full max-w-[620px] overflow-hidden rounded-2xl border shadow-2xl transition-all duration-500 sm:rounded-3xl ${
                  isDark
                    ? 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                    : 'border-neutral-200 bg-neutral-100 hover:border-neutral-300'
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onNavigate(currentSlide.ctaLink);
                  }
                }}
                aria-label={`عرض ${currentSlide.subtitleAr}`}
              >
                <div className="relative aspect-[4/5] w-full sm:aspect-[4/4.5] lg:aspect-[5/6]">
                  <img
                    key={currentSlide.imageUrl}
                    src={resolveImageUrl(currentSlide.imageUrl)}
                    alt={currentSlide.alt}
                    className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03] sm:object-center"
                    fetchPriority="high"
                  />

                  {/* Image overlay */}

                  <div
                    className={`pointer-events-none absolute inset-0 ${
                      isDark
                        ? 'bg-gradient-to-t from-black/75 via-black/10 to-transparent'
                        : 'bg-gradient-to-t from-black/45 via-transparent to-transparent'
                    }`}
                  />

                  {/* Top badge */}

                  <div className="pointer-events-none absolute left-4 top-4 max-w-[70%] select-none opacity-90 transition-all duration-500 sm:left-6 sm:top-6">
                    <span className="wrap-anywhere font-serif text-base italic text-white/95 drop-shadow-md sm:text-2xl">
                      {currentSlide.badgeTop}
                    </span>
                  </div>

                  {/* Bottom badge */}

                  <div className="pointer-events-none absolute bottom-4 right-4 max-w-[75%] select-none text-right sm:bottom-6 sm:right-6">
                    <span className="block wrap-anywhere text-[9px] font-mono uppercase tracking-[0.14em] text-white/95 drop-shadow-sm sm:text-xs sm:tracking-widest">
                      {currentSlide.badgeBottom}
                    </span>

                    <div className="mr-auto mt-1 h-0.5 w-8 bg-white/80" />
                  </div>

                  {/* Desktop hover label */}

                  <div className="pointer-events-none absolute bottom-4 left-4 hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:block">
                    <span className="rounded-full border border-white/20 bg-black/75 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md">
                      استكشف الموديل
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. TRUST FEATURES
          ===================================================================== */}

      <section className="w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6">
        <div
          className={`grid grid-cols-2 gap-6 rounded-2xl border p-6 text-center transition-colors sm:gap-4 sm:p-8 md:grid-cols-4 md:divide-x md:divide-x-reverse md:divide-y-0 ${
            isDark
              ? 'divide-neutral-800/80 border-neutral-800 bg-[#111115] text-white'
              : 'divide-neutral-200 border-neutral-200 bg-white text-black shadow-sm'
          }`}
        >
          {trustFeatures.map((feat) => {
            const Icon = feat.icon;

            return (
              <div
                key={feat.id}
                className="flex min-w-0 flex-col items-center justify-center px-2 pt-4 first:pt-0 md:pt-0"
              >
                <div
                  className={`mb-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors ${
                    isDark
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-black'
                  }`}
                >
                  <Icon className="h-6 w-6 stroke-[1.5]" />
                </div>

                <h4 className="wrap-anywhere text-sm font-bold sm:text-base">
                  {feat.title}
                </h4>

                <p className="mt-0.5 wrap-anywhere text-xs font-medium text-neutral-400">
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

      <section className="w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="my-6 text-center">
          <div className="inline-flex max-w-full items-center gap-3 text-lg font-black tracking-tight sm:text-2xl">
            <span className="h-[2px] w-8 shrink-0 bg-neutral-400 sm:w-12" />

            <h2
              className={`min-w-0 wrap-anywhere ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              تسوق حسب الفئة
            </h2>

            <span className="h-[2px] w-8 shrink-0 bg-neutral-400 sm:w-12" />
          </div>
        </div>

        {activeCategories.length === 0 ? (
          <div
            className={`rounded-2xl border p-8 text-center ${
              isDark
                ? 'border-neutral-800 bg-[#121216] text-neutral-400'
                : 'border-neutral-200 bg-white text-neutral-500'
            }`}
          >
            لا توجد فئات متاحة حاليًا.
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {activeCategories.map((cat) => {
              const categoryImage = cat.image_url
                ? resolveImageUrl(cat.image_url)
                : null;

              return (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryNavigate(cat.slug)}
                  className={`group min-w-0 cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 ${
                    isDark
                      ? 'border-neutral-800 bg-[#121216] shadow-md hover:border-neutral-600'
                      : 'border-neutral-200 bg-white hover:border-neutral-400 hover:shadow-lg'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCategoryNavigate(cat.slug);
                    }
                  }}
                  aria-label={`تصفح فئة ${cat.name}`}
                >
                  <div className="relative aspect-[4/4.5] w-full overflow-hidden bg-neutral-900/10 sm:aspect-[4/5]">
                    {categoryImage ? (
                      <img
                        src={categoryImage}
                        alt={cat.name}
                        className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className={`flex h-full w-full flex-col items-center justify-center ${
                          isDark
                            ? 'bg-neutral-900 text-neutral-500'
                            : 'bg-neutral-100 text-neutral-400'
                        }`}
                      >
                        <span className="text-3xl font-black opacity-20">
                          OZ
                        </span>

                        <span className="mt-2 text-xs">لا توجد صورة</span>
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>

                  <div className="flex min-w-0 items-center justify-between gap-2 p-3.5 sm:p-4">
                    <div className="min-w-0 text-right">
                      <h3
                        className={`min-w-0 truncate text-sm font-bold transition-colors sm:text-base ${
                          isDark
                            ? 'text-white group-hover:text-neutral-200'
                            : 'text-black group-hover:text-neutral-800'
                        }`}
                      >
                        {cat.name}
                      </h3>

                      <span className="mt-0.5 block min-w-0 truncate text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 sm:text-xs">
                        {cat.slug}
                      </span>
                    </div>

                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform group-hover:-translate-x-1 ${
                        isDark
                          ? 'bg-neutral-800 text-white group-hover:bg-white group-hover:text-black'
                          : 'bg-neutral-200 text-black group-hover:bg-black group-hover:text-white'
                      }`}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =====================================================================
          4. EDITORIAL PROMO BANNER
          ===================================================================== */}

      <section className="w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6">
        <div
          className={`relative overflow-hidden rounded-3xl border p-6 transition-colors sm:p-10 lg:p-12 ${
            isDark
              ? 'border-neutral-800 bg-[#111115] text-white'
              : 'border-neutral-800 bg-neutral-900 text-white'
          }`}
        >
          <div className="grid min-w-0 grid-cols-1 items-center gap-8 md:grid-cols-12">
            <div className="z-10 min-w-0 space-y-4 text-right md:col-span-7">
              <div className="flex min-w-0 items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
                <span className="h-px w-8 shrink-0 bg-neutral-500" />
                <span>OUTFIT ZONE</span>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-neutral-300 sm:text-base">
                  ...مش مجرد لبس
                </p>

                <h3 className="text-3xl font-black leading-tight tracking-tight sm:text-5xl">
                  ده حضور
                </h3>
              </div>

              <p className="max-w-md text-xs leading-relaxed text-neutral-400 sm:text-sm">
                تصاميم تعكس ذوقك العصري مع تفاصيل متقنة وخامات قطنية ممتازة
                تناسب كل لحظات يومك.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate('/about')}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-xs font-extrabold text-black shadow-md transition-all hover:bg-neutral-200 sm:text-sm"
                >
                  <span>اكتشف المزيد</span>
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="relative flex min-w-0 justify-center md:col-span-5 md:justify-end">
              <div className="relative aspect-[4/3] w-full max-w-sm overflow-hidden rounded-2xl border border-neutral-800 bg-black shadow-xl">
                <img
                  src={resolveImageUrl(
                    '/images/hero_streetwear_editorial_1790342899745.jpg'
                  )}
                  alt="Streetwear Detail"
                  className="h-full w-full object-cover object-bottom opacity-80"
                  loading="lazy"
                />

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] rounded border-2 border-neutral-700/80 bg-black/95 px-4 py-2 text-center font-syne text-sm font-black tracking-[0.2em] text-white shadow-2xl">
                  <div>OUTFIT</div>
                  <div>ZONE</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. FEATURED PRODUCTS
          ===================================================================== */}

      <section className="w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8 flex min-w-0 items-end justify-between gap-4">
          <div className="min-w-0 text-right">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-neutral-400">
              أحدث التشكيلات
            </span>

            <h2
              className={`min-w-0 wrap-anywhere text-xl font-black sm:text-2xl ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              الموديلات الأكثر طلباً
            </h2>
          </div>

          <button
            onClick={() => onNavigate('/products')}
            className={`flex shrink-0 items-center gap-1 text-xs font-bold text-neutral-400 transition-colors ${
              isDark ? 'hover:text-white' : 'hover:text-black'
            }`}
          >
            <span>عرض جميع المنتجات</span>
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-2xl bg-neutral-900/10 dark:bg-neutral-900/40"
              />
            ))}
          </div>
        ) : error ? (
          <div className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-900/10 p-8 text-center dark:border-neutral-800 dark:bg-neutral-900/40">
            <AlertCircle className="mx-auto h-8 w-8 text-neutral-400" />

            <p className="text-sm text-neutral-400">{error}</p>

            <button
              onClick={loadProducts}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-800 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />

              <span>إعادة المحاولة</span>
            </button>
          </div>
        ) : featuredProducts.length === 0 ? (
          <div
            className={`rounded-2xl border p-8 text-center ${
              isDark
                ? 'border-neutral-800 bg-neutral-900/40 text-neutral-400'
                : 'border-neutral-200 bg-neutral-50 text-neutral-500'
            }`}
          >
            لا توجد منتجات متاحة حاليًا.
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
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

      {/* =====================================================================
          6. CUSTOMER REVIEWS
          ===================================================================== */}

      <section className="w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8 flex min-w-0 flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 text-right">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-neutral-400">
              آراء عملائنا
            </span>

            <h2
              className={`min-w-0 wrap-anywhere text-xl font-black sm:text-2xl ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              تجارب حقيقية من عملائنا
            </h2>
          </div>

          {!showReviewForm && (
            <button
              type="button"
              onClick={openReviewForm}
              className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all hover:scale-[1.02] ${
                isDark
                  ? 'bg-white text-black hover:bg-neutral-200'
                  : 'bg-black text-white hover:bg-neutral-800'
              }`}
            >
              <Star className="h-4 w-4" />
              <span>شاركنا رأيك</span>
            </button>
          )}
        </div>

        {reviewMessage && (
          <div
            className={`mb-6 rounded-2xl border p-4 text-right text-sm ${
              isDark
                ? 'border-neutral-800 bg-neutral-900 text-neutral-200'
                : 'border-neutral-200 bg-neutral-50 text-neutral-700'
            }`}
          >
            {reviewMessage}
          </div>
        )}

        {showReviewForm && (
          <div
            className={`mb-8 rounded-3xl border p-5 sm:p-7 ${
              isDark
                ? 'border-neutral-800 bg-[#111115]'
                : 'border-neutral-200 bg-white shadow-sm'
            }`}
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="min-w-0 text-right">
                <h3
                  className={`text-lg font-black ${
                    isDark ? 'text-white' : 'text-black'
                  }`}
                >
                  شاركنا تجربتك
                </h3>

                <p className="mt-1 text-xs text-neutral-400">
                  رأيك يهمنا ويساعد عملاءنا يعرفوا تجربتك.
                </p>
              </div>

              <button
                type="button"
                onClick={closeReviewForm}
                disabled={reviewSubmitting}
                aria-label="إغلاق نموذج الرأي"
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  isDark
                    ? 'border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                    : 'border-neutral-200 text-neutral-500 hover:bg-neutral-100'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-5" dir="rtl">
              <div>
                <label
                  className={`mb-2 block text-sm font-bold ${
                    isDark ? 'text-white' : 'text-black'
                  }`}
                >
                  الاسم
                </label>

                <input
                  type="text"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  placeholder="اكتب اسمك"
                  maxLength={100}
                  disabled={reviewSubmitting}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${
                    isDark
                      ? 'border-neutral-800 bg-neutral-950 text-white placeholder:text-neutral-600 focus:border-neutral-500'
                      : 'border-neutral-200 bg-white text-black placeholder:text-neutral-400 focus:border-neutral-500'
                  }`}
                />
              </div>

              <div>
                <label
                  className={`mb-3 block text-sm font-bold ${
                    isDark ? 'text-white' : 'text-black'
                  }`}
                >
                  تقييمك
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
                        aria-label={`تقييم ${star} من 5`}
                        className="cursor-pointer p-1 transition-transform hover:scale-110 disabled:cursor-not-allowed"
                      >
                        <Star
                          className={`h-7 w-7 transition-colors ${
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
                  className={`mb-2 block text-sm font-bold ${
                    isDark ? 'text-white' : 'text-black'
                  }`}
                >
                  رأيك
                </label>

                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="اكتب تجربتك مع Outfit Zone..."
                  maxLength={1000}
                  rows={5}
                  disabled={reviewSubmitting}
                  className={`w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${
                    isDark
                      ? 'border-neutral-800 bg-neutral-950 text-white placeholder:text-neutral-600 focus:border-neutral-500'
                      : 'border-neutral-200 bg-white text-black placeholder:text-neutral-400 focus:border-neutral-500'
                  }`}
                />

                <div className="mt-1 text-left text-[10px] text-neutral-400">
                  {reviewText.length}/1000
                </div>
              </div>

              {reviewError && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    isDark
                      ? 'border-red-900/50 bg-red-950/20 text-red-300'
                      : 'border-red-200 bg-red-50 text-red-600'
                  }`}
                >
                  {reviewError}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeReviewForm}
                  disabled={reviewSubmitting}
                  className={`rounded-xl border px-6 py-3 text-sm font-bold transition-colors ${
                    isDark
                      ? 'border-neutral-800 text-neutral-300 hover:bg-neutral-900'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className={`flex items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                    isDark
                      ? 'bg-white text-black hover:bg-neutral-200'
                      : 'bg-black text-white hover:bg-neutral-800'
                  }`}
                >
                  <Send className="h-4 w-4" />

                  <span>
                    {reviewSubmitting ? 'جاري الإرسال...' : 'إرسال رأيي'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}

        {reviewsLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-44 animate-pulse rounded-2xl ${
                  isDark ? 'bg-neutral-900/60' : 'bg-neutral-100'
                }`}
              />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div
            className={`rounded-2xl border p-8 text-center ${
              isDark
                ? 'border-neutral-800 bg-[#111115] text-neutral-400'
                : 'border-neutral-200 bg-white text-neutral-500'
            }`}
          >
            <Star className="mx-auto mb-4 h-8 w-8 text-neutral-400" />

            <h3
              className={`text-base font-black ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              كن أول من يشارك تجربته
            </h3>

            <p className="mt-2 text-xs text-neutral-400">
              جربت Outfit Zone؟ شاركنا رأيك وتقييمك، ويمكن لرأيك يظهر هنا بعد
              اعتماده.
            </p>

            {!showReviewForm && (
              <button
                type="button"
                onClick={openReviewForm}
                className={`mt-5 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all hover:scale-[1.02] ${
                  isDark
                    ? 'bg-white text-black hover:bg-neutral-200'
                    : 'bg-black text-white hover:bg-neutral-800'
                }`}
              >
                <Star className="h-4 w-4" />
                <span>شاركنا رأيك</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => {
              const productSlug = review.product?.slug;

              return (
                <article
                  key={review.id}
                  onClick={() => handleReviewProduct(productSlug)}
                  className={`group min-w-0 rounded-2xl border p-5 transition-all duration-300 ${
                    productSlug ? 'cursor-pointer' : ''
                  } ${
                    isDark
                      ? 'border-neutral-800 bg-[#111115] hover:border-neutral-600'
                      : 'border-neutral-200 bg-white hover:border-neutral-400 hover:shadow-lg'
                  }`}
                >
                  <div
                    className="mb-4 flex items-center gap-0.5"
                    dir="ltr"
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
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
                    className={`min-h-[84px] wrap-anywhere text-sm leading-7 ${
                      isDark ? 'text-neutral-200' : 'text-neutral-700'
                    }`}
                  >
                    "{review.review_text}"
                  </p>

                  <div
                    className={`mt-5 flex items-center justify-between gap-3 border-t pt-4 ${
                      isDark
                        ? 'border-neutral-800'
                        : 'border-neutral-200'
                    }`}
                  >
                    <div className="min-w-0 text-right">
                      <p
                        className={`truncate text-sm font-bold ${
                          isDark ? 'text-white' : 'text-black'
                        }`}
                      >
                        {review.customer_name}
                      </p>

                      {review.product?.name && (
                        <p className="mt-0.5 truncate text-[10px] text-neutral-400">
                          {review.product.name}
                        </p>
                      )}
                    </div>

                    {productSlug && (
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform group-hover:-translate-x-1 ${
                          isDark
                            ? 'bg-neutral-800 text-white group-hover:bg-white group-hover:text-black'
                            : 'bg-neutral-100 text-black group-hover:bg-black group-hover:text-white'
                        }`}
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
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
```

[/END]
