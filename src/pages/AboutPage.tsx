import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, Sparkles, ShieldCheck, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { resolveImageUrl } from '../utils/imageHelper';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-8 sm:py-16 text-right space-y-12 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className={`space-y-3 pb-8 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
          {t('about.title', 'About the Brand')}
        </span>
        <h1 className={`text-3xl sm:text-4xl font-extrabold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
          {t('about.story_title', 'Our Story at Outfit Zone')}
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 max-w-2xl leading-relaxed">
          {t('about.description', 'An Egyptian men’s streetwear brand focused on modern everyday designs with Box Fit and Oversized cuts made for today’s youth.')}
        </p>
      </div>

      {/* Main Philosophy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className={`space-y-4 text-xs sm:text-sm leading-relaxed ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            {t('about.why_title', 'Why Did We Start Outfit Zone?')}
          </h2>
          <p>
            {t('about.why_text', 'Outfit Zone was founded from a clear passion for streetwear culture and a desire to fill a real gap in the local market: offering men’s T-shirts and polos with genuinely loose, comfortable cuts, made from heavy cotton fabrics without exaggerated prices or overly loud designs.')}
          </p>
          <p className="text-neutral-400">
            {t('about.details', 'We focus on the details that matter to streetwear wearers: collar durability after washing, the natural flow of Drop Shoulders, and a carefully balanced fit that gives you a distinctive presence without excess fabric.')}
          </p>
        </div>

        <div className={`aspect-[4/3] rounded-2xl overflow-hidden border shadow-xl ${
          isDark ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-200 bg-neutral-100'
        }`}>
          <img
            src={resolveImageUrl('/images/hero_streetwear_editorial_1790342899745.jpg')}
            alt="Outfit Zone Streetwear Aesthetics"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Core Principles (No fake claims, only actual product focus) */}
      <div className={`space-y-4 pt-6 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
          {t('about.standards', 'The standards we follow in every piece:')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`p-5 rounded-xl border space-y-2 ${
            isDark ? 'bg-[#121216] border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
          }`}>
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
              isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-neutral-100 border-neutral-200 text-neutral-800'
            }`}>
              <Check className="w-4 h-4" />
            </div>
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{t('about.cotton_title', '100% Heavy Cotton Fabrics')}</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t('about.cotton_text', 'We use fabrics ranging from 240 to 260 GSM, treated against shrinkage to withstand regular wear and repeated washing.')}
            </p>
          </div>

          <div className={`p-5 rounded-xl border space-y-2 ${
            isDark ? 'bg-[#121216] border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
          }`}>
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
              isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-neutral-100 border-neutral-200 text-neutral-800'
            }`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{t('about.fit_title', 'Box Fit & Oversized Cuts')}</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t('about.fit_text', 'Modern cuts designed to give you freedom of movement and a balanced, comfortable look throughout the day.')}
            </p>
          </div>

          <div className={`p-5 rounded-xl border space-y-2 ${
            isDark ? 'bg-[#121216] border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
          }`}>
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
              isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-neutral-100 border-neutral-200 text-neutral-800'
            }`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{t('about.trust_title', 'Try Before You Pay')}</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t('about.trust_text', 'Cash on delivery with the option to open the package and check the size and fabric before making any payment.')}
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="pt-6 text-center">
        <button
          onClick={() => onNavigate('/products')}
          className={`py-3 px-8 font-extrabold text-xs rounded-xl transition-colors inline-flex items-center gap-2 shadow-lg cursor-pointer ${
            isDark
              ? 'bg-white hover:bg-neutral-200 text-black'
              : 'bg-black hover:bg-neutral-800 text-white'
          }`}
        >
          <span>{t('about.explore', 'Explore Products Now')}</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
