import React, { useState, useEffect } from 'react';
import {
  Save,
  Check,
  Truck,
  Settings,
  Search,
  RefreshCw,
  Star,
  MessageCircle,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { useStore } from '../../context/StoreContext';
import {
  ShippingRate,
  Product,
  ProductReview,
  ProductComment,
} from '../../types';
import { EGYPTIAN_GOVERNORATES } from '../../utils/constants';

type ReviewStatus = 'pending' | 'approved' | 'hidden';

export const AdminSettingsPage: React.FC = () => {
  const { settings, refreshData } = useStore();

  const [storeName, setStoreName] = useState('Outfit Zone');
  const [whatsappNumber, setWhatsappNumber] = useState('201012345678');
  const [phoneNumber, setPhoneNumber] = useState('01012345678');
  const [shippingFee, setShippingFee] = useState('65');
  const [inspectionAvailable, setInspectionAvailable] = useState(true);
  const [exchangePolicy, setExchangePolicy] = useState(
    'استبدال المقاس متاح خلال 14 يوم من تاريخ الاستلام.'
  );
  const [returnPolicy, setReturnPolicy] = useState(
    'إرجاع المنتج متاح خلال 3 أيام في حالته الأصلية وبطاقة المنتج.'
  );
  const [codMessage, setCodMessage] = useState(
    'الدفع عند الاستلام فقط لجميع المحافظات داخل مصر.'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Shipping Rates per Governorate state
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [searchGov, setSearchGov] = useState('');
  const [updatingRateId, setUpdatingRateId] = useState<string | null>(null);
  const [bulkPrice, setBulkPrice] = useState('');
  const [rateFeedback, setRateFeedback] = useState<string | null>(null);

  // Reviews & Comments
  const [reviewTab, setReviewTab] = useState<'reviews' | 'comments'>(
    'reviews'
  );
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [comments, setComments] = useState<ProductComment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<
    'all' | ReviewStatus
  >('all');
  const [reviewProductFilter, setReviewProductFilter] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);

  const [editingReview, setEditingReview] =
    useState<ProductReview | null>(null);
  const [editingComment, setEditingComment] =
    useState<ProductComment | null>(null);

  const [reviewForm, setReviewForm] = useState({
    product_id: '',
    customer_name: '',
    rating: 5,
    review_text: '',
    status: 'approved' as ReviewStatus,
  });

  const [commentForm, setCommentForm] = useState({
    product_id: '',
    customer_name: '',
    comment: '',
    status: 'approved' as ReviewStatus,
  });

  const [reviewSaving, setReviewSaving] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setStoreName(settings.store_name);
      setWhatsappNumber(settings.whatsapp_number);
      setPhoneNumber(settings.phone_number || '01012345678');
      setShippingFee(String(settings.shipping_fee));
      setInspectionAvailable(settings.inspection_available);
      setExchangePolicy(settings.exchange_policy);
      setReturnPolicy(settings.return_policy);
      setCodMessage(
        settings.cod_message ||
          'الدفع عند الاستلام فقط لجميع المحافظات داخل مصر.'
      );
    }
  }, [settings]);

  const loadShippingRates = async () => {
    setRatesLoading(true);

    try {
      const data = await api.getShippingRates(true);
      setShippingRates(data);
    } catch (err) {
      console.error('Failed to load shipping rates:', err);
    } finally {
      setRatesLoading(false);
    }
  };

  useEffect(() => {
    loadShippingRates();
  }, []);

  const loadReviewsAndComments = async () => {
    setReviewsLoading(true);

    try {
      const [reviewsData, commentsData, productsData] =
        await Promise.all([
          api.adminGetProductReviews(),
          api.adminGetProductComments(),
          api.getProducts({ admin: true }),
        ]);

      setReviews(reviewsData);
      setComments(commentsData);
      setProducts(productsData);
    } catch (err: any) {
      console.error(
        'Failed to load reviews/comments:',
        err
      );

      setReviewFeedback(
        err.message || 'تعذر تحميل التقييمات والتعليقات.'
      );
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    loadReviewsAndComments();
  }, []);

  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);

    try {
      await api.adminUpdateSettings({
        store_name: storeName.trim(),
        whatsapp_number: whatsappNumber.trim(),
        phone_number: phoneNumber.trim(),
        shipping_fee: Number(shippingFee),
        inspection_available: inspectionAvailable,
        exchange_policy: exchangePolicy.trim(),
        return_policy: returnPolicy.trim(),
        cod_message: codMessage.trim(),
      });

      await refreshData();

      setSuccessMsg(
        'تم حفظ وتحديث إعدادات وسياسات المتجر العامة بنجاح.'
      );

      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'فشل تحديث الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSingleRate = async (
    rateId: string,
    updates: Partial<ShippingRate>
  ) => {
    setUpdatingRateId(rateId);
    setRateFeedback(null);

    try {
      const updated = await api.adminUpdateShippingRate(
        rateId,
        updates
      );

      setShippingRates((prev) =>
        prev.map((r) =>
          r.id === rateId ? { ...r, ...updated } : r
        )
      );

      setRateFeedback(
        'تم تحديث سعر الشحن للمحافظة بنجاح.'
      );

      setTimeout(() => setRateFeedback(null), 2500);
    } catch (err: any) {
      alert(err.message || 'فشل تحديث سعر المحافظة');
    } finally {
      setUpdatingRateId(null);
    }
  };

  const handleToggleRateActive = async (
    rate: ShippingRate
  ) => {
    await handleUpdateSingleRate(rate.id, {
      is_active: !rate.is_active,
    });
  };

  const handleBulkApplyPrice = async () => {
    const numPrice = Number(bulkPrice);

    if (isNaN(numPrice) || numPrice < 0) {
      alert('يرجى إدخال سعر صحيح (0 أو أكثر).');
      return;
    }

    if (
      !confirm(
        `هل أنت متأكد من تعيين سعر ${numPrice} ج.م لجميع المحافظات الـ 27؟`
      )
    ) {
      return;
    }

    setIsSaving(true);

    try {
      for (const rate of shippingRates) {
        await api.adminUpdateShippingRate(rate.id, {
          shipping_fee: numPrice,
        });
      }

      await loadShippingRates();

      setRateFeedback(
        `تم تحديث سعر الشحن لجميع المحافظات إلى ${numPrice} ج.م بنجاح.`
      );

      setBulkPrice('');

      setTimeout(() => setRateFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء التحديث الجماعي');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRates = shippingRates.filter((r) => {
    if (!searchGov.trim()) return true;

    const term = searchGov.trim().toLowerCase();

    const govObj = EGYPTIAN_GOVERNORATES.find(
      (g) => g.nameAr === r.governorate
    );

    return (
      r.governorate.toLowerCase().includes(term) ||
      (govObj &&
        govObj.nameEn.toLowerCase().includes(term))
    );
  });

  const getProductName = (productId: string) => {
    const product = products.find(
      (p) => p.id === productId
    );

    return product?.name || 'منتج غير معروف';
  };

  const getStatusLabel = (status: ReviewStatus) => {
    if (status === 'approved') return 'معتمد';
    if (status === 'hidden') return 'مخفي';
    return 'قيد المراجعة';
  };

  const filteredReviews = reviews.filter((review) => {
    const productName = getProductName(review.product_id);

    const matchesSearch =
      !reviewSearch.trim() ||
      review.customer_name
        .toLowerCase()
        .includes(reviewSearch.trim().toLowerCase()) ||
      review.review_text
        .toLowerCase()
        .includes(reviewSearch.trim().toLowerCase()) ||
      productName
        .toLowerCase()
        .includes(reviewSearch.trim().toLowerCase());

    const matchesStatus =
      reviewStatusFilter === 'all' ||
      review.status === reviewStatusFilter;

    const matchesProduct =
      !reviewProductFilter ||
      review.product_id === reviewProductFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesProduct
    );
  });

  const filteredComments = comments.filter((comment) => {
    const productName = getProductName(comment.product_id);

    const matchesSearch =
      !reviewSearch.trim() ||
      comment.customer_name
        .toLowerCase()
        .includes(reviewSearch.trim().toLowerCase()) ||
      comment.comment
        .toLowerCase()
        .includes(reviewSearch.trim().toLowerCase()) ||
      productName
        .toLowerCase()
        .includes(reviewSearch.trim().toLowerCase());

    const matchesStatus =
      reviewStatusFilter === 'all' ||
      comment.status === reviewStatusFilter;

    const matchesProduct =
      !reviewProductFilter ||
      comment.product_id === reviewProductFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesProduct
    );
  });

  const openCreateReviewModal = () => {
    setEditingReview(null);

    setReviewForm({
      product_id:
        reviewProductFilter || products[0]?.id || '',
      customer_name: '',
      rating: 5,
      review_text: '',
      status: 'approved',
    });

    setReviewModalOpen(true);
  };

  const openEditReviewModal = (
    review: ProductReview
  ) => {
    setEditingReview(review);

    setReviewForm({
      product_id: review.product_id,
      customer_name: review.customer_name,
      rating: review.rating,
      review_text: review.review_text,
      status: review.status,
    });

    setReviewModalOpen(true);
  };

  const openCreateCommentModal = () => {
    setEditingComment(null);

    setCommentForm({
      product_id:
        reviewProductFilter || products[0]?.id || '',
      customer_name: '',
      comment: '',
      status: 'approved',
    });

    setCommentModalOpen(true);
  };

  const openEditCommentModal = (
    comment: ProductComment
  ) => {
    setEditingComment(comment);

    setCommentForm({
      product_id: comment.product_id,
      customer_name: comment.customer_name,
      comment: comment.comment,
      status: comment.status,
    });

    setCommentModalOpen(true);
  };

  const handleSaveReview = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!reviewForm.product_id) {
      alert('اختر المنتج أولًا.');
      return;
    }

    if (!reviewForm.customer_name.trim()) {
      alert('اكتب اسم العميل.');
      return;
    }

    if (!reviewForm.review_text.trim()) {
      alert('اكتب نص التقييم.');
      return;
    }

    setReviewSaving(true);

    try {
      if (editingReview) {
        const updated =
          await api.adminUpdateProductReview(
            editingReview.id,
            {
              customer_name:
                reviewForm.customer_name.trim(),
              rating: reviewForm.rating,
              review_text:
                reviewForm.review_text.trim(),
              status: reviewForm.status,
            }
          );

        setReviews((prev) =>
          prev.map((item) =>
            item.id === updated.id ? updated : item
          )
        );

        setReviewFeedback(
          'تم تعديل التقييم بنجاح.'
        );
      } else {
        const created =
          await api.adminCreateProductReview({
            product_id: reviewForm.product_id,
            customer_name:
              reviewForm.customer_name.trim(),
            rating: reviewForm.rating,
            review_text:
              reviewForm.review_text.trim(),
            status: reviewForm.status,
          });

        setReviews((prev) => [created, ...prev]);

        setReviewFeedback(
          'تم إنشاء التقييم بنجاح.'
        );
      }

      setReviewModalOpen(false);
      setEditingReview(null);

      setTimeout(() => setReviewFeedback(null), 3000);
    } catch (err: any) {
      alert(
        err.message || 'تعذر حفظ التقييم.'
      );
    } finally {
      setReviewSaving(false);
    }
  };

  const handleSaveComment = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!commentForm.product_id) {
      alert('اختر المنتج أولًا.');
      return;
    }

    if (!commentForm.customer_name.trim()) {
      alert('اكتب اسم العميل.');
      return;
    }

    if (!commentForm.comment.trim()) {
      alert('اكتب نص التعليق.');
      return;
    }

    setCommentSaving(true);

    try {
      if (editingComment) {
        const updated =
          await api.adminUpdateProductComment(
            editingComment.id,
            {
              customer_name:
                commentForm.customer_name.trim(),
              comment:
                commentForm.comment.trim(),
              status: commentForm.status,
            }
          );

        setComments((prev) =>
          prev.map((item) =>
            item.id === updated.id ? updated : item
          )
        );

        setReviewFeedback(
          'تم تعديل التعليق بنجاح.'
        );
      } else {
        const created =
          await api.adminCreateProductComment({
            product_id: commentForm.product_id,
            customer_name:
              commentForm.customer_name.trim(),
            comment:
              commentForm.comment.trim(),
            status: commentForm.status,
          });

        setComments((prev) => [created, ...prev]);

        setReviewFeedback(
          'تم إنشاء التعليق بنجاح.'
        );
      }

      setCommentModalOpen(false);
      setEditingComment(null);

      setTimeout(() => setReviewFeedback(null), 3000);
    } catch (err: any) {
      alert(
        err.message || 'تعذر حفظ التعليق.'
      );
    } finally {
      setCommentSaving(false);
    }
  };

  const handleReviewStatusChange = async (
    review: ProductReview,
    status: ReviewStatus
  ) => {
    try {
      const updated =
        await api.adminUpdateProductReview(
          review.id,
          { status }
        );

      setReviews((prev) =>
        prev.map((item) =>
          item.id === updated.id ? updated : item
        )
      );

      setReviewFeedback(
        `تم تغيير حالة التقييم إلى ${getStatusLabel(
          status
        )}.`
      );

      setTimeout(() => setReviewFeedback(null), 2500);
    } catch (err: any) {
      alert(
        err.message || 'تعذر تحديث حالة التقييم.'
      );
    }
  };

  const handleCommentStatusChange = async (
    comment: ProductComment,
    status: ReviewStatus
  ) => {
    try {
      const updated =
        await api.adminUpdateProductComment(
          comment.id,
          { status }
        );

      setComments((prev) =>
        prev.map((item) =>
          item.id === updated.id ? updated : item
        )
      );

      setReviewFeedback(
        `تم تغيير حالة التعليق إلى ${getStatusLabel(
          status
        )}.`
      );

      setTimeout(() => setReviewFeedback(null), 2500);
    } catch (err: any) {
      alert(
        err.message || 'تعذر تحديث حالة التعليق.'
      );
    }
  };

  const handleDeleteReview = async (
    review: ProductReview
  ) => {
    if (
      !confirm(
        'هل أنت متأكد من حذف هذا التقييم نهائيًا؟'
      )
    ) {
      return;
    }

    try {
      await api.adminDeleteProductReview(review.id);

      setReviews((prev) =>
        prev.filter((item) => item.id !== review.id)
      );

      setReviewFeedback(
        'تم حذف التقييم نهائيًا.'
      );

      setTimeout(() => setReviewFeedback(null), 2500);
    } catch (err: any) {
      alert(
        err.message || 'تعذر حذف التقييم.'
      );
    }
  };

  const handleDeleteComment = async (
    comment: ProductComment
  ) => {
    if (
      !confirm(
        'هل أنت متأكد من حذف هذا التعليق نهائيًا؟'
      )
    ) {
      return;
    }

    try {
      await api.adminDeleteProductComment(
        comment.id
      );

      setComments((prev) =>
        prev.filter((item) => item.id !== comment.id)
      );

      setReviewFeedback(
        'تم حذف التعليق نهائيًا.'
      );

      setTimeout(() => setReviewFeedback(null), 2500);
    } catch (err: any) {
      alert(
        err.message || 'تعذر حذف التعليق.'
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-right pb-16">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-neutral-300" />
          <span>
            إعدادات وسياسات المتجر ونظام الشحن
          </span>
        </h1>

        <p className="text-xs text-neutral-400 mt-1">
          إدارة أسعار الشحن لكل محافظة من الـ 27 محافظة
          مصرية، وتفعيل أو تعطيل التوصيل، وسياسات المتجر.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: SHIPPING PER GOVERNORATE
          ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#121216] border border-neutral-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-neutral-300" />

            <div>
              <h2 className="text-sm font-bold text-white">
                أسعار الشحن حسب المحافظة (Shipping per
                Governorate)
              </h2>

              <p className="text-[11px] text-neutral-400">
                لكل محافظة سعر شحن مستقل وحالة
                تفعيل/تعطيل، تعتمدها قاعدة البيانات
                تلقائيًا.
              </p>
            </div>
          </div>

          <button
            onClick={loadShippingRates}
            disabled={ratesLoading}
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                ratesLoading ? 'animate-spin' : ''
              }`}
            />

            <span>تحديث الأسعار</span>
          </button>
        </div>

        {rateFeedback && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{rateFeedback}</span>
          </div>
        )}

        {/* Search & Bulk Set Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6 relative">
            <input
              type="text"
              placeholder="ابحث عن محافظة (مثال: الدقهلية / القاهرة / الإسكندرية)..."
              value={searchGov}
              onChange={(e) =>
                setSearchGov(e.target.value)
              }
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2 pr-9 pl-3 text-xs text-white focus:outline-none focus:border-white"
            />

            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          </div>

          <div className="sm:col-span-6 flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="سعر موحد (ج.م)"
              value={bulkPrice}
              onChange={(e) =>
                setBulkPrice(e.target.value)
              }
              className="w-32 bg-neutral-900 border border-neutral-800 rounded-xl py-2 px-3 text-xs text-white text-center focus:outline-none focus:border-white font-mono"
            />

            <button
              onClick={handleBulkApplyPrice}
              disabled={!bulkPrice || isSaving}
              className="py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              تطبيق على الجميع
            </button>
          </div>
        </div>

        {/* Governorates Table */}
        <div className="border border-neutral-800/80 rounded-xl overflow-hidden">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-right text-xs">
              <thead className="bg-neutral-900/90 text-neutral-400 font-bold sticky top-0 border-b border-neutral-800 z-10">
                <tr>
                  <th className="py-3 px-4">
                    المحافظة
                  </th>
                  <th className="py-3 px-4">
                    سعر الشحن (جنيه)
                  </th>
                  <th className="py-3 px-4">
                    الحالة
                  </th>
                  <th className="py-3 px-4 text-left">
                    إجراءات
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-800/60 bg-neutral-950/40">
                {ratesLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-neutral-400"
                    >
                      جاري تحميل أسعار المحافظات...
                    </td>
                  </tr>
                ) : filteredRates.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-neutral-400"
                    >
                      لا توجد محافظات مطابقة لبحثك.
                    </td>
                  </tr>
                ) : (
                  filteredRates.map((rate) => {
                    const govObj =
                      EGYPTIAN_GOVERNORATES.find(
                        (g) =>
                          g.nameAr === rate.governorate
                      );

                    const isUpdating =
                      updatingRateId === rate.id;

                    return (
                      <GovernorateRow
                        key={rate.id}
                        rate={rate}
                        govObj={govObj}
                        isUpdating={isUpdating}
                        onSavePrice={(newPrice) =>
                          handleUpdateSingleRate(
                            rate.id,
                            {
                              shipping_fee: newPrice,
                            }
                          )
                        }
                        onToggleActive={() =>
                          handleToggleRateActive(rate)
                        }
                      />
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: REVIEWS & COMMENTS
          ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#121216] border border-neutral-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
          <div className="flex items-center gap-2">
            {reviewTab === 'reviews' ? (
              <Star className="w-5 h-5 text-amber-400" />
            ) : (
              <MessageCircle className="w-5 h-5 text-neutral-300" />
            )}

            <div>
              <h2 className="text-sm font-bold text-white">
                إدارة تقييمات وتعليقات المنتجات
              </h2>

              <p className="text-[11px] text-neutral-400">
                مراجعة واعتماد وإخفاء وتعديل وحذف تقييمات
                وتعليقات العملاء.
              </p>
            </div>
          </div>

          <button
            onClick={loadReviewsAndComments}
            disabled={reviewsLoading}
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                reviewsLoading ? 'animate-spin' : ''
              }`}
            />

            <span>تحديث</span>
          </button>
        </div>

        {reviewFeedback && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{reviewFeedback}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-neutral-800 pb-3">
          <button
            type="button"
            onClick={() => setReviewTab('reviews')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              reviewTab === 'reviews'
                ? 'bg-white text-black'
                : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>التقييمات ({reviews.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setReviewTab('comments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              reviewTab === 'comments'
                ? 'bg-white text-black'
                : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>التعليقات ({comments.length})</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />

            <input
              type="text"
              value={reviewSearch}
              onChange={(e) =>
                setReviewSearch(e.target.value)
              }
              placeholder="ابحث بالاسم أو المنتج أو النص..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 pr-9 pl-3 text-xs text-white focus:outline-none focus:border-white"
            />
          </div>

          <select
            value={reviewProductFilter}
            onChange={(e) =>
              setReviewProductFilter(e.target.value)
            }
            className="md:col-span-4 bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-white"
          >
            <option value="">كل المنتجات</option>

            {products.map((product) => (
              <option
                key={product.id}
                value={product.id}
              >
                {product.name}
              </option>
            ))}
          </select>

          <select
            value={reviewStatusFilter}
            onChange={(e) =>
              setReviewStatusFilter(
                e.target.value as
                  | 'all'
                  | ReviewStatus
              )
            }
            className="md:col-span-3 bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-white"
          >
            <option value="all">كل الحالات</option>
            <option value="pending">قيد المراجعة</option>
            <option value="approved">معتمد</option>
            <option value="hidden">مخفي</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {reviewTab === 'reviews' ? (
            <button
              type="button"
              onClick={openCreateReviewModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              إضافة تقييم يدوي
            </button>
          ) : (
            <button
              type="button"
              onClick={openCreateCommentModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              إضافة تعليق يدوي
            </button>
          )}
        </div>

        {/* Reviews List */}
        {reviewTab === 'reviews' && (
          <div className="space-y-3">
            {reviewsLoading ? (
              <div className="py-10 text-center text-xs text-neutral-500">
                جاري تحميل التقييمات...
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-neutral-800 rounded-xl text-xs text-neutral-500">
                لا توجد تقييمات مطابقة للفلاتر الحالية.
              </div>
            ) : (
              filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {review.customer_name}
                        </span>

                        <StatusBadge
                          status={review.status}
                        />
                      </div>

                      <p className="text-[11px] text-neutral-500 mt-1">
                        {getProductName(
                          review.product_id
                        )}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(
                            (star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= review.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-neutral-700'
                                }`}
                              />
                            )
                          )}
                        </div>

                        <span className="text-[10px] text-neutral-500">
                          {review.rating}/5
                        </span>
                      </div>

                      <p className="text-xs leading-6 text-neutral-300 mt-3 whitespace-pre-wrap">
                        {review.review_text}
                      </p>

                      <p className="text-[10px] text-neutral-600 mt-3">
                        {new Date(
                          review.created_at
                        ).toLocaleString('ar-EG')}
                      </p>
                    </div>

                    <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                      {review.status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() =>
                            handleReviewStatusChange(
                              review,
                              'approved'
                            )
                          }
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-950/50 border border-emerald-900 text-emerald-300 text-[11px] font-bold hover:bg-emerald-900/50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          اعتماد
                        </button>
                      )}

                      {review.status !== 'hidden' && (
                        <button
                          type="button"
                          onClick={() =>
                            handleReviewStatusChange(
                              review,
                              'hidden'
                            )
                          }
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 text-[11px] font-bold hover:text-white"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          إخفاء
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          openEditReviewModal(review)
                        }
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 text-[11px] font-bold hover:text-white"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        تعديل
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteReview(review)
                        }
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-950/30 border border-red-900/60 text-red-300 text-[11px] font-bold hover:bg-red-950/60"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Comments List */}
        {reviewTab === 'comments' && (
          <div className="space-y-3">
            {reviewsLoading ? (
              <div className="py-10 text-center text-xs text-neutral-500">
                جاري تحميل التعليقات...
              </div>
            ) : filteredComments.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-neutral-800 rounded-xl text-xs text-neutral-500">
                لا توجد تعليقات مطابقة للفلاتر الحالية.
              </div>
            ) : (
              filteredComments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {comment.customer_name}
                        </span>

                        <StatusBadge
                          status={comment.status}
                        />
                      </div>

                      <p className="text-[11px] text-neutral-500 mt-1">
                        {getProductName(
                          comment.product_id
                        )}
                      </p>

                      <p className="text-xs leading-6 text-neutral-300 mt-3 whitespace-pre-wrap">
                        {comment.comment}
                      </p>

                      <p className="text-[10px] text-neutral-600 mt-3">
                        {new Date(
                          comment.created_at
                        ).toLocaleString('ar-EG')}
                      </p>
                    </div>

                    <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                      {comment.status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() =>
                            handleCommentStatusChange(
                              comment,
                              'approved'
                            )
                          }
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-950/50 border border-emerald-900 text-emerald-300 text-[11px] font-bold hover:bg-emerald-900/50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          اعتماد
                        </button>
                      )}

                      {comment.status !== 'hidden' && (
                        <button
                          type="button"
                          onClick={() =>
                            handleCommentStatusChange(
                              comment,
                              'hidden'
                            )
                          }
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 text-[11px] font-bold hover:text-white"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          إخفاء
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          openEditCommentModal(
                            comment
                          )
                        }
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 text-[11px] font-bold hover:text-white"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        تعديل
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteComment(comment)
                        }
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-950/30 border border-red-900/60 text-red-300 text-[11px] font-bold hover:bg-red-950/60"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 3: GENERAL STORE POLICIES & CONTACT
          ========================================================================= */}
      <form
        onSubmit={handleSaveStoreSettings}
        className="space-y-6"
      >
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121216] border border-neutral-800 space-y-4">
          <h2 className="text-sm font-bold text-white border-b border-neutral-800/80 pb-2">
            بيانات المتجر وأرقام التواصل
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                اسم البراند / المتجر
              </label>

              <input
                type="text"
                required
                value={storeName}
                onChange={(e) =>
                  setStoreName(e.target.value)
                }
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                رقم WhatsApp الرسمي (مع كود 20)
              </label>

              <input
                type="text"
                required
                dir="ltr"
                value={whatsappNumber}
                onChange={(e) =>
                  setWhatsappNumber(e.target.value)
                }
                placeholder="201012345678"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white text-left focus:outline-none focus:border-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                رقم الهاتف المباشر
              </label>

              <input
                type="text"
                required
                dir="ltr"
                value={phoneNumber}
                onChange={(e) =>
                  setPhoneNumber(e.target.value)
                }
                placeholder="01012345678"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white text-left focus:outline-none focus:border-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Policies */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121216] border border-neutral-800 space-y-4">
          <h2 className="text-sm font-bold text-white border-b border-neutral-800/80 pb-2">
            سياسات الاستبدال والإرجاع والمعاينة
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                سياسة الاستبدال
              </label>

              <input
                type="text"
                value={exchangePolicy}
                onChange={(e) =>
                  setExchangePolicy(e.target.value)
                }
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                سياسة الإرجاع
              </label>

              <input
                type="text"
                value={returnPolicy}
                onChange={(e) =>
                  setReturnPolicy(e.target.value)
                }
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                رسالة الدفع عند الاستلام
              </label>

              <input
                type="text"
                value={codMessage}
                onChange={(e) =>
                  setCodMessage(e.target.value)
                }
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="inspection"
                checked={inspectionAvailable}
                onChange={(e) =>
                  setInspectionAvailable(
                    e.target.checked
                  )
                }
                className="rounded bg-neutral-900 border-neutral-800 text-white focus:ring-0 w-4 h-4 cursor-pointer"
              />

              <label
                htmlFor="inspection"
                className="text-xs text-neutral-300 cursor-pointer"
              >
                تفعيل ميزة المعاينة المجانية للطلب قبل
                الدفع والاستلام
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="py-3 px-8 bg-white hover:bg-neutral-200 text-black font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ سياسات المتجر</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* =========================================================================
          REVIEW MODAL
          ========================================================================= */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#121216] border border-neutral-800 shadow-2xl">
            <div className="flex items-center justify-between gap-4 p-5 border-b border-neutral-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingReview
                    ? 'تعديل التقييم'
                    : 'إضافة تقييم يدوي'}
                </h3>

                <p className="text-[11px] text-neutral-500 mt-1">
                  التقييم الذي ينشئه Admin يمكن نشره مباشرة.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setReviewModalOpen(false)
                }
                className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveReview}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  المنتج
                </label>

                <select
                  value={reviewForm.product_id}
                  onChange={(e) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      product_id: e.target.value,
                    }))
                  }
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-white"
                >
                  <option value="">
                    اختر المنتج
                  </option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  اسم العميل
                </label>

                <input
                  type="text"
                  maxLength={100}
                  value={reviewForm.customer_name}
                  onChange={(e) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      customer_name: e.target.value,
                    }))
                  }
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  التقييم
                </label>

                <div className="flex gap-1" dir="ltr">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setReviewForm((prev) => ({
                          ...prev,
                          rating: star,
                        }))
                      }
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewForm.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-neutral-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  نص التقييم
                </label>

                <textarea
                  rows={5}
                  maxLength={1000}
                  value={reviewForm.review_text}
                  onChange={(e) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      review_text: e.target.value,
                    }))
                  }
                  className="w-full resize-none bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-3 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  الحالة
                </label>

                <select
                  value={reviewForm.status}
                  onChange={(e) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      status:
                        e.target.value as ReviewStatus,
                    }))
                  }
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-white"
                >
                  <option value="approved">
                    معتمد
                  </option>
                  <option value="pending">
                    قيد المراجعة
                  </option>
                  <option value="hidden">
                    مخفي
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setReviewModalOpen(false)
                  }
                  className="px-5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-bold hover:text-white"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={reviewSaving}
                  className="px-6 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 disabled:opacity-50"
                >
                  {reviewSaving
                    ? 'جاري الحفظ...'
                    : editingReview
                    ? 'حفظ التعديلات'
                    : 'إنشاء التقييم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          COMMENT MODAL
          ========================================================================= */}
      {commentModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#121216] border border-neutral-800 shadow-2xl">
            <div className="flex items-center justify-between gap-4 p-5 border-b border-neutral-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingComment
                    ? 'تعديل التعليق'
                    : 'إضافة تعليق يدوي'}
                </h3>

                <p className="text-[11px] text-neutral-500 mt-1">
                  التعليق الذي ينشئه Admin يمكن نشره مباشرة.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCommentModalOpen(false)
                }
                className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveComment}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  المنتج
                </label>

                <select
                  value={commentForm.product_id}
                  onChange={(e) =>
                    setCommentForm((prev) => ({
                      ...prev,
                      product_id: e.target.value,
                    }))
                  }
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-white"
                >
                  <option value="">
                    اختر المنتج
                  </option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  اسم العميل
                </label>

                <input
                  type="text"
                  maxLength={100}
                  value={commentForm.customer_name}
                  onChange={(e) =>
                    setCommentForm((prev) => ({
                      ...prev,
                      customer_name: e.target.value,
                    }))
                  }
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  التعليق
                </label>

                <textarea
                  rows={6}
                  maxLength={1000}
                  value={commentForm.comment}
                  onChange={(e) =>
                    setCommentForm((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  className="w-full resize-none bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-3 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  الحالة
                </label>

                <select
                  value={commentForm.status}
                  onChange={(e) =>
                    setCommentForm((prev) => ({
                      ...prev,
                      status:
                        e.target.value as ReviewStatus,
                    }))
                  }
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-white"
                >
                  <option value="approved">
                    معتمد
                  </option>
                  <option value="pending">
                    قيد المراجعة
                  </option>
                  <option value="hidden">
                    مخفي
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setCommentModalOpen(false)
                  }
                  className="px-5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-bold hover:text-white"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={commentSaving}
                  className="px-6 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 disabled:opacity-50"
                >
                  {commentSaving
                    ? 'جاري الحفظ...'
                    : editingComment
                    ? 'حفظ التعديلات'
                    : 'إنشاء التعليق'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// STATUS BADGE
// ============================================================================

const StatusBadge: React.FC<{
  status: ReviewStatus;
}> = ({ status }) => {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        معتمد
      </span>
    );
  }

  if (status === 'hidden') {
    return (
      <span className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-[10px] font-bold bg-neutral-900 text-neutral-400 border border-neutral-800">
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
        مخفي
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-[10px] font-bold bg-amber-950/50 text-amber-400 border border-amber-800/60">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      قيد المراجعة
    </span>
  );
};

// ============================================================================
// GOVERNORATE ROW
// ============================================================================

const GovernorateRow: React.FC<{
  rate: ShippingRate;
  govObj?: {
    id: string;
    nameAr: string;
    nameEn: string;
  };
  isUpdating: boolean;
  onSavePrice: (newPrice: number) => void;
  onToggleActive: () => void;
}> = ({
  rate,
  govObj,
  isUpdating,
  onSavePrice,
  onToggleActive,
}) => {
  const [feeInput, setFeeInput] = useState(
    String(rate.shipping_fee)
  );

  const [hasChanged, setHasChanged] =
    useState(false);

  useEffect(() => {
    setFeeInput(String(rate.shipping_fee));
    setHasChanged(false);
  }, [rate.shipping_fee]);

  const handlePriceChange = (val: string) => {
    setFeeInput(val);
    setHasChanged(
      Number(val) !== Number(rate.shipping_fee)
    );
  };

  const handleSave = () => {
    const num = Number(feeInput);

    if (!isNaN(num) && num >= 0) {
      onSavePrice(num);
      setHasChanged(false);
    }
  };

  return (
    <tr className="hover:bg-neutral-900/50 transition-colors">
      {/* Name */}
      <td className="py-3 px-4 font-bold text-white">
        <div className="flex items-center gap-2">
          <span>{rate.governorate}</span>

          {govObj && (
            <span className="text-[10px] text-neutral-500 font-mono">
              ({govObj.nameEn})
            </span>
          )}
        </div>
      </td>

      {/* Shipping Fee Input */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="1"
            value={feeInput}
            onChange={(e) =>
              handlePriceChange(e.target.value)
            }
            className="w-24 bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 px-2.5 text-xs text-white text-center focus:outline-none focus:border-white font-mono"
          />

          {hasChanged && (
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="py-1.5 px-2.5 rounded-lg bg-white text-black font-bold text-[11px] hover:bg-neutral-200 transition-colors shadow cursor-pointer"
            >
              {isUpdating ? '...' : 'حفظ'}
            </button>
          )}
        </div>
      </td>

      {/* Status Badge */}
      <td className="py-3 px-4">
        {rate.is_active ? (
          <span className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>مفعّل</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-[10px] font-bold bg-neutral-900 text-neutral-400 border border-neutral-800">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
            <span>معطّل (غير متاح)</span>
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="py-3 px-4 text-left">
        <button
          onClick={onToggleActive}
          disabled={isUpdating}
          className={`py-1.5 px-3 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border ${
            rate.is_active
              ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-red-400 hover:border-red-900'
              : 'bg-emerald-950/40 border-emerald-900 text-emerald-300 hover:bg-emerald-900/60'
          }`}
        >
          {rate.is_active
            ? 'تعطيل الشحن'
            : 'تفعيل الشحن'}
        </button>
      </td>
    </tr>
  );
};