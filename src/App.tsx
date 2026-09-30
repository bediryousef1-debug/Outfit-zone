import React, { useEffect, useState, Suspense, lazy } from 'react';

import { CartProvider, useCart } from './context/CartContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { SocialBar } from './components/layout/SocialBar';
import { WhatsAppFloatingButton } from './components/layout/WhatsAppFloatingButton';
import { CartDrawer } from './components/cart/CartDrawer';

import HomePage from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';

import type { AdminTab } from './pages/admin/AdminLayout';


// ============================================================================
// ADMIN LAZY IMPORTS
// ============================================================================

const AdminLoginPage = lazy(function loadAdminLoginPage() {
  return import('./pages/admin/AdminLoginPage').then(function (module) {
    return {
      default: module.AdminLoginPage,
    };
  });
});

const AdminLayout = lazy(function loadAdminLayout() {
  return import('./pages/admin/AdminLayout').then(function (module) {
    return {
      default: module.AdminLayout,
    };
  });
});

const AdminDashboardPage = lazy(function loadAdminDashboardPage() {
  return import('./pages/admin/AdminDashboardPage').then(function (module) {
    return {
      default: module.AdminDashboardPage,
    };
  });
});

const AdminProductsPage = lazy(function loadAdminProductsPage() {
  return import('./pages/admin/AdminProductsPage').then(function (module) {
    return {
      default: module.AdminProductsPage,
    };
  });
});

const AdminProductEditPage = lazy(function loadAdminProductEditPage() {
  return import('./pages/admin/AdminProductEditPage').then(function (module) {
    return {
      default: module.AdminProductEditPage,
    };
  });
});

const AdminCategoriesPage = lazy(function loadAdminCategoriesPage() {
  return import('./pages/admin/AdminCategoriesPage').then(function (module) {
    return {
      default: module.AdminCategoriesPage,
    };
  });
});

const AdminOrdersPage = lazy(function loadAdminOrdersPage() {
  return import('./pages/admin/AdminOrdersPage').then(function (module) {
    return {
      default: module.AdminOrdersPage,
    };
  });
});

const AdminOrderDetailPage = lazy(function loadAdminOrderDetailPage() {
  return import('./pages/admin/AdminOrderDetailPage').then(function (module) {
    return {
      default: module.AdminOrderDetailPage,
    };
  });
});

const AdminContentPage = lazy(function loadAdminContentPage() {
  return import('./pages/admin/AdminContentPage').then(function (module) {
    return {
      default: module.AdminContentPage,
    };
  });
});

const AdminContactPage = lazy(function loadAdminContactPage() {
  return import('./pages/admin/AdminContactPage').then(function (module) {
    return {
      default: module.AdminContactPage,
    };
  });
});

const AdminSettingsPage = lazy(function loadAdminSettingsPage() {
  return import('./pages/admin/AdminSettingsPage').then(function (module) {
    return {
      default: module.AdminSettingsPage,
    };
  });
});


// ============================================================================
// ADMIN LOADING
// ============================================================================

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


// ============================================================================
// APP CONTENT
// ============================================================================

