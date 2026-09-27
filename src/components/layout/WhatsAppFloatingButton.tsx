import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface WhatsAppFloatingButtonProps {
  customMessage?: string;
}

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({ customMessage }) => {
  const { getWhatsAppUrl } = useStore();
  const whatsappUrl = getWhatsAppUrl(customMessage);

  return (
    <aside aria-label="واتساب" className="fixed bottom-6 left-6 z-40 print:hidden">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="group flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white p-3 sm:px-4 sm:py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0c0c0e] focus:ring-[#25D366]"
        aria-label="تواصل معنا عبر واتساب"
      >
        <MessageCircle className="w-6 h-6 fill-current text-white" />
        <span className="hidden sm:inline text-xs font-bold whitespace-nowrap">
          تواصل معنا
        </span>
      </a>
    </aside>
  );
};
