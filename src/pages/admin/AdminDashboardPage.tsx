import React, { useEffect, useMemo, useState } from 'react';
import {
  ShoppingBag,
  TrendingUp,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  DollarSign,
  Plus,
  ArrowLeft,
  Star,
  MessageSquare,
  Eye,
  EyeOff,
  Trash2,
  Pencil,
  X,
  BarChart3,
  Activity,
  Compass,
} from 'lucide-react';
import { Order, ProductReview, AnalyticsSummary } from '../../types';
import { api } from '../../services/api';

import { formatPrice, ORDER_STATUS_LABELS } from '../../utils/constants';

interface AdminDashboardPageProps {
  onNavigateTab: (
    tab:
      | 'dashboard'
      | 'products'
      | 'categories'
      | 'orders'
      | 'coupons'
      | 'content'
      | 'contact'
      | 'hero-slider'
      | 'settings'
  ) => void;
  onSelectOrder: (orderId: string) => void;
  onNewProduct: () => void;
}

type ReviewFormState = {
  customer_name: string;
  rating: number;
  review_text: string;
  status: 'pending' | 'approved' | 'hidden';
  product_id: string | null;
};

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigateTab,
  onSelectOrder,
  onNewProduct,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [dateFilter, setDateFilter] = useState<
    'all' | 'today' | 'week' | 'month'
  >('all');


  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewActionLoading, setReviewActionLoading] = useState<string | null>(
    null
  );

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<ProductReview | null>(
    null
  );

  const [reviewForm, setReviewForm] = useState<ReviewFormState>({
    customer_name: '',
    rating: 5,
    review_text: '',
    status: 'approved',
    product_id: null,
  });

  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      const data = await api.adminGetProductReviews();
      setReviews(data);
    } catch (err) {
      console.error('Failed to load admin reviews:', err);
      setReviewError('تعذر تحميل الآراء.');
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      setIsLoading(true);
      setReviewsLoading(true);
      try {
        const [ordersData, reviewsData, analyticsData] = await Promise.all([
          api.adminGetOrders().catch((err) => {
            console.error('Failed to load admin orders:', err);
            return [];
          }),
          api.adminGetProductReviews().catch((err) => {
            console.error('Failed to load admin reviews:', err);
            return [];
          }),
          api.adminGetAnalytics().catch((err) => {
            console.error('Failed to load admin analytics:', err);
            return null;
          }),
        ]);

        if (isMounted) {
          setOrders(ordersData);
          setReviews(reviewsData);
          if (analyticsData) setAnalytics(analyticsData);
        }

      } finally {
        if (isMounted) {
          setIsLoading(false);
          setReviewsLoading(false);
        }
      }
    };

    loadDashboardData();
    return () => {
      isMounted = false;
    };
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
        const weekAgo = new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000
        );

        return orderDate >= weekAgo;
      }

      if (dateFilter === 'month') {
        const monthAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );

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

  const reviewStats = useMemo(() => {
    return {
      total: reviews.length,
      pending: reviews.filter((review) => review.status === 'pending').length,
      approved: reviews.filter((review) => review.status === 'approved').length,
      hidden: reviews.filter((review) => review.status === 'hidden').length,
    };
  }, [reviews]);

  const resetReviewForm = () => {
    setReviewForm({
      customer_name: '',
      rating: 5,
      review_text: '',
      status: 'approved',
      product_id: null,
    });

    setEditingReview(null);
    setShowReviewForm(false);
    setReviewMessage(null);
    setReviewError(null);
  };

  const startCreateReview = () => {
    setEditingReview(null);

    setReviewForm({
      customer_name: '',
      rating: 5,
      review_text: '',
      status: 'approved',
      product_id: null,
    });

    setReviewMessage(null);
    setReviewError(null);
    setShowReviewForm(true);
  };

  const startEditReview = (review: ProductReview) => {
    setEditingReview(review);

    setReviewForm({
      customer_name: review.customer_name,
      rating: review.rating,
      review_text: review.review_text,
      status: review.status,
      product_id: review.product_id,
    });

    setReviewMessage(null);
    setReviewError(null);
    setShowReviewForm(true);
  };

  const handleSaveReview = async () => {
    const customerName = reviewForm.customer_name.trim();
    const reviewText = reviewForm.review_text.trim();

    if (!customerName) {
      setReviewError('اكتب اسم العميل.');
      return;
    }

    if (!reviewText) {
      setReviewError('اكتب نص الرأي.');
      return;
    }

    if (reviewForm.rating < 1 || reviewForm.rating > 5) {
      setReviewError('التقييم يجب أن يكون من 1 إلى 5.');
      return;
    }

    try {
      setReviewActionLoading(editingReview?.id || 'new');
      setReviewError(null);
      setReviewMessage(null);

      if (editingReview) {
        await api.adminUpdateProductReview(editingReview.id, {
          customer_name: customerName,
          rating: reviewForm.rating,
          review_text: reviewText,
          status: reviewForm.status,
        });

        setReviewMessage('تم تعديل الرأي بنجاح.');
      } else {
        await api.adminCreateProductReview({
          customer_name: customerName,
          rating: reviewForm.rating,
          review_text: reviewText,
          status: reviewForm.status,
          product_id: reviewForm.product_id,
        });

        setReviewMessage('تمت إضافة الرأي بنجاح.');
      }

      await loadReviews();

      setTimeout(() => {
        resetReviewForm();
      }, 500);
    } catch (err) {
      console.error('Failed to save review:', err);

      setReviewError(
        err instanceof Error
          ? err.message
          : 'تعذر حفظ الرأي، حاول مرة أخرى.'
      );
    } finally {
      setReviewActionLoading(null);
    }
  };

  const handleToggleReviewStatus = async (review: ProductReview) => {
    const nextStatus =
      review.status === 'approved' ? 'hidden' : 'approved';

    try {
      setReviewActionLoading(review.id);
      setReviewError(null);

      await api.adminUpdateProductReview(review.id, {
        status: nextStatus,
      });

      await loadReviews();
    } catch (err) {
      console.error('Failed to update review status:', err);

      setReviewError(
        err instanceof Error
          ? err.message
          : 'تعذر تغيير حالة الرأي.'
      );
    } finally {
      setReviewActionLoading(null);
    }
  };

  const handleDeleteReview = async (review: ProductReview) => {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف رأي "${review.customer_name}" نهائيًا؟`
    );

    if (!confirmed) return;

    try {
      setReviewActionLoading(review.id);
      setReviewError(null);

      await api.adminDeleteProductReview(review.id);

      setReviews((current) =>
        current.filter((item) => item.id !== review.id)
      );
    } catch (err) {
      console.error('Failed to delete review:', err);

      setReviewError(
        err instanceof Error
          ? err.message
          : 'تعذر حذف الرأي.'
      );
    } finally {
      setReviewActionLoading(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5" dir="ltr">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'text-neutral-700'
            }`}
          />
        ))}
      </div>
    );
  };

  const getReviewStatusLabel = (status: ProductReview['status']) => {
    if (status === 'approved') return 'ظاهر';
    if (status === 'hidden') return 'مخفي';
    return 'قيد المراجعة';
  };

  const getReviewStatusClass = (status: ProductReview['status']) => {
    if (status === 'approved') {
      return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50';
    }

    if (status === 'hidden') {
      return 'text-neutral-400 bg-neutral-900 border-neutral-700';
    }

    return 'text-amber-400 bg-amber-950/40 border-amber-800/50';
  };

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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {/* Date Filter Tabs */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1 text-xs overflow-x-auto">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'today', label: 'اليوم' },
              { id: 'week', label: 'آخر 7 أيام' },
              { id: 'month', label: 'آخر 30 يوم' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDateFilter(f.id as typeof dateFilter)}
                className={`py-1 px-2.5 rounded-md transition-colors whitespace-nowrap ${
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
            className="py-2 px-3.5 bg-white text-black font-bold text-xs rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة موديل جديد</span>
          </button>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Delivered Revenue */}
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
            {stats.totalOrders}{' '}
            <span className="text-xs font-normal text-neutral-500">
              طلب
            </span>
          </div>

          <p className="text-[11px] text-neutral-500">
            جميع الطلبات المسجلة خلال الفترة المحددة.
          </p>
        </div>

        {/* Pending Orders */}
        <div className="p-5 rounded-2xl bg-[#121216] border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>طلبات جديدة قيد المراجعة</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>

          <div className="text-2xl font-bold text-amber-400 font-mono-numbers">
            {stats.pendingCount}{' '}
            <span className="text-xs font-normal text-neutral-500">
              طلب
            </span>
          </div>

          <p className="text-[11px] text-neutral-500">
            تحتاج لتأكيد ومكالمة العميل قبل الشحن.
          </p>
        </div>
      </div>

      {/* Order Status Workflow Breakdown */}
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

            <span className="text-lg font-bold text-white font-mono-numbers">
              {stats.pendingCount}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/40">
            <div className="flex items-center justify-between text-blue-400 mb-1">
              <span>تم التأكيد</span>
              <CheckCircle className="w-3.5 h-3.5" />
            </div>

            <span className="text-lg font-bold text-white font-mono-numbers">
              {stats.confirmedCount}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/40">
            <div className="flex items-center justify-between text-purple-400 mb-1">
              <span>تم الشحن</span>
              <Truck className="w-3.5 h-3.5" />
            </div>

            <span className="text-lg font-bold text-white font-mono-numbers">
              {stats.shippedCount}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <span>تم التسليم</span>
              <CheckCircle className="w-3.5 h-3.5" />
            </div>

            <span className="text-lg font-bold text-white font-mono-numbers">
              {stats.deliveredCount}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/40 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-rose-400 mb-1">
              <span>ملغي</span>
              <XCircle className="w-3.5 h-3.5" />
            </div>

            <span className="text-lg font-bold text-white font-mono-numbers">
              {stats.cancelledCount}
            </span>
          </div>
        </div>
      </div>

      {/* Conversion Funnel & Product Analytics (Feature 5 & 8) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#121216] border border-neutral-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>قمع التحويل والتحليلات (Conversion Funnel)</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              متابعة رحلة العميل من تصفح الموديل وحتى إتمام الطلب والسلات المتروكة.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-neutral-400">
              معدل التحويل الكلي:{' '}
              <strong className="text-emerald-400 font-mono">
                {analytics?.overall_conversion_rate?.toFixed(1) || '0.0'}%
              </strong>
            </span>
          </div>
        </div>

        {/* 4-Step Funnel Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Step 1: Views */}
          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 relative overflow-hidden">
            <div className="flex items-center justify-between text-neutral-400 mb-1.5">
              <span className="font-bold">1. مشاهدات الموديلات</span>
              <Eye className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {analytics?.views || 0}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">تصفح صفحات المنتجات</p>
          </div>

          {/* Step 2: Add to Cart */}
          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 relative overflow-hidden">
            <div className="flex items-center justify-between text-neutral-400 mb-1.5">
              <span className="font-bold">2. إضافة إلى السلة</span>
              <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {analytics?.add_to_cart || 0}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              معدل الإضافة:{' '}
              <strong className="text-purple-400 font-mono font-bold">
                {analytics?.cart_conversion_rate?.toFixed(1) || '0.0'}%
              </strong>
            </p>
          </div>

          {/* Step 3: Checkout Started */}
          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 relative overflow-hidden">
            <div className="flex items-center justify-between text-neutral-400 mb-1.5">
              <span className="font-bold">3. بدء الدفع (Checkout)</span>
              <Compass className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {analytics?.checkout_started || 0}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              معدل الانتقال للدفع:{' '}
              <strong className="text-amber-400 font-mono font-bold">
                {analytics?.checkout_conversion_rate?.toFixed(1) || '0.0'}%
              </strong>
            </p>
          </div>

          {/* Step 4: Orders Completed */}
          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 relative overflow-hidden">
            <div className="flex items-center justify-between text-neutral-400 mb-1.5">
              <span className="font-bold">4. طلبات مكتملة</span>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {analytics?.orders_completed || stats.totalOrders || 0}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              معدل إتمام الشراء:{' '}
              <strong className="text-emerald-400 font-mono font-bold">
                {analytics?.order_conversion_rate?.toFixed(1) || '0.0'}%
              </strong>
            </p>
          </div>
        </div>

        {/* Abandoned Checkouts Banner */}
        <div className="p-3.5 rounded-xl bg-neutral-900/40 border border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-neutral-300 font-semibold">
              السلات المتروكة (بدء الشراء ولم يُستكمل):
            </span>
            <span className="font-mono font-bold text-amber-300">
              {analytics?.abandoned_checkouts_count || 0} سلة
            </span>
          </div>

          <div className="text-neutral-400">
            نسبة الارتداد عند الدفع:{' '}
            <span className="font-mono font-bold text-neutral-200">
              {analytics?.abandonment_rate?.toFixed(1) || '0.0'}%
            </span>
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
              <div
                key={i}
                className="h-14 bg-neutral-900 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-10 text-center text-xs text-neutral-500">
            لا توجد طلبات مسجلة حتى الآن. ستظهر الطلبات الجديدة هنا فور قيام
            العملاء بالشراء.
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
                    <tr
                      key={order.id}
                      className="hover:bg-neutral-900/50 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {order.order_number}
                      </td>

                      <td className="py-3 px-3 font-semibold text-neutral-200">
                        {order.customer_name}
                      </td>

                      <td className="py-3 px-3 text-neutral-400">
                        {order.governorate}
                      </td>

                      <td
                        className="py-3 px-3 font-mono text-neutral-400"
                        dir="ltr"
                      >
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

      {/* Reviews Management */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#121216] border border-neutral-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-400" />

              <h2 className="text-base font-bold text-white">
                إدارة آراء العملاء
              </h2>
            </div>

            <p className="text-xs text-neutral-500 mt-1">
              الآراء الظاهرة هنا مرتبطة مباشرة بجدول Product Reviews في Supabase.
            </p>
          </div>

          <button
            onClick={startCreateReview}
            className="py-2.5 px-4 bg-white text-black font-bold text-xs rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            إضافة رأي يدوي
          </button>
        </div>

        {/* Review Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
            <p className="text-[11px] text-neutral-500 mb-1">
              كل الآراء
            </p>

            <p className="text-xl font-bold text-white">
              {reviewStats.total}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40">
            <p className="text-[11px] text-amber-400 mb-1">
              قيد المراجعة
            </p>

            <p className="text-xl font-bold text-white">
              {reviewStats.pending}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
            <p className="text-[11px] text-emerald-400 mb-1">
              ظاهرة
            </p>

            <p className="text-xl font-bold text-white">
              {reviewStats.approved}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
            <p className="text-[11px] text-neutral-500 mb-1">
              مخفية
            </p>

            <p className="text-xl font-bold text-white">
              {reviewStats.hidden}
            </p>
          </div>
        </div>

        {reviewError && (
          <div className="rounded-lg border border-rose-800/50 bg-rose-950/30 px-4 py-3 text-xs text-rose-300">
            {reviewError}
          </div>
        )}

        {/* Review Form */}
        {showReviewForm && (
          <div className="rounded-xl border border-neutral-700 bg-neutral-950 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {editingReview ? 'تعديل الرأي' : 'إضافة رأي يدوي'}
                </h3>

                <p className="text-[11px] text-neutral-500 mt-1">
                  الآراء التي تضيفها من هنا يمكن نشرها مباشرة.
                </p>
              </div>

              <button
                onClick={resetReviewForm}
                className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-900 transition-colors"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  اسم العميل
                </label>

                <input
                  value={reviewForm.customer_name}
                  onChange={(e) =>
                    setReviewForm((current) => ({
                      ...current,
                      customer_name: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-white outline-none focus:border-neutral-500"
                  placeholder="مثال: محمد أحمد"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  التقييم
                </label>

                <div
                  className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5"
                  dir="ltr"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setReviewForm((current) => ({
                          ...current,
                          rating: star,
                        }))
                      }
                      className="p-0.5"
                      aria-label={`تقييم ${star} من 5`}
                    >
                      <Star
                        className={`w-5 h-5 transition-colors ${
                          star <= reviewForm.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-neutral-700 hover:text-neutral-500'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                الرأي
              </label>

              <textarea
                value={reviewForm.review_text}
                onChange={(e) =>
                  setReviewForm((current) => ({
                    ...current,
                    review_text: e.target.value,
                  }))
                }
                rows={4}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-white outline-none focus:border-neutral-500 resize-y"
                placeholder="اكتب رأي العميل..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                الحالة
              </label>

              <select
                value={reviewForm.status}
                onChange={(e) =>
                  setReviewForm((current) => ({
                    ...current,
                    status: e.target.value as ReviewFormState['status'],
                  }))
                }
                className="w-full sm:w-auto min-w-[180px] rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-white outline-none focus:border-neutral-500"
              >
                <option value="approved">ظاهر</option>
                <option value="pending">قيد المراجعة</option>
                <option value="hidden">مخفي</option>
              </select>
            </div>

            {reviewMessage && (
              <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-4 py-3 text-xs text-emerald-300">
                {reviewMessage}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={resetReviewForm}
                className="py-2.5 px-4 rounded-lg border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-900 text-xs font-semibold"
              >
                إلغاء
              </button>

              <button
                onClick={handleSaveReview}
                disabled={reviewActionLoading !== null}
                className="py-2.5 px-5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold disabled:opacity-50"
              >
                {reviewActionLoading
                  ? 'جاري الحفظ...'
                  : editingReview
                    ? 'حفظ التعديلات'
                    : 'إضافة الرأي'}
              </button>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {reviewsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 rounded-xl bg-neutral-900 animate-pulse"
              />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-10 text-center rounded-xl border border-dashed border-neutral-800">
            <MessageSquare className="w-8 h-8 mx-auto text-neutral-700 mb-2" />

            <p className="text-xs text-neutral-500">
              لا توجد آراء حتى الآن.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-bold text-sm text-white">
                        {review.customer_name}
                      </span>

                      {renderStars(review.rating)}

                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full border ${getReviewStatusClass(
                          review.status
                        )}`}
                      >
                        {getReviewStatusLabel(review.status)}
                      </span>

                      {review.product_id === null && (
                        <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-950/30 border border-blue-800/40 text-blue-300">
                          رأي عام
                        </span>
                      )}
                    </div>

                    <p className="text-sm leading-6 text-neutral-300 whitespace-pre-wrap">
                      {review.review_text}
                    </p>

                    <p className="text-[10px] text-neutral-600 mt-2">
                      {new Date(review.created_at).toLocaleString('ar-EG')}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEditReview(review)}
                      disabled={reviewActionLoading === review.id}
                      className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors disabled:opacity-50"
                      title="تعديل"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleToggleReviewStatus(review)}
                      disabled={reviewActionLoading === review.id}
                      className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors disabled:opacity-50"
                      title={
                        review.status === 'approved'
                          ? 'إخفاء'
                          : 'إظهار'
                      }
                    >
                      {review.status === 'approved' ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteReview(review)}
                      disabled={reviewActionLoading === review.id}
                      className="p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors disabled:opacity-50"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
