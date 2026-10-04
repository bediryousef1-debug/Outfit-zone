import React, { useEffect, useState } from 'react';
import { CheckCircle2, MessageCircle, Truck, Package, ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import { OrderReceipt } from '../types';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';
import { formatPrice, getLocalizedColorName } from '../utils/constants';
import { useLanguage } from '../context/LanguageContext';

interface OrderSuccessPageProps {
  orderNumber: string;
  onNavigate: (path: string) => void;
}

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({ orderNumber, onNavigate }) => {
  const { settings, getWhatsAppUrl } = useStore();
  const { t, language } = useLanguage();
  const [order, setOrder] = useState<OrderReceipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Extract receipt authorization token from URL ?t=<token>
  const receiptToken = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('t') || undefined
    : undefined;

  useEffect(() => {
    let isMounted = true;

    const loadOrder = async () => {
      setIsLoading(true);
      try {
        const data = await api.lookupOrder(orderNumber, receiptToken);
        if (isMounted) {
          setOrder(data);
        }
      } catch (err) {
        console.error('Order receipt notice:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (orderNumber) {
      loadOrder();
    }

    return () => {
      isMounted = false;
    };
  }, [orderNumber, receiptToken]);

  const whatsappTrackingMessage = t("order.tracking_whatsapp_message", "Hello Outfit Zone, I want to track order number {orderNumber}").replace("{orderNumber}", orderNumber);
  const whatsappUrl = getWhatsAppUrl(whatsappTrackingMessage);

  const hasFullDetails = Boolean(order && (order.has_full_access || (order.customer_name && order.phone)));

  return (
    <div className="max-w-3xl mx-auto px-3.5 sm:px-6 py-8 sm:py-16 text-right w-full max-w-full overflow-x-hidden">
      <div className="p-5 sm:p-10 rounded-3xl bg-[#121216] border border-neutral-800 shadow-2xl space-y-8 min-w-0">
        
        {/* Success Icon & Header */}
        <div className="text-center space-y-3 pb-6 border-b border-neutral-800/80">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t("order.success_title", "Order Placed Successfully!")} 🎉
          </h1>

          <div className="inline-block bg-neutral-900 border border-neutral-800 px-3 sm:px-4 py-1.5 rounded-lg max-w-full">
            <span className="text-xs text-neutral-400 ml-2">{t("order.number", "Order Number:")}</span>
            <span className="font-mono text-xs sm:text-base font-bold text-white tracking-wider break-all">
              #{orderNumber}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            {t("order.shipping_message", "We will prepare and ship your items immediately. The courier will contact you within 2 - 4 business days.")}
          </p>
        </div>

        {/* WhatsApp Tracking CTA */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-neutral-900 border border-emerald-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-right">
            <h4 className="text-sm font-bold text-white">
              {t("order.track_or_ask", "Track your order or ask via WhatsApp")}
            </h4>
            <p className="text-xs text-neutral-400">
              {t("order.support_message", "Send your order number to our support team to confirm a suitable delivery time.")}
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="w-full sm:w-auto py-2.5 px-4 sm:px-5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md text-center"
          >
            <MessageCircle className="w-4 h-4 fill-current shrink-0" />
            <span>{t("order.whatsapp_contact", "Contact us via WhatsApp")}</span>
          </a>
        </div>

        {/* Direct Order Tracking Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => onNavigate(`/track?order=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(order?.phone || '')}`)}
            className="inline-flex items-center gap-2 py-2.5 px-5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Truck className="w-4 h-4 text-emerald-400" />
            <span>تتبع خط سير هذا الطلب لحظياً عبر الموقع</span>
          </button>
        </div>


        {/* Order Details Breakdown (Displayed only when verified via secure receipt token) */}
        {hasFullDetails && order && (
          <div className="space-y-6">
            {/* Delivery destination */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
              <h3 className="font-bold text-white flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-neutral-300" />
                <span>{t("order.customer_shipping", "Shipping destination and customer information:")}</span>
              </h3>
              <p className="text-neutral-300">
                <strong className="text-neutral-400">{t("order.name", "Name:")}</strong> {order.customer_name}
              </p>
              <p className="text-neutral-300">
                <strong className="text-neutral-400">{t("order.phone", "Phone:")}</strong>{' '}
                <span dir="ltr" className="font-mono">{order.phone}</span>
              </p>
              <p className="text-neutral-300">
                <strong className="text-neutral-400">{t("order.address", "Address:")}</strong> {order.governorate} - {order.city} - {order.address}
              </p>
              {order.notes && (
                <p className="text-neutral-400 italic">
                  <strong>{t("order.notes", "Your notes:")}</strong> {order.notes}
                </p>
              )}
            </div>

            {/* Items table */}
            {order.order_items && order.order_items.length > 0 && (
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <h3 className="font-bold text-white flex items-center gap-2 text-xs">
                  <Package className="w-4 h-4 text-neutral-300" />
                  <span>{t("order.items", "Items ordered:")}</span>
                </h3>

                <div className="divide-y divide-neutral-900 text-xs">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white">{item.product_name_snapshot}</h4>
                        <p className="text-[11px] text-neutral-400">
                          {t("order.item_details", "Color: {color} · Size: {size} · Quantity: {quantity}")
                            .replace("{color}", getLocalizedColorName(item.color, language))
                            .replace("{size}", item.size)
                            .replace("{quantity}", String(item.quantity))}
                        </p>
                      </div>
                      <span className="font-mono-numbers font-bold text-white">
                        {formatPrice(item.line_total, language)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Financial Breakdown */}
                <div className="pt-3 border-t border-neutral-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-neutral-400">
                    <span>{t("order.products_value", "Products value:")}</span>
                    <span className="font-mono-numbers text-white">{formatPrice(order.subtotal || 0, language)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>{t("order.shipping_all", "Shipping across Egypt:")}</span>
                    <span className="font-mono-numbers text-white">{formatPrice(order.shipping_fee || 0, language)}</span>
                  </div>
                  <div className="pt-2 border-t border-neutral-800/80 flex justify-between text-sm font-bold text-white">
                    <span>{t("order.cash_total", "Total to be paid in cash on delivery:")}</span>
                    <span className="font-mono-numbers text-base text-emerald-400">
                      {formatPrice(order.total || 0, language)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Minimal privacy notice when accessing without receipt token */}
        {!hasFullDetails && !isLoading && (
          <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 flex items-center gap-3 text-xs text-neutral-400">
            <Lock className="w-4 h-4 text-neutral-500 shrink-0" />
            <span>
              {t("order.privacy_notice", "Address and item details are hidden to protect customer privacy. To track your order, contact us via the WhatsApp number above with your order number.")}
            </span>
          </div>
        )}

        {/* Brand Guarantees */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800/60 flex items-center gap-2.5 text-neutral-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{t("order.inspection_notice", "Inspect and try on before paying the courier")}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800/60 flex items-center gap-2.5 text-neutral-300">
            <Truck className="w-4 h-4 text-neutral-300 shrink-0" />
            <span>{t("order.exchange_notice", "Free size exchange available within 14 days")}</span>
          </div>
        </div>

        {/* Back to Home CTA */}
        <div className="pt-2 text-center">
          <button
            onClick={() => onNavigate('/')}
            className="py-3 px-8 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm rounded-xl border border-neutral-800 inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span>{t("order.back_home", "Back to Home")}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
