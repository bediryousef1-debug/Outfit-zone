import React from 'react';
import { ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { OutfitZoneLogo } from '../common/OutfitZoneLogo';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { settings, content, socialLinks, contactSocial } = useStore();

  const showTrust = content ? content.show_trust : true;

  return (
    <footer className="bg-[#08080a] border-t border-neutral-900 text-neutral-400 mt-20">
      {/* Trust Elements Section */}
      {showTrust && (
        <div className="border-b border-neutral-900 py-10 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-neutral-950/40 border border-neutral-900">
              <Truck className="w-5 h-5 text-neutral-200 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-white text-sm font-semibold mb-1">الدفع عند الاستلام</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {content?.cod_text || 'ادفع كاش فقط عندما تستلم طلبك عند باب بيتك في أي محافظة داخل مصر.'}
                </p>
              </div>
            </div>

            {settings?.inspection_available && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-neutral-950/40 border border-neutral-900">
                <ShieldCheck className="w-5 h-5 text-neutral-200 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-white text-sm font-semibold mb-1">معاينة مجانية عند الاستلام</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {content?.inspection_text || 'يمكنك فتح الشحنة ومعاينة الخامة والمقاس بحضور مندوب الشحن قبل سداد المبلغ.'}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-4 rounded-lg bg-neutral-950/40 border border-neutral-900">
              <RotateCcw className="w-5 h-5 text-neutral-200 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-white text-sm font-semibold mb-1">استبدال المقاس</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {content?.exchange_policy || settings?.exchange_policy || 'استبدال المقاس متاح خلال 14 يوم من الاستلام بكل سهولة.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info with Official Logo */}
          <div className="md:col-span-2 space-y-3">
            <OutfitZoneLogo variant="horizontal" className="text-white" />
            <p className="text-xs text-neutral-400 max-w-md leading-relaxed mt-2">
              {content?.footer_text || 'براند مصري متخصص في ملابس الستريت وير الرجالي بقصات Box Fit و Oversized، مصممة بخامات قطنية ثقيلة لتمنحك الراحة والثقة يوميًا بروح الشارع.'}
            </p>
            
            {/* Social Links (only display if enabled) */}
            <div className="flex items-center gap-4 pt-2 text-xs">
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  Instagram
                </a>
              )}
              {socialLinks.facebook && (
                <>
                  {socialLinks.instagram && <span className="text-neutral-700">·</span>}
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-neutral-400 hover:text-white transition-colors"
                  >
                    Facebook
                  </a>
                </>
              )}
              {socialLinks.tiktok && (
                <>
                  {(socialLinks.instagram || socialLinks.facebook) && <span className="text-neutral-700">·</span>}
                  <a
                    href={socialLinks.tiktok}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-neutral-400 hover:text-white transition-colors"
                  >
                    TikTok
                  </a>
                </>
              )}
              {socialLinks.messenger && (
                <>
                  {(socialLinks.instagram || socialLinks.facebook || socialLinks.tiktok) && <span className="text-neutral-700">·</span>}
                  <a
                    href={socialLinks.messenger}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-neutral-400 hover:text-white transition-colors"
                  >
                    Messenger
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              التنقل السريع
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('/')}
                  className="hover:text-white transition-colors text-right cursor-pointer"
                >
                  الصفحة الرئيسية
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/products')}
                  className="hover:text-white transition-colors text-right cursor-pointer"
                >
                  جميع المنتجات
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/about')}
                  className="hover:text-white transition-colors text-right cursor-pointer"
                >
                  قصة البراند
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/contact')}
                  className="hover:text-white transition-colors text-right cursor-pointer"
                >
                  تواصل معنا
                </button>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              السياسات والشحن
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="text-neutral-400">
                {content?.return_policy || settings?.return_policy || 'الإرجاع متاح خلال 3 أيام من الاستلام.'}
              </li>
              <li className="text-neutral-400">
                {content?.shipping_text || `رسوم التوصيل: ${settings?.shipping_fee || 65} جنيه لجميع المحافظات`}
              </li>
              <li className="text-neutral-400">
                {content?.exchange_policy || settings?.exchange_policy || 'استبدال المقاس متاح خلال 14 يوم من الاستلام.'}
              </li>
              <li className="text-neutral-400">
                {content?.inspection_text || 'معاينة مجانية للمنتج قبل الدفع والاستلام.'}
              </li>
            </ul>
          </div>

        </div>

        {/* Quiet copyright */}
        <div className="mt-12 pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500 gap-3">
          <p>© {new Date().getFullYear()} {settings?.store_name || 'Outfit Zone'}. جميع الحقوق محفوظة.</p>
          <p className="font-mono text-[10px]">EGYPTIAN STREETWEAR BRAND</p>
        </div>
      </div>
    </footer>
  );
};
