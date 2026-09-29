import React, { useState } from 'react';
import { ShoppingBag, Menu, X, Search, Sun, Moon, ChevronRight, ChevronLeft } from 'lucide-react';
import { OutfitZoneLogo } from '../common/OutfitZoneLogo';
import { useTheme } from '../../context/ThemeContext';

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
  announcementText = 'الدفع عند الاستلام فقط داخل جميع محافظات مصر · معاينة مجانية للطلب قبل الدفع والاستلام',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const { isDark, toggleTheme } = useTheme();

  const navLinks = [
    { label: 'الرئيسية', path: '/' },
    { label: 'الموديلات', path: '/products' },
    { label: 'قصة البراند', path: '/about' },
    { label: 'تواصل معنا', path: '/contact' },
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

  return (
    <>
      {/* Top Banner Notice with Left/Right Chevrons matching Reference Images */}
      <div className="bg-black text-white text-[10px] sm:text-xs py-2 px-3 text-center font-medium border-b border-neutral-800 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 px-2">
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span className="truncate tracking-tight">{announcementText}</span>
          <ChevronLeft className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        </div>
      </div>

      {/* Main Brand Header */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
          isDark
            ? 'bg-black/95 border-neutral-800/80 text-white'
            : 'bg-white/95 border-neutral-200 text-black shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          
          {/* Left: Navigation Menu & Search */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-neutral-900 text-white' : 'hover:bg-neutral-100 text-black'
              }`}
              aria-label="القائمة الرئيسية"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-neutral-900 text-white' : 'hover:bg-neutral-100 text-black'
              }`}
              aria-label="البحث عن منتج"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 mr-4 text-xs font-semibold uppercase tracking-wider">
              {navLinks.map((link) => {
                const isActive = currentPath === link.path;
                return (
                  <button
                    key={link.path}
                    onClick={() => handleNav(link.path)}
                    className={`transition-colors py-1 cursor-pointer relative ${
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

          {/* Center: OUTFIT ZONE Brand Lockup matching Reference Image */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => handleNav('/')}
              className="text-center focus:outline-none cursor-pointer group py-1"
              aria-label="Outfit Zone Home"
            >
              <OutfitZoneLogo
                variant="center-editorial"
                className={isDark ? 'text-white' : 'text-black'}
              />
            </button>
          </div>

          {/* Right: Theme Toggle & Shopping Cart Bag */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                isDark
                  ? 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-200'
                  : 'border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
              }`}
              title={isDark ? 'التحويل إلى الوضع الفاتح (Light Mode)' : 'التحويل إلى الوضع الداكن (Dark Mode)'}
              aria-label="تبديل مظهر الموقع"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Cart Bag with badge count */}
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-neutral-900 text-white' : 'hover:bg-neutral-100 text-black'
              }`}
              aria-label={`عربة التسوق (${itemCount} منتجات)`}
            >
              <ShoppingBag className="w-6 h-6 stroke-[1.8]" />
              <span
                className={`absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center border font-mono ${
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

        {/* Collapsible Search Bar */}
        {isSearchOpen && (
          <div
            className={`border-t px-4 py-3 transition-colors ${
              isDark ? 'bg-neutral-950/95 border-neutral-800' : 'bg-neutral-50/95 border-neutral-200'
            }`}
          >
            <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto relative">
              <input
                type="text"
                autoFocus
                placeholder="ابحث عن تيشيرت، هودي، بنطلون، أو قصة معينة..."
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

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            className={`lg:hidden border-t px-5 py-6 space-y-4 animate-in fade-in duration-200 ${
              isDark ? 'bg-black border-neutral-800' : 'bg-white border-neutral-200'
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
              <span>المظهر:</span>
              <button
                onClick={toggleTheme}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer ${
                  isDark
                    ? 'bg-neutral-900 border-neutral-800 text-white'
                    : 'bg-neutral-100 border-neutral-300 text-black'
                }`}
              >
                {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span>{isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}</span>
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
