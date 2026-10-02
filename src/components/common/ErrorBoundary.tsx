import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** When this value changes (e.g. the route), the boundary clears its error state. */
  resetKey?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

function readLanguage(): 'ar' | 'en' {
  try {
    return localStorage.getItem('oz_lang') === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
}

/**
 * Prevents a runtime error inside a page from blanking the whole app
 * (the "white screen" symptom). It sits outside the LanguageProvider-aware
 * tree on purpose, so it reads the saved language directly.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[Outfit Zone] Unhandled UI error:', error, info.componentStack);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const isAr = readLanguage() === 'ar';

    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold mb-2">
          {isAr ? 'حصلت مشكلة غير متوقعة' : 'Something went wrong'}
        </h2>
        <p className="text-xs text-neutral-400 mb-6">
          {isAr
            ? 'حاول تحديث الصفحة. لو المشكلة استمرت ارجع للصفحة الرئيسية.'
            : 'Please try reloading the page. If the problem continues, go back to the home page.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="py-2.5 px-6 font-bold text-xs rounded-xl bg-black text-white cursor-pointer"
          >
            {isAr ? 'تحديث الصفحة' : 'Reload page'}
          </button>
          <a
            href="/"
            className="py-2.5 px-6 font-bold text-xs rounded-xl border border-neutral-400 cursor-pointer"
          >
            {isAr ? 'الرئيسية' : 'Home'}
          </a>
        </div>
      </div>
    );
  }
}
