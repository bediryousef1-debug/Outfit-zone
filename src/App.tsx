import React, { useState, useEffect } from 'react';
import './styles/cinematic-motion.css';
import { useStorefrontCinema } from './motion/useStorefrontCinema';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { CartProvider, useCart } from './context/CartContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { SocialBar } from './components/layout/SocialBar';
import { WhatsAppFloatingButton } from './components/layout/WhatsAppFloatingButton';
import { CartDrawer } from './components/cart/CartDrawer';
import { HomePage } from './pages/HomePage';
import { initSourceTracker } from './utils/sourceTracker';
import type { AdminTab } from './pages/admin/AdminLayout';

const ProductsPage = React.lazy(() => import('./pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const ProductDetailPage = React.lazy(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CartPage = React.lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));

const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrderSuccessPage = React.lazy(() => import('./pages/OrderSuccessPage').then(m => ({ default: m.OrderSuccessPage })));
const AboutPage = React.lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = React.lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const OrderTrackingPage = React.lazy(() => import('./pages/OrderTrackingPage').then(m => ({ default: m.OrderTrackingPage })));

const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminLoginPage = React.lazy(() => import('./pages/admin/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = React.lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const AdminProductsPage = React.lazy(() => import('./pages/admin/AdminProductsPage').then(m => ({ default: m.AdminProductsPage })));
const AdminProductEditPage = React.lazy(() => import('./pages/admin/AdminProductEditPage').then(m => ({ default: m.AdminProductEditPage })));
const AdminCategoriesPage = React.lazy(() => import('./pages/admin/AdminCategoriesPage').then(m => ({ default: m.AdminCategoriesPage })));
const AdminOrdersPage = React.lazy(() => import('./pages/admin/AdminOrdersPage').then(m => ({ default: m.AdminOrdersPage })));
const AdminOrderDetailPage = React.lazy(() => import('./pages/admin/AdminOrderDetailPage').then(m => ({ default: m.AdminOrderDetailPage })));
const AdminCouponsPage = React.lazy(() => import('./pages/admin/AdminCouponsPage').then(m => ({ default: m.AdminCouponsPage })));
const AdminContentPage = React.lazy(() => import('./pages/admin/AdminContentPage').then(m => ({ default: m.AdminContentPage })));
const AdminContactPage = React.lazy(() => import('./pages/admin/AdminContactPage').then(m => ({ default: m.AdminContactPage })));
const AdminHeroSliderPage = React.lazy(() => import('./pages/admin/AdminHeroSliderPage').then(m => ({ default: m.AdminHeroSliderPage })));
const AdminSettingsPage = React.lazy(() => import('./pages/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })));

function AdminLoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-xs text-neutral-400">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <span>جاري تحميل لوحة التحكم...</span>
      </div>
    </div>
  );
}

function StorefrontMotionEffects({ pathname }: { pathname: string }) {
  const progressRef = React.useRef<HTMLDivElement>(null);
  useStorefrontCinema(pathname);

  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionPreference.matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 0.7,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1,
      touchMultiplier: 1.05,
    });

    const syncScroll = () => ScrollTrigger.update();
    const frame = (time: number) => lenis.raf(time * 1000);
    // Route changes must reset immediately; a smooth scroll can be interrupted when the route effect reinitializes Lenis.
    const scrollToTop = () => {
      lenis.scrollTo(0, { immediate: true });
      window.scrollTo(0, 0);
    };

    lenis.on('scroll', syncScroll);
    gsap.ticker.add(frame);
    gsap.ticker.lagSmoothing(500, 33);
    window.addEventListener('oz:scroll-top', scrollToTop);

    const motionContext = gsap.context(() => {
      const routeRoot = main.querySelector<HTMLElement>('.oz-route-motion-root');
      if (routeRoot) {
        gsap.fromTo(routeRoot,
          { autoAlpha: 0, y: 38, scale: 0.985 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.72,
            ease: 'power3.out',
            clearProps: 'transform,opacity,visibility',
          }
        );
      }

      const pageSections = main.querySelectorAll<HTMLElement>(
        '.oz-home-page .oz-motion-section:not(.oz-hero-stage), .oz-page-motion section, .oz-page-motion [data-oz-scroll-scene]'
      );

      // Most inner pages are built from div/grid layouts rather than section elements.
      // Animate their actual content so product listing/detail pages receive the same visible motion.
      if (pathname !== '/') {
        const pageHeading = routeRoot?.querySelectorAll<HTMLElement>('h1, h2');
        if (pageHeading?.length) {
          gsap.fromTo(pageHeading,
            { autoAlpha: 0, y: 30, clipPath: 'inset(0 0 22% 0)' },
            {
              autoAlpha: 1,
              y: 0,
              clipPath: 'inset(0 0 0% 0)',
              duration: 0.78,
              stagger: 0.09,
              ease: 'power4.out',
              clearProps: 'transform,opacity,visibility',
              delay: 0.08,
            }
          );
        }

        const productCards = routeRoot?.querySelectorAll<HTMLElement>('.oz-card-hover, [data-oz-motion-card]');
        if (productCards?.length) {
          gsap.fromTo(productCards,
            { autoAlpha: 0, y: 24, scale: 0.99 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              rotateX: 0,
              duration: 0.48,
              stagger: { each: 0.035, from: 'start' },
              ease: 'power3.out',
              clearProps: 'transform,opacity,visibility',
              delay: 0.12,
            }
          );
        }

        const pageImages = routeRoot?.querySelectorAll<HTMLElement>('img:not(.oz-hero-image)');
        if (pageImages?.length) {
          gsap.fromTo(pageImages,
            { autoAlpha: 0.8 },
            {
              autoAlpha: 1,
              duration: 0.45,
              stagger: 0.025,
              ease: 'power3.out',
              clearProps: 'clipPath,transform,opacity,visibility',
              delay: 0.06,
            }
          );
        }
      }

      pageSections.forEach((section) => {
        const headings = section.querySelectorAll<HTMLElement>('h2, h3, [data-oz-motion-heading]');
        if (headings.length) {
          gsap.fromTo(headings,
            { autoAlpha: 0, y: 22 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.04,
              ease: 'power4.out',
              clearProps: 'clipPath',
              scrollTrigger: { trigger: section, start: 'top 84%', once: true },
            }
          );
        }

        const cards = section.querySelectorAll<HTMLElement>('[data-oz-motion-card], .oz-card-hover');
        if (cards.length) {
          gsap.fromTo(cards,
            { autoAlpha: 0, y: 20 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              rotateX: 0,
              duration: 0.45,
              stagger: { each: 0.03, from: 'start' },
              ease: 'power3.out',
              clearProps: 'transform,opacity,visibility',
              scrollTrigger: { trigger: section, start: 'top 88%', once: true },
            }
          );
        }

        const editorialImages = section.querySelectorAll<HTMLElement>(
          ':scope > div img:not(.oz-hero-image), [data-oz-cinematic-image]'
        );
        if (editorialImages.length) {
          gsap.fromTo(editorialImages,
            { autoAlpha: 0.82 },
            {
              duration: 0.5,
              stagger: 0.03,
              ease: 'power3.out',
              clearProps: 'clipPath,filter,transform',
              scrollTrigger: { trigger: section, start: 'top 82%', once: true },
            }
          );
        }
      });

      const hero = main.querySelector<HTMLElement>('.oz-hero-stage');
      const heroVisual = hero?.querySelector<HTMLElement>('.oz-hero-slide-visual');
      if (hero && heroVisual && window.matchMedia('(min-width: 768px)').matches) {
        gsap.to(heroVisual, {
          yPercent: 10,
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.1,
          },
        });
      }

      const heroCopy = main.querySelector<HTMLElement>('.oz-hero-slide-copy');
      if (heroCopy) {
        const heroEyebrow = heroCopy.querySelector<HTMLElement>('.font-mono');
        const heroHeading = heroCopy.querySelector<HTMLElement>('h1');
        const heroSubtitle = heroCopy.querySelector<HTMLElement>('h2');
        const heroDescription = heroCopy.querySelector<HTMLElement>('p');
        const heroCta = heroCopy.querySelector<HTMLElement>('button');
        gsap.fromTo([heroEyebrow, heroHeading, heroSubtitle, heroDescription, heroCta].filter((element): element is HTMLElement => element !== null),
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.88,
            stagger: 0.11,
            ease: 'power4.out',
            clearProps: 'transform',
            delay: 0.12,
          }
        );
      }
    }, main);

    const refreshTriggers = () => ScrollTrigger.refresh();
    const refreshTimer = window.setTimeout(refreshTriggers, 250);

    return () => {
      window.clearTimeout(refreshTimer);
      window.removeEventListener('oz:scroll-top', scrollToTop);
      lenis.off('scroll', syncScroll);
      lenis.destroy();
      gsap.ticker.remove(frame);
      motionContext.revert();
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.trigger && main.contains(trigger.trigger as Node)) trigger.kill();
      });
    };
  }, [pathname]);

  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const progress = progressRef.current;
    let ticking = false;
    const updateProgress = () => {
      if (!progress || ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const amount = scrollable > 0 ? window.scrollY / scrollable : 0;
        progress.style.transform = 'scaleX(' + Math.max(0, Math.min(1, amount)) + ')';
        ticking = false;
      });
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);

    if (!reduceMotion && 'IntersectionObserver' in window) {
      const sections = main.querySelectorAll<HTMLElement>('.oz-page-motion section, .oz-page-motion [data-oz-scroll-scene]');
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('oz-scroll-visible');
          else entry.target.classList.remove('oz-scroll-visible');
        });
      }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
      sections.forEach((section) => { section.classList.add('oz-scroll-reveal'); revealObserver.observe(section); });
      const mutationObserver = new MutationObserver(() => {
        main.querySelectorAll<HTMLElement>('.oz-page-motion section:not(.oz-scroll-reveal), .oz-page-motion [data-oz-scroll-scene]:not(.oz-scroll-reveal)').forEach((section) => {
          section.classList.add('oz-scroll-reveal');
          revealObserver.observe(section);
        });
      });
      mutationObserver.observe(main, { childList: true, subtree: true });
      const pointerMove = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return;
        const card = (event.target as HTMLElement).closest<HTMLElement>('.oz-page-motion [data-oz-motion-card]');
        if (!card) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--oz-pointer-x', (event.clientX - rect.left) + 'px');
        card.style.setProperty('--oz-pointer-y', (event.clientY - rect.top) + 'px');
        card.classList.add('oz-pointer-active');
      };
      const pointerLeave = (event: PointerEvent) => {
        const card = (event.target as HTMLElement).closest<HTMLElement>('.oz-page-motion [data-oz-motion-card]');
        if (card && !card.contains(event.relatedTarget as Node | null)) card.classList.remove('oz-pointer-active');
      };
      main.addEventListener('pointermove', pointerMove, { passive: true });
      main.addEventListener('pointerout', pointerLeave, { passive: true });
      return () => {
        window.removeEventListener('scroll', updateProgress);
        window.removeEventListener('resize', updateProgress);
        mutationObserver.disconnect(); revealObserver.disconnect();
        main.removeEventListener('pointermove', pointerMove);
        main.removeEventListener('pointerout', pointerLeave);
      };
    }
    return () => { window.removeEventListener('scroll', updateProgress); window.removeEventListener('resize', updateProgress); };
  }, []);

  return <div ref={progressRef} className="oz-scroll-progress" aria-hidden="true" />;
}
function AppContent() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const { content } = useStore();
  const { itemCount, isCartOpen, setIsCartOpen } = useCart();
  const { isDark } = useTheme();
  const { language } = useLanguage();

  // currentPath always includes the query string (e.g. /products?category=polo),
  // both after in-app navigation AND after a browser refresh / back button.
  const readLocation = () =>
    (window.location.pathname || '/') + (window.location.search || '');

  const [currentPath, setCurrentPath] = useState<string>(readLocation);

  // Sync browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(readLocation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initialize marketing order source tracker on visitor entry
  useEffect(() => {
    initSourceTracker();
  }, []);

  const navigate = (path: string) => {
    // Reset native scroll before React swaps the keyed route root, so the new page never inherits the old page's position.
    window.scrollTo(0, 0);
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.dispatchEvent(new Event('oz:scroll-top'));
  };

  const pathname = currentPath.split('?')[0].replace(/(.)\/+$/, '$1') || '/';
  const search = currentPath.includes('?') ? currentPath.slice(currentPath.indexOf('?')) : '';

  // Keep SEO metadata aligned with the active public route and language.
  useEffect(() => {
    const isAr = language === 'ar';
    const privateRoute =
      pathname === '/cart' ||
      pathname === '/checkout' ||
      pathname.startsWith('/order-success/') ||
      pathname === '/track' ||
      pathname.startsWith('/admin');

    if (pathname === '/') {
      document.title = isAr
        ? 'Outfit Zone | ملابس رجالي وستريت وير في مصر - Wear In The Zone'
        : 'Outfit Zone | Men’s Streetwear in Egypt - Wear In The Zone';
    } else if (pathname.startsWith('/products/')) {
      document.title = isAr ? 'تفاصيل الموديل | Outfit Zone' : 'Product Details | Outfit Zone';
    } else if (pathname.startsWith('/products')) {
      document.title = isAr ? 'ملابس رجالي وستريت وير | تشكيلة Outfit Zone' : 'Men’s Streetwear Collection | Outfit Zone';
    } else if (pathname === '/cart') {
      document.title = isAr ? 'سلة المشتريات | Outfit Zone' : 'Shopping Bag | Outfit Zone';
    } else if (pathname === '/checkout') {
      document.title = isAr
        ? 'إتمام الطلب (الدفع عند الاستلام) | Outfit Zone'
        : 'Checkout (Cash on Delivery) | Outfit Zone';
    } else if (pathname.startsWith('/order-success/')) {
      document.title = isAr ? 'تم استلام طلبك بنجاح | Outfit Zone' : 'Order Received | Outfit Zone';
    } else if (pathname === '/about') {
      document.title = isAr ? 'قصتنا وعن البراند | Outfit Zone' : 'About the Brand | Outfit Zone';
    } else if (pathname === '/contact') {
      document.title = isAr ? 'تواصل معنا | Outfit Zone' : 'Contact Us | Outfit Zone';
    } else if (pathname === '/track') {
      document.title = isAr ? 'تتبع حالة طلبك | Outfit Zone' : 'Track Your Order | Outfit Zone';
    } else if (pathname.startsWith('/admin')) {
      document.title = 'لوحة التحكم | Outfit Zone Admin';
    }

    const setMeta = (selector: string, attribute: 'name' | 'property', key: string, value: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.content = value;
    };

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (privateRoute) {
      canonical?.remove();
      setMeta('meta[name="robots"]', 'name', 'robots', 'noindex, nofollow');
    } else {
      document.head.querySelector('meta[name="robots"]')?.remove();
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = `https://outfitzone-eg.vercel.app${pathname === '/products' ? '/products' : pathname}`;
      setMeta('meta[property="og:url"]', 'property', 'og:url', canonical.href);
    }

    const descriptions: Record<string, string> = isAr
      ? {
          '/': 'Outfit Zone متجر ملابس رجالي وشبابي في مصر متخصص في ستايل الستريت وير. اكتشف تيشيرتات Box Fit وOversized والبولو والقمصان المتاحة، مع الدفع عند الاستلام.',
          '/products': 'تصفح ملابس Outfit Zone الرجالي والشبابي في مصر، واكتشف موديلات التيشيرتات والبولو والقمصان المتاحة بتصميمات ستريت وير.',
          '/about': 'تعرف على قصة Outfit Zone ورؤيتنا في تقديم ملابس ستريت وير رجالي بتصاميم عصرية.',
          '/contact': 'تواصل مع Outfit Zone للاستفسار عن المنتجات والمقاسات والطلبات.',
        }
      : {
          '/': 'Outfit Zone is an Egyptian men’s clothing and streetwear store. Explore available Box Fit and Oversized T-shirts, polos and shirts with cash on delivery.',
          '/products': 'Browse Outfit Zone men’s clothing and streetwear collection in Egypt, including available T-shirts, polos and shirts.',
          '/about': 'Learn about Outfit Zone and our approach to modern men’s streetwear.',
          '/contact': 'Contact Outfit Zone about products, sizing and orders.',
        };
    if (!privateRoute) {
      const description = descriptions[pathname] || (isAr
        ? 'اكتشف هذا الموديل من Outfit Zone، براند الستريت وير الرجالي المصري.'
        : 'Discover this style from Outfit Zone, an Egyptian men’s streetwear brand.');
      setMeta('meta[name="description"]', 'name', 'description', description);
      setMeta('meta[property="og:title"]', 'property', 'og:title', document.title);
      setMeta('meta[property="og:description"]', 'property', 'og:description', description);
      setMeta('meta[property="og:type"]', 'property', 'og:type', pathname.startsWith('/products/') ? 'product' : 'website');
    }
  }, [pathname, language]);

  // Observe product cards as they enter/leave the viewport, including async-loaded grids.
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches) return;

    const observedCards = new WeakSet<Element>();

    if (!('IntersectionObserver' in window)) {
      main.querySelectorAll<HTMLElement>('[data-oz-motion-card]').forEach((card) => {
        card.classList.add('oz-card-motion-in-view');
      });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const card = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          card.classList.add('oz-card-motion-in-view');
        } else {
          card.classList.remove('oz-card-motion-in-view');
        }
      });
    }, { threshold: 0.12, rootMargin: '0px' });

    const observeCards = () => {
      main.querySelectorAll<HTMLElement>('[data-oz-motion-card]').forEach((card) => {
        if (observedCards.has(card)) return;
        observedCards.add(card);
        observer.observe(card);
      });
    };

    observeCards();

    const mutationObserver = new MutationObserver(observeCards);
    mutationObserver.observe(main, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [pathname]);

  // Route Parsers
  // The slug is passed on exactly as it appears in the URL; the API layer decodes it,
  // so refreshing /products/<slug> resolves the same product as clicking a card.
  const productSlug = pathname.startsWith('/products/') ? pathname.slice('/products/'.length) : '';
  const isProductDetail = productSlug.length > 0;

  const orderNumber = pathname.startsWith('/order-success/')
    ? pathname.slice('/order-success/'.length)
    : '';
  const isOrderSuccess = orderNumber.length > 0;

  const isAdminRoute = pathname.startsWith('/admin');

  // ==============================================================================
  // ADMIN ROUTES (Lazy-loaded and strictly isolated from customer interface)
  // ==============================================================================
  if (isAdminRoute) {
    if (authLoading) {
      return <AdminLoadingSpinner />;
    }

    // Unauthenticated admin route handling: redirect to /admin/login
    if (!isAuthenticated) {
      return (
        <React.Suspense fallback={<AdminLoadingSpinner />}>
          <AdminLoginPage
            onBackToStore={() => navigate('/')}
            onLoginSuccess={() => navigate('/admin')}
          />
        </React.Suspense>
      );
    }

    // If authenticated user visits /admin/login, direct them to /admin dashboard directly
    if (pathname === '/admin/login') {
      window.history.replaceState({}, '', '/admin');
    }

    // Authenticated admin routing:
    let activeTab: AdminTab = 'dashboard';
    if (pathname.startsWith('/admin/products')) {
      activeTab = 'products';
    } else if (pathname.startsWith('/admin/categories')) {
      activeTab = 'categories';
    } else if (pathname.startsWith('/admin/orders')) {
      activeTab = 'orders';
    } else if (pathname.startsWith('/admin/coupons')) {
      activeTab = 'coupons';
    } else if (pathname.startsWith('/admin/content')) {
      activeTab = 'content';
    } else if (pathname.startsWith('/admin/contact')) {
      activeTab = 'contact';
    } else if (pathname.startsWith('/admin/hero-slider')) {
      activeTab = 'hero-slider';
    } else if (pathname.startsWith('/admin/settings')) {
      activeTab = 'settings';
    }

    // Parse edit product / view order IDs
    const isNewProduct = pathname === '/admin/products/new';
    const isEditProduct = pathname.startsWith('/admin/products/') && pathname.endsWith('/edit');
    const editProductId = isEditProduct
      ? pathname.replace('/admin/products/', '').replace('/edit', '')
      : null;

    const isOrderDetail =
      pathname.startsWith('/admin/orders/') && pathname !== '/admin/orders';
    const orderDetailId = isOrderDetail ? pathname.replace('/admin/orders/', '') : null;

    return (
      <React.Suspense fallback={<AdminLoadingSpinner />}>
      <AdminLayout
          currentTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'dashboard') navigate('/admin');
            if (tab === 'products') navigate('/admin/products');
            if (tab === 'categories') navigate('/admin/categories');
            if (tab === 'orders') navigate('/admin/orders');
            if (tab === 'coupons') navigate('/admin/coupons');
            if (tab === 'content') navigate('/admin/content');
            if (tab === 'contact') navigate('/admin/contact');
            if (tab === 'hero-slider') navigate('/admin/hero-slider');
            if (tab === 'settings') navigate('/admin/settings');
          }}
          onExitAdmin={() => navigate('/')}
        >
          {/* /admin Dashboard */}
          {activeTab === 'dashboard' && (
            <AdminDashboardPage
              onNavigateTab={(tab) => {
                if (tab === 'dashboard') navigate('/admin');
                if (tab === 'products') navigate('/admin/products');
                if (tab === 'categories') navigate('/admin/categories');
                if (tab === 'orders') navigate('/admin/orders');
                if (tab === 'coupons') navigate('/admin/coupons');
                if (tab === 'content') navigate('/admin/content');
                if (tab === 'contact') navigate('/admin/contact');
                if (tab === 'hero-slider') navigate('/admin/hero-slider');
                if (tab === 'settings') navigate('/admin/settings');
              }}
              onSelectOrder={(id) => navigate(`/admin/orders/${id}`)}
              onNewProduct={() => navigate('/admin/products/new')}
            />
          )}

          {/* /admin/products */}
          {activeTab === 'products' && (
            <>
              {isNewProduct ? (
                <AdminProductEditPage
                  productId={null}
                  onBack={() => navigate('/admin/products')}
                  onSaved={() => navigate('/admin/products')}
                />
              ) : isEditProduct && editProductId ? (
                <AdminProductEditPage
                  productId={editProductId}
                  onBack={() => navigate('/admin/products')}
                  onSaved={() => navigate('/admin/products')}
                />
              ) : (
                <AdminProductsPage
                  onNewProduct={() => navigate('/admin/products/new')}
                  onEditProduct={(id) => navigate(`/admin/products/${id}/edit`)}
                />
              )}
            </>
          )}

          {/* /admin/categories */}
          {activeTab === 'categories' && <AdminCategoriesPage />}

          {/* /admin/orders */}
          {activeTab === 'orders' && (
            <>
              {isOrderDetail && orderDetailId ? (
                <AdminOrderDetailPage
                  orderId={orderDetailId}
                  onBack={() => navigate('/admin/orders')}
                />
              ) : (
                <AdminOrdersPage
                  onSelectOrder={(id) => navigate(`/admin/orders/${id}`)}
                />
              )}
            </>
          )}

          {/* /admin/coupons */}
          {activeTab === 'coupons' && <AdminCouponsPage />}

          {/* /admin/content */}
          {activeTab === 'content' && <AdminContentPage />}


          {/* /admin/contact */}
          {activeTab === 'contact' && <AdminContactPage />}

          {/* /admin/hero-slider */}
          {activeTab === 'hero-slider' && <AdminHeroSliderPage />}

          {/* /admin/settings */}
          {activeTab === 'settings' && <AdminSettingsPage />}
        </AdminLayout>
      </React.Suspense>
    );
  }

  // ==============================================================================
  // CUSTOMER STOREFRONT ROUTES
  // ==============================================================================
  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors w-full max-w-full overflow-x-hidden ${
        isDark
          ? 'bg-[#09090b] text-[#f4f4f5] selection:bg-neutral-800 selection:text-white'
          : 'bg-[#f9f9fb] text-[#09090b] selection:bg-neutral-200 selection:text-black'
      }`}
    >
      {/* Customer Header */}
      <Header
        itemCount={itemCount}
        setIsCartOpen={setIsCartOpen}
        onNavigate={(path) => navigate(path)}
        currentPath={pathname}
        announcementText={content?.announcement_text}
      />

      {/* Main Storefront Views */}
      <main className="flex-1 pb-24 md:pb-16 w-full max-w-full overflow-x-hidden">
        <StorefrontMotionEffects pathname={pathname} />
        {/* / (Home) */}
        <ErrorBoundary resetKey={currentPath}>
        <React.Suspense fallback={<AdminLoadingSpinner />}>
        <div
          key={pathname}
          className={pathname === '/' ? 'oz-route-motion-root' : 'oz-page-motion oz-route-motion-root'}
        >
        {pathname === '/' && (
          <HomePage
            onNavigate={(path) => navigate(path)}
            onSelectProduct={(slug) => navigate(`/products/${slug}`)}
          />
        )}

        {/* /products and /products?category=...&filter=... (works after refresh too) */}
        {pathname === '/products' && (
          <ProductsPage
            onSelectProduct={(slug) => navigate(`/products/${slug}`)}
            initialCategory={new URLSearchParams(search).get('category') || ''}
            initialFilter={new URLSearchParams(search).get('filter') || ''}
          />
        )}

        {/* /products/:slug */}
        {isProductDetail && productSlug && (
          <ProductDetailPage
            slug={productSlug}
            onBack={() => navigate('/products')}
            onNavigate={(path) => navigate(path)}
          />
        )}

        {/* /cart */}
        {pathname === '/cart' && (
          <CartPage
            onNavigate={(path) => navigate(path)}
          />
        )}

        {/* /checkout */}
        {pathname === '/checkout' && (
          <CheckoutPage
            onNavigate={(path) => navigate(path)}
            onOrderSuccess={(orderNum, token) => {
              const url = token ? `/order-success/${orderNum}?t=${token}` : `/order-success/${orderNum}`;
              navigate(url);
            }}
          />
        )}

        {/* /order-success/:orderNumber */}
        {isOrderSuccess && orderNumber && (
          <OrderSuccessPage
            orderNumber={orderNumber}
            onNavigate={(path) => navigate(path)}
          />
        )}

        {/* /about */}
        {pathname === '/about' && (
          <AboutPage onNavigate={(path) => navigate(path)} />
        )}

        {/* /contact */}
        {pathname === '/contact' && (
          <ContactPage />
        )}

        {/* /track */}
        {pathname === '/track' && (
          <OrderTrackingPage onNavigate={(path) => navigate(path)} />
        )}
        </div>
        </React.Suspense>
        </ErrorBoundary>

      </main>

      {/* Customer Footer */}
      <Footer onNavigate={(path) => navigate(path)} />

      {/* Floating Elements (WhatsApp, Social Bar & Cart Drawer) */}
      <WhatsAppFloatingButton />
      <SocialBar variant="floating-mobile" />
      <MobileBottomNav currentPath={currentPath} onNavigate={(path) => navigate(path)} />
      <CartDrawer onNavigate={(path) => navigate(path)} />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <StoreProvider>
          <CartProvider>
            <AdminAuthProvider>
              <ErrorBoundary>
                <AppContent />
              </ErrorBoundary>
            </AdminAuthProvider>
          </CartProvider>
        </StoreProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
