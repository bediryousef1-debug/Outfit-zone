import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Heart } from 'lucide-react';
import { Product } from '../../types';
import {
formatPrice,
getLocalizedProductName,
} from '../../utils/constants';
import { resolveImageUrl } from '../../utils/imageHelper';
import { useTheme } from '../../context/ThemeContext';

interface ProductCardProps {
product: Product;
onSelect: (slug: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, onSelect }) => {
const { t, language } = useLanguage();

const { isDark } = useTheme();

const rawImage =
product.images?.find((img) => img.is_primary)?.image_url ||
product.images?.[0]?.image_url;
const primaryImage = resolveImageUrl(rawImage);

const hasDiscount =
product.compare_at_price !== null &&
product.compare_at_price !== undefined &&
product.compare_at_price > product.price;

const discountPercent = hasDiscount
? Math.round(
((product.compare_at_price! - product.price) /
product.compare_at_price!) *
100
)
: 0;

// Check total stock across variants
const totalStock =
product.variants?.reduce((sum, v) => sum + v.stock_quantity, 0) ?? 0;
const isOutOfStock = totalStock <= 0;

const localizedName = getLocalizedProductName(product, language);

const localizedCategory =
language === 'en'
? product.category?.name_en || product.category?.name
: product.category?.name;

return (
<div
onClick={() => onSelect(product.slug)}
className={`group cursor-pointer oz-card-hover animate-fade-in flex flex-col rounded-2xl overflow-hidden border ${
        isDark
          ? 'bg-[#121216] border-neutral-800/80 hover:border-neutral-600 shadow-md'
          : 'bg-white border-neutral-200 hover:border-neutral-400 hover:shadow-lg'
      }`}
role="button"
tabIndex={0}
onKeyDown={(e) => {
if (e.key === 'Enter' || e.key === ' ') {
onSelect(product.slug);
}
}}
>
{/* Product Image Slot */} <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-900/10"> <img
       src={primaryImage}
       alt={localizedName}
       loading="lazy"
       decoding="async"
       referrerPolicy="no-referrer"
       className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
     />

    {/* Status flags */}
    <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end">
      {isOutOfStock ? (
        <span className="text-[10px] font-bold bg-neutral-900/90 text-neutral-300 px-2 py-0.5 rounded-full backdrop-blur-sm">
          {t('product.out_of_stock', 'Out of Stock')}
        </span>
      ) : product.is_new ? (
        <span className="text-[10px] font-bold bg-black text-white dark:bg-white dark:text-black px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
          {t('product.badge_new', 'NEW')}
        </span>
      ) : null}

      {hasDiscount && !isOutOfStock && (
        <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full font-mono-numbers shadow-sm">
          -{discountPercent}%
        </span>
      )}
    </div>

    {/* Favorite Heart Button */}
    <button
      onClick={(e) => {
        e.stopPropagation();
      }}
      className={`absolute top-2.5 left-2.5 p-1.5 rounded-full backdrop-blur-md transition-all ${
        isDark
          ? 'bg-black/40 text-neutral-300 hover:text-red-400 hover:bg-black/70'
          : 'bg-white/70 text-neutral-600 hover:text-red-500 hover:bg-white'
      }`}
      aria-label={t('product.add_favorite', 'Add to Favorites')}
    >
      <Heart className="w-4 h-4" />
    </button>
  </div>

  {/* Card Info */}
  <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-2 text-right">
    <div>
      {/* Category / Style */}
      <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-1 flex items-center gap-1.5 font-medium">
        <span>
          {localizedCategory || t('product.streetwear', 'Streetwear')}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          {t('product.egyptian_cotton', 'Egyptian Cotton')}
        </span>
      </div>

      <h3
        className={`text-sm sm:text-base font-bold transition-colors line-clamp-1 ${
          isDark
            ? 'text-white group-hover:text-neutral-200'
            : 'text-neutral-900 group-hover:text-black'
        }`}
      >
        {localizedName}
      </h3>
    </div>

    {/* Pricing & Stock status */}
    <div
      className={`pt-2 border-t flex items-baseline justify-between ${
        isDark ? 'border-neutral-800/80' : 'border-neutral-100'
      }`}
    >
      <div className="flex items-baseline gap-2">
        <span
          className={`text-sm sm:text-base font-extrabold font-mono-numbers ${
            isDark ? 'text-white' : 'text-black'
          }`}
        >
          {formatPrice(product.price, language)}
        </span>

        {hasDiscount && (
          <span className="text-xs text-neutral-400 line-through font-mono-numbers">
            {formatPrice(product.compare_at_price!, language)}
          </span>
        )}
      </div>

      <span className="text-[10px] text-neutral-400 font-medium">
        {isOutOfStock
          ? t('product.unavailable', 'Unavailable')
          : t('product.available_sizes', 'Available Sizes')}
      </span>
    </div>
  </div>
</div>

);
});