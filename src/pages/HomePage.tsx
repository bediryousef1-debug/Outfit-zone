import React, { useEffect, useState } from 'react';
import { ArrowLeft, Sparkles, ShieldCheck, Truck, MessageCircle } from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';
import { ProductCard } from '../components/product/ProductCard';
import { useStore } from '../context/StoreContext';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onSelectProduct: (slug: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onSelectProduct }) => {
  const { categories, content, settings, getWhatsAppUrl } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await api.getProducts();
        setProducts(data);
      } catch (err) {
        console.error('Error fetching homepage products:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  const featuredProducts = products.filter((p) => p.is_featured).slice(0, 4);
  const newArrivals = products.filter((p) => p.is_new).slice(0, 4);

  // Section visibility toggles from Supabase CMS
  const showHero = content ? content.show_hero : true;
  const showCategories = content ? content.show_categories : true;
  const showFeatured = content ? content.show_featured : true;
  const showTrust = content ? content.show_trust : true;
  const showNewArrivals = content ? content.show_new_arrivals : true;
  const showContactCta = content ? content.show_contact_cta : true;

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* 1. HERO SECTION */}
      {showHero && (
        <section className="relative overflow-hidden border-b border-neutral-800/80 bg-gradient-to-b from-[#141419] to-[#0c0c0e]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Text / Editorial CTA */}
            <div className="lg:col-span-6 space-y-6 text-right z-10">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 bg-neutral-900/90 border border-neutral-800 px-3 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-neutral-200" />
                <span>{content?.announcement_text || 'تشكيلة ستريت وير 2026 قطن مصري 100%'}</span>
              </div>

              <div className="space-y-2">
                <h1 className="font-syne text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase leading-none">
                  {content?.hero_title || 'WEAR IN THE ZONE'}
                </h1>
                <p className="text-xl sm:text-2xl font-bold text-neutral-200">
                  {content?.hero_subtitle || 'ستايل يومي بروح الشارع المصري'}
                </p>
              </div>

              <p className="text-sm sm:text-base text-neutral-400 max-w-lg leading-relaxed">
                {content?.cta_text || 'قصات Box Fit و Oversized مريحة مصممة بعناية من خامات قطنية ثقيلة 240+ GSM تدوم معك، بتفاصيل مينيمال نظيفة تناسب يومك في الشارع والجامعة والخروج.'}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => onNavigate('/products')}
                  className="py-3.5 px-8 bg-white text-black font-extrabold text-sm rounded-lg hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <span>{content?.hero_button_text || 'تسوق الآن'}</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('/about')}
                  className="py-3.5 px-6 bg-neutral-900/90 text-neutral-300 font-semibold text-sm rounded-lg hover:text-white hover:bg-neutral-800 border border-neutral-800 transition-all text-center cursor-pointer"
                >
                  عن البراند والخامات
                </button>
              </div>

              {/* Quick highlight bar */}
              <div className="pt-4 flex items-center gap-6 text-xs text-neutral-400 border-t border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-neutral-300" />
                  <span>دفع عند الاستلام كاش</span>
                </div>
                {settings?.inspection_available && (
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-neutral-300" />
                    <span>معاينة قبل الدفع والاستلام</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Hero Banner Image */}
            <div className="lg:col-span-6 relative">
              <div className="relative aspect-[16/10] sm:aspect-[4/3] rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl bg-neutral-900">
                <img
                  src={content?.hero_image_url || '/src/assets/images/hero_streetwear_editorial_1790342899745.jpg'}
                  alt="Outfit Zone Campaign"
                  className="w-full h-full object-cover object-center"
                  fetchPriority="high"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 right-4 text-right">
                  <p className="text-white text-sm font-bold">قصات بوكس فيت وأوفرسايز أصلية</p>
                  <p className="text-[11px] text-neutral-400">قطن مصري 100% ثقيل معالج ضد الانكماش</p>
                </div>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* 2. CATEGORIES OVERVIEW */}
      {showCategories && categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-6">
            <div className="text-right">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                الأقسام
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {content?.categories_section_title || 'تسوق حسب الستايل والقَصّة'}
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/products')}
              className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>جميع الموديلات</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onNavigate(`/products?category=${cat.id}`)}
                className="p-5 rounded-xl bg-[#121216] border border-neutral-800/80 hover:border-neutral-600 text-right transition-all group hover:-translate-y-0.5 cursor-pointer"
              >
                <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-neutral-200 mb-1">
                  {cat.name}
                </h3>
                <p className="text-xs text-neutral-400 flex items-center gap-1">
                  <span>تصفح المعروض</span>
                  <span className="group-hover:-translate-x-1 transition-transform">←</span>
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 3. FEATURED PRODUCTS (2 cols mobile, 4 cols desktop) */}
      {showFeatured && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div className="text-right">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                الأكثر مبيعًا
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {content?.featured_section_title || 'الموديلات الأكثر طلباً'}
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/products')}
              className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>عرض الكل</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[3/4] bg-neutral-900/60 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={(slug) => onSelectProduct(slug)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 4. BRAND STORY & FABRIC REASONING */}
      {showTrust && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="p-8 sm:p-12 rounded-2xl bg-[#111115] border border-neutral-800 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center text-right">
            <div className="space-y-4">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
                خامات Outfit Zone
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                قطن مصري أصيل بوزن ثقيل لا يفقد شكله
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                {content?.about_story || 'المشكلة الأساسية في تيشيرتات الستريت وير في السوق هي الياقة المترهلة وانكماش الخامة بعد أول غسلة. في Outfit Zone نستخدم أقمشة إنترلوك وميلتون صيفي معالجة بانكماش مسبق وكثافة تبدأ من 240 حتى 260 جرام مع ياقة مضلعة مزدوجة تحافظ على تماسكها.'}
              </p>
              <div className="pt-2 grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="font-bold text-white block mb-0.5">قصة Box Fit</span>
                  <span className="text-neutral-400">مربعة مريحة لا تلتصق بالجسم</span>
                </div>
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="font-bold text-white block mb-0.5">قصة Oversized</span>
                  <span className="text-neutral-400">أكتاف منسدلة وأكمام واسعة</span>
                </div>
              </div>
            </div>

            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-neutral-800">
              <img
                src="/src/assets/images/product_interlock_polo_charcoal_1790342934447.jpg"
                alt="Streetwear Knit Texture"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </section>
      )}

      {/* 5. NEW ARRIVALS */}
      {showNewArrivals && newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div className="text-right">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                وصل حديثًا
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {content?.new_arrivals_section_title || 'أحدث القطع المضافة'}
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/products?filter=new')}
              className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>مشاهدة كل الجديد</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {newArrivals.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(slug) => onSelectProduct(slug)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 6. WHATSAPP & ORDER SUPPORT BANNER / CTA */}
      {showContactCta && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
          <div className="p-8 rounded-2xl bg-gradient-to-r from-neutral-900 to-[#121216] border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-6 text-right">
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {content?.cta_title || 'محتار في اختيار المقاس أو عندك استفسار؟'}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400">
                {content?.contact_text || 'فريق Outfit Zone متاح على واتساب لمساعدتك في تحديد مقاسك المناسب بناءً على وزنك وطولك.'}
              </p>
            </div>

            <a
              href={getWhatsAppUrl('مرحبًا Outfit Zone، أحتاج مساعدة في اختيار المقاس المناسب لي.')}
              target="_blank"
              rel="noreferrer noopener"
              className="py-3 px-6 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs sm:text-sm rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shadow-md shrink-0 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>تواصل معنا على واتساب</span>
            </a>
          </div>
        </section>
      )}
    </div>
  );
};
