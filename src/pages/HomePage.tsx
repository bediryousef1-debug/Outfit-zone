```tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Instagram,
  MessageCircle,
  ShoppingBag,
} from 'lucide-react';

import type { Product } from '../types';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';

interface HomePageProps {
  onNavigate?: (path: string) => void;
  onSelectProduct?: (slug: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onSelectProduct,
}) => {
  const { categories, content, contactSocial } = useStore();
  const { isDark } = useTheme();
  const { addItem } = useCart();

  const isRtl = true;

  const [products, setProducts] = useState<Product[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        image:
          content?.hero_image_url ||
          '/images/hero_streetwear_editorial_1790342899745.jpg',
        path: '/products',
      },
      {
        id: 'hero-2',
        eyebrow: 'NEW DROP',
        title: 'YOUR STYLE. YOUR ZONE.',
        arabicTitle: 'ستايلك له مكان',
        description:
          'اكتشف أحدث القطع والقصات اللي تخلي اختيارك للّوك أسهل.',
        cta: 'اكتشف الجديد',
        image:
          content?.hero_image_url ||
          '/images/hero_streetwear_editorial_1790342899745.jpg',
        path: '/products',
      },
    ],
    [content?.hero_image_url]
  );

  const activeSlide = heroSlides[currentSlide] || heroSlides[0];

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await api.getProducts();

        if (!cancelled) {
          setProducts(data || []);
        }
      } catch (err) {
        console.error('Failed to load homepage products:', err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'تعذر تحميل المنتجات حاليًا'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (heroSlides.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentSlide((previous) => {
        if (previous >= heroSlides.length - 1) {
          return 0;
        }

        return previous + 1;
      });
    }, 6000);

    return () => {
      window.clearInterval(interval);
    };
  }, [heroSlides.length]);

  const nextSlide = () => {
    setCurrentSlide((previous) => {
      if (previous >= heroSlides.length - 1) {
        return 0;
      }

      return previous + 1;
    });
  };

  const prevSlide = () => {
    setCurrentSlide((previous) => {
      if (previous <= 0) {
        return heroSlides.length - 1;
      }

      return previous - 1;
    });
  };

  const activeCategories = (categories || []).filter(
    (category) => category.is_active !== false
  );

  const featuredProducts = products
    .filter((product) => product.is_featured)
    .slice(0, 8);

  const displayedProducts =
    featuredProducts.length > 0
      ? featuredProducts
      : products.slice(0, 8);

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
      return;
    }

    window.location.href = path;
  };

  const handleProductSelect = (product: Product) => {
    if (onSelectProduct) {
      onSelectProduct(product.slug);
      return;
    }

    window.location.href = '/products/' + product.slug;
  };

  const socialLinks = [
    {
      key: 'instagram',
      href: contactSocial?.instagram_url || '',
      icon: Instagram,
      label: 'Instagram',
    },
    {
      key: 'whatsapp',
      href: contactSocial?.whatsapp_number
        ? `https://wa.me/${String(
            contactSocial.whatsapp_number
          ).replace(/\D/g, '')}`
        : '',
      icon: MessageCircle,
      label: 'WhatsApp',
    },
    {
      key: 'tiktok',
      href: contactSocial?.tiktok_url || '',
      icon: null,
      label: 'TikTok',
    },
  ].filter((social) => Boolean(social.href));

  const isLongHeroTitle = activeSlide.title.length > 18;

  const mainClass = isDark
    ? 'min-h-screen overflow-x-hidden bg-black text-white'
    : 'min-h-screen overflow-x-hidden bg-white text-black';

  const heroWrapperClass = isDark
    ? 'mx-auto grid min-h-[680px] w-full max-w-[1600px] grid-cols-1 bg-black lg:grid-cols-2'
    : 'mx-auto grid min-h-[680px] w-full max-w-[1600px] grid-cols-1 bg-white lg:grid-cols-2';

  const heroTextClass = isRtl
    ? 'relative z-10 flex min-w-0 flex-col justify-center px-5 py-14 sm:px-8 lg:order-2 lg:px-12 lg:text-right xl:px-16'
    : 'relative z-10 flex min-w-0 flex-col justify-center px-5 py-14 sm:px-8 lg:order-1 lg:px-12 lg:text-left xl:px-16';

  const heroContentClass = isLongHeroTitle
    ? 'w-full min-w-0 max-w-full space-y-2 lg:max-w-[510px]'
    : 'w-full min-w-0 max-w-full space-y-2 lg:max-w-[570px]';

  const eyebrowClass = isDark
    ? 'font-mono text-xs font-bold tracking-[0.2em] text-white/60'
    : 'font-mono text-xs font-bold tracking-[0.2em] text-black/50';

  const titleSizeClass = isLongHeroTitle
    ? 'text-[clamp(1.9rem,8.5vw,3rem)] sm:text-[clamp(2.7rem,6vw,3.7rem)] lg:text-[clamp(2.5rem,3.45vw,3.75rem)]'
    : 'text-[clamp(2.15rem,9vw,3rem)] sm:text-6xl lg:text-[clamp(3.4rem,4.7vw,4.5rem)]';

  const titleClass = isDark
    ? 'w-full min-w-0 max-w-full font-syne font-black uppercase leading-[0.88] tracking-[-0.045em] text-white'
    : 'w-full min-w-0 max-w-full font-syne font-black uppercase leading-[0.88] tracking-[-0.045em] text-black';

  const arabicTitleClass = isDark
    ? 'pt-2 text-xl font-bold text-white/90 sm:text-2xl'
    : 'pt-2 text-xl font-bold text-black/80 sm:text-2xl';

  const descriptionClass = isDark
    ? 'max-w-xl text-sm leading-7 text-white/60 sm:text-base'
    : 'max-w-xl text-sm leading-7 text-black/60 sm:text-base';

  const heroButtonClass = isDark
    ? 'inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition-transform duration-200 hover:-translate-y-0.5'
    : 'inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-bold text-white transition-transform duration-200 hover:-translate-y-0.5';

  const heroImageSideClass = isRtl
    ? 'relative min-h-[420px] overflow-hidden lg:order-1 lg:min-h-full'
    : 'relative min-h-[420px] overflow-hidden lg:order-2 lg:min-h-full';

  const heroGradientDirection = isRtl
    ? 'bg-gradient-to-l'
    : 'bg-gradient-to-r';

  const heroGradientTheme = isDark
    ? 'from-black/70 via-black/20 to-transparent'
    : 'from-white/70 via-white/10 to-transparent';

  const heroControlClass = isDark
    ? 'flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white transition-colors hover:bg-white hover:text-black'
    : 'flex h-10 w-10 items-center justify-center rounded-full border border-black/20 bg-white/70 text-black transition-colors hover:bg-black hover:text-white';

  const trustSectionClass = isDark
    ? 'border-y border-white/10 bg-neutral-950'
    : 'border-y border-black/10 bg-neutral-50';

  const trustItemClass = isDark
    ? 'border-b border-white/10 px-4 py-6 text-center md:border-b-0 md:border-r'
    : 'border-b border-black/10 px-4 py-6 text-center md:border-b-0 md:border-r';

  const mutedTextClass = isDark
    ? 'text-white/45'
    : 'text-black/45';

  const editorialWrapperClass = isDark
    ? 'relative min-h-[360px] overflow-hidden rounded-3xl bg-neutral-900'
    : 'relative min-h-[360px] overflow-hidden rounded-3xl bg-neutral-100';

  const productCardClass = isDark
    ? 'group overflow-hidden rounded-2xl bg-neutral-900'
    : 'group overflow-hidden rounded-2xl bg-neutral-100';

  const productCompareClass = isDark
    ? 'text-xs line-through text-white/35'
    : 'text-xs line-through text-black/35';

  const productButtonClass = isDark
    ? 'mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-xs font-bold text-black transition-colors hover:bg-white/90'
    : 'mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-black py-2.5 text-xs font-bold text-white transition-colors hover:bg-black/90';

  const loadingCardClass = isDark
    ? 'aspect-[0.8] animate-pulse rounded-2xl bg-neutral-900'
    : 'aspect-[0.8] animate-pulse rounded-2xl bg-neutral-100';

  const messageClass = isDark
    ? 'rounded-2xl border border-white/10 p-8 text-center text-sm text-white/60'
    : 'rounded-2xl border border-black/10 p-8 text-center text-sm text-black/60';

  const socialSectionClass = isDark
    ? 'border-t border-white/10 bg-black'
    : 'border-t border-black/10 bg-white';

  const socialButtonClass = isDark
    ? 'flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-neutral-900'
    : 'flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-neutral-50';

  return (
    <main className={mainClass}>
      <section className="relative overflow-hidden">
        <div className={heroWrapperClass}>
          <div className={heroTextClass}>
            <div className={heroContentClass}>
              <p className={eyebrowClass}>
                {activeSlide.eyebrow}
              </p>

              <h1
                className={
                  titleSizeClass + ' ' + titleClass
                }
              >
                {activeSlide.title}
              </h1>

              <h2 className={arabicTitleClass}>
                {activeSlide.arabicTitle}
              </h2>

              <p className={descriptionClass}>
                {activeSlide.description}
              </p>

              <div
                className={
                  isRtl
                    ? 'flex flex-wrap items-center justify-end gap-3 pt-5'
                    : 'flex flex-wrap items-center justify-start gap-3 pt-5'
                }
              >
                <button
                  type="button"
                  onClick={() =>
                    handleNavigate(activeSlide.path)
                  }
                  className={heroButtonClass}
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

          <div className={heroImageSideClass}>
            <img
              src={activeSlide.image}
              alt={activeSlide.title}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />

            <div
              className={
                'absolute inset-0 ' +
                heroGradientDirection +
                ' ' +
                heroGradientTheme
              }
            />

            <div className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-between px-5 sm:px-8 lg:px-10">
              <div className="flex items-center gap-2">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    aria-label={'Go to slide ' + (index + 1)}
                    onClick={() => setCurrentSlide(index)}
                    className={
                      index === currentSlide
                        ? 'h-1.5 w-8 rounded-full bg-white transition-all duration-300'
                        : 'h-1.5 w-2 rounded-full bg-white transition-all duration-300'
                    }
                  />
                ))}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  aria-label="الشريحة السابقة"
                  onClick={prevSlide}
                  className={heroControlClass}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  aria-label="الشريحة التالية"
                  onClick={nextSlide}
                  className={heroControlClass}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={trustSectionClass}>
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 md:grid-cols-4">
          {[
            ['معاينة مجانية', 'عاين طلبك قبل الاستلام'],
            ['استبدال 14 يوم', 'بدّل المقاس بسهولة'],
            ['شحن لكل مصر', 'نوصل لجميع المحافظات'],
            ['اختيارات مختارة', 'ستايل مختار بعناية'],
          ].map(([title, text]) => (
            <div
              key={title}
              className={trustItemClass}
            >
              <span className="text-xs font-black">
                {title}
              </span>

              <span
                className={
                  'mt-1 block text-[11px] ' +
                  mutedTextClass
                }
              >
                {text}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mb-8 text-right">
          <p
            className={
              'mb-2 text-xs font-bold tracking-[0.2em] ' +
              mutedTextClass
            }
          >
            اختار ستايلك
          </p>

          <h2 className="font-syne text-3xl font-black sm:text-4xl">
            التصنيفات
          </h2>
        </div>

        {activeCategories.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {activeCategories.map((category) => {
              const categoryImage = category.image_url;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() =>
                    handleNavigate(
                      '/products?category=' +
                        encodeURIComponent(category.id)
                    )
                  }
                  className={
                    'group relative aspect-[0.82] overflow-hidden rounded-2xl text-right ' +
                    (isDark
                      ? 'bg-neutral-900'
                      : 'bg-neutral-100')
                  }
                >
                  {categoryImage && (
                    <img
                      src={categoryImage}
                      alt={category.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2 text-white">
                    <span className="font-bold">
                      {category.name}
                    </span>

                    <ArrowLeft className="h-4 w-4 shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-[1400px] px-5 pb-16 sm:px-8 lg:px-12">
        <div className={editorialWrapperClass}>
          <img
            src={
              content?.hero_image_url ||
              '/images/hero_streetwear_editorial_1790342899745.jpg'
            }
            alt="Outfit Zone"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/30 to-transparent" />

          <div className="relative z-10 flex min-h-[360px] max-w-xl flex-col justify-center px-6 py-10 text-right text-white sm:px-10">
            <p className="mb-3 text-xs font-bold tracking-[0.2em] text-white/60">
              OUTFIT ZONE
            </p>

            <h2 className="font-syne text-4xl font-black leading-none sm:text-5xl">
              البسها بطريقتك.
            </h2>

            <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
              اختار القطعة، ظبط اللوك، وانزل.
            </p>

            <button
              type="button"
              onClick={() => handleNavigate('/products')}
              className="mt-6 inline-flex w-fit flex-row-reverse items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition-transform hover:-translate-y-0.5"
            >
              تسوق المجموعة
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 pb-16 sm:px-8 lg:px-12">
        <div className="mb-8 flex items-end justify-between gap-4 text-right">
          <div>
            <p
              className={
                'mb-2 text-xs font-bold tracking-[0.2em] ' +
                mutedTextClass
              }
            >
              اختياراتنا
            </p>

            <h2 className="font-syne text-3xl font-black sm:text-4xl">
              منتجات مختارة
            </h2>
          </div>

          <button
            type="button"
            onClick={() => handleNavigate('/products')}
            className="hidden items-center gap-2 text-sm font-bold sm:flex"
          >
            عرض جميع المنتجات
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className={loadingCardClass}
              />
            ))}
          </div>
        ) : error ? (
          <div className={messageClass}>{error}</div>
        ) : displayedProducts.length === 0 ? (
          <div className={messageClass}>
            لا توجد منتجات متاحة حاليًا.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {displayedProducts.map((product) => {
              const compareAtPrice = (
                product as Product & {
                  compareAtPrice?:
                    | number
                    | string
                    | null;
                }
              ).compareAtPrice;

              const numericCompare =
                compareAtPrice == null
                  ? null
                  : Number(compareAtPrice);

              const numericPrice = Number(product.price);

              const hasCompare =
                numericCompare !== null &&
                Number.isFinite(numericCompare) &&
                Number.isFinite(numericPrice) &&
                numericCompare > numericPrice;

              const image =
                product.images?.[0]?.image_url || '';

              return (
                <article
                  key={product.id}
                  className={productCardClass}
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleProductSelect(product)
                    }
                    className="relative block aspect-[0.8] w-full overflow-hidden"
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className={
                          isDark
                            ? 'h-full w-full bg-neutral-800'
                            : 'h-full w-full bg-neutral-200'
                        }
                      />
                    )}
                  </button>

                  <div className="p-4 text-right">
                    <h3 className="line-clamp-2 text-sm font-bold">
                      {product.name}
                    </h3>

                    <div className="mt-2 flex items-center justify-end gap-2">
                      <span className="text-sm font-black">
                        {product.price} EGP
                      </span>

                      {hasCompare && (
                        <span className={productCompareClass}>
                          {compareAtPrice} EGP
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const variant = product.variants?.[0];

                        if (!variant) {
                          return;
                        }

                        addItem(product, variant);
                      }}
                      className={productButtonClass}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      أضف للسلة
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => handleNavigate('/products')}
          className="mt-6 flex w-full items-center justify-center gap-2 text-sm font-bold sm:hidden"
        >
          عرض جميع المنتجات
          <ArrowLeft className="h-4 w-4" />
        </button>
      </section>

      {socialLinks.length > 0 && (
        <section className={socialSectionClass}>
          <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
            <p
              className={
                'mb-3 text-xs font-bold tracking-[0.2em] ' +
                mutedTextClass
              }
            >
              @OUTFITZONE
            </p>

            <h2 className="font-syne text-3xl font-black sm:text-5xl">
              خليك في الـ Zone
            </h2>

            <p
              className={
                'mt-3 max-w-lg text-sm leading-7 ' +
                (isDark
                  ? 'text-white/50'
                  : 'text-black/50')
              }
            >
              تابعنا وشوف الجديد أول بأول.
            </p>

            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                  <a
                    key={social.key}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    className={socialButtonClass}
                  >
                    {Icon ? (
                      <Icon className="h-5 w-5" />
                    ) : (
                      <span className="text-xs font-black">
                        TK
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default HomePage;
```
