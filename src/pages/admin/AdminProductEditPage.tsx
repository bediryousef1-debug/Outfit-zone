import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Save,
  Trash2,
  Plus,
  Star,
  Upload,
  Check,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Category, Product, ProductImage } from '../../types';
import { api } from '../../services/api';
import { uploadProductImage } from '../../lib/supabase';
import { STANDARD_SIZES } from '../../utils/constants';

interface AdminProductEditPageProps {
  productId?: string | null;
  onBack: () => void;
  onSaved: () => void;
}

interface VariantGroup {
  color: string;
  color_hex: string;
  sizes: Record<string, number>;
}

const DEFAULT_COLOR_HEX = '#333333';

export const AdminProductEditPage: React.FC<AdminProductEditPageProps> = ({
  productId,
  onBack,
  onSaved,
}) => {
  const isEditing = Boolean(productId);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [fabricDetails, setFabricDetails] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('450');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNew, setIsNew] = useState(true);

  // Images state
  const [images, setImages] = useState<
    { id?: string; image_url: string; is_primary: boolean }[]
  >([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Active sizes for this product
  const [availableSizes, setAvailableSizes] = useState<string[]>([
    'M',
    'L',
    'XL',
    '2XL',
  ]);
  const [newSizeInput, setNewSizeInput] = useState('');

  // Variants grouped by color
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([
    {
      color: 'أسود كربوني',
      color_hex: DEFAULT_COLOR_HEX,
      sizes: {
        M: 5,
        L: 8,
        XL: 4,
        '2XL': 2,
      },
    },
  ]);

  const [existingVariantsMap, setExistingVariantsMap] = useState<
    Record<string, string>
  >({});
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [newColorInput, setNewColorInput] = useState('');

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const cats = await api.getCategories();
        setCategories(cats);

        if (cats.length > 0 && !categoryId) {
          setCategoryId(cats[0].id);
        }

        if (isEditing && productId) {
          const prods = await api.getProducts({ admin: true });
          const found = prods.find((p) => p.id === productId);

          if (found) {
            setName(found.name);
            setSlug(found.slug);
            setDescription(found.description || '');
            setFabricDetails(found.fabric_details || '');
            setCategoryId(found.category_id || cats[0]?.id || '');
            setPrice(String(found.price));
            setCompareAtPrice(
              found.compare_at_price
                ? String(found.compare_at_price)
                : ''
            );
            setIsActive(found.is_active);
            setIsFeatured(found.is_featured);
            setIsNew(found.is_new);

            if (found.images && found.images.length > 0) {
              setImages(
                found.images.map((img) => ({
                  id: img.id,
                  image_url: img.image_url,
                  is_primary: img.is_primary,
                }))
              );
            }

            // Extract unique sizes and group variants by color
            if (found.variants && found.variants.length > 0) {
              const sizeSet = new Set<string>();

              const grouped: Record<
                string,
                {
                  color_hex: string;
                  sizes: Record<string, number>;
                }
              > = {};

              const idMap: Record<string, string> = {};

              found.variants.forEach((v) => {
                sizeSet.add(v.size);

                if (!grouped[v.color]) {
                  grouped[v.color] = {
                    color_hex: v.color_hex || DEFAULT_COLOR_HEX,
                    sizes: {},
                  };
                }

                grouped[v.color].sizes[v.size] = v.stock_quantity;

                if (v.id) {
                  idMap[`${v.color}___${v.size}`] = v.id;
                }
              });

              if (sizeSet.size > 0) {
                setAvailableSizes(Array.from(sizeSet));
              }

              setExistingVariantsMap(idMap);

              setVariantGroups(
                Object.entries(grouped).map(([color, data]) => ({
                  color,
                  color_hex: data.color_hex || DEFAULT_COLOR_HEX,
                  sizes: data.sizes,
                }))
              );
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to initialize edit form:', err);
        setError(err.message || 'حدث خطأ في تحميل البيانات');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [productId, isEditing]);

  const handleNameChange = (val: string) => {
    setName(val);

    if (!isEditing || !slug) {
      const generated = val
        .trim()
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\u0621-\u064A]+/g, '-')
        .replace(/^-+|-+$/g, '');

      setSlug(
        generated || `product-${Date.now().toString(36)}`
      );
    }
  };

  const handleAddImage = () => {
    if (!imageUrlInput.trim()) return;

    setImages((prev) => [
      ...prev,
      {
        image_url: imageUrlInput.trim(),
        is_primary: prev.length === 0,
      },
    ]);

    setImageUrlInput('');
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadProductImage(file);

      setImages((prev) => [
        ...prev,
        {
          image_url: url,
          is_primary: prev.length === 0,
        },
      ]);
    } catch (err: any) {
      alert(err.message || 'فشل رفع الصورة');
    }

    e.target.value = '';
  };

  const setPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, idx) => ({
        ...img,
        is_primary: idx === index,
      }))
    );
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, idx) => idx !== index);

      if (
        next.length > 0 &&
        !next.some((img) => img.is_primary)
      ) {
        next[0].is_primary = true;
      }

      return next;
    });
  };

  const moveImage = (
    index: number,
    direction: 'left' | 'right'
  ) => {
    const newIndex =
      direction === 'left' ? index + 1 : index - 1;

    if (newIndex < 0 || newIndex >= images.length) {
      return;
    }

    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];

      copy[index] = copy[newIndex];
      copy[newIndex] = temp;

      return copy;
    });
  };

  // Update the visual color assigned to a color group
  const updateColorHex = (
    color: string,
    colorHex: string
  ) => {
    setVariantGroups((prev) =>
      prev.map((group) =>
        group.color === color
          ? {
              ...group,
              color_hex: colorHex,
            }
          : group
      )
    );
  };

  const addColorGroup = () => {
    if (!newColorInput.trim()) return;

    const col = newColorInput.trim();

    if (
      variantGroups.some(
        (group) => group.color === col
      )
    ) {
      alert('هذا اللون مضاف بالفعل.');
      return;
    }

    const defaultSizes: Record<string, number> = {};

    availableSizes.forEach((size) => {
      defaultSizes[size] = 5;
    });

    setVariantGroups((prev) => [
      ...prev,
      {
        color: col,
        color_hex: DEFAULT_COLOR_HEX,
        sizes: defaultSizes,
      },
    ]);

    setNewColorInput('');
  };

  const removeColorGroup = (color: string) => {
    if (variantGroups.length <= 1) {
      alert(
        'يجب الإبقاء على لون واحد على الأقل مع مقاساته.'
      );
      return;
    }

    setVariantGroups((prev) =>
      prev.filter((group) => group.color !== color)
    );
  };

  const addCustomSize = () => {
    if (!newSizeInput.trim()) return;

    const sz = newSizeInput.trim().toUpperCase();

    if (availableSizes.includes(sz)) {
      alert('هذا المقاس مضاف بالفعل.');
      return;
    }

    setAvailableSizes((prev) => [...prev, sz]);

    setVariantGroups((prev) =>
      prev.map((group) => ({
        ...group,
        sizes: {
          ...group.sizes,
          [sz]: 5,
        },
      }))
    );

    setNewSizeInput('');
  };

  const removeCustomSize = (sizeToRemove: string) => {
    if (availableSizes.length <= 1) {
      alert(
        'يجب توفر مقاس واحد على الأقل للموديل.'
      );
      return;
    }

    setAvailableSizes((prev) =>
      prev.filter((size) => size !== sizeToRemove)
    );

    setVariantGroups((prev) =>
      prev.map((group) => {
        const nextSizes = { ...group.sizes };

        delete nextSizes[sizeToRemove];

        return {
          ...group,
          sizes: nextSizes,
        };
      })
    );
  };

  const updateSizeStock = (
    color: string,
    size: string,
    count: number
  ) => {
    setVariantGroups((prev) =>
      prev.map((group) => {
        if (group.color !== color) {
          return group;
        }

        return {
          ...group,
          sizes: {
            ...group.sizes,
            [size]: Math.max(0, count),
          },
        };
      })
    );
  };

  const handleDeleteVariant = async (
    color: string,
    size: string
  ) => {
    if (
      !window.confirm(
        'هل أنت متأكد من حذف هذا المقاس/اللون من المنتج؟'
      )
    ) {
      return;
    }

    try {
      const key = `${color}___${size}`;
      const varId = existingVariantsMap[key];

      if (varId) {
        await api.adminDeleteVariant(varId);
      }

      setVariantGroups((prev) =>
        prev.map((group) => {
          if (group.color !== color) {
            return group;
          }

          const nextSizes = {
            ...group.sizes,
          };

          delete nextSizes[size];

          return {
            ...group,
            sizes: nextSizes,
          };
        })
      );

      setExistingVariantsMap((prev) => {
        const next = { ...prev };

        delete next[key];

        return next;
      });

      setSuccessNotice('تم حذف المتغير بنجاح');

      setTimeout(() => {
        setSuccessNotice(null);
      }, 3000);
    } catch (err: any) {
      alert(err.message || 'فشل حذف المتغير');
    }
  };

  const handleAddSizeToColor = (
    color: string,
    sizeToAdd: string
  ) => {
    if (!sizeToAdd) return;

    setVariantGroups((prev) =>
      prev.map((group) => {
        if (group.color !== color) {
          return group;
        }

        if (
          group.sizes[sizeToAdd] !== undefined
        ) {
          return group;
        }

        return {
          ...group,
          sizes: {
            ...group.sizes,
            [sizeToAdd]: 5,
          },
        };
      })
    );
  };

  const handleDeleteProduct = async () => {
    if (!productId) return;

    if (
      !window.confirm(
        'هل أنت متأكد من حذف هذا الموديل نهائيًا من قاعدة البيانات؟\nلن يتم حذف بيانات الطلبات السابقة المرتبطة به.'
      )
    ) {
      return;
    }

    try {
      setIsSaving(true);

      await api.adminDeleteProduct(productId);

      onSaved();
    } catch (err: any) {
      setError(err.message || 'فشل حذف المنتج');
      setIsSaving(false);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();
    setError(null);

    if (
      !name.trim() ||
      !slug.trim() ||
      !price
    ) {
      setError(
        'يرجى استكمال الحقول الإلزامية: اسم المنتج، الرابط (slug)، والسعر.'
      );
      return;
    }

    if (images.length === 0) {
      setError(
        'يرجى إضافة صورة واحدة على الأقل للموديل.'
      );
      return;
    }

    if (variantGroups.length === 0) {
      setError(
        'يرجى إضافة لون واحد على الأقل للموديل.'
      );
      return;
    }

    setIsSaving(true);

    try {
      const flattenedVariants: {
        color: string;
        color_hex: string;
        size: string;
        stock_quantity: number;
      }[] = [];

      variantGroups.forEach((group) => {
        Object.entries(group.sizes).forEach(
          ([size, quantity]) => {
            flattenedVariants.push({
              color: group.color,
              color_hex:
                group.color_hex ||
                DEFAULT_COLOR_HEX,
              size,
              stock_quantity:
                Number(quantity) || 0,
            });
          }
        );
      });

      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        fabric_details: fabricDetails.trim(),
        category_id: categoryId,
        price: Number(price),
        compare_at_price: compareAtPrice
          ? Number(compareAtPrice)
          : null,
        is_active: isActive,
        is_featured: isFeatured,
        is_new: isNew,

        images: images.map((img, idx) => ({
          image_url: img.image_url,
          sort_order: idx,
          is_primary: img.is_primary,
        })),

        variants: flattenedVariants,
      };

      if (isEditing && productId) {
        await api.adminUpdateProduct(
          productId,
          payload
        );
      } else {
        await api.adminCreateProduct(payload);
      }

      onSaved();
    } catch (err: any) {
      console.error(
        'Failed to save product:',
        err
      );

      setError(
        err.message ||
          'حدث خطأ أثناء حفظ المنتج.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-neutral-400">
        جاري تحميل بيانات الموديل...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-right pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white mb-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لقائمة المنتجات</span>
          </button>

          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {isEditing
              ? `تعديل الموديل: ${name}`
              : 'إضافة موديل ستريت وير جديد'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {isEditing && productId && (
            <button
              type="button"
              onClick={handleDeleteProduct}
              disabled={isSaving}
              className="py-2.5 px-4 bg-red-950/70 hover:bg-red-900/90 border border-red-800 text-red-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="حذف هذا الموديل نهائيًا"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف الموديل</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="py-2.5 px-6 bg-white hover:bg-neutral-200 text-black font-extrabold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSaving
                ? 'جاري الحفظ...'
                : 'حفظ الموديل'}
            </span>
          </button>
        </div>
      </div>

      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* 1. Main Details Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121216] border border-neutral-800 space-y-4">
          <h2 className="text-sm font-bold text-white border-b border-neutral-800/80 pb-2">
            البيانات الأساسية للموديل
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                اسم الموديل{' '}
                <span className="text-red-400">
                  *
                </span>
              </label>

              <input
                type="text"
                required
                placeholder="مثال: تيشيرت Interlock Box Fit - أسود"
                value={name}
                onChange={(e) =>
                  handleNameChange(e.target.value)
                }
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                الرابط المختصر (Slug){' '}
                <span className="text-red-400">
                  *
                </span>
              </label>

              <input
                type="text"
                required
                dir="ltr"
                placeholder="interlock-box-fit-black"
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value)
                }
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white text-left focus:outline-none focus:border-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                القسم{' '}
                <span className="text-red-400">
                  *
                </span>
              </label>

              <select
                value={categoryId}
                onChange={(e) =>
                  setCategoryId(e.target.value)
                }
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-white"
              >
                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                    className="bg-neutral-900 text-white"
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  السعر الحالي (جنيه){' '}
                  <span className="text-red-400">
                    *
                  </span>
                </label>

                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value)
                  }
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                  سعر المقارنة (قبل الخصم)
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="اختياري"
                  value={compareAtPrice}
                  onChange={(e) =>
                    setCompareAtPrice(
                      e.target.value
                    )
                  }
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-neutral-700 font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              وصف الموديل والقصة
            </label>

            <textarea
              rows={2}
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="وصف تفصيلي للقصة والستايل والتنسيق مع البناطيل..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              تفاصيل الخامة والنسيج (GSM، نوع القطن، الغسيل)
            </label>

            <input
              type="text"
              value={fabricDetails}
              onChange={(e) =>
                setFabricDetails(e.target.value)
              }
              placeholder="مثال: قطن مصري 100% ثقيل كثافة 240 جرام/م² معالج ضد الانكماش..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-white"
            />
          </div>

          {/* Visibility & Flags */}
          <div className="pt-2 border-t border-neutral-800 flex flex-wrap gap-6 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) =>
                  setIsActive(e.target.checked)
                }
                className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 accent-white"
              />
              <span className="text-white font-medium">
                نشط ومعروض بالمتجر للعملاء
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) =>
                  setIsFeatured(e.target.checked)
                }
                className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 accent-white"
              />
              <span className="text-white font-medium">
                عرض في قسم "الأكثر مبيعًا"
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isNew}
                onChange={(e) =>
                  setIsNew(e.target.checked)
                }
                className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 accent-white"
              />
              <span className="text-white font-medium">
                تمييز كـ "وصل حديثًا"
              </span>
            </label>
          </div>
        </div>

        {/* 2. Images Management */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121216] border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
            <div>
              <h2 className="text-sm font-bold text-white">
                صور الموديل ({images.length})
              </h2>

              <p className="text-[11px] text-neutral-400">
                يمكنك إعادة ترتيب الصور باستخدام الأسهم وتعيين الصورة الرئيسية بالنجمة.
              </p>
            </div>
          </div>

          {/* Add Image Inputs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="أدخل رابط صورة (URL) أو ارفع من جهازك..."
                value={imageUrlInput}
                onChange={(e) =>
                  setImageUrlInput(e.target.value)
                }
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-white font-mono"
              />

              <button
                type="button"
                onClick={handleAddImage}
                className="py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                إضافة
              </button>
            </div>

            <label className="py-2 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs font-semibold text-neutral-300 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>
                رفع من الجهاز (Supabase Storage)
              </span>

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Images preview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
            {images.map((img, idx) => (
              <div
                key={img.id || idx}
                className={`relative aspect-[3/4] rounded-xl overflow-hidden bg-neutral-950 border-2 ${
                  img.is_primary
                    ? 'border-white'
                    : 'border-neutral-800'
                }`}
              >
                <img
                  src={img.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />

                <div className="absolute top-1.5 right-1.5 flex gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setPrimaryImage(idx)
                    }
                    title={
                      img.is_primary
                        ? 'الصورة الرئيسية'
                        : 'تعيين كصورة رئيسية'
                    }
                    className={`p-1 rounded-md text-xs ${
                      img.is_primary
                        ? 'bg-white text-black'
                        : 'bg-black/60 text-white hover:bg-black'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      removeImage(idx)
                    }
                    title="حذف الصورة"
                    className="p-1 rounded-md bg-black/60 text-red-400 hover:bg-black text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() =>
                      moveImage(idx, 'right')
                    }
                    title="تحريك للخلف"
                    className="p-1 rounded bg-black/60 text-white disabled:opacity-30 hover:bg-black text-xs"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={
                      idx === images.length - 1
                    }
                    onClick={() =>
                      moveImage(idx, 'left')
                    }
                    title="تحريك للأمام"
                    className="p-1 rounded bg-black/60 text-white disabled:opacity-30 hover:bg-black text-xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Sizes / Colors / Stock */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121216] border border-neutral-800 space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
            <div>
              <h2 className="text-sm font-bold text-white">
                المقاسات والألوان والمخزون
              </h2>

              <p className="text-[11px] text-neutral-400">
                تحكم في قائمة المقاسات المتاحة لهذا الموديل، وأضف ألوانًا وحدد كمية كل مقاس بدقة.
              </p>
            </div>
          </div>

          {/* Custom Size Management */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              المقاسات المفعلة لهذا الموديل:
            </label>

            <div className="flex flex-wrap items-center gap-2">
              {availableSizes.map((size) => (
                <span
                  key={size}
                  className="inline-flex items-center gap-1.5 py-1 px-3 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono font-bold text-white"
                >
                  <span>{size}</span>

                  <button
                    type="button"
                    onClick={() =>
                      removeCustomSize(size)
                    }
                    className="text-neutral-500 hover:text-red-400 p-0.5"
                    title={`حذف مقاس ${size}`}
                  >
                    ×
                  </button>
                </span>
              ))}

              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  placeholder="مقاس جديد (مثال: 3XL)"
                  value={newSizeInput}
                  onChange={(e) =>
                    setNewSizeInput(e.target.value)
                  }
                  className="w-32 bg-neutral-900 border border-neutral-800 rounded-lg py-1 px-2 text-xs text-white focus:outline-none focus:border-white font-mono"
                />

                <button
                  type="button"
                  onClick={addCustomSize}
                  className="py-1 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs"
                >
                  + إضافة مقاس
                </button>
              </div>
            </div>
          </div>

          {/* Color Groups */}
          <div className="space-y-4 pt-2 border-t border-neutral-800/60">
            {variantGroups.map((group) => (
              <div
                key={group.color}
                className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3"
              >
                {/* Color Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Native color picker */}
                    <input
                      type="color"
                      value={
                        group.color_hex ||
                        DEFAULT_COLOR_HEX
                      }
                      onChange={(e) =>
                        updateColorHex(
                          group.color,
                          e.target.value
                        )
                      }
                      title={`اختيار لون دائرة ${group.color}`}
                      className="w-9 h-9 rounded-lg bg-transparent border border-neutral-700 cursor-pointer p-0.5"
                    />

                    {/* Live preview circle */}
                    <span
                      className="w-5 h-5 rounded-full border border-neutral-600 shadow-inner shrink-0"
                      style={{
                        backgroundColor:
                          group.color_hex ||
                          DEFAULT_COLOR_HEX,
                      }}
                      title={
                        group.color_hex ||
                        DEFAULT_COLOR_HEX
                      }
                    />

                    <div className="flex flex-col">
                      <span className="font-bold text-white text-xs">
                        اللون: {group.color}
                      </span>

                      <span
                        dir="ltr"
                        className="text-[10px] text-neutral-500 font-mono mt-0.5"
                      >
                        {group.color_hex ||
                          DEFAULT_COLOR_HEX}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeColorGroup(
                        group.color
                      )
                    }
                    className="text-neutral-500 hover:text-red-400 text-xs p-1"
                    title="حذف هذا اللون"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Stock per Size */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                  {Object.keys(group.sizes).map(
                    (size) => (
                      <div
                        key={size}
                        className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-white font-bold bg-neutral-800 px-2 py-0.5 rounded text-xs">
                            مقاس {size}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteVariant(
                                group.color,
                                size
                              )
                            }
                            className="px-2 py-1 rounded bg-red-950/60 hover:bg-red-900/90 border border-red-800/80 text-red-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title={`حذف مقاس ${size} من لون ${group.color}`}
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>حذف</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-neutral-400 whitespace-nowrap">
                            المخزون:
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={
                              group.sizes[size] ?? 0
                            }
                            onChange={(e) =>
                              updateSizeStock(
                                group.color,
                                size,
                                parseInt(
                                  e.target.value
                                ) || 0
                              )
                            }
                            className="w-full bg-neutral-950 border border-neutral-800 rounded py-1 px-2 text-center text-xs font-mono font-bold text-white focus:outline-none focus:border-white"
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Add available size to this color */}
                {availableSizes.some(
                  (size) =>
                    group.sizes[size] ===
                    undefined
                ) && (
                  <div className="pt-2 flex items-center gap-2 text-xs border-t border-neutral-900">
                    <span className="text-neutral-400 text-[11px]">
                      إضافة مقاس لهذا اللون:
                    </span>

                    <div className="flex flex-wrap gap-1.5">
                      {availableSizes
                        .filter(
                          (size) =>
                            group.sizes[size] ===
                            undefined
                        )
                        .map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() =>
                              handleAddSizeToColor(
                                group.color,
                                size
                              )
                            }
                            className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-mono font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            + {size}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add New Color */}
          <div className="pt-2 flex gap-2">
            <input
              type="text"
              placeholder="أضف لون جديد للموديل (مثال: زيتي، رمادي، بيج)..."
              value={newColorInput}
              onChange={(e) =>
                setNewColorInput(e.target.value)
              }
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-white"
            />

            <button
              type="button"
              onClick={addColorGroup}
              className="py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة اللون</span>
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="py-3 px-8 bg-white hover:bg-neutral-200 text-black font-extrabold text-sm rounded-xl transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Check className="w-4 h-4" />

            <span>
              {isSaving
                ? 'جاري الحفظ...'
                : 'حفظ ونشر التعديلات'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};