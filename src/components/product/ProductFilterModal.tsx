import React from 'react';
import { X, Check } from 'lucide-react';
import { Category } from '../../types';
import { STANDARD_SIZES, POPULAR_COLORS } from '../../utils/constants';

export interface FilterState {
  categoryId: string;
  size: string;
  color: string;
  inStockOnly: boolean;
  minPrice: number;
  maxPrice: number;
  sortBy: 'newest' | 'price_asc' | 'price_desc';
}

interface ProductFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  filters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  onResetFilters: () => void;
}

export const ProductFilterModal: React.FC<ProductFilterModalProps> = ({
  isOpen,
  onClose,
  categories,
  filters,
  onApplyFilters,
  onResetFilters,
}) => {
  const [localFilters, setLocalFilters] = React.useState<FilterState>(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121216] border-t sm:border border-neutral-800 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-white">
            تصفية وترتيب المنتجات
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-sm">
          
          {/* 1. Sorting */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
              ترتيب حسب
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'newest', label: 'الأحدث' },
                { id: 'price_asc', label: 'السعر: الأقل' },
                { id: 'price_desc', label: 'السعر: الأعلى' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setLocalFilters({ ...localFilters, sortBy: opt.id as any })}
                  className={`py-2 px-2.5 text-xs font-medium rounded-lg border transition-colors ${
                    localFilters.sortBy === opt.id
                      ? 'bg-white text-black border-white font-bold'
                      : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
              القسم
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setLocalFilters({ ...localFilters, categoryId: '' })}
                className={`py-1.5 px-3 text-xs font-medium rounded-lg border transition-colors ${
                  !localFilters.categoryId
                    ? 'bg-white text-black border-white font-bold'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                الكل
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setLocalFilters({ ...localFilters, categoryId: cat.id })}
                  className={`py-1.5 px-3 text-xs font-medium rounded-lg border transition-colors ${
                    localFilters.categoryId === cat.id
                      ? 'bg-white text-black border-white font-bold'
                      : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Sizes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
              المقاس
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setLocalFilters({ ...localFilters, size: '' })}
                className={`py-1.5 px-3 text-xs font-medium rounded-lg border transition-colors ${
                  !localFilters.size
                    ? 'bg-white text-black border-white font-bold'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-800'
                }`}
              >
                أي مقاس
              </button>
              {STANDARD_SIZES.map((sz) => (
                <button
                  key={sz}
                  onClick={() => setLocalFilters({ ...localFilters, size: sz })}
                  className={`py-1.5 px-3 text-xs font-medium rounded-lg border transition-colors font-mono ${
                    localFilters.size === sz
                      ? 'bg-white text-black border-white font-bold'
                      : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Colors */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
              اللون
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setLocalFilters({ ...localFilters, color: '' })}
                className={`py-1.5 px-3 text-xs font-medium rounded-lg border transition-colors ${
                  !localFilters.color
                    ? 'bg-white text-black border-white font-bold'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-800'
                }`}
              >
                جميع الألوان
              </button>
              {POPULAR_COLORS.map((col) => {
                const isSelected = localFilters.color === col.name;
                return (
                  <button
                    key={col.name}
                    onClick={() => setLocalFilters({ ...localFilters, color: col.name })}
                    className={`flex items-center gap-2 py-1.5 px-3 text-xs font-medium rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-neutral-800 text-white border-white'
                        : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-neutral-600"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span>{col.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. In-stock toggle */}
          <div className="pt-2 border-t border-neutral-800/80">
            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-sm font-medium text-neutral-200">
                إظهار المنتجات المتوفرة فقط بالمخزون
              </span>
              <input
                type="checkbox"
                checked={localFilters.inStockOnly}
                onChange={(e) => setLocalFilters({ ...localFilters, inStockOnly: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-white focus:ring-0 cursor-pointer accent-white"
              />
            </label>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-5 border-t border-neutral-800 bg-neutral-950/80 flex items-center gap-3">
          <button
            onClick={() => {
              onApplyFilters(localFilters);
              onClose();
            }}
            className="flex-1 py-3 px-4 bg-white text-black font-bold rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>تطبيق الفلترة</span>
          </button>
          <button
            onClick={() => {
              onResetFilters();
              onClose();
            }}
            className="py-3 px-4 bg-neutral-900 text-neutral-400 hover:text-white rounded-lg text-sm border border-neutral-800 transition-colors"
          >
            إعادة تعيين
          </button>
        </div>

      </div>
    </div>
  );
};
