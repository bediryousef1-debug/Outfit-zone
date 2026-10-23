import React, { useState, useEffect } from 'react';
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
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { initSourceTracker } from './utils/sourceTracker';
import { AdminLayout } from './pages/admin/AdminLayout';
import type { AdminTab } from './pages/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminProductEditPage } from './pages/admin/AdminProductEditPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminOrderDetailPage } from './pages/admin/AdminOrderDetailPage';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage';
import { AdminContentPage } from './pages/admin/AdminContentPage';
import { AdminContactPage } from './pages/admin/AdminContactPage';
import { AdminHeroSliderPage } from './pages/admin/AdminHeroSliderPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

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

  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionPreference.matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.92,
      touchMultiplier: 1.05,
    });

    const syncScroll = () => ScrollTrigger.update();
    const frame = (time: number) => lenis.raf(time * 1000);
    const scrollToTop = () => lenis.scrollTo(0, { duration: 0.85, easing: (t) => 1 - Math.pow(1 - t, 4) });

    lenis.on('scroll', syncScroll);
    gsap.ticker.add(frame);
    gsap.ticker.lagSmoothing(0);
    window.addEventListener('oz:scroll-top', scrollToTop);

    const motionContext = gsap.context(() => {
      const pageSections = main.querySelectorAll<HTMLElement>(
        '.oz-home-page .oz-motion-section:not(.oz-hero-stage), .oz-page-motion section, .oz-page-motion [data-oz-scroll-scene]'
      );

      pageSections.forEach((section) => {
        const headings = section.querySelectorAll<HTMLElement>('h2, h3, [data-oz-motion-heading]');
        if (headings.length) {
          gsap.fromTo(headings,
            { autoAlpha: 0, y: 34, clipPath: 'inset(0 0 16% 0)' },
            {
              autoAlpha: 1,
              y: 0,
              clipPath: 'inset(0 0 0% 0)',
              duration: 0.9,
              stagger: 0.1,
              ease: 'power4.out',
              clearProps: 'clipPath',
              scrollTrigger: { trigger: section, start: 'top 84%', once: true },
            }
          );
        }

        const cards = section.querySelectorAll<HTMLElement>('[data-oz-motion-card], .oz-card-hover');
        if (cards.length) {
          gsap.fromTo(cards,
            { autoAlpha: 0, y: 38, scale: 0.965, rotateX: 2, transformPerspective: 1100 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              rotateX: 0,
              duration: 0.82,
              stagger: { each: 0.065, from: 'start' },
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
            { clipPath: 'inset(7% 4% 7% 4% round 12px)', scale: 1.055, filter: 'saturate(.78)' },
            {
              clipPath: 'inset(0% 0% 0% 0% round 0px)',
              scale: 1,
              filter: 'saturate(1)',
              duration: 1.15,
              stagger: 0.08,
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
          { autoAlpha: 0, y: 28, filter: 'blur(5px)' },
          {
            autoAlpha: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.88,
            stagger: 0.11,
            ease: 'power4.out',
            clearProps: 'filter',
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

    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.dispatchEvent(new Event('oz:scroll-top'));
  };

  const pathname = currentPath.split('?')[0].replace(/(.)\/+$/, '$1') || '/';
  const search = currentPath.includes('?') ? currentPath.slice(currentPath.indexOf('?')) : '';

  // SEO document title sync per page (follows the selected language)
  useEffect(() => {
    const isAr = language === 'ar';
    if (pathname === '/') {
      document.title = isAr
        ? 'Outfit Zone | Wear In The Zone - براند ستريت وير مصري'
        : 'Outfit Zone | Wear In The Zone - Egyptian Streetwear Brand';
    } else if (pathname.startsWith('/products/')) {
      document.title = isAr ? 'تفاصيل الموديل | Outfit Zone' : 'Product Details | Outfit Zone';
    } else if (pathname.startsWith('/products')) {
      document.title = isAr ? 'تشكيلة الستريت وير | Outfit Zone' : 'Streetwear Collection | Outfit Zone';
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
        <AdminLoginPage
          onBackToStore={() => navigate('/')}
          onLoginSuccess={() => navigate('/admin')}
        />
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
        <div
          key={pathname}
          className={pathname === '/' ? undefined : 'oz-page-motion'}
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
