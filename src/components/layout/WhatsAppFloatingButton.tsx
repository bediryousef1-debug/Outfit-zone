import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface WhatsAppFloatingButtonProps {
  customMessage?: string;
}

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({ customMessage }) => {
  const { getWhatsAppUrl, contactSocial, settings } = useStore();
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const whatsappUrl = getWhatsAppUrl(customMessage);

  const rawPhone =
    contactSocial?.phone_number ||
    settings?.phone_number ||
    contactSocial?.whatsapp_number ||
    settings?.whatsapp_number ||
    '01012345678';

  const displayPhone = rawPhone.replace(/^\+2/, '');

  return (
    <aside
      aria-label="تواصل معنا عبر واتساب"
      className="fixed left-3 sm:left-6 z-50 print:hidden transition-all duration-300 pointer-events-auto max-w-[calc(100vw-24px)]"
      style={{
        bottom: 'var(--whatsapp-btn-bottom, 220px)',
      }}
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer noopener"
        className={`group flex items-center gap-2 sm:gap-2.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 border max-w-full ${
          isDark
            ? 'bg-[#141417]/95 border-neutral-800 text-white shadow-black/60 focus:ring-offset-black focus:ring-emerald-500 hover:border-neutral-700'
            : 'bg-white/95 border-neutral-200/90 text-neutral-900 shadow-neutral-300/50 focus:ring-offset-white focus:ring-emerald-500 hover:border-neutral-300'
        }`}
        aria-label="تواصل معنا عبر واتساب"
      >
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
          <MessageCircle className="w-5 h-5 fill-current text-white" />
        </div>

        <div className="flex flex-col text-right leading-none">
          <span className="text-[11px] sm:text-xs font-black tracking-tight flex items-center gap-1.5">
            <span>{t('common.contact_us', 'تواصل معنا')}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
          </span>

          {displayPhone && (
            <span className="text-[10px] font-mono font-bold text-neutral-400 group-hover:text-emerald-500 transition-colors dir-ltr text-right mt-1">
              {displayPhone}
            </span>
          )}
        </div>
      </a>
    </aside>
  );
};
