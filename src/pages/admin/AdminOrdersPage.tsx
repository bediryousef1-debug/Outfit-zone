import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Order } from '../../types';
import { api } from '../../services/api';
import { formatPrice, ORDER_STATUS_LABELS } from '../../utils/constants';

interface AdminOrdersPageProps {
  onSelectOrder: (orderId: string) => void;
}

export const AdminOrdersPage: React.FC<AdminOrdersPageProps> = ({ onSelectOrder }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Delete order state
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOrders = async () => {
    setIsLoading(true);

    try {
      const data = await api.adminGetOrders();
      setOrders(data);
      setSelectedOrderIds(new Set());
    } catch (err: any) {
      console.warn('Notice loading admin orders:', err?.message || err);
      setOrders([]);
      setSelectedOrderIds(new Set());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);

      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }

      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);

      const allFilteredSelected =
        filteredOrders.length > 0 &&
        filteredOrders.every((order) => next.has(order.id));

      if (allFilteredSelected) {
        filteredOrders.forEach((order) => next.delete(order.id));
      } else {
        filteredOrders.forEach((order) => next.add(order.id));
      }

      return next;
    });
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await api.adminDeleteOrder(orderToDelete.id);

      const deletedNum = orderToDelete.order_number;
      const deletedId = orderToDelete.id;

      setOrders((prev) =>
        prev.filter(
          (o) => o.id !== deletedId && o.order_number !== deletedNum
        )
      );

      setSelectedOrderIds((prev) => {
        const next = new Set(prev);
        next.delete(deletedId);
        return next;
      });

      setOrderToDelete(null);
      setSuccessMessage('تم حذف الطلب بنجاح');

      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err: any) {
      console.error('Delete order failed:', err);
      setErrorMessage(err.message || 'فشل حذف الطلب');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrderIds.size === 0 || isDeleting) return;

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف ${selectedOrderIds.size} طلب؟\n\nسيتم حذف الطلبات وكافة عناصرها وسجل حالتها نهائيًا.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const idsToDelete = Array.from(selectedOrderIds);
    const failedIds: string[] = [];

    try {
      for (const orderId of idsToDelete) {
        try {
          await api.adminDeleteOrder(orderId);
        } catch (err) {
          console.error(`Failed to delete order ${orderId}:`, err);
          failedIds.push(orderId);
        }
      }

      const deletedIds = new Set(
        idsToDelete.filter((id) => !failedIds.includes(id))
      );

      setOrders((prev) =>
        prev.filter((order) => !deletedIds.has(order.id))
      );

      setSelectedOrderIds(new Set(failedIds));

      if (failedIds.length === 0) {
        setSuccessMessage(
          `تم حذف ${idsToDelete.length} طلب بنجاح`
        );
      } else if (deletedIds.size > 0) {
        setSuccessMessage(
          `تم حذف ${deletedIds.size} طلب بنجاح`
        );
        setErrorMessage(
          `تعذر حذف ${failedIds.length} طلب`
        );
      } else {
        setErrorMessage('تعذر حذف الطلبات المحددة');
      }

      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err: any) {
      console.error('Bulk delete failed:', err);
      setErrorMessage(err.message || 'فشل حذف الطلبات المحددة');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) {
        return false;
      }

      if (search) {
        const q = search.toLowerCase().trim();

        return (
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.phone.includes(q) ||
          o.city.toLowerCase().includes(q) ||
          o.governorate.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [orders, search, statusFilter]);

  const selectedFilteredCount = filteredOrders.filter((order) =>
    selectedOrderIds.has(order.id)
  ).length;

  const allFilteredSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((order) => selectedOrderIds.has(order.id));

  const someFilteredSelected =
    selectedFilteredCount > 0 && !allFilteredSelected;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          طلبات العملاء ومتابعة الشحن
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          إدارة ومتابعة طلبات الدفع عند الاستلام والتواصل مع العملاء.
        </p>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-950/50 border border-emerald-800/70 rounded-xl text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>

          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-white text-xs px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-red-950/50 border border-red-800/70 rounded-xl text-red-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>

          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-white text-xs px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative max-w-sm flex-1">
          <input
            type="text"
            placeholder="بحث برقم الطلب، اسم العميل، الهاتف، أو المدينة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121216] border border-neutral-800 rounded-lg py-2.5 pr-9 pl-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white"
          />

          <Search className="w-4 h-4 text-neutral-500 absolute top-3 right-3" />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 bg-[#121216] border border-neutral-800 rounded-lg p-1 text-xs">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'pending', label: 'قيد المراجعة' },
            { id: 'confirmed', label: 'تم التأكيد' },
            { id: 'shipped', label: 'تم الشحن' },
            { id: 'delivered', label: 'تم التسليم' },
            { id: 'cancelled', label: 'ملغي' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`py-1.5 px-3 rounded-md whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-neutral-800 text-white font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedOrderIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-red-950/30 border border-red-900/50 rounded-xl">
          <div className="flex items-center gap-2 text-xs text-neutral-300">
            <CheckCircle className="w-4 h-4 text-red-400" />

            <span className="font-bold">
              تم تحديد {selectedOrderIds.size} طلب
            </span>
          </div>

          <button
            type="button"
            disabled={isDeleting}
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>
              حذف المحدد ({selectedOrderIds.size})
            </span>
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-[#121216] border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-14 bg-neutral-900 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-500">
            لا توجد طلبات مطابقة للبحث أو الحالة المختارة.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400 bg-neutral-950/40">
                  <th className="py-3 px-4 w-12 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectAll();
                      }}
                      disabled={isDeleting}
                      className="inline-flex items-center justify-center text-neutral-400 hover:text-white disabled:opacity-50 cursor-pointer"
                      title={
                        allFilteredSelected
                          ? 'إلغاء تحديد الكل'
                          : 'تحديد كل الطلبات الظاهرة'
                      }
                    >
                      {allFilteredSelected ? (
                        <CheckSquare className="w-4 h-4 text-white" />
                      ) : someFilteredSelected ? (
                        <div className="relative">
                          <Square className="w-4 h-4" />

                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-2 h-0.5 bg-white rounded-full" />
                          </span>
                        </div>
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>

                  <th className="py-3 px-4">رقم الطلب</th>
                  <th className="py-3 px-4">العميل</th>
                  <th className="py-3 px-4">الهاتف</th>
                  <th className="py-3 px-4">المحافظة / المدينة</th>
                  <th className="py-3 px-4">القطع المطلوبة</th>
                  <th className="py-3 px-4">الإجمالي (COD)</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">تاريخ الطلب</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-900">
                {filteredOrders.map((order) => {
                  const statusInfo = ORDER_STATUS_LABELS[order.status] || {
                    label: order.status,
                    color: 'text-neutral-400 bg-neutral-900',
                  };

                  const itemsCount =
                    order.order_items?.reduce(
                      (s, i) => s + i.quantity,
                      0
                    ) || 0;

                  const isSelected = selectedOrderIds.has(order.id);

                  return (
                    <tr
                      key={order.id}
                      onClick={() => onSelectOrder(order.id)}
                      className={`hover:bg-neutral-900/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-neutral-900/70' : ''
                      }`}
                    >
                      {/* Selection */}
                      <td
                        className="py-3 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => toggleOrderSelection(order.id)}
                          className="inline-flex items-center justify-center text-neutral-400 hover:text-white disabled:opacity-50 cursor-pointer"
                          title={
                            isSelected
                              ? 'إلغاء تحديد الطلب'
                              : 'تحديد الطلب'
                          }
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-white" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {order.order_number}
                      </td>

                      <td className="py-3 px-4 font-semibold text-neutral-200">
                        {order.customer_name}
                      </td>

                      <td
                        className="py-3 px-4 font-mono text-neutral-400"
                        dir="ltr"
                      >
                        {order.phone}
                      </td>

                      <td className="py-3 px-4 text-neutral-300">
                        {order.governorate} · {order.city}
                      </td>

                      <td className="py-3 px-4 text-neutral-400">
                        {itemsCount} قطع
                      </td>

                      <td className="py-3 px-4 font-mono-numbers font-bold text-white">
                        {formatPrice(order.total)}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-neutral-500 font-mono text-[11px]">
                        {new Date(order.created_at).toLocaleDateString(
                          'ar-EG'
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div
                          className="flex items-center justify-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectOrder(order.id)}
                            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                            title="عرض تفاصيل الطلب"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setOrderToDelete(order)}
                            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/70 text-red-400 hover:text-white border border-red-800/50 transition-colors flex items-center gap-1 cursor-pointer"
                            title="حذف الطلب"
                          >
                            <Trash2 className="w-4 h-4" />

                            <span className="hidden xl:inline text-[11px] font-bold">
                              حذف الطلب
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Single Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#121216] border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-5 text-right shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-full bg-red-950/60 border border-red-800/50 text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-1.5 flex-1">
                <h3 className="text-base font-bold text-white">
                  تأكيد حذف الطلب
                </h3>

                <p className="text-sm font-bold text-neutral-200">
                  هل أنت متأكد من حذف هذا الطلب؟
                </p>

                <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-300 space-y-1 mt-2">
                  <p>
                    <span className="text-neutral-500 font-semibold">
                      رقم الطلب:
                    </span>{' '}
                    <span className="font-mono font-bold text-white">
                      {orderToDelete.order_number}
                    </span>
                  </p>

                  <p>
                    <span className="text-neutral-500 font-semibold">
                      العميل:
                    </span>{' '}
                    <span className="text-white font-semibold">
                      {orderToDelete.customer_name}
                    </span>
                  </p>

                  <p>
                    <span className="text-neutral-500 font-semibold">
                      المبلغ:
                    </span>{' '}
                    <span className="font-mono text-white font-bold">
                      {formatPrice(orderToDelete.total)}
                    </span>
                  </p>
                </div>

                <p className="text-[11px] text-red-400/90 pt-1">
                  تنبيه: سيتم حذف الطلب وكافة عناصره وسجل حالته نهائيًا من
                  قاعدة البيانات.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  if (!isDeleting) {
                    setOrderToDelete(null);
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