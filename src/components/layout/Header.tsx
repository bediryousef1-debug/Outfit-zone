import React, { useState } from 'react';
import {
  ShoppingBag,
  Menu,
  X,
  Search,
  Sun,
  Moon,
  ChevronRight,
  ChevronLeft,
  Globe,
} from 'lucide-react';
import { OutfitZoneLogo } from '../common/OutfitZoneLogo';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  itemCount: number;
  setIsCartOpen: (open: boolean) => void;
  announcementText?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  onNavigate,
  itemCount,
  setIsCartOpen,
  announcementText,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');

  const { isDark, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  const navLinks = [
    { label: t('nav.home', 'الرئيسية'), path: '/' },
    { label: t('nav.products', 'الموديلات'), path: '/products' },
    { label: t('nav.about', 'قصة البراند'), path: '/about' },
    { label: t('nav.contact', 'تواصل معنا'), path: '/contact' },
  ];

  const handleNav = (path: string) => {
    setMobileMenuOpen(false);
    setIsSearchOpen(false);
    onNavigate(path);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const normalized = headerSearchQuery.trim();

    if (!normalized) return;

    if (normalized.toLowerCase() === 'admin') {
      setHeaderSearchQuery('');
      setIsSearchOpen(false);
      setMobileMenuOpen(false);
      onNavigate('/admin');
      return;
    }

    setHeaderSearchQuery('');
    setIsSearchOpen(false);
    setMobileMenuOpen(false);

    onNavigate(`/products?search=${encodeURIComponent(normalized)}`);
  };

  const localizedAnnouncement =
    announcementText ||
    t(
      'announcement.cod_inspection',
      language === 'en'
        ? 'Cash on Delivery only across all governorates in Egypt · Free inspection before payment and receiving'
        : 'الدفع عند الاستلام فقط داخل جميع محافظات مصر · معاينة مجانية للطلب قبل الدفع والاستلام'
    );

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-black text-white text-[10px] sm:text-xs py-2 px-3 text-center font-medium border-b border-neutral-800 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 px-2 min-w-0">
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />

          <span className="truncate tracking-tight min-w-0">
            {localizedAnnouncement}
          </span>

          <ChevronLeft className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        </div>
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${
          isDark
            ? 'bg-black/95 border-neutral-800/80 text-white'
            : 'bg-white/95 border-neutral-200 text-black shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto w-full px-2.5 sm:px-6 h-18 min-w-0 flex items-center">
          {/* =========================================================
              MOBILE / DESKTOP LEFT AREA
          ========================================================= */}
          <div className="flex items-center min-w-0 flex-1">
            <div className="flex items-center gap-0.5 sm:gap-4 shrink-0">
              {/* Menu */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer ${
                  isDark
                    ? 'hover:bg-neutral-900 text-white'
                    : 'hover:bg-neutral-100 text-black'
                }`}
                aria-label={t('nav.menu', 'Main Menu')}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </button>

              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer ${
                  isDark
                    ? 'hover:bg-neutral-900 text-white'
                    : 'hover:bg-neutral-100 text-black'
                }`}
                aria-label={t('nav.search', 'Search')}
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6 mr-4 text-xs font-semibold uppercase tracking-wider">
              {navLinks.map((link) => {
                const isActive = currentPath === link.path;

                return (
                  <button
                    key={link.path}
                    onClick={() => handleNav(link.path)}
                    className={`transition-colors py-1 cursor-pointer relative whitespace-nowrap ${
                      isActive
                        ? isDark
                          ? 'text-white font-bold'
                          : 'text-black font-bold'
                        : isDark
                        ? 'text-neutral-400 hover:text-white'
                        : 'text-neutral-500 hover:text-black'
                    }`}
                  >
                    {link.label}

                    {isActive && (
                      <span
                        className={`absolute -bottom-1 left-0 right-0 h-0.5 rounded-full ${
                          isDark ? 'bg-white' : 'bg-black'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* =========================================================
              CENTER LOGO
          ========================================================= */}
          <div className="flex items-center justify-center flex-none min-w-0 px-1 sm:px-4">
            <button
              onClick={() => handleNav('/')}
              className="text-center focus:outline-none cursor-pointer group py-1 min-w-0"
              aria-label="Outfit Zone Home"
            >
              <OutfitZoneLogo
                variant="center-editorial"
                className={`${isDark ? 'text-white' : 'text-black'} max-w-[120px] sm:max-w-none`}
              />
            </button>
          </div>

          {/* =========================================================
              RIGHT ACTIONS
          ========================================================= */}
          <div className="flex items-center justify-end min-w-0 flex-1">
            <div className="flex items-center gap-0.5 sm:gap-3">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className={`h-8 w-8 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1 rounded-full border transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 motion-reduce:transition-none ${
                  isDark
                    ? 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-200'
                    : 'border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                }`}
                title={
                  language === 'ar'
                    ? 'Switch to English'
                    : 'التحويل إلى العربية'
                }
                aria-label={language === 'ar' ? 'تبديل اللغة' : 'Switch language'}
              >
                <Globe className="w-3.5 h-3.5 shrink-0" />

                <span className="hidden sm:inline text-[10px] sm:text-xs whitespace-nowrap">
                  {language === 'ar' ? 'EN' : 'عربي'}
                </span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`w-8 h-8 sm:w-auto sm:h-auto sm:p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                  isDark
                    ? 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-200'
                    : 'border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                }`}
                title={
                  language === 'ar'
                    ? isDark
                      ? 'التحويل إلى الوضع الفاتح'
                      : 'التحويل إلى الوضع الداكن'
                    : isDark
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'
                }
                aria-label={language === 'ar' ? 'تبديل مظهر الموقع' : 'Toggle theme'}
              >
                {isDark ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>

              {/* Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className={`relative w-8 h-8 sm:w-auto sm:h-auto sm:p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                  isDark
                    ? 'hover:bg-neutral-900 text-white'
                    : 'hover:bg-neutral-100 text-black'
                }`}
                aria-label={`${t('nav.cart', 'Shopping Bag')} (${itemCount})`}
              >
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />

                <span
                  className={`absolute top-0.5 right-0.5 sm:top-1 sm:right-1 min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] px-0.5 sm:px-1 rounded-full text-[9px] sm:text-[10px] font-bold flex items-center justify-center border font-mono ${
                    isDark
                      ? 'bg-white text-black border-black'
                      : 'bg-black text-white border-white'
                  }`}
                >
                  {itemCount}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================
            SEARCH BAR
        ========================================================= */}
        {isSearchOpen && (
          <div
            className={`border-t px-4 py-3 transition-colors ${
              isDark
                ? 'bg-neutral-950/95 border-neutral-800'
                : 'bg-neutral-50/95 border-neutral-200'
            }`}
          >
            <form
              onSubmit={handleSearchSubmit}
              className="max-w-xl mx-auto relative"
            >
              <input
                type="text"
                autoFocus
                placeholder={t('nav.search_placeholder', 'Search t-shirts, polos, shirts...')}
                value={headerSearchQuery}
                onChange={(e) => setHeaderSearchQuery(e.target.value)}
                className={`w-full rounded-xl py-2.5 pr-10 pl-4 text-xs focus:outline-none transition-colors border ${
                  isDark
                    ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500 focus:border-white'
                    : 'bg-white border-neutral-300 text-black placeholder-neutral-400 focus:border-black'
                }`}
              />

              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </form>
          </div>
        )}

        {/* =========================================================
            MOBILE MENU
        ========================================================= */}
        {mobileMenuOpen && (
          <div
            className={`lg:hidden border-t px-5 py-6 space-y-4 animate-in fade-in duration-200 ${
              isDark
                ? 'bg-black border-neutral-800'
                : 'bg-white border-neutral-200'
            }`}
          >
            <div className="space-y-2">
              {navLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => handleNav(link.path)}
                  className={`w-full text-right py-3 px-4 rounded-xl text-sm font-bold transition-colors flex items-center justify-between cursor-pointer ${
                    currentPath === link.path
                      ? isDark
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-black'
                      : isDark
                      ? 'text-neutral-300 hover:bg-neutral-950'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <span>{link.label}</span>

                  <ChevronLeft className="w-4 h-4 text-neutral-400" />
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-neutral-800/50 flex items-center justify-between text-xs text-neutral-400">
              <span>
                {language === 'ar' ? 'اللغة / Language:' : 'Language:'}
              </span>

              <button
                onClick={toggleLanguage}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold cursor-pointer ${
                  isDark
                    ? 'bg-neutral-900 border-neutral-800 text-white'
                    : 'bg-neutral-100 border-neutral-300 text-black'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />

                <span>
                  {language === 'ar' ? 'English (EN)' : 'العربية (AR)'}
                </span>
              </button>
            </div>

            <div className="pt-3 flex items-center justify-between text-xs text-neutral-400">
              <span>{language === 'ar' ? 'المظهر:' : 'Theme:'}</span>

              <button
                onClick={toggleTheme}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer ${
                  isDark
                    ? 'bg-neutral-900 border-neutral-800 text-white'
                    : 'bg-neutral-100 border-neutral-300 text-black'
                }`}
              >
                {isDark ? (
                  <Sun className="w-3.5 h-3.5" />
                ) : (
                  <Moon className="w-3.5 h-3.5" />
                )}

                <span>
                  {language === 'ar'
                    ? isDark
                      ? 'الوضع الفاتح'
                      : 'الوضع الداكن'
                    : isDark
                    ? 'Light mode'
                    : 'Dark mode'}
                </span>
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};