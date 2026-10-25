import React, { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface WhatsAppFloatingButtonProps {
  customMessage?: string;
}

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({ customMessage }) => {
  const { getWhatsAppUrl } = useStore();
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const whatsappUrl = getWhatsAppUrl(customMessage);
  const [isScrollVisible, setIsScrollVisible] = useState(true);

  // Keep the WhatsApp CTA out of the way while mobile shoppers scroll down.
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 80) {
        setIsScrollVisible(true);
        lastScrollY = currentScrollY;
        return;
      }

      if (Math.abs(currentScrollY - lastScrollY) >= 8) {
        setIsScrollVisible(currentScrollY < lastScrollY);
        lastScrollY = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <aside
      aria-label="تواصل معنا عبر واتساب"
      className={`fixed left-3 sm:left-6 z-50 print:hidden transition-[transform,opacity] duration-300 pointer-events-auto max-w-[calc(100vw-24px)] ${isScrollVisible ? 'translate-x-0 opacity-100' : '-translate-x-16 opacity-0 pointer-events-none md:translate-x-0 md:opacity-100 md:pointer-events-auto'}`}
      style={{
        bottom: 'var(--whatsapp-btn-bottom, 220px)',
      }}
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer noopener"
        className={`group oz-btn-press flex items-center gap-2.5 rounded-full border py-2 pl-2 pr-4 shadow-lg backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] ${
          isDark
            ? 'border-neutral-700/80 bg-[#111113]/95 text-white shadow-black/40 hover:border-emerald-500/50 hover:shadow-emerald-950/30'
            : 'border-neutral-200/90 bg-white/95 text-neutral-900 shadow-neutral-400/25 hover:border-emerald-500/50 hover:shadow-emerald-100'
        }`}
        aria-label="تواصل معنا عبر واتساب"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
          <MessageCircle className="h-[19px] w-[19px] fill-current" />
        </span>

        <span className="flex flex-col text-right leading-none">
          <span className="whitespace-nowrap text-xs font-extrabold tracking-tight">
            {t('footer.contact_us', 'تواصل معنا')}
          </span>
          <span className={`mt-1 text-[9px] font-semibold tracking-[0.14em] uppercase ${
            isDark ? 'text-neutral-500' : 'text-neutral-400'
          }`}>
            WhatsApp
          </span>
        </span>
        <span className="ml-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#25D366]" aria-hidden="true" />
      </a>
    </aside>
  );
};
