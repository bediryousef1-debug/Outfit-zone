import React from 'react';
import { Product } from '../../types';
import { formatPrice } from '../../utils/constants';

interface ProductCardProps {
  product: Product;
  onSelect: (slug: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const primaryImage =
    product.images?.find((img) => img.is_primary)?.image_url ||
    product.images?.[0]?.image_url ||
    '/src/assets/images/product_boxfit_tee_black_1790342911897.jpg';

  const hasDiscount =
    product.compare_at_price !== null &&
    product.compare_at_price !== undefined &&
    product.compare_at_price > product.price;

  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;

  // Check total stock across variants
  const totalStock = product.variants?.reduce((sum, v) => sum + v.stock_quantity, 0) ?? 0;
  const isOutOfStock = totalStock <= 0;

  return (
    <div
      onClick={() => onSelect(product.slug)}
      className="group cursor-pointer flex flex-col bg-[#121215] border border-neutral-800/80 rounded-xl overflow-hidden hover:border-neutral-700 transition-all duration-200"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(product.slug);
        }
      }}
    >
      {/* Product Image Slot */}
      <div className="relative aspect-[3/4] w-full bg-[#18181c] overflow-hidden">
        <img
          src={primaryImage}
          alt={product.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Status flags: Clean, subtle text label */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end">
          {isOutOfStock ? (
            <span className="text-[11px] font-semibold bg-neutral-900/90 text-neutral-400 px-2 py-0.5 rounded backdrop-blur-sm">
              نفد من المخزون
            </span>
          ) : product.is_new ? (
            <span className="text-[11px] font-semibold bg-white text-black px-2 py-0.5 rounded shadow-sm">
              وصل حديثًا
            </span>
          ) : null}

          {hasDiscount && !isOutOfStock && (
            <span className="text-[11px] font-semibold bg-red-950/80 text-red-200 border border-red-800/50 px-1.5 py-0.5 rounded font-mono-numbers">
              -{discountPercent}%
            </span>
          )}
        </div>
      </div>

      {/* Card Info */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-2 text-right">
        <div>
          {/* Category / Style (Unboxed metadata with typographic separator) */}
          <div className="text-[11px] text-neutral-500 mb-1 flex items-center gap-1.5">
            <span>{product.category?.name || 'ستريت وير'}</span>
            <span aria-hidden="true">·</span>
            <span>قطن مصري</span>
          </div>

          <h3 className="text-sm sm:text-base font-semibold text-neutral-100 group-hover:text-white transition-colors line-clamp-1">
            {product.name}
          </h3>
        </div>

        {/* Pricing & Stock status */}
        <div className="pt-1 border-t border-neutral-800/60 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-sm sm:text-base font-bold text-white font-mono-numbers">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-neutral-500 line-through font-mono-numbers">
                {formatPrice(product.compare_at_price!)}
              </span>
            )}
          </div>

          <span className="text-[11px] text-neutral-400 font-medium">
            عرض المقاسات ←
          </span>
        </div>
      </div>
    </div>
  );
};
