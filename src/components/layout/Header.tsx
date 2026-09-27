import React, { useState } from 'react';
import { ShoppingBag, Menu, X, Search } from 'lucide-react';
import { OutfitZoneLogo } from '../common/OutfitZoneLogo';

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

  const navLinks = [
    { label: 'الرئيسية', path: '/' },
    { label: 'جميع الموديلات', path: '/products' },
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
      {/* Top Banner Notice */}
      <div className="bg-[#121216] border-b border-neutral-800 text-neutral-300 text-xs py-2 px-4 text-center font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <span>{announcementText}</span>
        </div>
      </div>

      {/* Top Bar Header */}
      <header className="sticky top-0 z-40 bg-[#0c0c0e]/95 backdrop-blur-md border-b border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNav('/')}
              className="text-right focus:outline-none group flex items-center gap-2 cursor-pointer"
              aria-label="Outfit Zone Home"
            >
              <OutfitZoneLogo variant="horizontal" className="text-white group-hover:text-neutral-200 transition-colors" />
            </button>
          </div>

          {/* Clean text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleNav(link.path)}
                  className={`transition-colors relative py-1 cursor-pointer ${
                    isActive ? 'text-white font-semibold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Primary Actions (Search + Cart + Mobile Toggle) */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Desktop / Global Search Input Toggle */}
            <div className="relative">
              {isSearchOpen ? (
                <form onSubmit={handleSearchSubmit} className="flex items-center animate-in fade-in zoom-in-95 duration-150">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      autoFocus
                      placeholder="ابحث عن موديل..."
                      value={headerSearchQuery}
                      onChange={(e) => setHeaderSearchQuery(e.target.value)}
                      className="w-48 sm:w-64 bg-neutral-900 border border-neutral-700 rounded-lg py-1.5 pr-8 pl-8 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-all text-right"
                    />
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setIsSearchOpen(false)}
                      className="p-1 text-neutral-400 hover:text-white absolute left-2 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
                  aria-label="البحث عن منتج"
                  title="بحث"
                >
                  <Search className="w-5 h-5 stroke-[1.75]" />
                </button>
              )}
            </div>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors focus-visible:ring-2 focus-visible:ring-neutral-400 cursor-pointer"
              aria-label="سلة المشتريات"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.75]" />
              {itemCount > 0 && (
                <span className="absolute top-1 -right-1 bg-white text-black text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center font-mono-numbers shadow-sm">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-[#0c0c0e]/98 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="h-16 px-4 flex items-center justify-between border-b border-neutral-800">
            <OutfitZoneLogo variant="horizontal" className="text-white" />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-neutral-400 hover:text-white cursor-pointer"
              aria-label="إغلاق القائمة"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search bar inside mobile drawer */}
          <div className="p-4 border-b border-neutral-800">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="ابحث عن موديل، خامة، أو قصة..."
                value={headerSearchQuery}
                onChange={(e) => setHeaderSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2.5 pr-10 pl-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors text-right"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute top-3 right-3.5 pointer-events-none" />
            </form>
          </div>

          <div className="p-6 flex flex-col gap-4 text-right">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleNav(link.path)}
                  className={`text-lg font-bold py-2 text-right cursor-pointer ${
                    isActive ? 'text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </div>

          <div className="mt-auto p-6 border-t border-neutral-800 text-xs text-neutral-500 text-right space-y-1">
            <p className="font-semibold text-neutral-300">Outfit Zone Egypt</p>
            <p>ملابس ستريت وير رجالي قطن مصري 100%</p>
            <p>معاينة مجانية قبل الدفع والاستلام</p>
          </div>
        </div>
      )}
    </>
  );
};
