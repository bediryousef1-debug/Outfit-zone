const staticImageMap: Record<string, string> = {
  'hero_streetwear_editorial_1790342899745.jpg': '/optimized/hero_streetwear_editorial_1790342899745.webp',
  'product_boxfit_tee_black_1790342911897.jpg': '/optimized/product_boxfit_tee_black_1790342911897.webp',
  'product_oversized_tee_offwhite_1790342923739.jpg': '/optimized/product_oversized_tee_offwhite_1790342923739.webp',
  'product_interlock_polo_charcoal_1790342934447.jpg': '/optimized/product_interlock_polo_charcoal_1790342934447.webp',
  'product_streetwear_shirt_olive_1790342946975.jpg': '/optimized/product_streetwear_shirt_olive_1790342946975.webp',
};

const fallbackImage = staticImageMap['product_boxfit_tee_black_1790342911897.jpg'];

/**
 * Resolves product and storefront images seamlessly across dev, preview, and Vercel production.
 * Large bundled JPGs are converted to smaller WebP files before the app starts or builds.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) {
    return fallbackImage;
  }

  // Keep remote Supabase/CDN images and Data URLs unchanged.
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  const filename = url.split('/').pop()?.split('?')[0] || '';
  if (filename && staticImageMap[filename]) {
    return staticImageMap[filename];
  }

  if (url.startsWith('/src/assets/images/')) {
    return `/images/${filename}`;
  }

  return url;
}
