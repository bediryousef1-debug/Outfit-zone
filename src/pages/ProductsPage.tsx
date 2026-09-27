import React, { useEffect, useState, useMemo } from 'react';
import { SlidersHorizontal, Search, RotateCcw } from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/product/ProductCard';
import { FilterState, ProductFilterModal } from '../components/product/ProductFilterModal';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [filters, setFilters] = useState<FilterState>({
    categoryId: initialCategory,
    size: '',
    color: '',
    inStockOnly: false,
    minPrice: 0,
    maxPrice: 2000,
    sortBy: 'newest',
  });

  useEffect(() => {
    if (initialCategory) {
      setFilters((prev) => ({ ...prev, categoryId: initialCategory }));
    }
  }, [initialCategory]);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const data = await api.getProducts();
        setProducts(data);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Filter & sort logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search query
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          const matchFabric = p.fabric_details.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchFabric) return false;
        }

        // Category
        if (filters.categoryId && p.category_id !== filters.categoryId) {
          return false;
        }

        // New arrival filter query param
        if (initialFilter === 'new' && !p.is_new) {
          return false;
        }

        // Size check
        if (filters.size) {
          const hasSize = p.variants?.some(
            (v) => v.size === filters.size && v.stock_quantity > 0
          );
          if (!hasSize) return false;
        }

        // Color check
        if (filters.color) {
          const hasColor = p.variants?.some(
            (v) => v.color === filters.color && v.stock_quantity > 0
          );
          if (!hasColor) return false;
        }

        // In-stock only
        if (filters.inStockOnly) {
          const totalStock = p.variants?.reduce((sum, v) => sum + v.stock_quantity, 0) || 0;
          if (totalStock <= 0) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'price_asc') return a.price - b.price;
        if (filters.sortBy === 'price_desc') return b.price - a.price;
        return (new Date(b.created_at || '').getTime() || 0) - (new Date(a.created_at || '').getTime() || 0);
      });
  }, [products, searchQuery, filters, initialFilter]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.categoryId) count++;
    if (filters.size) count++;
    if (filters.color) count++;
    if (filters.inStockOnly) count++;
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Title & Search bar */}
      <div className="mb-8 space-y-4">
        <div className="text-right">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            تشكيلة الستريت وير
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            جميع الموديلات مصممة بخامات قطنية ثقيلة ومتاحة للدفع عند الاستلام.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="ابحث عن موديل، خامة، أو قصة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const normalized = searchQuery.trim();
                  if (normalized.toLowerCase() === 'admin') {
                    e.preventDefault();
                    setSearchQuery('');
                    window.history.pushState({}, '', '/admin');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                }
              }}
              className="w-full bg-[#121216] border border-neutral-800 rounded-lg py-2.5 pr-10 pl-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
            />
            <Search className="w-4 h-4 text-neutral-500 absolute top-3 right-3.5" />
          </div>

          {/* Filter button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className={`flex items-center gap-2 py-2.5 px-4 rounded-lg border text-xs font-semibold transition-colors ${
                activeFiltersCount > 0
                  ? 'bg-neutral-800 text-white border-neutral-600'
                  : 'bg-[#121216] text-neutral-300 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>تصفية وترتيب</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-black font-bold text-[10px] flex items-center justify-center font-mono-numbers">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={resetAllFilters}
                className="p-2.5 rounded-lg border border-neutral-800 bg-[#121216] text-neutral-400 hover:text-white transition-colors"
                title="إعادة تعيين الفلاتر"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
          <button
            onClick={() => setFilters({ ...filters, categoryId: '' })}
            className={`py-1.5 px-3.5 rounded-lg border whitespace-nowrap transition-colors ${
              !filters.categoryId
                ? 'bg-white text-black font-bold border-white'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            جميع الموديلات ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilters({ ...filters, categoryId: cat.id })}
              className={`py-1.5 px-3.5 rounded-lg border whitespace-nowrap transition-colors ${
                filters.categoryId === cat.id
                  ? 'bg-white text-black font-bold border-white'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid (2 cols mobile, 3 cols tablet, 4 cols desktop) */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="aspect-[3/4] bg-neutral-900/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center border border-neutral-800/80 rounded-2xl bg-[#101014] p-8">
          <p className="text-base font-bold text-neutral-300 mb-2">
            لا توجد منتجات مطابقة لخيارات البحث أو الفلترة
          </p>
          <p className="text-xs text-neutral-500 mb-6">
            جرب إلغاء بعض الفلاتر المحددة أو إعادة التعيين لرؤية باقي الموديلات
          </p>
          <button
            onClick={resetAllFilters}
            className="py-2.5 px-6 bg-white text-black font-bold text-xs rounded-lg hover:bg-neutral-200 transition-colors"
          >
            إعادة تعيين الفلاتر
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={(slug) => onSelectProduct(slug)}
            />
          ))}
        </div>
      )}

      {/* Filter Modal */}
      <ProductFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        categories={categories}
        filters={filters}
        onApplyFilters={(f) => setFilters(f)}
        onResetFilters={resetAllFilters}
      />
    </div>
  );
};
