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

const ADMIN_TOKEN_KEY = 'outfit_zone_admin_token';
const ADMIN_EMAIL_KEY = 'outfit_zone_admin_email';

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminEmail, setAdminEmail] = useState<string | null>(() => {
    return localStorage.getItem(ADMIN_EMAIL_KEY) || null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Authoritative check: verify that the user's email is present in the admin_users table
  const verifyAdminApproval = async (email: string): Promise<boolean> => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) return false;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('id, email, user_id')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (!error && data) {
          return true;
        }
      } catch (e) {
        console.warn('verifyAdminApproval check failed:', e);
      }
      return false;
    }

    try {
      const token = localStorage.getItem(ADMIN_TOKEN_KEY) || cleanEmail;
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json().catch(() => ({}));
      return Boolean(res.ok && data.authorized);
    } catch {
      return false;
    }
  };

  // Check initial session from Supabase Auth or Local Storage
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      setIsLoading(true);
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email) {
            const isApproved = await verifyAdminApproval(session.user.email);
            if (isMounted) {
              if (isApproved) {
                setAdminEmail(session.user.email);
                localStorage.setItem(ADMIN_EMAIL_KEY, session.user.email);
                if (session.access_token) {
                  localStorage.setItem(ADMIN_TOKEN_KEY, session.access_token);
                }
                setAuthError(null);
                setIsLoading(false);
                return;
              } else {
                await supabase.auth.signOut();
                localStorage.removeItem(ADMIN_TOKEN_KEY);
                localStorage.removeItem(ADMIN_EMAIL_KEY);
                setAdminEmail(null);
                setAuthError('هذا الحساب غير مصرح له بالدخول إلى لوحة التحكم.');
                setIsLoading(false);
                return;
              }
            }
          }
        }

        // Check stored admin token & email
        const storedEmail = localStorage.getItem(ADMIN_EMAIL_KEY);
        const storedToken = localStorage.getItem(ADMIN_TOKEN_KEY);

        if (storedEmail && storedToken) {
          const isApproved = await verifyAdminApproval(storedEmail);
          if (isMounted) {
            if (isApproved) {
              setAdminEmail(storedEmail);
              setAuthError(null);
            } else {
              localStorage.removeItem(ADMIN_TOKEN_KEY);
              localStorage.removeItem(ADMIN_EMAIL_KEY);
              setAdminEmail(null);
            }
          }
        } else if (isMounted) {
          setAdminEmail(null);
        }
      } catch (err: any) {
        console.error('Auth verification error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Listen to real Supabase auth events if configured
    let authListenerSub: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          if (isMounted) {
            localStorage.removeItem(ADMIN_TOKEN_KEY);
            localStorage.removeItem(ADMIN_EMAIL_KEY);
            setAdminEmail(null);
          }
          return;
        }

        if (session?.user?.email) {
          const isApproved = await verifyAdminApproval(session.user.email);
          if (isMounted) {
            if (isApproved) {
              setAdminEmail(session.user.email);
              localStorage.setItem(ADMIN_EMAIL_KEY, session.user.email);
              if (session.access_token) {
                localStorage.setItem(ADMIN_TOKEN_KEY, session.access_token);
              }
              setAuthError(null);
            } else {
              await supabase?.auth.signOut();
              localStorage.removeItem(ADMIN_TOKEN_KEY);
              localStorage.removeItem(ADMIN_EMAIL_KEY);
              setAdminEmail(null);
              setAuthError('هذا الحساب غير مصرح له بالدخول إلى لوحة التحكم.');
            }
          }
        }
      });
      authListenerSub = data.subscription;
    }

    return () => {
      isMounted = false;
      authListenerSub?.unsubscribe();
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

    try {
      // 1. If remote Supabase is configured, authenticate strictly via Supabase Auth
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          // Supabase Auth rejected the password or credentials
          setAuthError(
            error.message === 'Invalid login credentials'
              ? 'بيانات الدخول غير صحيحة (البريد الإلكتروني أو كلمة المرور خاطئة).'
              : error.message || 'فشل تسجيل الدخول.'
          );
          return false;
        }

        if (data?.user?.email) {
          const isApproved = await verifyAdminApproval(data.user.email);
          if (isApproved) {
            setAdminEmail(data.user.email);
            localStorage.setItem(ADMIN_EMAIL_KEY, data.user.email);
            if (data.session?.access_token) {
              localStorage.setItem(ADMIN_TOKEN_KEY, data.session.access_token);
            }
            setAuthError(null);
            return true;
          } else {
            // Authenticated user is not an approved admin
            await supabase.auth.signOut();
            localStorage.removeItem(ADMIN_TOKEN_KEY);
            localStorage.removeItem(ADMIN_EMAIL_KEY);
            setAdminEmail(null);
            setAuthError('هذا الحساب غير مصرح له بالدخول إلى لوحة التحكم.');
            return false;
          }
        }
        return false;
      }

      // 2. Call backend admin login endpoint (checks database admin_users table) - ONLY when Supabase is NOT configured
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const result = await res.json().catch(() => ({}));

      if (res.ok && result.authorized && result.email) {
        setAdminEmail(result.email);
        localStorage.setItem(ADMIN_EMAIL_KEY, result.email);
        const token = result.token || `admin_token_${result.email}`;
        localStorage.setItem(ADMIN_TOKEN_KEY, token);
        setAuthError(null);
        return true;
      } else {
        setAuthError(result.error || 'بيانات الدخول غير صحيحة أو هذا الحساب غير مصرح له.');
        return false;
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setAuthError('حدث خطأ أثناء محاولة تسجيل الدخول. يرجى إعادة المحاولة.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.auth.signOut();
        } catch {}
      }
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_EMAIL_KEY);
      setAdminEmail(null);
      setAuthError(null);
    } finally {
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
