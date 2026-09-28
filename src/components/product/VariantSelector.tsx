import React, { useMemo } from 'react';
import { ProductVariant } from '../../types';
import { STANDARD_SIZES } from '../../utils/constants';

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
  // Extract unique colors available for this product
  const availableColors = useMemo(() => {
    const colorSet = new Set<string>();
    variants.forEach((v) => colorSet.add(v.color));
    return Array.from(colorSet);
  }, [variants]);

  // For the selected color, determine stock per size
  const sizesForColor = useMemo(() => {
    const map: Record<string, number> = {};
    STANDARD_SIZES.forEach((sz) => {
      map[sz] = 0;
    });

    variants
      .filter((v) => !selectedColor || v.color === selectedColor)
      .forEach((v) => {
        map[v.size] = (map[v.size] || 0) + v.stock_quantity;
      });

    return map;
  }, [variants, selectedColor]);

  // Selected variant specific stock
  const currentVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) return null;

    return (
      variants.find(
        (v) =>
          v.color === selectedColor &&
          v.size === selectedSize
      ) || null
    );
  }, [variants, selectedColor, selectedSize]);

  const maxStock = currentVariant
    ? currentVariant.stock_quantity
    : 0;

  // Get the exact color saved for this variant in Supabase
  const getColorHex = (colorName: string): string => {
    const variant = variants.find(
      (v) => v.color === colorName
    );

    return variant?.color_hex || '#333333';
  };

  return (
    <div className="space-y-6">
      {/* 1. Color Selector */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            اللون:
          </span>

          <span className="text-xs font-semibold text-neutral-200">
            {selectedColor || 'اختر اللون'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {availableColors.map((color) => {
            const isSelected = selectedColor === color;

            // Check if color has any stock at all
            const colorStock = variants
              .filter((v) => v.color === color)
              .reduce(
                (sum, v) => sum + v.stock_quantity,
                0
              );

            const isColorOutOfStock = colorStock <= 0;

            return (
              <button
                key={color}
                type="button"
                onClick={() => onSelectColor(color)}
                disabled={isColorOutOfStock}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  isColorOutOfStock
                    ? 'opacity-40 cursor-not-allowed border-neutral-900 bg-neutral-950 text-neutral-600 line-through'
                    : isSelected
                    ? 'bg-neutral-800 border-white text-white shadow-sm ring-1 ring-white'
                    : 'bg-neutral-900/80 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-neutral-600 shadow-inner shrink-0"
                  style={{
                    backgroundColor: getColorHex(color),
                  }}
                />

                <span>{color}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Size Selector */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            المقاس:
          </span>

          <span className="text-xs font-semibold text-neutral-200">
            {selectedSize
              ? `المقاس المختار: ${selectedSize}`
              : 'اختر مقاسك'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {STANDARD_SIZES.map((size) => {
            const stock = sizesForColor[size] || 0;
            const isAvailable = stock > 0;
            const isSelected = selectedSize === size;

            return (
              <button
                key={size}
                type="button"
                onClick={() => onSelectSize(size)}
                disabled={!isAvailable}
                className={`py-3 px-2 rounded-lg border text-center transition-all font-mono-numbers relative ${
                  !isAvailable
                    ? 'opacity-35 cursor-not-allowed border-neutral-900 bg-neutral-950/60 text-neutral-600'
                    : isSelected
                    ? 'bg-white text-black font-bold border-white shadow-md'
                    : 'bg-[#141418] text-neutral-200 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                }`}
              >
                <span className="text-sm font-bold block">
                  {size}
                </span>

                <span className="text-[10px] block opacity-75 font-sans">
                  {!isAvailable
                    ? 'غير متوفر'
                    : stock <= 3
                    ? `باقي ${stock}`
                    : 'متوفر'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Quantity Selector */}
      {selectedColor &&
        selectedSize &&
        maxStock > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              الكمية:
            </span>

            <div className="flex items-center border border-neutral-800 rounded-lg bg-neutral-900 overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  onChangeQuantity(
                    Math.max(1, quantity - 1)
                  )
                }
                disabled={quantity <= 1}
                className="px-3 py-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-40 transition-colors"
              >
                -
              </button>

              <span className="w-10 text-center font-mono-numbers font-bold text-sm text-white">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() =>
                  onChangeQuantity(
                    Math.min(maxStock, quantity + 1)
                  )
                }
                disabled={quantity >= maxStock}
                className="px-3 py-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-40 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        )}
    </div>
  );
};