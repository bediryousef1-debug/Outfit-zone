import React, { useEffect, useState } from 'react';
import { Category } from '../../types';
import { api } from '../../services/api';
import { useStore } from '../../context/StoreContext';
import { Plus, Edit2, Archive, Trash2, Check, Layers, AlertCircle, RefreshCw, Image } from 'lucide-react';
import { AdminImageUpload } from '../../components/admin/AdminImageUpload';

export const AdminCategoriesPage: React.FC = () => {
  const { refreshData } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.adminGetCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل الأقسام');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormImageUrl('');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormImageUrl(cat.image_url || '');
    setFormIsActive(cat.is_active !== false);
    setIsModalOpen(true);
  };

  const generateSlugFromName = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim()) {
      setError('يرجى إدخال اسم القسم والرابط.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (editingCategory) {
        await api.adminUpdateCategory(editingCategory.id, {
          name: formName.trim(),
          slug: formSlug.trim(),
          image_url: formImageUrl.trim() || undefined,
          is_active: formIsActive,
        });
        setSuccessMsg('تم تحديث القسم بنجاح.');
      } else {
        await api.adminCreateCategory({
          name: formName.trim(),
          slug: formSlug.trim(),
          image_url: formImageUrl.trim() || undefined,
        });
        setSuccessMsg('تمت إضافة القسم الجديد بنجاح.');
      }

      await fetchCategories();
      await refreshData();
      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ القسم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (cat: Category) => {
    if (!window.confirm(`هل أنت متأكد من أرشفة القسم "${cat.name}"؟ لن يظهر في المتجر للعملاء.`)) {
      return;
    }

    try {
      await api.adminArchiveCategory(cat.id);
      setSuccessMsg(`تمت أرشفة القسم "${cat.name}".`);
      await fetchCategories();
      await refreshData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'فشل أرشفة القسم');
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`هل أنت متأكد من حذف القسم "${cat.name}" نهائيًا من قاعدة البيانات؟\nلن يتم حذف الموديلات والمنتجات التابعة له.`)) {
      return;
    }

    try {
      await api.adminDeleteCategory(cat.id);
      setSuccessMsg(`تم حذف القسم "${cat.name}" بنجاح.`);
      await fetchCategories();
      await refreshData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'فشل حذف القسم');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-neutral-300" />
            <span>إدارة الأقسام وتصنيفات المتجر</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            إضافة وتعديل وأرشفة الأقسام المعروضة للعملاء على المتجر مباشرة من Supabase.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs transition-colors flex items-center gap-2 shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة قسم جديد</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 flex items-center gap-2 text-xs text-emerald-200 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800 flex items-center gap-2 text-xs text-red-200 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Categories Table / List */}
      <div className="bg-[#0f0f13] border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="p-12 text-center text-neutral-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>جاري تحميل الأقسام...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-xs">
            لا توجد أقسام مسجلة حاليًا. اضغط على "إضافة قسم جديد".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400 font-semibold">
                <tr>
                  <th className="p-4">القسم</th>
                  <th className="p-4">الرابط المرجعي (Slug)</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-850">
                {categories.map((cat) => {
                  const isActive = cat.is_active !== false;
                  return (
                    <tr
                      key={cat.id}
                      className={`hover:bg-neutral-900/50 transition-colors ${
                        !isActive ? 'opacity-50 bg-neutral-950/40' : ''
                      }`}
                    >
                      <td className="p-4 font-bold text-white flex items-center gap-3">
                        {cat.image_url ? (
                          <img
                            src={cat.image_url}
                            alt={cat.name}
                            className="w-10 h-10 object-cover rounded-lg border border-neutral-800"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600">
                            <Image className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div>{cat.name}</div>
                          {!isActive && (
                            <span className="text-[10px] text-amber-400 font-normal">مؤرشف / معطل</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-neutral-400 text-[11px]" dir="ltr">
                        {cat.slug}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                          }`}
                        >
                          {isActive ? 'نشط على المتجر' : 'مؤرشف'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                            title="تعديل القسم"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {isActive && (
                            <button
                              onClick={() => handleArchive(cat)}
                              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-amber-950 border border-neutral-800 hover:border-amber-900 text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
                              title="أرشفة القسم"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(cat)}
                            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-red-950 border border-neutral-800 hover:border-red-900 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="حذف القسم نهائيًا"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#111116] border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-5 text-right">
            <div className="border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingCategory ? 'تعديل بيانات القسم' : 'إضافة قسم جديد'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  اسم القسم (بالعربية)
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تيشيرتات Box Fit"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingCategory) {
                      setFormSlug(generateSlugFromName(e.target.value));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-white transition-colors text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  الرابط المرجعي (Slug بالإنجليزية)
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: box-fit-t-shirts"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-white transition-colors font-mono"
                />
              </div>

              <AdminImageUpload
                label="صورة القسم"
                value={formImageUrl}
                onChange={(url) => setFormImageUrl(url)}
                helperText="تظهر في واجهة الأقسام على الصفحة الرئيسية وتصفح الموديلات"
                aspectRatio="portrait"
              />

              {editingCategory && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="formIsActive"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded bg-neutral-900 border-neutral-800 text-white accent-white cursor-pointer"
                  />
                  <label htmlFor="formIsActive" className="text-xs text-neutral-300 cursor-pointer font-semibold">
                    القسم نشط ومعروض في المتجر للعملاء
                  </label>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2 px-5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-extrabold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ القسم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
