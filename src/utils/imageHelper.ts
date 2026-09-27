import heroImg from '../assets/images/hero_streetwear_editorial_1790342899745.jpg';
import boxfitBlackImg from '../assets/images/product_boxfit_tee_black_1790342911897.jpg';
import oversizedOffwhiteImg from '../assets/images/product_oversized_tee_offwhite_1790342923739.jpg';
import poloCharcoalImg from '../assets/images/product_interlock_polo_charcoal_1790342934447.jpg';
import shirtOliveImg from '../assets/images/product_streetwear_shirt_olive_1790342946975.jpg';

const staticImageMap: Record<string, string> = {
  'hero_streetwear_editorial_1790342899745.jpg': heroImg,
  'product_boxfit_tee_black_1790342911897.jpg': boxfitBlackImg,
  'product_oversized_tee_offwhite_1790342923739.jpg': oversizedOffwhiteImg,
  'product_interlock_polo_charcoal_1790342934447.jpg': poloCharcoalImg,
  'product_streetwear_shirt_olive_1790342946975.jpg': shirtOliveImg,
};

/**
 * Resolves product and storefront images seamlessly across dev, preview, and Vercel production.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) {
    return boxfitBlackImg;
  }

  // Already a full remote URL (e.g. Supabase Storage or CDN) or Data URL
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  // Extract filename
  const filename = url.split('/').pop()?.split('?')[0] || '';
  if (filename && staticImageMap[filename]) {
    return staticImageMap[filename];
  }

  return url;
}
