import React, { useState, useEffect, Suspense, lazy } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
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
import type { AdminTab } from './pages/admin/AdminLayout';

// Performance optimization: Lazy-load admin bundle so customer storefront remains ultra-fast
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage').then(m => ({ default: m.AdminProductsPage })));
const AdminProductEditPage = lazy(() => import('./pages/admin/AdminProductEditPage').then(m => ({ default: m.AdminProductEditPage })));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage').then(m => ({ default: m.AdminCategoriesPage })));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage').then(m => ({ default: m.AdminOrdersPage })));
const AdminOrderDetailPage = lazy(() => import('./pages/admin/AdminOrderDetailPage').then(m => ({ default: m.AdminOrderDetailPage })));
const AdminContentPage = lazy(() => import('./pages/admin/AdminContentPage').then(m => ({ default: m.AdminContentPage })));
const AdminContactPage = lazy(() => import('./pages/admin/AdminContactPage').then(m => ({ default: m.AdminContactPage })));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })));

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

function AppContent() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const { content } = useStore();
  const { itemCount, isCartOpen, setIsCartOpen } = useCart();
  const { isDark } = useTheme();

  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  // Sync browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // SEO document title sync per page
  useEffect(() => {
    if (currentPath === '/') {
      document.title = 'Outfit Zone | Wear In The Zone - براند ستريت وير مصري';
    } else if (currentPath.startsWith('/products/')) {
      document.title = 'تفاصيل الموديل | Outfit Zone';
    } else if (currentPath.startsWith('/products')) {
      document.title = 'تشكيلة الستريت وير | Outfit Zone';
    } else if (currentPath === '/cart') {
      document.title = 'سلة المشتريات | Outfit Zone';
    } else if (currentPath === '/checkout') {
      document.title = 'إتمام الطلب (الدفع عند الاستلام) | Outfit Zone';
    } else if (currentPath.startsWith('/order-success/')) {
      document.title = 'تم استلام طلبك بنجاح | Outfit Zone';
    } else if (currentPath === '/about') {
      document.title = 'قصتنا وعن البراند | Outfit Zone';
    } else if (currentPath === '/contact') {
      document.title = 'تواصل معنا | Outfit Zone';
    } else if (currentPath.startsWith('/admin')) {
      document.title = 'لوحة التحكم | Outfit Zone Admin';
    }
  }, [currentPath]);

  // Route Parsers
  const isProductDetail = currentPath.startsWith('/products/') && currentPath !== '/products';
  const productSlug = isProductDetail ? currentPath.replace('/products/', '').split('?')[0] : '';

  const isOrderSuccess = currentPath.startsWith('/order-success/');
  const orderNumber = isOrderSuccess ? currentPath.replace('/order-success/', '').split('?')[0] : '';

  const isAdminRoute = currentPath.startsWith('/admin');

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
        <Suspense fallback={<AdminLoadingSpinner />}>
          <AdminLoginPage
            onBackToStore={() => navigate('/')}
            onLoginSuccess={() => navigate('/admin')}
          />
        </Suspense>
      );
    }

    // If authenticated user visits /admin/login, direct them to /admin dashboard directly
    if (currentPath === '/admin/login') {
      window.history.replaceState({}, '', '/admin');
    }

    // Authenticated admin routing:
    let activeTab: AdminTab = 'dashboard';
    if (currentPath.startsWith('/admin/products')) {
      activeTab = 'products';
    } else if (currentPath.startsWith('/admin/categories')) {
      activeTab = 'categories';
    } else if (currentPath.startsWith('/admin/orders')) {
      activeTab = 'orders';
    } else if (currentPath.startsWith('/admin/content')) {
      activeTab = 'content';
    } else if (currentPath.startsWith('/admin/contact')) {
      activeTab = 'contact';
    } else if (currentPath.startsWith('/admin/settings')) {
      activeTab = 'settings';
    }

    // Parse edit product / view order IDs
    const isNewProduct = currentPath === '/admin/products/new';
    const isEditProduct = currentPath.startsWith('/admin/products/') && currentPath.endsWith('/edit');
    const editProductId = isEditProduct
      ? currentPath.replace('/admin/products/', '').replace('/edit', '')
      : null;

    const isOrderDetail =
      currentPath.startsWith('/admin/orders/') && currentPath !== '/admin/orders';
    const orderDetailId = isOrderDetail ? currentPath.replace('/admin/orders/', '') : null;

    return (
      <Suspense fallback={<AdminLoadingSpinner />}>
        <AdminLayout
          currentTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'dashboard') navigate('/admin');
            if (tab === 'products') navigate('/admin/products');
            if (tab === 'categories') navigate('/admin/categories');
            if (tab === 'orders') navigate('/admin/orders');
            if (tab === 'content') navigate('/admin/content');
            if (tab === 'contact') navigate('/admin/contact');
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
                if (tab === 'content') navigate('/admin/content');
                if (tab === 'contact') navigate('/admin/contact');
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

          {/* /admin/content */}
          {activeTab === 'content' && <AdminContentPage />}

          {/* /admin/contact */}
          {activeTab === 'contact' && <AdminContactPage />}

          {/* /admin/settings */}
          {activeTab === 'settings' && <AdminSettingsPage />}
        </AdminLayout>
      </Suspense>
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
        currentPath={currentPath}
        announcementText={content?.announcement_text}
      />

      {/* Main Storefront Views */}
      <main className="flex-1 pb-24 md:pb-16 w-full max-w-full overflow-x-hidden">
        {/* / (Home) */}
        {currentPath === '/' && (
          <HomePage
            onNavigate={(path) => navigate(path)}
            onSelectProduct={(slug) => navigate(`/products/${slug}`)}
          />
        )}

        {/* /products */}
        {currentPath === '/products' && (
          <ProductsPage
            onSelectProduct={(slug) => navigate(`/products/${slug}`)}
          />
        )}

        {/* /products?category=... */}
        {currentPath.startsWith('/products?') && !isProductDetail && (
          <ProductsPage
            onSelectProduct={(slug) => navigate(`/products/${slug}`)}
            initialCategory={new URLSearchParams(currentPath.split('?')[1]).get('category') || ''}
            initialFilter={new URLSearchParams(currentPath.split('?')[1]).get('filter') || ''}
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
        {currentPath === '/cart' && (
          <CartPage
            onNavigate={(path) => navigate(path)}
          />
        )}

        {/* /checkout */}
        {currentPath === '/checkout' && (
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
        {currentPath === '/about' && (
          <AboutPage onNavigate={(path) => navigate(path)} />
        )}

        {/* /contact */}
        {currentPath === '/contact' && (
          <ContactPage />
        )}
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
              <AppContent />
            </AdminAuthProvider>
          </CartProvider>
        </StoreProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
