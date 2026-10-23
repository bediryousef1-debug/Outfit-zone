import React, { useRef, useEffect, useState } from 'react';
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
  const [isScrollVisible, setIsScrollVisible] = useState(true);

  // On mobile, hide floating controls while scrolling down and reveal them when scrolling up.
  useEffect(() => {
    if (variant !== 'floating-mobile') return;

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
  }, [variant]);

  const links = [];

  // In inline variant, include WhatsApp; in floating-mobile variant, WhatsAppFloatingButton is already present
  if (contactSocial?.whatsapp_number && variant === 'inline') {
    links.push({
      id: 'whatsapp',
      name: 'واتساب',
      url: getWhatsAppUrl('مرحباً Outfit Zone، لدي استفسار بخصوص المنتجات'),
      icon: MessageCircle,
      bg: 'hover:text-emerald-500 hover:border-emerald-500/30 hover:bg-emerald-500/10',
    });
  }

  if (contactSocial?.instagram_enabled && contactSocial?.instagram_url) {
    links.push({
      id: 'instagram',
      name: 'انستجرام',
      url: contactSocial.instagram_url,
      icon: Instagram,
      bg: 'hover:text-pink-500 hover:border-pink-500/30 hover:bg-pink-500/10',
    });
  }

  if (contactSocial?.facebook_enabled && contactSocial?.facebook_url) {
    links.push({
      id: 'facebook',
      name: 'فيسبوك',
      url: contactSocial.facebook_url,
      icon: Facebook,
      bg: 'hover:text-blue-500 hover:border-blue-500/30 hover:bg-blue-500/10',
    });
  }

  if (contactSocial?.tiktok_enabled && contactSocial?.tiktok_url) {
    links.push({
      id: 'tiktok',
      name: 'تيك توك',
      url: contactSocial.tiktok_url,
      icon: TikTokIcon,
      bg: 'hover:text-neutral-950 hover:border-neutral-400/50 hover:bg-neutral-500/10 dark:hover:text-white dark:hover:border-neutral-500/50',
    });
  }

  // Keep the WhatsApp CTA safely above the social rail on small screens.
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
      observer = new ResizeObserver(updateHeight);
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
      <div className="flex items-center gap-2.5">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`oz-btn-press group w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-200 ${
                isDark
                  ? 'bg-neutral-900/90 border-neutral-800 text-neutral-300 shadow-black/30'
                  : 'bg-white border-neutral-200 text-neutral-700 shadow-sm'
              } ${link.bg}`}
              title={link.name}
              aria-label={link.name}
            >
              <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
            </a>
          );
        })}
      </div>
    );
  }

  // Minimal floating social rail: separate round controls, consistent with Outfit Zone's monochrome look.
  return (
    <aside
      ref={barRef}
      aria-label="روابط التواصل الاجتماعي"
      className={`fixed left-3 sm:left-6 z-40 flex flex-col gap-2 transition-all duration-300 print:hidden pointer-events-auto ${isScrollVisible ? 'translate-x-0 opacity-100' : '-translate-x-16 opacity-0 pointer-events-none md:translate-x-0 md:opacity-100 md:pointer-events-auto'}`}
      style={{
        bottom: 'var(--social-bar-bottom, 74px)',
      }}
    >
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            data-oz-social-motion
            className={`oz-btn-press group flex h-10 w-10 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-all duration-200 active:scale-95 sm:h-11 sm:w-11 ${
              isDark
                ? 'border-neutral-700/80 bg-[#111113]/90 text-neutral-300 shadow-black/40 hover:bg-[#1b1b1f]'
                : 'border-neutral-200/90 bg-white/90 text-neutral-600 shadow-neutral-400/20 hover:bg-white'
            } ${link.bg}`}
            title={link.name}
            aria-label={link.name}
          >
            <Icon className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" />
          </a>
        );
      })}
    </aside>
  );
};
