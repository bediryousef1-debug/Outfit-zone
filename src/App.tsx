import React, { useState, useEffect } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
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
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminLayout, AdminTab } from './pages/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminProductEditPage } from './pages/admin/AdminProductEditPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminOrderDetailPage } from './pages/admin/AdminOrderDetailPage';
import { AdminContentPage } from './pages/admin/AdminContentPage';
import { AdminContactPage } from './pages/admin/AdminContactPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

function AppContent() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const { content } = useStore();
  const { itemCount, isCartOpen, setIsCartOpen } = useCart();

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
  // ADMIN ROUTES (Strictly separate from customer interface)
  // ==============================================================================
  if (isAdminRoute) {
    if (authLoading) {
      return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-xs text-neutral-400">
          جاري التحقق من صلاحيات المسؤول...
        </div>
      );
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
              <AdminOrdersPage onSelectOrder={(id) => navigate(`/admin/orders/${id}`)} />
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
    );
  }

  // ==============================================================================
  // CUSTOMER STOREFRONT ROUTES (Zero admin elements)
  // ==============================================================================
  return (
    <div className="min-h-screen bg-[#0c0c0e] text-[#ededed] flex flex-col justify-between selection:bg-neutral-800 selection:text-white">
      {/* Customer Header */}
      <Header
        currentPath={currentPath}
        onNavigate={(path) => navigate(path)}
        itemCount={itemCount}
        setIsCartOpen={setIsCartOpen}
        announcementText={content?.announcement_text}
      />

      {/* Customer Page Views */}
      <main className="flex-1">
        {/* / Home */}
        {currentPath === '/' && (
          <HomePage
            onNavigate={(path) => navigate(path)}
            onSelectProduct={(slug) => navigate(`/products/${slug}`)}
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

        {/* /products */}
        {currentPath.startsWith('/products') && !isProductDetail && (
          <ProductsPage
            onSelectProduct={(slug) => navigate(`/products/${slug}`)}
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
            onOrderSuccess={(orderId) => navigate(`/order-success/${orderId}`)}
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

      {/* Floating Elements (WhatsApp & Cart Drawer) */}
      <WhatsAppFloatingButton />
      <CartDrawer onNavigate={(path) => navigate(path)} />
    </div>
  );
}

export function App() {
  return (
    <StoreProvider>
      <CartProvider>
        <AdminAuthProvider>
          <AppContent />
        </AdminAuthProvider>
      </CartProvider>
    </StoreProvider>
  );
}

export default App;
