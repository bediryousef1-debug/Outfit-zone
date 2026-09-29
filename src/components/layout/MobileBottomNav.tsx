import React from 'react';
import { Home, LayoutGrid, Heart, User } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface MobileBottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPath,
  onNavigate,
}) => {
  const { isDark } = useTheme();

  const navItems = [
    {
      id: 'home',
      label: 'الرئيسية',
      icon: Home,
      path: '/',
      isActive: currentPath === '/',
    },
    {
      id: 'categories',
      label: 'الأقسام',
      icon: LayoutGrid,
      path: '/products',
      isActive: currentPath.startsWith('/products') && !currentPath.includes('filter=favorites'),
    },
    {
      id: 'favorites',
      label: 'المفضلة',
      icon: Heart,
      path: '/products?filter=favorites',
      isActive: currentPath.includes('filter=favorites'),
    },
    {
      id: 'account',
      label: 'حسابي',
      icon: User,
      path: '/about',
      isActive: currentPath === '/about' || currentPath === '/admin',
    },
  ];

  return (
    <nav
      className={`fixed bottom-0 inset-x-0 z-40 md:hidden border-t backdrop-blur-lg transition-colors ${
        isDark
          ? 'bg-black/90 border-neutral-800/90 text-neutral-400'
          : 'bg-white/95 border-neutral-200 text-neutral-600 shadow-lg'
      }`}
      aria-label="التنقل الرئيسي للهاتف"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
    >
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors relative cursor-pointer ${
                active
                  ? isDark
                    ? 'text-white font-bold'
                    : 'text-black font-bold'
                  : isDark
                  ? 'text-neutral-400 hover:text-neutral-200'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
              {active && (
                <span
                  className={`w-4 h-0.5 rounded-full mt-0.5 ${
                    isDark ? 'bg-white' : 'bg-black'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
