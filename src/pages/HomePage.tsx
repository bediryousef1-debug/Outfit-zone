import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  Instagram,
  MessageCircle,
  Play,
  ShoppingBag,
  Star,
} from 'lucide-react';

import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';

import {
  getCategories,
  getFeaturedProducts,
  getHomeReviews,
  submitReview,
} from '../services/api';

import type {
  Category,
  Product,
  ProductReview,
} from '../types';

const HomePage = () => {
  const { isDark } = useTheme();
  const { isRtl } = useLanguage();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);

  const [currentSlide, setCurrentSlide] = useState(0);

  const [reviewName, setReviewName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const heroSlides = useMemo(
    () => [
      {
        id: 'hero-1',
        eyebrow: 'OUTFIT ZONE',
        title: 'WEAR IN THE ZONE',
        arabicTitle: 'البسها صح',
        description:
          'قطع ستريت وير مختارة بعناية عشان تكمل اللوك بتاعك من غير تفكير كتير.',
        cta: 'تسوق الآن',
        image: '/images/hero-1.jpg',
      },
      {
        id: 'hero-2',
        eyebrow: 'NEW DROP',
        title: 'YOUR STYLE. YOUR ZONE.',
        arabicTitle: 'ستايلك له مكان',
        description:
          'اكتشف أحدث القطع والقصات اللي تخلي اختيارك للّوك أسهل.',
        cta: 'اكتشف الجديد',
        image: '/images/hero-2.jpg',
      },
    ],
    []
  );

  const activeSlide = heroSlides[currentSlide];

  const isLongHeroTitle =
    activeSlide.title.length > 18;

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [
          categoriesData,
          productsData,
          reviewsData,
        ] = await Promise.all([
          getCategories(),
          getFeaturedProducts(),
          getHomeReviews(),
        ]);

        setCategories(categoriesData || []);
        setProducts(productsData || []);
        setReviews(reviewsData || []);
      } catch (error) {
        console.error('Failed to load homepage data:', error);
      }
    };

    loadHomeData();
  }, []);

  useEffect(() => {
    if (heroSlides.length <= 1) return;

    const interval = window.setInterval(() => {
      setCurrentSlide((previous) =>
        previous === heroSlides.length - 1
          ? 0
          : previous + 1
      );
    }, 6000);

    return () => window.clearInterval(interval);
  }, [heroSlides.length]);

  const nextSlide = () => {
    setCurrentSlide((previous) =>
      previous === heroSlides.length - 1
        ? 0
        : previous + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((previous) =>
      previous === 0
        ? heroSlides.length - 1
        : previous - 1
    );
  };

  const handleReviewSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!reviewName.trim() || !reviewText.trim()) {
      return;
    }

    try {
      setReviewSubmitting(true);

      await submitReview({
        name: reviewName.trim(),
        review: reviewText.trim(),
        rating: reviewRating,
      });

      setReviewName('');
      setReviewText('');
      setReviewRating(5);

      alert(
        isRtl
          ? 'تم إرسال تقييمك بنجاح وسيتم مراجعته.'
          : 'Your review was submitted successfully and will be reviewed.'
      );
    } catch (error) {
      console.error('Failed to submit review:', error);

      alert(
        isRtl
          ? 'حدث خطأ أثناء إرسال التقييم.'
          : 'Something went wrong while submitting your review.'
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <main
      className={`min-h-screen overflow-x-hidden ${
        isDark
          ? 'bg-black text-white'
          : 'bg-white text-black'
      }`}
    >
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className={`mx-auto grid min-h-[680px] w-full max-w-[1600px] grid-cols-1 lg:grid-cols-2 ${
            isDark ? 'bg-black' : 'bg-white'
          }`}
        >
          {/* Hero Content */}
          <div
            className={`relative z-10 flex min-w-0 flex-col justify-center px-5 py-14 sm:px-8 lg:px-12 xl:px-16 ${
              isRtl
                ? 'lg:order-2 lg:text-right'
                : 'lg:order-1 lg:text-left'
            }`}
          >
            <div
              className={`w-full min-w-0 max-w-full space-y-2 ${
                isLongHeroTitle
                  ? 'lg:max-w-[510px]'
                  : 'lg:max-w-[570px]'
              }`}
            >
              <p
                className={`font-mono text-xs font-bold tracking-[0.2em] ${
                  isDark
                    ? 'text-white/60'
                    : 'text-black/50'
                }`}
              >
                {activeSlide.eyebrow}
              </p>

              <h1
                className={`w-full min-w-0 max-w-full font-syne font-black uppercase leading-[0.88] tracking-[-0.045em] ${
                  isLongHeroTitle
                    ? 'text-[clamp(1.9rem,8.5vw,3rem)] sm:text-[clamp(2.7rem,6vw,3.7rem)] lg:text-[clamp(2.5rem,3.45vw,3.75rem)]'
                    : 'text-[clamp(2.15rem,9vw,3rem)] sm:text-6xl lg:text-[clamp(3.4rem,4.7vw,4.5rem)]'
                } ${isDark ? 'text-white' : 'text-black'}`}
                style={{
                  overflowWrap: 'break-word',
                  wordBreak: 'normal',
                }}
              >
                {activeSlide.title}
              </h1>

              <h2
                className={`pt-2 text-xl font-bold sm:text-2xl ${
                  isDark
                    ? 'text-white/90'
                    : 'text-black/80'
                }`}
              >
                {activeSlide.arabicTitle}
              </h2>

              <p
                className={`max-w-xl text-sm leading-7 sm:text-base ${
                  isDark
                    ? 'text-white/60'
                    : 'text-black/60'
                }`}
              >
                {activeSlide.description}
              </p>

              <div
                className={`flex flex-wrap items-center gap-3 pt-5 ${
                  isRtl
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <button
                  type="button"
                  className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-transform duration-200 hover:-translate-y-0.5 ${
                    isDark
                      ? 'bg-white text-black'
                      : 'bg-black text-white'
                  }`}
                >
                  {activeSlide.cta}

                  {isRtl ? (
                    <ArrowLeft className="h-4 w-4" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div
            className={`relative min-h-[420px] overflow-hidden lg:min-h-full ${
              isRtl
                ? 'lg:order-1'
                : 'lg:order-2'
            }`}
          >
            <img
              src={activeSlide.image}
              alt={activeSlide.title}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />

            <div
              className={`absolute inset-0 ${
                isRtl
                  ? 'bg-gradient-to-l'
                  : 'bg-gradient-to-r'
              } ${
                isDark
                  ? 'from-black/70 via-black/20 to-transparent'
                  : 'from-white/70 via-white/10 to-transparent'
              }`}
            />

            {/* SLIDER CONTROLS */}
            <div className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-between px-5 sm:px-8 lg:px-10">
              <div className="flex items-center gap-2">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    aria-label={`Go to slide ${index + 1}`}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? 'w-8'
                        : 'w-2'
                    } ${
                      isDark
                        ? 'bg-white'
                        : 'bg-black'
                    }`}
                  />
                ))}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {/* Previous */}
                <button
                  type="button"
                  aria-label={
                    isRtl
                      ? 'الشريحة السابقة'
                      : 'Previous slide'
                  }
                  onClick={prevSlide}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                    isDark
                      ? 'border-white/30 bg-black/40 text-white hover:bg-white hover:text-black'
                      : 'border-black/20 bg-white/70 text-black hover:bg-black hover:text-white'
                  }`}
                >
                  {isRtl ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </button>

                {/* Next */}
                <button
                  type="button"
                  aria-label={
                    isRtl
                      ? 'الشريحة التالية'
                      : 'Next slide'
                  }
                  onClick={nextSlide}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                    isDark
                      ? 'border-white/30 bg-black/40 text-white hover:bg-white hover:text-black'
                      : 'border-black/20 bg-white/70 text-black hover:bg-black hover:text-white'
                  }`}
                >
                  {isRtl ? (
                    <ChevronLeft className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST FEATURES */}
      <section
        className={`border-y ${
          isDark
            ? 'border-white/10 bg-neutral-950'
            : 'border-black/10 bg-neutral-50'
        }`}
      >
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 md:grid-cols-4">
          {[
            {
              title: isRtl
                ? 'معاينة مجانية'
                : 'Free inspection',
              text: isRtl
                ? 'عاين طلبك قبل الاستلام'
                : 'Inspect before receiving',
            },
            {
              title: isRtl
                ? 'استبدال 14 يوم'
                : '14-day exchange',
              text: isRtl
                ? 'بدّل المقاس بسهولة'
                : 'Easy size exchange',
            },
            {
              title: isRtl
                ? 'شحن لكل مصر'
                : 'Nationwide shipping',
              text: isRtl
                ? 'نوصل لجميع المحافظات'
                : 'We ship across Egypt',
            },
            {
              title: isRtl
                ? 'اختيارات مختارة'
                : 'Curated pieces',
              text: isRtl
                ? 'ستايل مختار بعناية'
                : 'Carefully selected style',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className={`flex flex-col gap-1 border-black/10 px-4 py-6 text-center ${
                isDark
                  ? 'border-white/10'
                  : 'border-black/10'
              }`}
            >
              <span className="text-xs font-black uppercase tracking-wider">
                {feature.title}
              </span>

              <span
                className={`text-[11px] ${
                  isDark
                    ? 'text-white/45'
                    : 'text-black/45'
                }`}
              >
                {feature.text}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12">
        <div
          className={`mb-8 flex items-end justify-between gap-4 ${
            isRtl ? 'text-right' : 'text-left'
          }`}
        >
          <div>
            <p
              className={`mb-2 text-xs font-bold tracking-[0.2em] ${
                isDark
                  ? 'text-white/45'
                  : 'text-black/45'
              }`}
            >
              {isRtl ? 'اختار ستايلك' : 'CHOOSE YOUR STYLE'}
            </p>

            <h2 className="font-syne text-3xl font-black sm:text-4xl">
              {isRtl ? 'التصنيفات' : 'CATEGORIES'}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`/products?category=${category.id}`}
              className={`group relative aspect-[0.82] overflow-hidden rounded-2xl ${
                isDark
                  ? 'bg-neutral-900'
                  : 'bg-neutral-100'
              }`}
            >
              {category.image && (
                <img
                  src={category.image}
                  alt={category.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

              <div
                className={`absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2 text-white ${
                  isRtl ? 'flex-row-reverse' : ''
                }`}
              >
                <div className={isRtl ? 'text-right' : 'text-left'}>
                  <h3 className="font-bold">
                    {category.name}
                  </h3>

                  {category.subtitle && (
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/60">
                      {category.subtitle}
                    </p>
                  )}
                </div>

                {isRtl ? (
                  <ArrowLeft className="h-4 w-4 shrink-0" />
                ) : (
                  <ArrowRight className="h-4 w-4 shrink-0" />
                )}
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* EDITORIAL PROMO */}
      <section className="mx-auto max-w-[1400px] px-5 pb-16 sm:px-8 lg:px-12">
        <div
          className={`relative min-h-[360px] overflow-hidden rounded-3xl ${
            isDark
              ? 'bg-neutral-900'
              : 'bg-neutral-100'
          }`}
        >
          <div className="absolute inset-0">
            <img
              src="/images/editorial.jpg"
              alt="Outfit Zone"
              className="h-full w-full object-cover"
            />

            <div
              className={`absolute inset-0 ${
                isRtl
                  ? 'bg-gradient-to-l'
                  : 'bg-gradient-to-r'
              } from-black/80 via-black/30 to-transparent`}
            />
          </div>

          <div
            className={`relative z-10 flex min-h-[360px] max-w-xl flex-col justify-center px-6 py-10 text-white sm:px-10 ${
              isRtl ? 'text-right' : 'text-left'
            }`}
          >
            <p className="mb-3 text-xs font-bold tracking-[0.2em] text-white/60">
              OUTFIT ZONE
            </p>

            <h2 className="font-syne text-4xl font-black leading-none sm:text-5xl">
              {isRtl
                ? 'البسها بطريقتك.'
                : 'MAKE IT YOURS.'}
            </h2>

            <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
              {isRtl
                ? 'اختار القطعة، ظبط اللوك، وانزل.'
                : 'Pick the piece. Build the look. Step out.'}
            </p>

            <a
              href="/products"
              className={`mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition-transform hover:-translate-y-0.5 ${
                isRtl ? 'flex-row-reverse' : ''
              }`}
            >
              {isRtl
                ? 'تسوق المجموعة'
                : 'Shop the collection'}

              {isRtl ? (
                <ArrowLeft className="h-4 w-4" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </a>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="mx-auto max-w-[1400px] px-5 pb-16 sm:px-8 lg:px-12">
        <div
          className={`mb-8 flex items-end justify-between gap-4 ${
            isRtl ? 'text-right' : 'text-left'
          }`}
        >
          <div>
            <p
              className={`mb-2 text-xs font-bold tracking-[0.2em] ${
                isDark
                  ? 'text-white/45'
                  : 'text-black/45'
              }`}
            >
              {isRtl ? 'اختياراتنا' : 'OUR PICKS'}
            </p>

            <h2 className="font-syne text-3xl font-black sm:text-4xl">
              {isRtl ? 'منتجات مختارة' : 'FEATURED'}
            </h2>
          </div>

          <a
            href="/products"
            className={`hidden items-center gap-2 text-sm font-bold sm:flex ${
              isRtl ? 'flex-row-reverse' : ''
            }`}
          >
            {isRtl
              ? 'عرض جميع المنتجات'
              : 'View all products'}

            {isRtl ? (
              <ArrowLeft className="h-4 w-4" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => {
            const favorite = isFavorite(product.id);

            return (
              <article
                key={product.id}
                className={`group overflow-hidden rounded-2xl ${
                  isDark
                    ? 'bg-neutral-900'
                    : 'bg-neutral-100'
                }`}
              >
                <div className="relative aspect-[0.8] overflow-hidden">
                  <a href={`/products/${product.id}`}>
                    <img
                      src={product.images?.[0] || ''}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </a>

                  <button
                    type="button"
                    aria-label={
                      favorite
                        ? 'Remove from favorites'
                        : 'Add to favorites'
                    }
                    onClick={() =>
                      toggleFavorite(product.id)
                    }
                    className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md ${
                      isDark
                        ? 'bg-black/50 text-white'
                        : 'bg-white/80 text-black'
                    }`}
                  >
                    <Heart
                      className="h-4 w-4"
                      fill={
                        favorite
                          ? 'currentColor'
                          : 'none'
                      }
                    />
                  </button>
                </div>

                <div
                  className={`p-4 ${
                    isRtl ? 'text-right' : 'text-left'
                  }`}
                >
                  <h3 className="line-clamp-2 text-sm font-bold">
                    {product.name}
                  </h3>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm font-black">
                      {product.price} EGP
                    </span>

                    {product.compareAtPrice &&
                      product.compareAtPrice >
                        product.price && (
                        <span
                          className={`text-xs line-through ${
                            isDark
                              ? 'text-white/35'
                              : 'text-black/35'
                          }`}
                        >
                          {product.compareAtPrice} EGP
                        </span>
                      )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      addToCart(product)
                    }
                    className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-colors ${
                      isDark
                        ? 'bg-white text-black hover:bg-white/90'
                        : 'bg-black text-white hover:bg-black/90'
                    }`}
                  >
                    <ShoppingBag className="h-4 w-4" />

                    {isRtl
                      ? 'أضف للسلة'
                      : 'Add to cart'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <a
          href="/products"
          className={`mt-6 flex items-center justify-center gap-2 text-sm font-bold sm:hidden ${
            isRtl ? 'flex-row-reverse' : ''
          }`}
        >
          {isRtl
            ? 'عرض جميع المنتجات'
            : 'View all products'}

          {isRtl ? (
            <ArrowLeft className="h-4 w-4" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
        </a>
      </section>

      {/* REVIEWS */}
      <section
        className={`border-t ${
          isDark
            ? 'border-white/10 bg-neutral-950'
            : 'border-black/10 bg-neutral-50'
        }`}
      >
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12">
          <div
            className={`mb-10 ${
              isRtl ? 'text-right' : 'text-left'
            }`}
          >
            <p
              className={`mb-2 text-xs font-bold tracking-[0.2em] ${
                isDark
                  ? 'text-white/45'
                  : 'text-black/45'
              }`}
            >
              {isRtl
                ? 'آراء العملاء'
                : 'CUSTOMER LOVE'}
            </p>

            <h2 className="font-syne text-3xl font-black sm:text-4xl">
              {isRtl
                ? 'ناس لبست الـ Zone'
                : 'PEOPLE IN THE ZONE'}
            </h2>
          </div>

          {reviews.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className={`rounded-2xl border p-5 ${
                    isDark
                      ? 'border-white/10 bg-black'
                      : 'border-black/10 bg-white'
                  }`}
                >
                  <div
                    className={`mb-4 flex items-center gap-1 ${
                      isRtl
                        ? 'flex-row-reverse justify-end'
                        : ''
                    }`}
                  >
                    {Array.from({
                      length: 5,
                    }).map((_, index) => (
                      <Star
                        key={index}
                        className={`h-4 w-4 ${
                          index < review.rating
                            ? 'fill-current'
                            : isDark
                            ? 'text-white/20'
                            : 'text-black/20'
                        }`}
                      />
                    ))}
                  </div>

                  <p
                    className={`text-sm leading-7 ${
                      isDark
                        ? 'text-white/70'
                        : 'text-black/70'
                    }`}
                  >
                    “{review.review}”
                  </p>

                  <div
                    className={`mt-5 flex items-center justify-between gap-3 ${
                      isRtl
                        ? 'flex-row-reverse'
                        : ''
                    }`}
                  >
                    <span className="text-sm font-bold">
                      {review.name}
                    </span>

                    {review.productName && (
                      <a
                        href={`/products/${review.productId}`}
                        className={`flex items-center gap-1 text-xs ${
                          isDark
                            ? 'text-white/40'
                            : 'text-black/40'
                        }`}
                      >
                        {review.productName}

                        {isRtl ? (
                          <ArrowLeft className="h-3 w-3" />
                        ) : (
                          <ArrowRight className="h-3 w-3" />
                        )}
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* REVIEW FORM */}
          <div
            className={`mx-auto mt-12 max-w-2xl rounded-3xl border p-6 sm:p-8 ${
              isDark
                ? 'border-white/10 bg-black'
                : 'border-black/10 bg-white'
            }`}
          >
            <div
              className={`mb-6 ${
                isRtl ? 'text-right' : 'text-left'
              }`}
            >
              <h3 className="text-xl font-black">
                {isRtl
                  ? 'شاركنا رأيك'
                  : 'SHARE YOUR REVIEW'}
              </h3>

              <p
                className={`mt-1 text-sm ${
                  isDark
                    ? 'text-white/45'
                    : 'text-black/45'
                }`}
              >
                {isRtl
                  ? 'رأيك بيساعدنا نطور التجربة.'
                  : 'Your feedback helps us improve.'}
              </p>
            </div>

            <form
              onSubmit={handleReviewSubmit}
              className="space-y-4"
            >
              <div>
                <label
                  className={`mb-2 block text-xs font-bold ${
                    isRtl ? 'text-right' : 'text-left'
                  }`}
                >
                  {isRtl ? 'الاسم' : 'Name'}
                </label>

                <input
                  value={reviewName}
                  onChange={(event) =>
                    setReviewName(event.target.value)
                  }
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${
                    isDark
                      ? 'border-white/10 bg-neutral-900 text-white placeholder:text-white/30 focus:border-white/30'
                      : 'border-black/10 bg-neutral-50 text-black placeholder:text-black/30 focus:border-black/30'
                  }`}
                  placeholder={
                    isRtl
                      ? 'اكتب اسمك'
                      : 'Your name'
                  }
                />
              </div>

              <div>
                <label
                  className={`mb-2 block text-xs font-bold ${
                    isRtl ? 'text-right' : 'text-left'
                  }`}
                >
                  {isRtl ? 'التقييم' : 'Rating'}
                </label>

                <div
                  className={`flex items-center gap-1 ${
                    isRtl
                      ? 'flex-row-reverse justify-end'
                      : ''
                  }`}
                >
                  {Array.from({
                    length: 5,
                  }).map((_, index) => {
                    const rating = index + 1;

                    return (
                      <button
                        key={rating}
                        type="button"
                        onClick={() =>
                          setReviewRating(rating)
                        }
                        className="p-1"
                        aria-label={`${rating} stars`}
                      >
                        <Star
                          className={`h-5 w-5 ${
                            rating <= reviewRating
                              ? 'fill-current'
                              : isDark
                              ? 'text-white/20'
                              : 'text-black/20'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  className={`mb-2 block text-xs font-bold ${
                    isRtl ? 'text-right' : 'text-left'
                  }`}
                >
                  {isRtl ? 'رأيك' : 'Review'}
                </label>

                <textarea
                  value={reviewText}
                  onChange={(event) =>
                    setReviewText(event.target.value)
                  }
                  rows={4}
                  className={`w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${
                    isDark
                      ? 'border-white/10 bg-neutral-900 text-white placeholder:text-white/30 focus:border-white/30'
                      : 'border-black/10 bg-neutral-50 text-black placeholder:text-black/30 focus:border-black/30'
                  }`}
                  placeholder={
                    isRtl
                      ? 'اكتب تجربتك مع Outfit Zone'
                      : 'Tell us about your Outfit Zone experience'
                  }
                />
              </div>

              <button
                type="submit"
                disabled={reviewSubmitting}
                className={`w-full rounded-xl py-3 text-sm font-bold transition-opacity ${
                  reviewSubmitting
                    ? 'cursor-not-allowed opacity-50'
                    : ''
                } ${
                  isDark
                    ? 'bg-white text-black'
                    : 'bg-black text-white'
                }`}
              >
                {reviewSubmitting
                  ? isRtl
                    ? 'جاري الإرسال...'
                    : 'Submitting...'
                  : isRtl
                  ? 'إرسال التقييم'
                  : 'Submit review'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* MOBILE / SOCIAL CTA */}
      <section
        className={`border-t ${
          isDark
            ? 'border-white/10 bg-black'
            : 'border-black/10 bg-white'
        }`}
      >
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
          <p
            className={`mb-3 text-xs font-bold tracking-[0.2em] ${
              isDark
                ? 'text-white/40'
                : 'text-black/40'
            }`}
          >
            @OUTFITZONE
          </p>

          <h2 className="font-syne text-3xl font-black sm:text-5xl">
            {isRtl
              ? 'خليك في الـ Zone'
              : 'STAY IN THE ZONE'}
          </h2>

          <p
            className={`mt-3 max-w-lg text-sm leading-7 ${
              isDark
                ? 'text-white/50'
                : 'text-black/50'
            }`}
          >
            {isRtl
              ? 'تابعنا وشوف الجديد أول بأول.'
              : 'Follow us and stay up to date with the latest drops.'}
          </p>

          <div
            className={`mt-6 flex items-center gap-3 ${
              isRtl ? 'flex-row-reverse' : ''
            }`}
          >
            <a
              href="#instagram"
              aria-label="Instagram"
              className={`flex h-11 w-11 items-center justify-center rounded-full border ${
                isDark
                  ? 'border-white/10 bg-neutral-900'
                  : 'border-black/10 bg-neutral-50'
              }`}
            >
              <Instagram className="h-5 w-5" />
            </a>

            <a
              href="#whatsapp"
              aria-label="WhatsApp"
              className={`flex h-11 w-11 items-center justify-center rounded-full border ${
                isDark
                  ? 'border-white/10 bg-neutral-900'
                  : 'border-black/10 bg-neutral-50'
              }`}
            >
              <MessageCircle className="h-5 w-5" />
            </a>

            <a
              href="#tiktok"
              aria-label="TikTok"
              className={`flex h-11 w-11 items-center justify-center rounded-full border text-xs font-black ${
                isDark
                  ? 'border-white/10 bg-neutral-900'
                  : 'border-black/10 bg-neutral-50'
              }`}
            >
              TK
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;