import React, { useEffect, useState } from 'react';
import { CheckCircle2, MessageCircle, Truck, Package, ShieldCheck, ArrowRight } from 'lucide-react';
import { Order } from '../types';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../utils/constants';

interface OrderSuccessPageProps {
  orderNumber: string;
  onNavigate: (path: string) => void;
}

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({ orderNumber, onNavigate }) => {
  const { settings, getWhatsAppUrl } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const data = await api.lookupOrder(orderNumber);
        setOrder(data);
      } catch (err) {
        console.error('Failed to load order details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (orderNumber) {
      loadOrder();
    }
  }, [orderNumber]);

  const whatsappTrackingMessage = `مرحبًا Outfit Zone، أريد متابعة الطلب رقم ${orderNumber}`;
  const whatsappUrl = getWhatsAppUrl(whatsappTrackingMessage);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 text-right">
      <div className="p-6 sm:p-10 rounded-3xl bg-[#121216] border border-neutral-800 shadow-2xl space-y-8">
        
        {/* Success Icon & Header */}
        <div className="text-center space-y-3 pb-6 border-b border-neutral-800/80">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            تم استلام طلبك بنجاح 🎉
          </h1>

          <div className="inline-block bg-neutral-900 border border-neutral-800 px-4 py-1.5 rounded-lg">
            <span className="text-xs text-neutral-400 ml-2">رقم الطلب الخاص بك:</span>
            <span className="font-mono text-sm sm:text-base font-bold text-white tracking-wider">
              #{orderNumber}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            شكرًا لثقتك في Outfit Zone! سنقوم بتجهيز القطع والشحن فورًا وسيتواصل معك مندوب شركة الشحن خلال 2 - 4 أيام عمل.
          </p>
        </div>

        {/* WhatsApp Tracking CTA */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-neutral-900 border border-emerald-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-right">
            <h4 className="text-sm font-bold text-white">
              تابع طلبك أو استفسر عبر WhatsApp
            </h4>
            <p className="text-xs text-neutral-400">
              أرسل رقم طلبك لفريق الدعم لتأكيد الميعاد المناسب لاستلامك.
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="py-2.5 px-5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs sm:text-sm rounded-lg flex items-center gap-2 transition-colors shadow-md whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>تواصل معنا عبر WhatsApp</span>
          </a>
        </div>

        {/* Order Details Breakdown */}
        {order && (
          <div className="space-y-6">
            {/* Delivery destination */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
              <h3 className="font-bold text-white flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-neutral-300" />
                <span>وجهة الشحن ومعلومات العميل:</span>
              </h3>
              <p className="text-neutral-300">
                <strong className="text-neutral-400">الاسم:</strong> {order.customer_name}
              </p>
              <p className="text-neutral-300">
                <strong className="text-neutral-400">الهاتف:</strong>{' '}
                <span dir="ltr" className="font-mono">{order.phone}</span>
              </p>
              <p className="text-neutral-300">
                <strong className="text-neutral-400">العنوان:</strong> {order.governorate} - {order.city} - {order.address}
              </p>
              {order.notes && (
                <p className="text-neutral-400 italic">
                  <strong>ملاحظاتك:</strong> {order.notes}
                </p>
              )}
            </div>

            {/* Items table */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
              <h3 className="font-bold text-white flex items-center gap-2 text-xs">
                <Package className="w-4 h-4 text-neutral-300" />
                <span>القطع المطلوبة:</span>
              </h3>

              <div className="divide-y divide-neutral-900 text-xs">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white">{item.product_name_snapshot}</h4>
                      <p className="text-[11px] text-neutral-400">
                        اللون: {item.color} · المقاس: {item.size} · الكمية: {item.quantity}
                      </p>
                    </div>
                    <span className="font-mono-numbers font-bold text-white">
                      {formatPrice(item.line_total)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial Breakdown */}
              <div className="pt-3 border-t border-neutral-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>قيمة المنتجات:</span>
                  <span className="font-mono-numbers text-white">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>الشحن لجميع المحافظات:</span>
                  <span className="font-mono-numbers text-white">{formatPrice(order.shipping_fee)}</span>
                </div>
                <div className="pt-2 border-t border-neutral-800/80 flex justify-between text-sm font-bold text-white">
                  <span>الإجمالي المطلوب سداده نقدًا عند الاستلام:</span>
                  <span className="font-mono-numbers text-base text-emerald-400">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Free Inspection reminder */}
        {settings?.inspection_available && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <h5 className="font-bold text-white mb-0.5">معاينة مجانية عند الاستلام</h5>
              <p className="text-neutral-400 leading-relaxed">
                تذكر: يمكنك فحص القطع والتأكد من مطابقة المقاس والخامة قبل تسليم المبلغ للمندوب.
              </p>
            </div>
          </div>
        )}

        {/* Back to Home Button */}
        <div className="pt-4 text-center">
          <button
            onClick={() => onNavigate('/')}
            className="py-3 px-8 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white font-bold text-xs rounded-xl border border-neutral-800 transition-colors inline-flex items-center gap-2"
          >
            <span>العودة للصفحة الرئيسية</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
