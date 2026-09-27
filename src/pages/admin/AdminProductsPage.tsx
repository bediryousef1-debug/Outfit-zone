import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Edit2, Archive, Trash2, Search, CheckCircle, XCircle } from 'lucide-react';
import { Product } from '../../types';
import { api } from '../../services/api';
import { formatPrice } from '../../utils/constants';
import { resolveImageUrl } from '../../utils/imageHelper';

interface AdminProductsPageProps {
  onNewProduct: () => void;
  onEditProduct: (id: string) => void;
}

export const AdminProductsPage: React.FC<AdminProductsPageProps> = ({
  onNewProduct,
  onEditProduct,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [archiveSuccess, setArchiveSuccess] = useState<string | null>(null);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getProducts({ admin: true });
      setProducts(data);
    } catch (err) {
      console.error('Failed to load admin products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleArchive = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في أرشفة الموديل "${name}"؟\nسيتم إخفاؤه من المتجر مع الحفاظ على كافة الطلبات السابقة.`)) {
      return;
    }

    try {
      await api.adminArchiveProduct(id);
      setArchiveSuccess(`تم أرشفة الموديل "${name}" بنجاح.`);
      loadProducts();
      setTimeout(() => setArchiveSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'فشل أرشفة المنتج');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الموديل "${name}" نهائيًا من قاعدة البيانات؟\nلن يتم حذف بيانات الطلبات السابقة المرتبطة به.`)) {
      return;
    }

    try {
      await api.adminDeleteProduct(id);
      setArchiveSuccess(`تم حذف الموديل "${name}" بنجاح.`);
      loadProducts();
      setTimeout(() => setArchiveSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'فشل حذف المنتج');
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (statusFilter === 'active' && !p.is_active) return false;
      if (statusFilter === 'archived' && p.is_active) return false;

      if (search) {
        const term = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(term) ||
          p.slug.toLowerCase().includes(term) ||
          p.category?.name.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [products, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            إدارة منتجات وموديلات Outfit Zone
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            إضافة موديلات جديدة أسبوعيًا، تحديث المقاسات، والتحكم في المخزون.
          </p>
        </div>

        <button
          onClick={onNewProduct}
          className="py-2.5 px-4 bg-white text-black font-extrabold text-xs rounded-xl hover:bg-neutral-200 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة موديل جديد</span>
        </button>
      </div>

      {archiveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
          {archiveSuccess}
        </div>
      )}

      {/* Controls: Search and Status tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <input
            type="text"
            placeholder="بحث بالاسم، الرابط، أو القسم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121216] border border-neutral-800 rounded-lg py-2 pr-9 pl-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
          />
          <Search className="w-4 h-4 text-neutral-500 absolute top-2.5 right-3" />
        </div>

        <div className="flex items-center bg-[#121216] border border-neutral-800 rounded-lg p-1 text-xs self-start sm:self-auto">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'active', label: 'النشطة بالمتجر' },
            { id: 'archived', label: 'المؤرشفة' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`py-1 px-3 rounded-md transition-colors ${
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

      {/* Product Table */}
      <div className="bg-[#121216] border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-neutral-900 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-500">
            لا توجد منتجات مطابقة للبحث أو الفلتر.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400 bg-neutral-950/40">
                  <th className="py-3 px-4">الصورة</th>
                  <th className="py-3 px-4">اسم الموديل</th>
                  <th className="py-3 px-4">القسم</th>
                  <th className="py-3 px-4">السعر</th>
                  <th className="py-3 px-4">إجمالي المخزون</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {filteredProducts.map((product) => {
                  const totalStock = product.variants?.reduce((sum, v) => sum + v.stock_quantity, 0) || 0;
                  const rawImg = product.images?.[0]?.image_url;
                  const primaryImg = resolveImageUrl(rawImg);

                  return (
                    <tr key={product.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="py-3 px-4">
                        <img
                          src={primaryImg}
                          alt=""
                          className="w-10 h-12 object-cover rounded bg-neutral-950 border border-neutral-800"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs">{product.name}</div>
                        <div className="text-[11px] font-mono text-neutral-500">{product.slug}</div>
                      </td>
                      <td className="py-3 px-4 text-neutral-300">
                        {product.category?.name || 'ستريت وير'}
                      </td>
                      <td className="py-3 px-4 font-mono-numbers font-bold text-white">
                        {formatPrice(product.price)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-mono-numbers font-bold ${totalStock <= 0 ? 'text-red-400' : totalStock < 5 ? 'text-amber-400' : 'text-neutral-200'}`}>
                          {totalStock} قطعة
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {product.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            <span>معروض</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" />
                            <span>مؤرشف</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onEditProduct(product.id)}
                            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                            title="تعديل الموديل والمخزون"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {product.is_active ? (
                            <button
                              onClick={() => handleArchive(product.id, product.name)}
                              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-amber-950/40 text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
                              title="أرشفة المنتج (إخفاء من المتجر)"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                try {
                                  await api.adminUpdateProduct(product.id, { ...product, is_active: true });
                                  loadProducts();
                                } catch (e: any) {
                                  alert(e.message || 'فشل إعادة التفعيل');
                                }
                              }}
                              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-emerald-950/40 text-neutral-400 hover:text-emerald-400 transition-colors cursor-pointer"
                              title="إعادة تفعيل وعرض بالمتجر"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-red-950/60 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="حذف المنتج نهائيًا"
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
    </div>
  );
};
