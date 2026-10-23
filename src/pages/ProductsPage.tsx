import React, { useEffect, useState, useMemo } from 'react';
import { SlidersHorizontal, Search, RotateCcw } from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ProductCard } from '../components/product/ProductCard';
import { ZoneMarquee } from '../motion/ZoneMarquee';
import {
  FilterState,
  ProductFilterModal,
} from '../components/product/ProductFilterModal';

interface ProductsPageProps {
  onSelectProduct: (slug: string) => void;
  initialCategory?: string;
  initialFilter?: string;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  onSelectProduct,
  initialCategory = '',
  initialFilter = '',
}) => {
  const { categories } = useStore();
  const { isDark } = useTheme();
  const { language } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeCategories = useMemo(
    () =>
      (categories || []).filter(
        (category) => category.is_active !== false
      ),
    [categories]
  );

  /**
   * Resolve the category coming from the URL.
   *
   * Home page uses the category slug:
   * /products?category=box-fit
   *
   * Products themselves use category_id:
   * product.category_id = UUID
   *
   * So we support both UUID and slug here.
   */
  const resolvedCategoryId = useMemo(() => {
    if (!initialCategory) return '';

    const byId = activeCategories.find(
      (category) => category.id === initialCategory
    );

    if (byId) return byId.id;

    const normalizedSlug = initialCategory.trim().toLowerCase();

    const bySlug = activeCategories.find(
      (category) =>
        category.slug.trim().toLowerCase() === normalizedSlug
    );

    return bySlug?.id || '';
  }, [initialCategory, activeCategories]);

  const selectedCategory = useMemo(() => {
    if (!resolvedCategoryId) return null;

    return (
      activeCategories.find(
        (category) => category.id === resolvedCategoryId
      ) || null
    );
  }, [resolvedCategoryId, activeCategories]);

  const [filters, setFilters] = useState<FilterState>({
    categoryId: resolvedCategoryId,
    size: '',
    color: '',
    inStockOnly: false,
    minPrice: 0,
    maxPrice: 2000,
    sortBy: 'newest',
  });

  const loadProducts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err: any) {
      console.error('Failed to load products:', err);
      setError(
        err.message ||
          (language === 'en'
            ? 'Unable to load products right now'
            : 'تعذر تحميل المنتجات حاليًا')
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      categoryId: resolvedCategoryId,
    }));
  }, [resolvedCategoryId]);

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();

          const matchName =
            (p.name || '').toLowerCase().includes(q) ||
            (p.name_en || '').toLowerCase().includes(q);

          const matchDesc =
            (p.description || '').toLowerCase().includes(q) ||
            (p.description_en || '').toLowerCase().includes(q);

          const matchFabric =
            (p.fabric_details || '').toLowerCase().includes(q) ||
            (p.fabric_details_en || '').toLowerCase().includes(q);

          if (!matchName && !matchDesc && !matchFabric) {
            return false;
          }
        }

        // Category
        if (
          filters.categoryId &&
          p.category_id !== filters.categoryId
        ) {
          return false;
        }

        // New arrivals
        if (initialFilter === 'new' && !p.is_new) {
          return false;
        }

        // Price
        if (p.price < filters.minPrice) {
          return false;
        }

        // 2000 is the slider's upper bound and means "no upper limit";
        // otherwise products priced above it would silently disappear.
        if (filters.maxPrice < 2000 && p.price > filters.maxPrice) {
          return false;
        }

        // Size
        if (filters.size) {
          const hasSize = p.variants?.some(
            (v) =>
              v.size === filters.size &&
              v.stock_quantity > 0
          );

          if (!hasSize) return false;
        }

        // Color
        if (filters.color) {
          const hasColor = p.variants?.some(
            (v) =>
              v.color === filters.color &&
              v.stock_quantity > 0
          );

          if (!hasColor) return false;
        }

        // In stock
        if (filters.inStockOnly) {
          const totalStock =
            p.variants?.reduce(
              (sum, v) => sum + v.stock_quantity,
              0
            ) || 0;

          if (totalStock <= 0) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'price_asc') {
          return a.price - b.price;
        }

        if (filters.sortBy === 'price_desc') {
          return b.price - a.price;
        }

        return (
          (new Date(b.created_at || '').getTime() || 0) -
          (new Date(a.created_at || '').getTime() || 0)
        );
      });
  }, [
    products,
    searchQuery,
    filters,
    initialFilter,
  ]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;

    if (filters.categoryId) count++;
    if (filters.size) count++;
    if (filters.color) count++;
    if (filters.inStockOnly) count++;

    if (
      filters.minPrice > 0 ||
      filters.maxPrice < 2000
    ) {
      count++;
    }

    if (filters.sortBy !== 'newest') count++;

    return count;
  }, [filters]);

  const resetAllFilters = () => {
    setFilters({
      categoryId: '',
      size: '',
      color: '',
      inStockOnly: false,
      minPrice: 0,
      maxPrice: 2000,
      sortBy: 'newest',
    });

    setSearchQuery('');
  };

  const selectCategory = (categoryId: string) => {
    setFilters((prev) => ({
      ...prev,
      categoryId,
    }));
  };

  const getCategoryName = (category: (typeof activeCategories)[number]) =>
    language === 'en'
      ? category.name_en || category.name
      : category.name;

  const selectedCategoryName = selectedCategory
    ? getCategoryName(selectedCategory)
    : '';

  return (
    <div data-oz-scene className="max-w-7xl mx-auto px-3.5 sm:px-6 py-6 sm:py-8 w-full max-w-full overflow-x-hidden">

      {/* Title */}
      <div className="mb-8 space-y-4">
        <div className="text-right">
          <h1
            className={`text-2xl sm:text-3xl font-extrabold ${
              isDark ? 'text-white' : 'text-neutral-900'
            }`}
          >
            {selectedCategory
              ? selectedCategoryName
              : initialFilter === 'new'
                ? language === 'en'
                  ? 'New Arrivals'
                  : 'وصل حديثًا'
                : language === 'en'
                  ? 'Streetwear Collection'
                  : 'تشكيلة الستريت وير'}
          </h1>

          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            {selectedCategory
              ? language === 'en'
                ? `Browse all products in ${selectedCategoryName}`
                : `تصفح جميع منتجات قسم ${selectedCategoryName}`
              : language === 'en'
                ? 'All styles are made with heavyweight cotton fabrics and available for cash on delivery.'
                : 'جميع الموديلات مصممة بخامات قطنية ثقيلة ومتاحة للدفع عند الاستلام.'}
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder={
                language === 'en'
                  ? 'Search by model, fabric, or fit...'
                  : 'ابحث عن موديل، خامة، أو قصة...'
              }
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const normalized =
                    searchQuery.trim();

                  if (
                    normalized.toLowerCase() ===
                    'admin'
                  ) {
                    e.preventDefault();
                    setSearchQuery('');

                    window.history.pushState(
                      {},
                      '',
                      '/admin'
                    );

                    window.dispatchEvent(
                      new PopStateEvent('popstate')
                    );
                  }
                }
              }}
              className={`w-full rounded-lg py-2.5 pr-10 pl-4 text-xs transition-colors focus:outline-none border ${
                isDark
                  ? 'bg-[#121216] border-neutral-800 text-white placeholder-neutral-500 focus:border-neutral-600'
                  : 'bg-white border-neutral-200 text-black placeholder-neutral-400 focus:border-neutral-400 shadow-xs'
              }`}
            />

            <Search className="w-4 h-4 text-neutral-400 absolute top-3 right-3.5" />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setIsFilterModalOpen(true)
              }
              className={`flex items-center gap-2 py-2.5 px-4 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                activeFiltersCount > 0
                  ? isDark
                    ? 'bg-neutral-800 text-white border-neutral-600'
                    : 'bg-black text-white border-black'
                  : isDark
                  ? 'bg-[#121216] text-neutral-300 border-neutral-800 hover:border-neutral-700'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400 shadow-xs'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />

              <span>
                {language === 'en'
                  ? 'Filter & Sort'
                  : 'تصفية وترتيب'}
              </span>

              {activeFiltersCount > 0 && (
                <span
                  className={`w-5 h-5 rounded-full font-bold text-[10px] flex items-center justify-center font-mono-numbers ${
                    isDark ? 'bg-white text-black' : 'bg-neutral-900 text-white'
                  }`}
                >
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={resetAllFilters}
                className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                  isDark
                    ? 'border-neutral-800 bg-[#121216] text-neutral-400 hover:text-white'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:text-black shadow-xs'
                }`}
                title={
                  language === 'en'
                    ? 'Reset filters'
                    : 'إعادة تعيين الفلاتر'
                }
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Categories */}
        <div data-oz-category-chips className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs w-full max-w-full min-w-0">

          <button
            onClick={() => selectCategory('')}
            className={`py-1.5 px-3.5 rounded-lg border whitespace-nowrap transition-colors cursor-pointer ${
              !filters.categoryId
                ? isDark
                  ? 'bg-white text-black font-bold border-white'
                  : 'bg-black text-white font-bold border-black'
                : isDark
                ? 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 shadow-xs'
            }`}
          >
            {language === 'en'
              ? `All Models (${products.length})`
              : `جميع الموديلات (${products.length})`}
          </button>

          {activeCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                selectCategory(cat.id)
              }
              className={`py-1.5 px-3.5 rounded-lg border whitespace-nowrap transition-colors cursor-pointer ${
                filters.categoryId === cat.id
                  ? isDark
                    ? 'bg-white text-black font-bold border-white'
                    : 'bg-black text-white font-bold border-black'
                  : isDark
                  ? 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 shadow-xs'
              }`}
            >
              {getCategoryName(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Products */}
      {error ? (
        <div className="py-16 text-center border border-neutral-800/80 rounded-2xl bg-[#101014] p-8 space-y-4">
          <p className="text-base font-bold text-neutral-300">
            {error}
          </p>

          <button
            onClick={loadProducts}
            className="inline-flex items-center gap-2 py-2.5 px-6 bg-white text-black font-bold text-xs rounded-lg hover:bg-neutral-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>
              {language === 'en'
                ? 'Try Again'
                : 'إعادة المحاولة'}
            </span>
          </button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="aspect-[3/4] bg-neutral-900/60 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center border border-neutral-800/80 rounded-2xl bg-[#101014] p-8">

          <p className="text-base font-bold text-neutral-300 mb-2">
            {language === 'en'
              ? 'No products match your search or filters'
              : 'لا توجد منتجات مطابقة لخيارات البحث أو الفلترة'}
          </p>

          <p className="text-xs text-neutral-500 mb-6">
            {language === 'en'
              ? 'Try removing some filters or resetting them to see more styles'
              : 'جرب إلغاء بعض الفلاتر المحددة أو إعادة التعيين لرؤية باقي الموديلات'}
          </p>

          <button
            onClick={resetAllFilters}
            className="py-2.5 px-6 bg-white text-black font-bold text-xs rounded-lg hover:bg-neutral-200 transition-colors"
          >
            {language === 'en'
              ? 'Reset Filters'
              : 'إعادة تعيين الفلاتر'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={(slug) =>
                onSelectProduct(slug)
              }
            />
          ))}
        </div>
      )}

      <div className="-mx-3.5 sm:-mx-6 my-10" aria-label={language === 'en' ? 'Outfit Zone collection divider' : 'فاصل مجموعة Outfit Zone'}>
        <ZoneMarquee />
      </div>

      {/* Filter Modal */}
      <ProductFilterModal
        isOpen={isFilterModalOpen}
        onClose={() =>
          setIsFilterModalOpen(false)
        }
        categories={activeCategories}
        filters={filters}
        onApplyFilters={(f) =>
          setFilters(f)
        }
        onResetFilters={resetAllFilters}
      />
    </div>
  );
};