function AppContent() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const { content } = useStore();
  const { itemCount, isCartOpen, setIsCartOpen } = useCart();
  const { isDark } = useTheme();

  const [currentPath, setCurrentPath] = useState(function () {
    return window.location.pathname || '/';
  });


  // ==========================================================================
  // BROWSER HISTORY
  // ==========================================================================

  useEffect(function () {
    function handlePopState() {
      setCurrentPath(window.location.pathname || '/');
    }

    window.addEventListener('popstate', handlePopState);

    return function () {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);


  // ==========================================================================
  // NAVIGATION
  // ==========================================================================

  function navigate(path: string) {
    window.history.pushState({}, '', path);
    setCurrentPath(path);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }


  // ==========================================================================
  // PAGE TITLE
  // ==========================================================================

  useEffect(
    function () {
      if (currentPath === '/') {
        document.title =
          'Outfit Zone | Wear In The Zone - براند ستريت وير مصري';
        return;
      }

      if (currentPath.indexOf('/products/') === 0) {
        document.title = 'تفاصيل الموديل | Outfit Zone';
        return;
      }

      if (currentPath.indexOf('/products') === 0) {
        document.title = 'تشكيلة الستريت وير | Outfit Zone';
        return;
      }

      if (currentPath === '/cart') {
        document.title = 'سلة المشتريات | Outfit Zone';
        return;
      }

      if (currentPath === '/checkout') {
        document.title = 'إتمام الطلب (الدفع عند الاستلام) | Outfit Zone';
        return;
      }

      if (currentPath.indexOf('/order-success/') === 0) {
        document.title = 'تم استلام طلبك بنجاح | Outfit Zone';
        return;
      }

      if (currentPath === '/about') {
        document.title = 'قصتنا وعن البراند | Outfit Zone';
        return;
      }

      if (currentPath === '/contact') {
        document.title = 'تواصل معنا | Outfit Zone';
        return;
      }

      if (currentPath.indexOf('/admin') === 0) {
        document.title = 'لوحة التحكم | Outfit Zone Admin';
      }
    },
    [currentPath]
  );


  // ==========================================================================
  // ROUTE PARSING
  // ==========================================================================

  const isProductDetail =
    currentPath.indexOf('/products/') === 0 &&
    currentPath !== '/products';

  let productSlug = '';

  if (isProductDetail) {
    productSlug = currentPath
      .replace('/products/', '')
      .split('?')[0];
  }

  const isOrderSuccess =
    currentPath.indexOf('/order-success/') === 0;

  let orderNumber = '';

  if (isOrderSuccess) {
    orderNumber = currentPath
      .replace('/order-success/', '')
      .split('?')[0];
  }

  const isAdminRoute =
    currentPath.indexOf('/admin') === 0;


  // ==========================================================================
  // ADMIN ROUTES
  // ==========================================================================

  if (isAdminRoute) {
    if (authLoading) {
      return <AdminLoadingSpinner />;
    }

    if (!isAuthenticated) {
      return (
        <Suspense fallback={<AdminLoadingSpinner />}>
          <AdminLoginPage
            onBackToStore={function () {
              navigate('/');
            }}
            onLoginSuccess={function () {
              navigate('/admin');
            }}
          />
        </Suspense>
      );
    }

    if (currentPath === '/admin/login') {
      window.history.replaceState({}, '', '/admin');
    }


    // ------------------------------------------------------------------------
    // ADMIN ACTIVE TAB
    // ------------------------------------------------------------------------

    let activeTab: AdminTab = 'dashboard';

    if (currentPath.indexOf('/admin/products') === 0) {
      activeTab = 'products';
    } else if (currentPath.indexOf('/admin/categories') === 0) {
      activeTab = 'categories';
    } else if (currentPath.indexOf('/admin/orders') === 0) {
      activeTab = 'orders';
    } else if (currentPath.indexOf('/admin/content') === 0) {
      activeTab = 'content';
    } else if (currentPath.indexOf('/admin/contact') === 0) {
      activeTab = 'contact';
    } else if (currentPath.indexOf('/admin/settings') === 0) {
      activeTab = 'settings';
    }


    // ------------------------------------------------------------------------
    // PRODUCT ADMIN ROUTES
    // ------------------------------------------------------------------------

    const isNewProduct =
      currentPath === '/admin/products/new';

    const isEditProduct =
      currentPath.indexOf('/admin/products/') === 0 &&
      currentPath.endsWith('/edit');

    let editProductId: string | null = null;

    if (isEditProduct) {
      editProductId = currentPath
        .replace('/admin/products/', '')
        .replace('/edit', '');
    }


    // ------------------------------------------------------------------------
    // ORDER ADMIN ROUTES
    // ------------------------------------------------------------------------

    const isOrderDetail =
      currentPath.indexOf('/admin/orders/') === 0 &&
      currentPath !== '/admin/orders';

    let orderDetailId: string | null = null;

    if (isOrderDetail) {
      orderDetailId = currentPath.replace(
        '/admin/orders/',
        ''
      );
    }


    // ------------------------------------------------------------------------
    // ADMIN UI
    // ------------------------------------------------------------------------

    return (
      <Suspense fallback={<AdminLoadingSpinner />}>
        <AdminLayout
          currentTab={activeTab}
          onSelectTab={function (tab) {
            if (tab === 'dashboard') {
              navigate('/admin');
            }

            if (tab === 'products') {
              navigate('/admin/products');
            }

            if (tab === 'categories') {
              navigate('/admin/categories');
            }

            if (tab === 'orders') {
              navigate('/admin/orders');
            }

            if (tab === 'content') {
              navigate('/admin/content');
            }

            if (tab === 'contact') {
              navigate('/admin/contact');
            }

            if (tab === 'settings') {
              navigate('/admin/settings');
            }
          }}
          onExitAdmin={function () {
            navigate('/');
          }}
        >

          {/* ADMIN DASHBOARD */}

          {activeTab === 'dashboard' && (
            <AdminDashboardPage
              onNavigateTab={function (tab) {
                if (tab === 'dashboard') {
                  navigate('/admin');
                }

                if (tab === 'products') {
                  navigate('/admin/products');
                }

                if (tab === 'categories') {
                  navigate('/admin/categories');
                }

                if (tab === 'orders') {
                  navigate('/admin/orders');
                }

                if (tab === 'content') {
                  navigate('/admin/content');
                }

                if (tab === 'contact') {
                  navigate('/admin/contact');
                }

                if (tab === 'settings') {
                  navigate('/admin/settings');
                }
              }}
              onSelectOrder={function (id) {
                navigate('/admin/orders/' + id);
              }}
              onNewProduct={function () {
                navigate('/admin/products/new');
              }}
            />
          )}


          {/* ADMIN PRODUCTS */}

          {activeTab === 'products' && (
            <>
              {isNewProduct ? (
                <AdminProductEditPage
                  productId={null}
                  onBack={function () {
                    navigate('/admin/products');
                  }}
                  onSaved={function () {
                    navigate('/admin/products');
                  }}
                />
              ) : isEditProduct && editProductId ? (
                <AdminProductEditPage
                  productId={editProductId}
                  onBack={function () {
                    navigate('/admin/products');
                  }}
                  onSaved={function () {
                    navigate('/admin/products');
                  }}
                />
              ) : (
                <AdminProductsPage
                  onNewProduct={function () {
                    navigate('/admin/products/new');
                  }}
                  onEditProduct={function (id) {
                    navigate('/admin/products/' + id + '/edit');
                  }}
                />
              )}
            </>
          )}


          {/* ADMIN CATEGORIES */}

          {activeTab === 'categories' && (
            <AdminCategoriesPage />
          )}


          {/* ADMIN ORDERS */}

          {activeTab === 'orders' && (
            <>
              {isOrderDetail && orderDetailId ? (
                <AdminOrderDetailPage
                  orderId={orderDetailId}
                  onBack={function () {
                    navigate('/admin/orders');
                  }}
                />
              ) : (
                <AdminOrdersPage
                  onSelectOrder={function (id) {
                    navigate('/admin/orders/' + id);
                  }}
                />
              )}
            </>
          )}


          {/* ADMIN CONTENT */}

          {activeTab === 'content' && (
            <AdminContentPage />
          )}


          {/* ADMIN CONTACT */}

          {activeTab === 'contact' && (
            <AdminContactPage />
          )}


          {/* ADMIN SETTINGS */}

          {activeTab === 'settings' && (
            <AdminSettingsPage />
          )}

        </AdminLayout>
      </Suspense>
    );
  }


  // ==========================================================================
  // CUSTOMER STOREFRONT
  // ==========================================================================

  let storefrontClassName =
    'min-h-screen flex flex-col font-sans transition-colors ';

  if (isDark) {
    storefrontClassName +=
      'bg-[#09090b] text-[#f4f4f5] selection:bg-neutral-800 selection:text-white';
  } else {
    storefrontClassName +=
      'bg-[#f9f9fb] text-[#09090b] selection:bg-neutral-200 selection:text-black';
  }


  return (
    <div className={storefrontClassName}>

      {/* HEADER */}

      <Header
        itemCount={itemCount}
        setIsCartOpen={setIsCartOpen}
        onNavigate={function (path) {
          navigate(path);
        }}
        currentPath={currentPath}
        announcementText={content?.announcement_text}
      />


      {/* MAIN */}

      <main className="flex-1 pb-24 md:pb-16">

        {/* HOME */}

        {currentPath === '/' && (
          <HomePage
            onNavigate={function (path) {
              navigate(path);
            }}
            onSelectProduct={function (slug) {
              navigate('/products/' + slug);
            }}
          />
        )}


        {/* PRODUCTS */}

        {currentPath === '/products' && (
          <ProductsPage
            onSelectProduct={function (slug) {
              navigate('/products/' + slug);
            }}
          />
        )}


        {/* PRODUCTS WITH QUERY */}

        {currentPath.indexOf('/products?') === 0 &&
          !isProductDetail && (
            <ProductsPage
              onSelectProduct={function (slug) {
                navigate('/products/' + slug);
              }}
              initialCategory={
                new URLSearchParams(
                  currentPath.split('?')[1]
                ).get('category') || ''
              }
              initialFilter={
                new URLSearchParams(
                  currentPath.split('?')[1]
                ).get('filter') || ''
              }
            />
          )}


        {/* PRODUCT DETAIL */}

        {isProductDetail && productSlug && (
          <ProductDetailPage
            slug={productSlug}
            onBack={function () {
              navigate('/products');
            }}
            onNavigate={function (path) {
              navigate(path);
            }}
          />
        )}


        {/* CART */}

        {currentPath === '/cart' && (
          <CartPage
            onNavigate={function (path) {
              navigate(path);
            }}
          />
        )}


        {/* CHECKOUT */}

        {currentPath === '/checkout' && (
          <CheckoutPage
            onNavigate={function (path) {
              navigate(path);
            }}
            onOrderSuccess={function (orderNum, token) {
              let url =
                '/order-success/' + orderNum;

              if (token) {
                url += '?t=' + token;
              }

              navigate(url);
            }}
          />
        )}


        {/* ORDER SUCCESS */}

        {isOrderSuccess && orderNumber && (
          <OrderSuccessPage
            orderNumber={orderNumber}
            onNavigate={function (path) {
              navigate(path);
            }}
          />
        )}


        {/* ABOUT */}

        {currentPath === '/about' && (
          <AboutPage
            onNavigate={function (path) {
              navigate(path);
            }}
          />
        )}


        {/* CONTACT */}

        {currentPath === '/contact' && (
          <ContactPage />
        )}

      </main>


      {/* FOOTER */}

      <Footer
        onNavigate={function (path) {
          navigate(path);
        }}
      />


      {/* FLOATING ELEMENTS */}

      <WhatsAppFloatingButton />

      <SocialBar variant="floating-mobile" />

      <MobileBottomNav
        currentPath={currentPath}
        onNavigate={function (path) {
          navigate(path);
        }}
      />

      <CartDrawer
        onNavigate={function (path) {
          navigate(path);
        }}
      />

    </div>
  );
}


// ============================================================================
// ROOT APP
// ============================================================================

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
