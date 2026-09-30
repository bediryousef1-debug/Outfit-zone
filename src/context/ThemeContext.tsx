import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getInitialThemeState = (): { theme: Theme; isManual: boolean } => {
  if (typeof window === 'undefined') {
    return { theme: 'dark', isManual: false };
  }

  try {
    const saved = localStorage.getItem('oz_theme');
    if (saved === 'light' || saved === 'dark') {
      return { theme: saved as Theme, isManual: true };
    }

    // Follow device/system preferences on first visit
    if (window.matchMedia) {
      if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        return { theme: 'light', isManual: false };
      }
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return { theme: 'dark', isManual: false };
      }
    }
  } catch {}

  // Fallback if unable to detect system preference: Dark
  return { theme: 'dark', isManual: false };
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [{ theme, isManual }, setThemeState] = useState<{ theme: Theme; isManual: boolean }>(getInitialThemeState);

  // Apply theme class to documentElement immediately
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    } catch {}
  }, [theme]);

  // If user has NOT manually set theme, dynamically respond to OS/browser theme shifts
  useEffect(() => {
    if (isManual) return;
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemChange = (e: MediaQueryListEvent) => {
      // Re-verify localStorage wasn't set in another tab
      try {
        const saved = localStorage.getItem('oz_theme');
        if (saved === 'light' || saved === 'dark') return;
      } catch {}

      setThemeState({
        theme: e.matches ? 'dark' : 'light',
        isManual: false,
      });
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
      return () => mediaQuery.removeEventListener('change', handleSystemChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleSystemChange);
      return () => (mediaQuery as any).removeListener(handleSystemChange);
    }
  }, [isManual]);

  const setTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem('oz_theme', newTheme);
    } catch {}
    setThemeState({ theme: newTheme, isManual: true });
  };

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
