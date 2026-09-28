import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AdminAuthContextType {
  adminEmail: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  signInWithEmailPassword: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Clean up legacy auth keys once at initialization (no localStorage fallback)
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('outfit_zone_admin_token');
    localStorage.removeItem('outfit_zone_admin_email');
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('admin_token_')) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore storage errors
  }
}

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Authoritative admin verification via Supabase RPC is_admin()
  const verifyIsAdmin = async (): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) {
        console.warn('is_admin RPC returned error:', error.message);
        return false;
      }
      return Boolean(data);
    } catch (err) {
      console.warn('verifyIsAdmin exception:', err);
      return false;
    }
  };

  // Restore session from Supabase Auth
  const checkSession = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setAdminEmail(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        setAdminEmail(null);
        return;
      }

      const isAdmin = await verifyIsAdmin();
      if (isAdmin) {
        setAdminEmail(session.user?.email || null);
        setAuthError(null);
      } else {
        await supabase.auth.signOut();
        setAdminEmail(null);
      }
    } catch (err) {
      console.error('Session restoration error:', err);
      setAdminEmail(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();

    let subscription: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        // Deferred execution to avoid calling Supabase synchronously inside callback
        setTimeout(() => {
          if (event === 'SIGNED_OUT' || !session) {
            setAdminEmail(null);
            setIsLoading(false);
            return;
          }
          checkSession();
        }, 0);
      });
      subscription = data.subscription;
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signInWithEmailPassword = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setAuthError('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      setIsLoading(false);
      return false;
    }

    if (!isSupabaseConfigured || !supabase) {
      setAuthError('قاعدة بيانات Supabase غير متصلة.');
      setIsLoading(false);
      return false;
    }

    try {
      // 1. Supabase Auth signInWithPassword
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setAuthError(
          error.message === 'Invalid login credentials'
            ? 'بيانات الدخول غير صحيحة (البريد الإلكتروني أو كلمة المرور خاطئة).'
            : error.message || 'فشل تسجيل الدخول.'
        );
        setIsLoading(false);
        return false;
      }

      // 2. Verify admin via supabase.rpc('is_admin')
      if (data?.session) {
        const isAdmin = await verifyIsAdmin();
        if (isAdmin) {
          setAdminEmail(data.user?.email || cleanEmail);
          setAuthError(null);
          setIsLoading(false);
          return true;
        } else {
          await supabase.auth.signOut();
          setAdminEmail(null);
          setAuthError('هذا الحساب غير مصرح له بالدخول إلى لوحة التحكم.');
          setIsLoading(false);
          return false;
        }
      }

      setAuthError('فشل تسجيل الدخول.');
      setIsLoading(false);
      return false;
    } catch (err: any) {
      console.error('Login error:', err);
      setAuthError('حدث خطأ أثناء محاولة تسجيل الدخول. يرجى إعادة المحاولة.');
      setIsLoading(false);
      return false;
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('SignOut error:', err);
    } finally {
      setAdminEmail(null);
      setAuthError(null);
      setIsLoading(false);
    }
  };

  const clearError = () => setAuthError(null);

  return (
    <AdminAuthContext.Provider
      value={{
        adminEmail,
        isAuthenticated: Boolean(adminEmail),
        isLoading,
        authError,
        signInWithEmailPassword,
        signOut,
        clearError,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
