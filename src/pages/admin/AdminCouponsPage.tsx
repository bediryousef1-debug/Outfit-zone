import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Copy,
  Percent,
  DollarSign,
  AlertCircle,
  X,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Edit2,
} from 'lucide-react';
import { api } from '../../services/api';
import { Coupon } from '../../types';
import { formatPrice } from '../../utils/constants';

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 10,
    min_order_amount: 0,
    max_uses: '' as number | '',
    max_uses_per_customer: '' as number | '',
    expires_at: '',
    is_active: true,
  });

  const loadCoupons = async () => {
    setIsLoading(true);
    try {
      const data = await api.adminGetCoupons();
      setCoupons(data);
    } catch (err: any) {
      setError(err.message || 'تعذر تحميل الكوبونات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleOpenCreateModal = () => {
    setError(null);
    setEditingCoupon(null);
    setForm({
      code: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: 0,
      max_uses: '',
      max_uses_per_customer: '',
      expires_at: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon: Coupon) => {
    setError(null);
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount || 0,
      max_uses: coupon.max_uses ?? '',
      max_uses_per_customer: coupon.max_uses_per_customer ?? '',
      expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
      is_active: coupon.is_active,
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const updated = await api.adminUpdateCoupon(coupon.id, {
        is_active: !coupon.is_active,
      });
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? updated : c)));
      setSuccess(`تم ${updated.is_active ? 'تفعيل' : 'تعطيل'} الكوبون بنجاح.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'فشل تحديث حالة الكوبون');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الكوبون نهائيًا؟')) return;
    try {
      await api.adminDeleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      setSuccess('تم حذف الكوبون بنجاح.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'فشل حذف الكوبون');
    }
  };

  const handleSubmitCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) {
      setError('يرجى إدخال كود الكوبون');
      return;
    }
    if (form.discount_value <= 0) {
      setError('يرجى إدخال قيمة خصم صالحة أكبر من صفر');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCoupon) {
        const updated = await api.adminUpdateCoupon(editingCoupon.id, {
          code: form.code.trim().toUpperCase(),
          discount_type: form.discount_type,
          discount_value: Number(form.discount_value),
          min_order_amount: Number(form.min_order_amount) || 0,
          max_uses: form.max_uses === '' ? null : Number(form.max_uses),
          max_uses_per_customer: form.max_uses_per_customer === '' ? null : Number(form.max_uses_per_customer),
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
          is_active: form.is_active,
        });

        setCoupons((prev) => prev.map((c) => (c.id === editingCoupon.id ? updated : c)));
        setIsModalOpen(false);
        setEditingCoupon(null);
        setSuccess('تم تحديث الكوبون بنجاح.');
      } else {
        const newCoupon = await api.adminCreateCoupon({
          code: form.code.trim().toUpperCase(),
          discount_type: form.discount_type,
          discount_value: Number(form.discount_value),
          min_order_amount: Number(form.min_order_amount) || 0,
          max_uses: form.max_uses === '' ? null : Number(form.max_uses),
          max_uses_per_customer: form.max_uses_per_customer === '' ? null : Number(form.max_uses_per_customer),
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
          is_active: form.is_active,
        });

        setCoupons((prev) => [newCoupon, ...prev]);
        setIsModalOpen(false);
        setSuccess('تم إنشاء الكوبون بنجاح.');
      }

      setForm({
        code: '',
        discount_type: 'percentage',
        discount_value: 10,
        min_order_amount: 0,
        max_uses: '',
        max_uses_per_customer: '',
        expires_at: '',
        is_active: true,
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'فشل حفظ الكوبون');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setSuccess(`تم نسخ كود الكوبون: ${code}`);
    setTimeout(() => setSuccess(null), 2500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Ticket className="w-6 h-6 text-white" />
            <span>إدارة كوبونات الخصم</span>
          </h1>
          <p className="text-neutral-400 text-xs mt-1">
            أنشئ كوبونات خصم، حدد الحد الأقصى لكل عميل، الشروط، وتواريخ الصلاحية.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-black text-xs font-bold rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة كوبون جديد</span>
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-[#121216] border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-neutral-400">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
            <span>جاري تحميل الكوبونات...</span>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center">
            <Ticket className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">لا توجد كوبونات خصم حتى الآن</h3>
            <p className="text-xs text-neutral-400 mb-4">أنشئ أول كود خصم لعملائك لزيادة المبيعات والتحويل.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-neutral-800 text-white text-xs font-semibold rounded-lg hover:bg-neutral-700 cursor-pointer"
            >
              إنشاء كود الآن
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="p-4">كود الكوبون</th>
                  <th className="p-4">نوع وقيمة الخصم</th>
                  <th className="p-4">الحد الأدنى للطلب</th>
                  <th className="p-4">مرات الاستخدام</th>
                  <th className="p-4">الحد لكل عميل</th>
                  <th className="p-4">تاريخ الانتهاء</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {coupons.map((c) => {
                  const isExpired = c.expires_at ? new Date(c.expires_at) < new Date() : false;
                  const isMaxedOut = c.max_uses !== null && c.max_uses !== undefined && c.used_count >= c.max_uses;

                  return (
                    <tr key={c.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-white tracking-wider bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800">
                            {c.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(c.code)}
                            title="نسخ الكود"
                            className="p-1 hover:text-white text-neutral-500 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-emerald-400">
                          {c.discount_type === 'percentage'
                            ? `${c.discount_value}% خصم`
                            : `${formatPrice(c.discount_value)} خصم مباشر`}
                        </span>
                      </td>

                      <td className="p-4 text-neutral-300">
                        {c.min_order_amount > 0 ? formatPrice(c.min_order_amount) : 'بدون حد أدنى'}
                      </td>

                      <td className="p-4 text-neutral-300">
                        <span className="font-mono">{c.used_count}</span>
                        {c.max_uses ? <span className="text-neutral-500 font-mono"> / {c.max_uses}</span> : ' (غير محدود)'}
                      </td>

                      <td className="p-4 text-neutral-300 font-mono">
                        {c.max_uses_per_customer ? (
                          <span className="px-2 py-0.5 rounded bg-neutral-800 text-white font-semibold">
                            {c.max_uses_per_customer} مرة
                          </span>
                        ) : (
                          <span className="text-neutral-500">غير محدود</span>
                        )}
                      </td>

                      <td className="p-4 text-neutral-400">
                        {c.expires_at ? (
                          <span className={isExpired ? 'text-rose-400 font-medium' : ''}>
                            {new Date(c.expires_at).toLocaleDateString('ar-EG', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                            {isExpired && ' (منتهي)'}
                          </span>
                        ) : (
                          'مفتوح دائماً'
                        )}
                      </td>

                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                            c.is_active && !isExpired && !isMaxedOut
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                              : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                          }`}
                        >
                          {c.is_active && !isExpired && !isMaxedOut ? 'مفعّل' : 'معطّل'}
                        </button>
                      </td>

                      <td className="p-4 text-left">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(c)}
                            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                            title="تعديل الكوبون"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 rounded hover:bg-rose-950/40 text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="حذف الكوبون"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Create / Edit Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#121216] border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 left-5 text-neutral-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-white" />
              <span>{editingCoupon ? `تعديل كود الخصم (${editingCoupon.code})` : 'إنشاء كود خصم جديد'}</span>
            </h3>
            <p className="text-xs text-neutral-400 mb-6">
              يتم التحقق من الكوبون والحد الأقصى لكل عميل server-side بأمان.
            </p>

            <form onSubmit={handleSubmitCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">كود الكوبون</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="مثال: ZONE20"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-mono text-sm tracking-wider uppercase outline-none focus:border-white"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">نوع الخصم</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) => setForm({ ...form, discount_type: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white outline-none focus:border-white cursor-pointer"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت (جنيه)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    {form.discount_type === 'percentage' ? 'نسبة الخصم (%)' : 'المبلغ المخصوم (جنيه)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={form.discount_type === 'percentage' ? '100' : '10000'}
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-mono outline-none focus:border-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">الحد الأدنى للطلب (جنيه)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.min_order_amount}
                    onChange={(e) => setForm({ ...form, min_order_amount: Number(e.target.value) })}
                    placeholder="0 = بدون حد"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-mono outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">إجمالي مرات الاستخدام للكوبون</label>
                  <input
                    type="number"
                    min="1"
                    value={form.max_uses}
                    onChange={(e) => setForm({ ...form, max_uses: e.target.value === '' ? '' : Number(e.target.value) })}
                    placeholder="فارغ = غير محدود"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-mono outline-none focus:border-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  الحد الأقصى لاستخدام الكوبون لكل عميل
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.max_uses_per_customer}
                  onChange={(e) => setForm({ ...form, max_uses_per_customer: e.target.value === '' ? '' : Number(e.target.value) })}
                  placeholder="مثال: 1 (مرة واحدة فقط) أو اترك فارغًا لغير محدود"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-mono outline-none focus:border-white"
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  يتم التحقق من العميل بناءً على تطبيع رقم هاتفه (normalizePhone) Server-Side لمنع تكرار الاستخدام بالاحتيال بصيغ أرقام مختلفة.
                </p>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">تاريخ الانتهاء (اختياري)</label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white outline-none focus:border-white cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeToggle"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded bg-neutral-900 border-neutral-700 text-white cursor-pointer"
                />
                <label htmlFor="activeToggle" className="text-neutral-300 cursor-pointer select-none">
                  تفعيل الكوبون فور الإنشاء
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer text-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : editingCoupon ? 'تحديث الكوبون' : 'حفظ الكوبون'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCouponsPage;

