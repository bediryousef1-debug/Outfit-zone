import React from 'react';
import { MessageCircle, ShieldCheck, Clock } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export const ContactPage: React.FC = () => {
  const { content, getWhatsAppUrl, socialLinks, contactSocial } = useStore();
  const { isDark } = useTheme();
  const { isRtl } = useLanguage();

  return (
    <div data-oz-scene className="max-w-4xl mx-auto px-3.5 sm:px-6 py-8 sm:py-16 text-right space-y-12 w-full max-w-full overflow-x-hidden">
      {/* Title */}
      <div className={`space-y-3 pb-8 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
          {isRtl ? 'خدمة العملاء والدعم' : 'Customer Support'}
        </span>
        <h1 className={`text-3xl sm:text-4xl font-extrabold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
          {isRtl ? 'تواصل مع Outfit Zone' : 'Contact Outfit Zone'}
        </h1>
        <p className="text-sm text-neutral-400 max-w-xl leading-relaxed">
          {content?.contact_text || (isRtl ? 'نحن هنا لمساعدتك في استفسارات المقاسات، تتبع شحنتك، أو أي استفسار يخص طلبك.' : 'We are here to help with sizing questions, tracking your order, or any inquiry.')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* WhatsApp & Phone Support Box */}
        <div className={`p-5 sm:p-8 rounded-2xl border space-y-6 ${
          isDark ? 'bg-[#121216] border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center text-[#25D366]">
              <MessageCircle className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{isRtl ? 'دعم WhatsApp المباشر' : 'Direct WhatsApp Support'}</h2>
              <p className="text-xs text-neutral-400">{isRtl ? 'أسرع وسيلة للتواصل معنا على مدار اليوم' : 'The fastest way to reach us anytime'}</p>
            </div>
          </div>

          <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
            {isRtl ? 'اضغط على الزر أدناه لمراسلتنا مباشرة على واتساب. يمكنك الاستفسار عن تفاصيل أي موديل أو إرسال رقم طلبك لمتابعته فورًا.' : 'Click below to message us directly on WhatsApp for sizing help or order tracking.'}
          </p>

          <a
            href={getWhatsAppUrl(isRtl ? 'مرحبًا Outfit Zone، أريد الاستفسار عن منتجاتكم وخدمة التوصيل.' : 'Hello Outfit Zone, I have an inquiry about your products and delivery.')}
            target="_blank"
            rel="noreferrer noopener"
            className="w-full py-3.5 px-6 bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>{isRtl ? 'محادثة واتساب فورية' : 'Instant WhatsApp Chat'}</span>
          </a>

          {/* Direct Phone Number */}
          {contactSocial?.phone_number && (
            <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
            }`}>
              <span className="text-neutral-400">{isRtl ? 'الاتصال المباشر / هاتف:' : 'Direct Phone Call:'}</span>
              <a
                href={`tel:${contactSocial.phone_number}`}
                className={`font-mono font-bold hover:underline ${isDark ? 'text-white' : 'text-neutral-900'}`}
                dir="ltr"
              >
                {contactSocial.phone_number}
              </a>
            </div>
          )}

          <div className={`pt-4 border-t flex items-center gap-2 text-[11px] text-neutral-400 ${
            isDark ? 'border-neutral-800/80' : 'border-neutral-100'
          }`}>
            <Clock className="w-4 h-4 text-neutral-500" />
            <span>{isRtl ? 'ساعات الرد: يوميًا من 10 صباحًا حتى 11 مساءً' : 'Support hours: Daily 10 AM - 11 PM'}</span>
          </div>
        </div>

        {/* Social Accounts & Trust */}
        <div className="space-y-6">
          <div className={`p-5 sm:p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#121216] border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
          }`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{isRtl ? 'حساباتنا على منصات التواصل' : 'Our Social Media Channels'}</h3>
            <p className="text-xs text-neutral-400">
              {isRtl ? 'تابع أحدث دروبات الستريت وير وكواليس التصوير والموديلات الجديدة أولاً بأول.' : 'Follow the latest streetwear drops, behind the scenes, and new releases.'}
            </p>

            <div className="space-y-2.5 pt-2 text-xs">
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-600 text-white' : 'bg-neutral-50 border-neutral-200 hover:border-neutral-400 text-neutral-800'
                  }`}
                >
                  <span className="font-semibold">Instagram</span>
                  <span className="text-neutral-400 text-[11px]">{isRtl ? 'متابعة ↗' : 'Follow ↗'}</span>
                </a>
              )}

              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-600 text-white' : 'bg-neutral-50 border-neutral-200 hover:border-neutral-400 text-neutral-800'
                  }`}
                >
                  <span className="font-semibold">Facebook</span>
                  <span className="text-neutral-400 text-[11px]">{isRtl ? 'متابعة ↗' : 'Follow ↗'}</span>
                </a>
              )}

              {socialLinks.tiktok && (
                <a
                  href={socialLinks.tiktok}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-600 text-white' : 'bg-neutral-50 border-neutral-200 hover:border-neutral-400 text-neutral-800'
                  }`}
                >
                  <span className="font-semibold">TikTok</span>
                  <span className="text-neutral-400 text-[11px]">{isRtl ? 'متابعة ↗' : 'Follow ↗'}</span>
                </a>
              )}

              {socialLinks.messenger && (
                <a
                  href={socialLinks.messenger}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-600 text-white' : 'bg-neutral-50 border-neutral-200 hover:border-neutral-400 text-neutral-800'
                  }`}
                >
                  <span className="font-semibold">Messenger</span>
                  <span className="text-neutral-400 text-[11px]">{isRtl ? 'مراسلة ↗' : 'Message ↗'}</span>
                </a>
              )}
            </div>
          </div>

          <div className={`p-5 rounded-2xl border space-y-3 text-xs ${
            isDark ? 'bg-[#121216] border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
          }`}>
            <div className={`flex items-center gap-2 font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>{isRtl ? 'سياسة التوصيل والمعاينة' : 'Delivery & Inspection Policy'}</span>
            </div>
            <p className="text-neutral-400 leading-relaxed">
              {isRtl ? (content?.shipping_text || 'جميع الطلبات يتم شحنها لجميع المحافظات بنظام الدفع عند الاستلام كاش. يمكنك معاينة الطلب والتأكد من مطابقة المقاس قبل الدفع.') : 'All orders are shipped across all Egyptian governorates with Cash on Delivery. You can inspect the pieces and check sizes before payment.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
