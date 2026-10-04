import React, { useState } from 'react';
import { OutfitZoneLogo } from '../../components/common/OutfitZoneLogo';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';

interface AdminLoginPageProps {
  onBackToStore?: () => void;
  onLoginSuccess?: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onBackToStore,
  onLoginSuccess,
}) => {
  const { signInWithEmailPassword, authError, isLoading } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await signInWithEmailPassword(email, password);
    if (success) {
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        window.history.pushState({}, '', '/admin');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#08080a] flex items-center justify-center p-4 text-right selection:bg-neutral-800 selection:text-white">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[#0f0f13] border border-neutral-800 shadow-2xl space-y-6">
        
        {/* Brand Logo & Title */}
        <div className="text-center flex flex-col items-center justify-center space-y-3 pb-4 border-b border-neutral-800/80">
          <OutfitZoneLogo variant="stacked" className="text-white" />
          <div className="space-y-1 mt-2">
            <h1 className="text-base sm:text-lg font-bold text-neutral-200">
              Outfit Zone Admin Dashboard
            </h1>
            <p className="text-xs text-neutral-400">
              لوحة التحكم المركزية لإدارة الموديلات والمخزون ومحتوى المتجر
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {authError && (
          <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800/80 flex items-start gap-2.5 text-xs text-red-200 leading-relaxed animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Email / البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                dir="ltr"
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-white transition-colors disabled:opacity-50"
              />
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Password / كلمة المرور
            </label>
            <div className="relative">
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-white transition-colors disabled:opacity-50"
              />
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-sm transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>

        {/* Back Link to Customer Storefront */}
        {onBackToStore && (
          <div className="pt-4 border-t border-neutral-800/80 text-center">
            <button
              type="button"
              onClick={onBackToStore}
              className="text-xs text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>العودة لمتجر Outfit Zone</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminLoginPage;

