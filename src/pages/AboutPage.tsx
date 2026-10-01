import React from 'react';
import { ArrowLeft, Sparkles, ShieldCheck, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { resolveImageUrl } from '../utils/imageHelper';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const { isDark } = useTheme();

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-8 sm:py-16 text-right space-y-12 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className={`space-y-3 pb-8 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
          عن البراند
        </span>
        <h1 className={`text-3xl sm:text-4xl font-extrabold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
          قصتنا في Outfit Zone
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 max-w-2xl leading-relaxed">
          براند ملابس ستريت وير رجالي مصري يركز على تقديم تصاميم يومية حديثة بقصات Box Fit و Oversized تلائم الشباب العصري.
        </p>
      </div>

      {/* Main Philosophy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className={`space-y-4 text-xs sm:text-sm leading-relaxed ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            لماذا بدأنا Outfit Zone؟
          </h2>
          <p>
            تأسس براند Outfit Zone انطلاقًا من شغف واضح بثقافة الستريت وير ورغبة في سد فجوة حقيقية في السوق المحلي: تقديم تيشيرتات وبولو رجالي بقصات واسعة ومريحة فعلاً، مصنعة بأقمشة قطنية ثقيلة دون مبالغة في الأسعار أو تصاميم صاخبة غير مريحة للعين.
          </p>
          <p className="text-neutral-400">
            نركز على التفاصيل التي تهم مرتدي الستريت وير: تماسك الياقة بعد الغسيل، انسيابية الأكتاف المنسدلة (Drop Shoulders)، والاتساع المدروس الذي يمنحك حضورًا مميزًا بدون تكتل القماش.
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
          المعايير التي نلتزم بها في كل قطعة:
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
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>خامات 100% قطنية ثقيلة</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              نعتمد أوزان تبدأ من 240 وحتى 260 GSM المعالجة ضد الانكماش لتتحمل الاستخدام والغسيل المتكرر.
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
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>قصات Box Fit و Oversized</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              قصات عصرية صُممت لتمنح الجسم حرية حركة ومظهرًا متناسقًا ومريحًا طوال اليوم.
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
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>ثقة وأمان المعاينة</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              دفع عند الاستلام مع إمكانية فتح الشحنة والتأكد من المقاس والخامة قبل سداد أي مبلغ.
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
          <span>استكشف المنتجات الآن</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
