import React, { useEffect, useState } from 'react';
import { ArrowRight, ShoppingBag, ShieldCheck, RotateCcw, Truck, MessageCircle } from 'lucide-react';
import { Product, ProductVariant } from '../types';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../utils/constants';
import { VariantSelector } from '../components/product/VariantSelector';
import { resolveImageUrl } from '../utils/imageHelper';

interface ProductDetailPageProps {
  slug: string;
  onBack: () => void;
  onNavigate: (path: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slug, onBack, onNavigate }) => {
  const { addItem, setIsCartOpen } = useCart();
  const { settings, getWhatsAppUrl } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.getProductBySlug(slug);
        setProduct(data);

        // Pre-select first color with available stock
        if (data.variants && data.variants.length > 0) {
          const firstInStock = data.variants.find((v) => v.stock_quantity > 0) || data.variants[0];
          setSelectedColor(firstInStock.color);
        }
      } catch (err: any) {
        console.error('Failed to load product detail:', err);
        setError(err.message || 'تعذر تحميل بيانات المنتج');
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
          <div className="lg:col-span-7 aspect-[3/4] bg-neutral-900 rounded-2xl" />
          <div className="lg:col-span-5 space-y-4">
            <div className="h-6 w-32 bg-neutral-900 rounded" />
            <div className="h-10 w-full bg-neutral-900 rounded" />
            <div className="h-8 w-48 bg-neutral-900 rounded" />
            <div className="h-32 w-full bg-neutral-900 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white mb-2">عفوًا، المنتج غير متوفر</h2>
        <p className="text-xs text-neutral-400 mb-6">{error || 'لم يتم العثور على هذا الموديل.'}</p>
        <button
          onClick={onBack}
          className="py-2.5 px-6 bg-white text-black font-bold text-xs rounded-lg hover:bg-neutral-200 transition-colors"
        >
          العودة للمنتجات
        </button>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ id: 'fallback', image_url: '/src/assets/images/product_boxfit_tee_black_1790342911897.jpg', sort_order: 0, is_primary: true }];

  const currentImage = images[selectedImageIndex] || images[0];

  const variants = product.variants || [];

  // Current selected variant
  const selectedVariant: ProductVariant | undefined = variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );

  const canAddToCart = Boolean(
    selectedVariant && selectedVariant.stock_quantity >= quantity && quantity > 0
  );

  const hasDiscount =
    product.compare_at_price !== null &&
    product.compare_at_price !== undefined &&
    product.compare_at_price > product.price;

  const handleAddToCart = () => {
    if (!selectedVariant || !canAddToCart) return;
    addItem(product, selectedVariant, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleDirectOrder = () => {
    if (!selectedVariant || !canAddToCart) return;
    addItem(product, selectedVariant, quantity);
    setIsCartOpen(true);
  };

  const whatsappInquiryUrl = getWhatsAppUrl(
    `مرحبًا Outfit Zone، أستفسر عن الموديل: "${product.name}"، هل متوفر بلون "${selectedColor || '...'}" ومقاس "${selectedSize || '...'}"؟`
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 text-right">
      {/* Back button breadcrumb */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors mb-6 group"
      >
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        <span>العودة لجميع المنتجات</span>
      </button>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left: Image Gallery (Takes 7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Selected Image */}
          <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#141418] border border-neutral-800 shadow-xl">
            <img
              src={resolveImageUrl(currentImage.image_url)}
              alt={product.name}
              className="w-full h-full object-cover object-center"
              fetchPriority="high"
            />
            {hasDiscount && (
              <span className="absolute top-4 right-4 bg-red-950/90 text-red-200 border border-red-800/60 text-xs font-bold px-2.5 py-1 rounded font-mono-numbers">
                خصم {Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)}%
              </span>
            )}
          </div>

          {/* Thumbnails row */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 h-24 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-white ring-2 ring-white/20'
                      : 'border-neutral-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={resolveImageUrl(img.image_url)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          
          {/* Category & Title */}
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-2">
              <span>{product.category?.name || 'ستريت وير'}</span>
              <span>·</span>
              <span>Outfit Zone</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-3 pb-4 border-b border-neutral-800">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono-numbers">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-sm sm:text-base text-neutral-500 line-through font-mono-numbers">
                {formatPrice(product.compare_at_price!)}
              </span>
            )}
            <span className="text-xs text-neutral-400 mr-auto">
              (الدفع عند الاستلام)
            </span>
          </div>

          {/* Variant Selector (Color, Size, Quantity) */}
          <VariantSelector
            variants={variants}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            quantity={quantity}
            onSelectColor={(col) => {
              setSelectedColor(col);
              // reset size if previous size not available in new color
              setSelectedSize('');
            }}
            onSelectSize={(sz) => setSelectedSize(sz)}
            onChangeQuantity={(qty) => setQuantity(qty)}
          />

          {/* Actions: Add to Order / Fast Checkout */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className={`w-full py-4 px-6 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-lg ${
                !canAddToCart
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                  : justAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-black hover:bg-neutral-200'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span>
                {justAdded
                  ? 'تمت الإضافة بنجاح! ✓'
                  : !selectedColor
                  ? 'يرجى اختيار اللون'
                  : !selectedSize
                  ? 'يرجى تحديد المقاس'
                  : selectedVariant && selectedVariant.stock_quantity <= 0
                  ? 'المقاس المختار نفد من المخزون'
                  : 'أضف للطلب (كاش عند الاستلام)'}
              </span>
            </button>

            {canAddToCart && (
              <button
                onClick={handleDirectOrder}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors"
              >
                شراء سريع وإتمام الطلب الآن
              </button>
            )}

            {/* WhatsApp Sizing assistance */}
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="w-full py-2.5 text-center text-xs text-neutral-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>مساعدة في اختيار المقاس عبر WhatsApp</span>
            </a>
          </div>

          {/* Trust Highlights */}
          <div className="p-4 rounded-xl bg-[#121216] border border-neutral-800/80 space-y-3 text-xs">
            <div className="flex items-center gap-2.5 text-neutral-300">
              <Truck className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>توصيل لجميع المحافظات خلال 2 - 4 أيام عمل ({settings?.shipping_fee || 65} جنيه فقط)</span>
            </div>

            {settings?.inspection_available && (
              <div className="flex items-center gap-2.5 text-neutral-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-white">معاينة مجانية عند الاستلام قبل دفع أي جنيه</span>
              </div>
            )}

            <div className="flex items-center gap-2.5 text-neutral-300">
              <RotateCcw className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>{settings?.exchange_policy || 'استبدال المقاس متاح خلال 14 يوم'}</span>
            </div>
          </div>

          {/* Description & Fabric Details */}
          <div className="space-y-4 pt-4 border-t border-neutral-800 text-xs leading-relaxed">
            {product.description && (
              <div>
                <h4 className="font-bold text-white mb-1.5 text-sm">وصف الموديل والقصة:</h4>
                <p className="text-neutral-400">{product.description}</p>
              </div>
            )}

            {product.fabric_details && (
              <div>
                <h4 className="font-bold text-white mb-1.5 text-sm">مواصفات الخامة والنسيج:</h4>
                <p className="text-neutral-400">{product.fabric_details}</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Sticky Mobile Buy Bar (Respects 15% Mobile Sticky Cap rule) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0e0e12]/95 backdrop-blur-md border-t border-neutral-800 p-3 flex items-center justify-between gap-3 shadow-2xl">
        <div className="text-right">
          <span className="text-[11px] text-neutral-400 block">الإجمالي</span>
          <span className="text-sm font-bold text-white font-mono-numbers">
            {formatPrice(product.price * quantity)}
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          className={`py-3 px-5 rounded-lg text-xs font-bold flex items-center gap-2 ${
            !canAddToCart
              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              : 'bg-white text-black hover:bg-neutral-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{!selectedSize ? 'حدد المقاس' : 'أضف للطلب'}</span>
        </button>
      </div>
    </div>
  );
};
