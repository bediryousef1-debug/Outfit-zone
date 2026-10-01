import React, { useRef, useEffect } from 'react';
import { MessageCircle, Instagram, Facebook } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useTheme } from '../../context/ThemeContext';

// TikTok custom SVG icon
const TikTokIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.892 2.896 2.896 0 0 1-2.891-2.892 2.896 2.896 0 0 1 2.891-2.892c.38 0 .739.074 1.069.208V9.458a6.335 6.335 0 0 0-1.069-.092A6.342 6.342 0 0 0 3 15.708a6.342 6.342 0 0 0 6.342 6.342 6.342 6.342 0 0 0 6.342-6.342V8.406a8.219 8.219 0 0 0 3.905 1.554V6.686z" />
  </svg>
);

interface SocialBarProps {
  variant?: 'floating-mobile' | 'inline';
}

export const SocialBar: React.FC<SocialBarProps> = ({ variant = 'floating-mobile' }) => {
  const { contactSocial, getWhatsAppUrl } = useStore();
  const { isDark } = useTheme();
  const barRef = useRef<HTMLElement>(null);

  const links = [];

  // In inline variant, include WhatsApp; in floating-mobile variant, WhatsAppFloatingButton is already present
  if (contactSocial?.whatsapp_number && variant === 'inline') {
    links.push({
      id: 'whatsapp',
      name: 'واتساب',
      url: getWhatsAppUrl('مرحباً Outfit Zone، لدي استفسار بخصوص المنتجات'),
      icon: MessageCircle,
      bg: 'hover:text-emerald-500',
    });
  }

  if (contactSocial?.instagram_enabled && contactSocial?.instagram_url) {
    links.push({
      id: 'instagram',
      name: 'انستجرام',
      url: contactSocial.instagram_url,
      icon: Instagram,
      bg: 'hover:text-pink-500',
    });
  }

  if (contactSocial?.facebook_enabled && contactSocial?.facebook_url) {
    links.push({
      id: 'facebook',
      name: 'فيسبوك',
      url: contactSocial.facebook_url,
      icon: Facebook,
      bg: 'hover:text-blue-500',
    });
  }

  if (contactSocial?.tiktok_enabled && contactSocial?.tiktok_url) {
    links.push({
      id: 'tiktok',
      name: 'تيك توك',
      url: contactSocial.tiktok_url,
      icon: TikTokIcon,
      bg: 'hover:text-neutral-400',
    });
  }

  // Dynamic height reporting to root for WhatsApp floating button positioning
  useEffect(() => {
    if (variant !== 'floating-mobile') return;

    const updateHeight = () => {
      if (barRef.current) {
        const height = barRef.current.offsetHeight;
        document.documentElement.style.setProperty('--social-bar-height', `${height}px`);
      } else {
        document.documentElement.style.setProperty('--social-bar-height', '0px');
      }
    };

    updateHeight();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && barRef.current) {
      observer = new ResizeObserver(() => {
        updateHeight();
      });
      observer.observe(barRef.current);
    }

    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      if (observer) observer.disconnect();
      document.documentElement.style.setProperty('--social-bar-height', '0px');
    };
  }, [variant, links.length]);

  if (!contactSocial || links.length === 0) return null;

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-full border transition-all ${
                isDark
                  ? 'bg-neutral-900/80 border-neutral-800 text-neutral-300 hover:border-neutral-600 hover:text-white'
                  : 'bg-white border-neutral-300 text-neutral-700 hover:border-black hover:text-black shadow-sm'
              } ${link.bg}`}
              title={link.name}
              aria-label={link.name}
            >
              <Icon className="w-4 h-4" />
            </a>
          );
        })}
      </div>
    );
  }

  // Floating responsive bar - positioned safely above bottom nav on mobile, and at bottom on desktop
  return (
    <aside
      ref={barRef}
      aria-label="روابط التواصل الاجتماعي"
      className="fixed left-3 sm:left-6 z-40 flex flex-col gap-2 transition-all duration-300 print:hidden pointer-events-auto"
      style={{
        bottom: 'var(--social-bar-bottom, 74px)',
      }}
    >
      <div
        className={`flex flex-col gap-1.5 p-1.5 rounded-full border shadow-xl backdrop-blur-md transition-colors ${
          isDark
            ? 'bg-black/85 border-neutral-800 text-neutral-300'
            : 'bg-white/95 border-neutral-200 text-neutral-700 shadow-md'
        }`}
      >
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isDark
                  ? 'hover:bg-neutral-800 hover:text-white'
                  : 'hover:bg-neutral-100 hover:text-black'
              } ${link.bg}`}
              title={link.name}
              aria-label={link.name}
            >
              <Icon className="w-4 h-4" />
            </a>
          );
        })}
      </div>
    </aside>
  );
};
