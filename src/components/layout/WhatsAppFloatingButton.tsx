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
        className={`group oz-btn-press active:scale-95 flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2 rounded-2xl shadow-xl transition-all duration-300 border max-w-full backdrop-blur-md ${
          isDark
            ? 'bg-[#141417]/95 border-neutral-800 text-white shadow-black/80 hover:border-emerald-500/50 hover:shadow-emerald-950/30'
            : 'bg-white/95 border-neutral-200/90 text-neutral-900 shadow-neutral-300/60 hover:border-emerald-500/50 hover:shadow-emerald-100'
        }`}
        aria-label="تواصل معنا عبر واتساب"
      >
        <div className="w-8 h-8 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300 pulse-glow">
          <MessageCircle className="w-4.5 h-4.5 fill-current text-white" />
        </div>

        <div className="flex flex-col text-right leading-none">
          <span className="text-[11px] sm:text-xs font-black tracking-tight flex items-center gap-1.5">
            <span>{t('footer.contact_us', 'تواصل معنا')}</span>
            <span className="w-2 h-2 rounded-full bg-[#25D366] shadow-[0_0_8px_#25D366]" />
          </span>

          {displayPhone && (
            <span className="text-[9.5px] font-mono font-bold text-neutral-400 group-hover:text-emerald-500 transition-colors dir-ltr text-right mt-1">
              {displayPhone}
            </span>
          )}
        </div>
      </a>
    </aside>
  );
};