import React, { useMemo } from 'react';
import { ProductVariant } from '../../types';
import { STANDARD_SIZES } from '../../utils/constants';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Minus, Plus } from 'lucide-react';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedColor: string;
  selectedSize: string;
  quantity: number;
  onSelectColor: (color: string) => void;
  onSelectSize: (size: string) => void;
  onChangeQuantity: (qty: number) => void;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  selectedColor,
  selectedSize,
  quantity,
  onSelectColor,
  onSelectSize,
  onChangeQuantity,
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();

  // Extract unique colors available for this product
  const availableColors = useMemo(() => {
    const colorSet = new Set<string>();
    variants.forEach((v) => {
      if (v.color) colorSet.add(v.color);
    });
    return Array.from(colorSet);
  }, [variants]);

  // Extract all sizes available for this product (merging standard sizes with any variant sizes)
  const productSizes = useMemo(() => {
    const sizeSet = new Set<string>();
    // If variants exist, prioritize sizes that actually exist in variants or standard sizes
    const variantSizes = new Set(variants.map((v) => v.size).filter(Boolean));
    STANDARD_SIZES.forEach((sz) => {
      // Include standard size if present in product variants or if variants has it
      if (variantSizes.has(sz) || variantSizes.size === 0) {
        sizeSet.add(sz);
      }
    });
    variants.forEach((v) => {
      if (v.size) sizeSet.add(v.size);
    });
    // Fallback: if empty, default to STANDARD_SIZES
    if (sizeSet.size === 0) {
      STANDARD_SIZES.forEach((sz) => sizeSet.add(sz));
    }

    const standardOrder = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
    return Array.from(sizeSet).sort((a, b) => {
      const idxA = standardOrder.indexOf(a);
      const idxB = standardOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [variants]);

  // For the selected color, determine stock per size
  const sizesForColor = useMemo(() => {
    const map: Record<string, number> = {};
    productSizes.forEach((sz) => {
      map[sz] = 0;
    });

    variants
      .filter((v) => !selectedColor || v.color === selectedColor)
      .forEach((v) => {
        map[v.size] = (map[v.size] || 0) + v.stock_quantity;
      });

    return map;
  }, [variants, selectedColor, productSizes]);

  // Selected variant specific stock
  const currentVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) return null;

    return (
      variants.find(
        (v) => v.color === selectedColor && v.size === selectedSize
      ) || null
    );
  }, [variants, selectedColor, selectedSize]);

  const maxStock = currentVariant
    ? currentVariant.stock_quantity
    : 10;

  const isCurrentOutOfStock = currentVariant !== null && currentVariant.stock_quantity <= 0;

  // Get the exact color saved for this variant
  const getColorHex = (colorName: string): string => {
    const variant = variants.find((v) => v.color === colorName);
    return variant?.color_hex || '#333333';
  };

  return (
    <div className="space-y-5">
      {/* 1. Color Selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            {t('product.color', 'اللون:')}
          </span>

          <span
            className={`text-xs font-semibold ${
              isDark ? 'text-neutral-200' : 'text-neutral-800'
            }`}
          >
            {selectedColor || t('product.select_color', 'اختر اللون')}
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {availableColors.map((color) => {
            const isSelected = selectedColor === color;

            // Check if color has any stock at all
            const colorStock = variants
              .filter((v) => v.color === color)
              .reduce((sum, v) => sum + v.stock_quantity, 0);

            const isColorOutOfStock = colorStock <= 0;

            return (
              <button
                key={color}
                type="button"
                onClick={() => onSelectColor(color)}
                disabled={isColorOutOfStock}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 motion-reduce:transition-none ${
                  isColorOutOfStock
                    ? 'opacity-40 cursor-not-allowed border-neutral-800 bg-neutral-900/40 text-neutral-500 line-through'
                    : isSelected
                    ? isDark
                      ? 'bg-neutral-800 border-white text-white shadow-md ring-2 ring-white/30'
                      : 'bg-black border-black text-white shadow-md ring-2 ring-black/20'
                    : isDark
                    ? 'bg-neutral-900/80 border-neutral-800 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800/80'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 shadow-xs'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full border border-black/20 shadow-inner shrink-0"
                  style={{
                    backgroundColor: getColorHex(color),
                  }}
                />

                <span className="font-semibold">{color}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Size Selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            {t('product.size', 'المقاس:')}
          </span>

          <span
            className={`text-xs font-semibold ${
              isDark ? 'text-neutral-200' : 'text-neutral-800'
            }`}
          >
            {selectedSize
              ? `${selectedSize}`
              : t('product.select_size', 'اختر مقاسك')}
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {productSizes.map((size) => {
            const stock = sizesForColor[size] || 0;
            const isAvailable = stock > 0;
            const isSelected = selectedSize === size;

            return (
              <button
                key={size}
                type="button"
                onClick={() => onSelectSize(size)}
                disabled={!isAvailable}
                className={`py-3 px-2 rounded-xl border text-center transition-all duration-200 font-mono-numbers relative cursor-pointer active:scale-95 motion-reduce:transition-none ${
                  !isAvailable
                    ? 'opacity-35 cursor-not-allowed border-neutral-800 bg-neutral-900/30 text-neutral-500'
                    : isSelected
                    ? isDark
                      ? 'bg-white text-black font-extrabold border-white shadow-lg ring-2 ring-white/40'
                      : 'bg-black text-white font-extrabold border-black shadow-lg ring-2 ring-black/30'
                    : isDark
                    ? 'bg-[#141418] text-neutral-200 border-neutral-800 hover:border-neutral-600 hover:bg-neutral-850'
                    : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 shadow-xs'
                }`}
              >
                <span className="text-sm font-black block">{size}</span>

                <span className="text-[10px] block opacity-75 font-sans mt-0.5">
                  {!isAvailable
                    ? t('product.out_of_stock', 'غير متوفر')
                    : stock <= 3
                    ? `${t('product.remaining', 'باقي')} ${stock}`
                    : t('product.available', 'متوفر')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Quantity Selector */}
      <div
        className={`pt-4 border-t flex items-center justify-between ${
          isDark ? 'border-neutral-800/80' : 'border-neutral-200'
        }`}
      >
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
            {t('product.quantity', 'الكمية:')}
          </span>
          {currentVariant && currentVariant.stock_quantity > 0 && currentVariant.stock_quantity <= 4 && (
            <span className="text-[10px] text-amber-500 font-medium">
              {t('product.remaining', 'متبقي في المخزون:')} {currentVariant.stock_quantity}
            </span>
          )}
        </div>

        <div
          className={`flex items-center rounded-xl border p-1 transition-all ${
            isDark
              ? 'border-neutral-800 bg-neutral-900/90'
              : 'border-neutral-200 bg-neutral-100'
          }`}
        >
          <button
            type="button"
            onClick={() => onChangeQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1 || isCurrentOutOfStock}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 ${
              isDark
                ? 'hover:bg-neutral-800 text-neutral-200 hover:text-white'
                : 'hover:bg-white text-neutral-700 hover:text-black shadow-xs'
            }`}
            aria-label="تقليل الكمية"
          >
            <Minus className="w-4 h-4 stroke-[2.5]" />
          </button>

          <span
            className={`w-12 text-center font-mono-numbers font-black text-base select-none ${
              isDark ? 'text-white' : 'text-neutral-900'
            }`}
          >
            {quantity}
          </span>

          <button
            type="button"
            onClick={() =>
              onChangeQuantity(
                currentVariant
                  ? Math.min(maxStock, quantity + 1)
                  : quantity + 1
              )
            }
            disabled={
              isCurrentOutOfStock ||
              (Boolean(currentVariant) && quantity >= maxStock)
            }
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 ${
              isDark
                ? 'hover:bg-neutral-800 text-neutral-200 hover:text-white'
                : 'hover:bg-white text-neutral-700 hover:text-black shadow-xs'
            }`}
            aria-label="زيادة الكمية"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
