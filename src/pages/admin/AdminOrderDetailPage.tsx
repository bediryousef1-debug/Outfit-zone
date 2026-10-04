import React, { useEffect, useState } from 'react';
import { ArrowRight, Phone, MessageCircle, Truck, Package, Clock, CheckCircle, ShieldAlert, Trash2, AlertTriangle } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { api } from '../../services/api';
import { formatPrice, ORDER_STATUS_LABELS } from '../../utils/constants';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface AdminOrderDetailPageProps {
  orderId: string;
  onBack: () => void;
}

export const AdminOrderDetailPage: React.FC<AdminOrderDetailPageProps> = ({ orderId, onBack }) => {
  const { adminEmail } = useAdminAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadOrder = async () => {
    setIsLoading(true);
    try {
      const found = await api.adminGetOrderById(orderId);
      if (found) {
        setOrder(found);
      } else {
        setError('الطلب غير موجود');
      }
    } catch (err: any) {
      // Fallback
      try {
        const orders = await api.adminGetOrders();
        const found = orders.find((o) => o.id === orderId || o.order_number === orderId);
        if (found) {
          setOrder(found);
          setError(null);
        } else {
          setError('الطلب غير موجود');
        }
      } catch (innerErr: any) {
        setError(innerErr.message || 'فشل جلب تفاصيل الطلب');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const updated = await api.adminUpdateOrderStatus(order.id, newStatus, adminEmail || 'admin');
      setOrder(updated);
    } catch (err: any) {
      alert(err.message || 'فشل تحديث حالة الطلب');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!order) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.adminDeleteOrder(order.id);
      onBack();
    } catch (err: any) {
      console.error('Failed to delete order:', err);
      setDeleteError(err.message || 'فشل حذف الطلب');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-neutral-400">جاري تحميل تفاصيل الطلب...</div>;
  }

  if (error || !order) {
    return (
      <div className="p-8 text-center text-xs text-red-400">
        <p>{error || 'لم يتم العثور على الطلب.'}</p>
        <button onClick={onBack} className="mt-4 py-2 px-4 bg-white text-black font-bold rounded-lg cursor-pointer">
          العودة للطلبات
        </button>
      </div>
    );
  }

  const statusInfo = ORDER_STATUS_LABELS[order.status] || {
    label: order.status,
    color: 'text-neutral-300 bg-neutral-900',
  };

  // WhatsApp link to communicate with customer directly
  const customerWhatsAppLink = `https://wa.me/20${order.phone.replace(/^(\+20|20|0)/, '')}?text=${encodeURIComponent(
    `مرحبًا ${order.customer_name}، نتواصل معك من براند Outfit Zone بخصوص طلبك رقم ${order.order_number}...`
  )}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-right pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white mb-2 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لقائمة الطلبات</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-white font-mono">
              طلب #{order.order_number}
            </h1>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Quick Customer Action Buttons & Delete Button */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <a
            href={`tel:${order.phone}`}
            className="py-2 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 hover:text-white rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>اتصال هاتفي</span>
          </a>

          <a
            href={customerWhatsAppLink}
            target="_blank"
            rel="noreferrer noopener"
            className="py-2 px-3 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current" />
            <span>واتساب العميل</span>
          </a>

          {/* Delete Order Action */}
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="py-2 px-3 bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 hover:text-white rounded-lg flex items-center gap-1.5 transition-colors font-semibold cursor-pointer"
            title="حذف الطلب"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف الطلب</span>
          </button>
        </div>
      </div>

      {/* Status Management Workflow Panel */}
      <div className="p-5 rounded-2xl bg-[#121216] border border-neutral-800 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          تغيير حالة الطلب (Workflow Status)
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
          {(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'] as OrderStatus[]).map(
            (st) => {
              const info = ORDER_STATUS_LABELS[st] || { label: st, color: 'text-neutral-400 bg-neutral-900 border-neutral-700' };
              const isCurrent = order.status === st;

              return (
                <button
                  key={st}
                  disabled={isUpdating || isCurrent}
                  onClick={() => handleStatusChange(st)}
                  className={`py-2 px-3 rounded-lg border font-semibold transition-all ${
                    isCurrent
                      ? `${info.color} ring-1 ring-white/20 font-bold shadow-md cursor-default`
                      : 'bg-neutral-900/60 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  {info.label} {isCurrent && '✓'}
                </button>
              );
            }
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Customer & Address Details (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          <div className="p-5 rounded-2xl bg-[#121216] border border-neutral-800 space-y-3 text-xs">
            <h3 className="font-bold text-white text-sm border-b border-neutral-800/80 pb-2 flex items-center gap-2">
              <Truck className="w-4 h-4 text-neutral-300" />
              <span>بيانات العميل والشحن</span>
            </h3>

            <div className="space-y-2 text-neutral-300 leading-relaxed">
              <p>
                <span className="text-neutral-500 font-semibold">الاسم:</span>{' '}
                <strong className="text-white">{order.customer_name}</strong>
              </p>
              <p>
                <span className="text-neutral-500 font-semibold">الهاتف:</span>{' '}
                <span dir="ltr" className="font-mono text-white">{order.phone}</span>
              </p>
              <p>
                <span className="text-neutral-500 font-semibold">مصدر الطلب:</span>{' '}
                <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-white font-mono text-[11px]">
                  {order.order_source || 'Direct'}
                </span>
              </p>
              <p>
                <span className="text-neutral-500 font-semibold">المحافظة:</span>{' '}
                <span className="text-white">{order.governorate}</span>
              </p>

              <p>
                <span className="text-neutral-500 font-semibold">المدينة / الحي:</span>{' '}
                <span className="text-white">{order.city}</span>
              </p>
              <p>
                <span className="text-neutral-500 font-semibold">العنوان بالتفصيل:</span>{' '}
                <span className="text-white">{order.address}</span>
              </p>
              {order.notes && (
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/80 mt-2">
                  <span className="text-neutral-500 font-semibold block mb-0.5">ملاحظات العميل:</span>
                  <span className="text-neutral-300">{order.notes}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 text-xs text-neutral-400 space-y-1">
            <p>
              <strong>تاريخ الطلب:</strong> {new Date(order.created_at).toLocaleString('ar-EG')}
            </p>
            <p>
              <strong>طريقة الدفع:</strong> كاش عند الاستلام (COD)
            </p>
          </div>
        </div>

        {/* Ordered Items & Financial Totals (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          <div className="p-5 rounded-2xl bg-[#121216] border border-neutral-800 space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-neutral-800/80 pb-2 flex items-center gap-2">
              <Package className="w-4 h-4 text-neutral-300" />
              <span>القطع المطلوبة (لقطة تاريخية محفوظة)</span>
            </h3>

            <div className="divide-y divide-neutral-900 text-xs">
              {order.order_items?.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-xs">{item.product_name_snapshot}</h4>
                    <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                      <span>اللون: {item.color}</span>
                      <span>·</span>
                      <span className="font-mono">المقاس: {item.size}</span>
                      <span>·</span>
                      <span>سعر القطعة: {formatPrice(item.unit_price)}</span>
                      <span>·</span>
                      <span>الكمية: {item.quantity}</span>
                    </div>
                  </div>

                  <span className="font-mono-numbers font-bold text-white">
                    {formatPrice(item.line_total)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-3 border-t border-neutral-800 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>إجمالي المنتجات:</span>
                <span className="font-mono-numbers text-white">{formatPrice(order.subtotal)}</span>
              </div>
              {order.coupon_code && Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>خصم الكوبون ({order.coupon_code}):</span>
                  <span className="font-mono-numbers">-{formatPrice(order.discount_amount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-400">
                <span>مصاريف الشحن:</span>
                <span className="font-mono-numbers text-white">{formatPrice(order.shipping_fee)}</span>
              </div>
              <div className="pt-2 border-t border-neutral-800/80 flex justify-between text-base font-extrabold text-white">
                <span>المبلغ المطلوب تحصيله كاش:</span>
                <span className="font-mono-numbers text-lg text-emerald-400">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#121216] border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-5 text-right shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-full bg-red-950/60 border border-red-800/50 text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-base font-bold text-white">تأكيد حذف الطلب</h3>
                <p className="text-sm font-bold text-neutral-200">
                  هل أنت متأكد من حذف هذا الطلب؟
                </p>
                <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-300 space-y-1 mt-2">
                  <p>
                    <span className="text-neutral-500 font-semibold">رقم الطلب:</span>{' '}
                    <span className="font-mono font-bold text-white">{order.order_number}</span>
                  </p>
                  <p>
                    <span className="text-neutral-500 font-semibold">العميل:</span>{' '}
                    <span className="text-white font-semibold">{order.customer_name}</span>
                  </p>
                  <p>
                    <span className="text-neutral-500 font-semibold">المبلغ:</span>{' '}
                    <span className="font-mono text-white font-bold">{formatPrice(order.total)}</span>
                  </p>
                </div>
                {deleteError && (
                  <p className="text-xs text-red-400 font-semibold mt-2">
                    {deleteError}
                  </p>
                )}
                <p className="text-[11px] text-red-400/90 pt-1">
                  تنبيه: سيتم حذف الطلب وكافة عناصره وسجل حالته نهائيًا من قاعدة البيانات.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  if (!isDeleting) {
                    setShowDeleteModal(false);
                    setDeleteError(null);
                  }
                }}
                className="py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="py-2.5 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-red-950 cursor-pointer"
              >
                {isDeleting ? (
                  <span>جاري الحذف...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف الطلب</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderDetailPage;

