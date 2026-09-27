import React from 'react';
import {
  Package,
  ShoppingBag,
  Settings,
  LogOut,
  ArrowRight,
  LayoutDashboard,
  Layers,
  FileText,
  Share2,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { OutfitZoneLogo } from '../../components/common/OutfitZoneLogo';

export type AdminTab =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'orders'
  | 'content'
  | 'contact'
  | 'settings';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onExitAdmin: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onExitAdmin,
  children,
}) => {
  const { adminEmail, signOut } = useAdminAuth();

  const handleLogout = async () => {
    await signOut();
    window.history.pushState({}, '', '/admin/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const navItems: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'لوحة المؤشرات', icon: LayoutDashboard },
    { id: 'products', label: 'المنتجات والمخزون', icon: Package },
    { id: 'categories', label: 'الأقسام', icon: Layers },
    { id: 'orders', label: 'الطلبات', icon: ShoppingBag },
    { id: 'content', label: 'محتوى المتجر', icon: FileText },
    { id: 'contact', label: 'التواصل والسوشيال', icon: Share2 },
    { id: 'settings', label: 'الإعدادات العامة', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-200 flex flex-col text-right selection:bg-neutral-800 selection:text-white">
      {/* Admin Top Bar */}
      <header className="sticky top-0 z-30 bg-[#0e0e12] border-b border-neutral-800 px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand with Official Logo & Badge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <OutfitZoneLogo variant="horizontal" className="text-white scale-90 sm:scale-100 origin-right" />
            <span className="text-[10px] font-mono bg-white text-black font-extrabold px-2 py-0.5 rounded shadow-sm">
              ADMIN
            </span>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3 text-xs">
          <span className="hidden lg:inline text-neutral-400 font-mono text-[11px] bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-md" dir="ltr">
            {adminEmail}
          </span>

          <button
            onClick={onExitAdmin}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="معاينة المتجر كعميل"
          >
            <span>المتجر</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Visible Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-red-950/50 hover:bg-red-900/60 border border-red-800/60 text-red-200 hover:text-white transition-colors font-semibold cursor-pointer"
            title="تسجيل الخروج"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </header>

      {/* Navigation Sub-bar (Desktop & Tablet) */}
      <div className="bg-[#0c0c0f] border-b border-neutral-800 px-4 sm:px-6 py-2 overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1.5 text-xs font-semibold min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
};
