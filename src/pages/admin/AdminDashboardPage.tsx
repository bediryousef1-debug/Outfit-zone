import React, { useEffect, useState, useMemo } from 'react';
import { ShoppingBag, TrendingUp, CheckCircle, Clock, Truck, XCircle, DollarSign, Plus, ArrowLeft } from 'lucide-react';
import { Order } from '../../types';
import { api } from '../../services/api';
import { formatPrice, ORDER_STATUS_LABELS } from '../../utils/constants';

interface AdminDashboardPageProps {
  onNavigateTab: (tab: 'dashboard' | 'products' | 'categories' | 'orders' | 'content' | 'contact' | 'settings') => void;
  onSelectOrder: (orderId: string) => void;
  onNewProduct: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigateTab,
  onSelectOrder,
  onNewProduct,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await api.adminGetOrders();
        setOrders(data);
      } catch (err) {
        console.error('Failed to load admin orders:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadOrders();
  }, []);

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (dateFilter === 'all') return orders;

    const now = new Date();
    return orders.filter((o) => {
      const orderDate = new Date(o.created_at);
      if (dateFilter === 'today') {
        return (
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= weekAgo;
      }
      if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return orderDate >= monthAgo;
      }
      return true;
    });
  }, [orders, dateFilter]);

  // Financial & Order Metrics
  const stats = useMemo(() => {
    let totalValue = 0;
    let deliveredRevenue = 0;
    let pendingCount = 0;
    let confirmedCount = 0;
    let shippedCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;

    filteredOrders.forEach((o) => {
      // Total order value counts non-cancelled orders
      if (o.status !== 'cancelled') {
        totalValue += Number(o.total);
      }

      if (o.status === 'delivered') {
        deliveredRevenue += Number(o.total);
        deliveredCount++;
      } else if (o.status === 'pending') {
        pendingCount++;
      } else if (o.status === 'confirmed') {
        confirmedCount++;
      } else if (o.status === 'shipped') {
        shippedCount++;
      } else if (o.status === 'cancelled') {
        cancelledCount++;
      }
    });

    return {
      totalOrders: filteredOrders.length,
      totalValue,
      deliveredRevenue,
      pendingCount,
      confirmedCount,
      shippedCount,
      deliveredCount,
      cancelledCount,
    };
  }, [filteredOrders]);

  return (
    <div className="space-y-8">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            مؤشرات أداء متجر Outfit Zone
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            إحصائيات المبيعات، الطلبات، والتحصيل الفعلي عند الاستلام.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Filter Tabs */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1 text-xs">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'today', label: 'اليوم' },
              { id: 'week', label: 'آخر 7 أيام' },
              { id: 'month', label: 'آخر 30 يوم' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDateFilter(f.id as any)}
                className={`py-1 px-2.5 rounded-md transition-colors ${
                  dateFilter === f.id
                    ? 'bg-neutral-800 text-white font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={onNewProduct}
            className="py-2 px-3.5 bg-white text-black font-bold text-xs rounded-lg hover:bg-neutral-200 transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة موديل جديد</span>
          </button>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Delivered Revenue (Actual collected cash) */}
        <div className="p-5 rounded-2xl bg-[#121216] border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>الإيراد الفعلي المحصل (تم التسليم)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono-numbers">
            {formatPrice(stats.deliveredRevenue)}
          </div>
          <p className="text-[11px] text-neutral-500">
            المبالغ التي تم تحصيلها كاش من العملاء فقط.
          </p>
        </div>

        {/* Total Order Value */}
        <div className="p-5 rounded-2xl bg-[#121216] border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>إجمالي قيمة الطلبات (بدون الملغاة)</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono-numbers">
            {formatPrice(stats.totalValue)}
          </div>
          <p className="text-[11px] text-neutral-500">
            يشمل الطلبات قيد المراجعة والشحن والتسليم.
          </p>
        </div>

        {/* Total Orders */}
        <div className="p-5 rounded-2xl bg-[#121216] border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>إجمالي عدد الطلبات</span>
            <ShoppingBag className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono-numbers">
            {stats.totalOrders} <span className="text-xs font-normal text-neutral-500">طلب</span>
          </div>
          <p className="text-[11px] text-neutral-500">
            جميع الطلبات المسجلة خلال الفترة المحددة.
          </p>
        </div>

        {/* Pending Orders to review */}
        <div className="p-5 rounded-2xl bg-[#121216] border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>طلبات جديدة قيد المراجعة</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono-numbers">
            {stats.pendingCount} <span className="text-xs font-normal text-neutral-500">طلب</span>
          </div>
          <p className="text-[11px] text-neutral-500">
            تحتاج لتأكيد ومكالمة العميل قبل الشحن.
          </p>
        </div>

      </div>

      {/* Order Status Workflow Breakdown (Cards) */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
          مراحل تدفق الطلبات (Workflow)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40">
            <div className="flex items-center justify-between text-amber-400 mb-1">
              <span>قيد المراجعة</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span className="text-lg font-bold text-white font-mono-numbers">{stats.pendingCount}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/40">
            <div className="flex items-center justify-between text-blue-400 mb-1">
              <span>تم التأكيد</span>
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
            <span className="text-lg font-bold text-white font-mono-numbers">{stats.confirmedCount}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/40">
            <div className="flex items-center justify-between text-purple-400 mb-1">
              <span>تم الشحن</span>
              <Truck className="w-3.5 h-3.5" />
            </div>
            <span className="text-lg font-bold text-white font-mono-numbers">{stats.shippedCount}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <span>تم التسليم</span>
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
            <span className="text-lg font-bold text-white font-mono-numbers">{stats.deliveredCount}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/40 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-rose-400 mb-1">
              <span>ملغي</span>
              <XCircle className="w-3.5 h-3.5" />
            </div>
            <span className="text-lg font-bold text-white font-mono-numbers">{stats.cancelledCount}</span>
          </div>
        </div>
      </div>

      {/* Recent Orders Preview */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#121216] border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h2 className="text-base font-bold text-white">
            أحدث الطلبات
          </h2>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>عرض كل الطلبات ({orders.length})</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-neutral-900 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-10 text-center text-xs text-neutral-500">
            لا توجد طلبات مسجلة حتى الآن. ستظهر الطلبات الجديدة هنا فور قيام العملاء بالشراء.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400">
                  <th className="py-2.5 px-3">رقم الطلب</th>
                  <th className="py-2.5 px-3">العميل</th>
                  <th className="py-2.5 px-3">المحافظة</th>
                  <th className="py-2.5 px-3">الهاتف</th>
                  <th className="py-2.5 px-3">الإجمالي</th>
                  <th className="py-2.5 px-3">الحالة</th>
                  <th className="py-2.5 px-3">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {filteredOrders.slice(0, 5).map((order) => {
                  const statusInfo = ORDER_STATUS_LABELS[order.status] || {
                    label: order.status,
                    color: 'text-neutral-400 bg-neutral-900',
                  };

                  return (
                    <tr key={order.id} className="hover:bg-neutral-900/50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {order.order_number}
                      </td>
                      <td className="py-3 px-3 font-semibold text-neutral-200">
                        {order.customer_name}
                      </td>
                      <td className="py-3 px-3 text-neutral-400">
                        {order.governorate}
                      </td>
                      <td className="py-3 px-3 font-mono text-neutral-400" dir="ltr">
                        {order.phone}
                      </td>
                      <td className="py-3 px-3 font-mono-numbers font-bold text-white">
                        {formatPrice(order.total)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => onSelectOrder(order.id)}
                          className="text-neutral-300 hover:text-white underline text-[11px]"
                        >
                          تفاصيل
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
