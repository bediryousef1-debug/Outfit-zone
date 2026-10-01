import React, { useEffect, useState } from 'react';
import {
Plus,
Save,
Trash2,
Edit3,
Eye,
EyeOff,
ArrowUp,
ArrowDown,
RefreshCw,
AlertCircle,
Check,
Image as ImageIcon,
X,
} from 'lucide-react';
import { HeroSlide } from '../../types';
import { api } from '../../services/api';
import { uploadProductImage } from '../../lib/supabase';

interface AdminHeroSliderPageProps {}

type SlideForm = {
title_line1_ar: string;
title_line1_en: string;
title_line2_ar: string;
title_line2_en: string;
subtitle_ar: string;
subtitle_en: string;
description_ar: string;
description_en: string;
button_text_ar: string;
button_text_en: string;
button_link: string;
image_url: string;
is_active: boolean;
};

const emptyForm: SlideForm = {
title_line1_ar: '',
title_line1_en: '',
title_line2_ar: '',
title_line2_en: '',
subtitle_ar: '',
subtitle_en: '',
description_ar: '',
description_en: '',
button_text_ar: '',
button_text_en: '',
button_link: '/products',
image_url: '',
is_active: true,
};

export const AdminHeroSliderPage: React.FC<AdminHeroSliderPageProps> = () => {
const [slides, setSlides] = useState<HeroSlide[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [isSaving, setIsSaving] = useState(false);

const [error, setError] = useState<string | null>(null);
const [successMsg, setSuccessMsg] = useState<string | null>(null);

const [isFormOpen, setIsFormOpen] = useState(false);
const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
const [form, setForm] = useState<SlideForm>(emptyForm);

const fetchSlides = async () => {
setIsLoading(true);
setError(null);

```
try {
  const data = await api.adminGetHeroSlides();
  setSlides(Array.isArray(data) ? data : []);
} catch (err: any) {
  setError(err?.message || 'فشل تحميل الـ Hero Slider');
} finally {
  setIsLoading(false);
}
```

};

useEffect(() => {
fetchSlides();
}, []);

const showSuccess = (message: string) => {
setSuccessMsg(message);
window.setTimeout(() => setSuccessMsg(null), 3000);
};

const updateField = <K extends keyof SlideForm>(
field: K,
value: SlideForm[K]
) => {
setForm((previous) => ({
...previous,
[field]: value,
}));
};

const openCreateForm = () => {
setEditingSlideId(null);
setForm({ ...emptyForm });
setError(null);
setIsFormOpen(true);
};

const openEditForm = (slide: HeroSlide) => {
setEditingSlideId(slide.id);

```
setForm({
  title_line1_ar: slide.title_line1_ar || '',
  title_line1_en: slide.title_line1_en || '',
  title_line2_ar: slide.title_line2_ar || '',
  title_line2_en: slide.title_line2_en || '',
  subtitle_ar: slide.subtitle_ar || '',
  subtitle_en: slide.subtitle_en || '',
  description_ar: slide.description_ar || '',
  description_en: slide.description_en || '',
  button_text_ar: slide.button_text_ar || '',
  button_text_en: slide.button_text_en || '',
  button_link: slide.button_link || '/products',
  image_url: slide.image_url || '',
  is_active: slide.is_active !== false,
});

setError(null);
setIsFormOpen(true);
```

};

const closeForm = () => {
if (isSaving) return;

```
setIsFormOpen(false);
setEditingSlideId(null);
setForm({ ...emptyForm });
```

};

const validateForm = () => {
if (!form.title_line1_ar.trim() && !form.title_line2_ar.trim()) {
return 'اكتب عنوان السلايد بالعربية على الأقل.';
}

```
if (!form.subtitle_ar.trim()) {
  return 'اكتب النص الفرعي بالعربية.';
}

if (!form.image_url.trim()) {
  return 'أضف صورة للسلايد.';
}

if (!form.button_link.trim()) {
  return 'اكتب رابط الزر.';
}

return null;
```

};

const buildSlideData = (sortOrder: number) => ({
title_line1_ar: form.title_line1_ar,
title_line1_en: form.title_line1_en || undefined,
title_line2_ar: form.title_line2_ar,
title_line2_en: form.title_line2_en || undefined,
subtitle_ar: form.subtitle_ar,
subtitle_en: form.subtitle_en || undefined,
description_ar: form.description_ar,
description_en: form.description_en || undefined,
button_text_ar: form.button_text_ar,
button_text_en: form.button_text_en || undefined,
button_link: form.button_link,
image_url: form.image_url,
sort_order: sortOrder,
is_active: form.is_active,
});

const handleSave = async (e: React.FormEvent) => {
e.preventDefault();

```
const validationError = validateForm();

if (validationError) {
  setError(validationError);
  return;
}

setIsSaving(true);
setError(null);
setSuccessMsg(null);

try {
  if (editingSlideId) {
    const existingSlide = slides.find(
      (slide) => slide.id === editingSlideId
    );

    await api.adminUpdateHeroSlide(
      editingSlideId,
      buildSlideData(existingSlide?.sort_order ?? 0)
    );

    showSuccess('تم تعديل السلايد بنجاح.');
  } else {
    await api.adminCreateHeroSlide(
      buildSlideData(slides.length)
    );

    showSuccess('تم إضافة السلايد بنجاح.');
  }

  await fetchSlides();
  closeForm();
} catch (err: any) {
  setError(err?.message || 'فشل حفظ السلايد.');
} finally {
  setIsSaving(false);
}
```

};

const handleDelete = async (slide: HeroSlide) => {
const confirmed = window.confirm(
`هل أنت متأكد من حذف السلايد "${slide.title_line1_ar || slide.title_line2_ar}"؟`
);

```
if (!confirmed) return;

setError(null);

try {
  await api.adminDeleteHeroSlide(slide.id);
  await fetchSlides();
  showSuccess('تم حذف السلايد.');
} catch (err: any) {
  setError(err?.message || 'فشل حذف السلايد.');
}
```

};

const handleToggleActive = async (slide: HeroSlide) => {
setError(null);

```
try {
  await api.adminUpdateHeroSlide(slide.id, {
    is_active: !slide.is_active,
  });

  setSlides((previous) =>
    previous.map((item) =>
      item.id === slide.id
        ? { ...item, is_active: !item.is_active }
        : item
    )
  );

  showSuccess(
    slide.is_active
      ? 'تم إخفاء السلايد.'
      : 'تم تفعيل السلايد.'
  );
} catch (err: any) {
  setError(err?.message || 'فشل تغيير حالة السلايد.');
}
```

};

const moveSlide = async (
slide: HeroSlide,
direction: 'up' | 'down'
) => {
const sortedSlides = [...slides].sort(
(a, b) => a.sort_order - b.sort_order
);

```
const currentIndex = sortedSlides.findIndex(
  (item) => item.id === slide.id
);

if (currentIndex === -1) return;

const targetIndex =
  direction === 'up'
    ? currentIndex - 1
    : currentIndex + 1;

if (
  targetIndex < 0 ||
  targetIndex >= sortedSlides.length
) {
  return;
}

const reordered = [...sortedSlides];

const currentItem = reordered[currentIndex];
const targetItem = reordered[targetIndex];

reordered[currentIndex] = targetItem;
reordered[targetIndex] = currentItem;

const orderedSlides = reordered.map((item, index) => ({
  id: item.id,
  sort_order: index,
}));

setError(null);

try {
  await api.adminReorderHeroSlides(orderedSlides);

  setSlides(
    reordered.map((item, index) => ({
      ...item,
      sort_order: index,
    }))
  );

  showSuccess('تم تحديث ترتيب السلايدز.');
} catch (err: any) {
  setError(err?.message || 'فشل تغيير ترتيب السلايدز.');
}
```

};

const handleImageUpload = async (
e: React.ChangeEvent<HTMLInputElement>
) => {
const file = e.target.files?.[0];

```
if (!file) return;

setError(null);
setIsSaving(true);

try {
  const imageUrl = await uploadProductImage(file);

  updateField('image_url', imageUrl);

  showSuccess('تم رفع الصورة بنجاح.');
} catch (err: any) {
  setError(err?.message || 'فشل رفع الصورة.');
} finally {
  setIsSaving(false);
  e.target.value = '';
}
```

};

const sortedSlides = [...slides].sort(
(a, b) => a.sort_order - b.sort_order
);

if (isLoading) {
return ( <div className="p-16 text-center text-neutral-400 text-xs flex items-center justify-center gap-2"> <RefreshCw className="w-4 h-4 animate-spin" /> <span>جاري تحميل الـ Hero Slider...</span> </div>
);
}

return ( <div className="space-y-6 max-w-6xl mx-auto pb-12"> <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-16 z-20 bg-[#09090b]/95 backdrop-blur-md py-4 border-b border-neutral-800"> <div> <h1 className="text-xl sm:text-2xl font-bold text-white">
إدارة الـ Hero Slider </h1>

```
      <p className="text-xs text-neutral-400 mt-1">
        إضافة وتعديل وترتيب وإخفاء سلايدز الصفحة الرئيسية.
      </p>
    </div>

    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={fetchSlides}
        className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
        title="تحديث"
      >
        <RefreshCw className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={openCreateForm}
        className="py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-black text-xs transition-all shadow-lg flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        <span>إضافة سلايد</span>
      </button>
    </div>
  </div>

  {successMsg && (
    <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 flex items-center gap-2.5 text-xs text-emerald-200">
      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
      <span>{successMsg}</span>
    </div>
  )}

  {error && (
    <div className="p-4 rounded-xl bg-red-950/80 border border-red-800 flex items-center gap-2.5 text-xs text-red-200">
      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
      <span>{error}</span>
    </div>
  )}

  {sortedSlides.length === 0 && (
    <div className="p-12 rounded-2xl bg-[#0f0f13] border border-neutral-800 text-center">
      <ImageIcon className="w-10 h-10 mx-auto text-neutral-600 mb-3" />

      <h2 className="text-white font-bold text-sm mb-2">
        لا توجد سلايدز حاليًا
      </h2>

      <p className="text-xs text-neutral-500 mb-5">
        أضف أول سلايد ليظهر في الصفحة الرئيسية.
      </p>

      <button
        type="button"
        onClick={openCreateForm}
        className="py-2.5 px-5 rounded-xl bg-white text-black text-xs font-bold"
      >
        إضافة أول سلايد
      </button>
    </div>
  )}

  <div className="space-y-4">
    {sortedSlides.map((slide, index) => (
      <div
        key={slide.id}
        className={`rounded-2xl bg-[#0f0f13] border overflow-hidden transition-colors ${
          slide.is_active
            ? 'border-neutral-800'
            : 'border-red-900/40 opacity-70'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr]">
          <div className="relative aspect-[16/9] lg:aspect-auto bg-neutral-900 min-h-[170px]">
            {slide.image_url ? (
              <img
                src={slide.image_url}
                alt={slide.subtitle_ar || 'Hero Slide'}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
                <ImageIcon className="w-10 h-10" />
              </div>
            )}

            <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-[10px] text-white font-bold">
              #{index + 1}
            </div>

            {!slide.is_active && (
              <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-red-950/90 border border-red-800 text-[10px] text-red-200 font-bold">
                مخفي
              </div>
            )}
          </div>

          <div className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-black text-white">
                  {slide.title_line1_ar}
                </h2>

                {slide.title_line2_ar && (
                  <h3 className="text-lg font-black text-neutral-400">
                    {slide.title_line2_ar}
                  </h3>
                )}

                {slide.subtitle_ar && (
                  <p className="text-xs text-neutral-300 mt-2">
                    {slide.subtitle_ar}
                  </p>
                )}

                {slide.description_ar && (
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                    {slide.description_ar}
                  </p>
                )}

                {slide.button_text_ar && (
                  <div className="inline-flex mt-3 px-3 py-1.5 rounded-lg bg-white text-black text-[10px] font-bold">
                    {slide.button_text_ar}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => moveSlide(slide, 'up')}
                  disabled={index === 0}
                  className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  title="تحريك لأعلى"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => moveSlide(slide, 'down')}
                  disabled={index === sortedSlides.length - 1}
                  className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  title="تحريك لأسفل"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleActive(slide)}
                  className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
                  title={slide.is_active ? 'إخفاء' : 'تفعيل'}
                >
                  {slide.is_active ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => openEditForm(slide)}
                  className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
                  title="تعديل"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(slide)}
                  className="p-2 rounded-lg bg-red-950/40 border border-red-900/50 text-red-300 hover:text-white hover:bg-red-900/60"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-800 flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-neutral-500">
              <span>
                الترتيب: {slide.sort_order + 1}
              </span>

              <span dir="ltr">
                {slide.button_link}
              </span>

              {slide.title_line1_en && (
                <span>
                  EN: {slide.title_line1_en}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>

  {isFormOpen && (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto">
      <form
        onSubmit={handleSave}
        className="w-full max-w-4xl my-4 sm:my-8 rounded-2xl bg-[#0f0f13] border border-neutral-800 shadow-2xl"
      >
        <div className="sticky top-0 z-10 px-5 py-4 bg-[#0f0f13]/95 backdrop-blur-md border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              {editingSlideId
                ? 'تعديل السلايد'
                : 'إضافة سلايد جديد'}
            </h2>

            <p className="text-[10px] text-neutral-500 mt-1">
              ارفع الصورة واكتب محتوى السلايد فقط.
            </p>
          </div>

          <button
            type="button"
            onClick={closeForm}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-white">
              صورة السلايد
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  رابط الصورة
                </label>

                <input
                  type="text"
                  value={form.image_url}
                  onChange={(e) =>
                    updateField('image_url', e.target.value)
                  }
                  dir="ltr"
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white font-mono"
                />

                <label className="mt-3 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold cursor-pointer">
                  <ImageIcon className="w-4 h-4" />

                  <span>
                    {isSaving
                      ? 'جاري رفع الصورة...'
                      : 'رفع صورة من الجهاز'}
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isSaving}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="aspect-video rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800">
                {form.image_url ? (
                  <img
                    src={form.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-600">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-neutral-800 pb-3">
              المحتوى العربي
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="العنوان - السطر الأول"
                value={form.title_line1_ar}
                onChange={(value) =>
                  updateField('title_line1_ar', value)
                }
                required
                dir="rtl"
              />

              <Field
                label="العنوان - السطر الثاني"
                value={form.title_line2_ar}
                onChange={(value) =>
                  updateField('title_line2_ar', value)
                }
                dir="rtl"
              />

              <Field
                label="العنوان الفرعي"
                value={form.subtitle_ar}
                onChange={(value) =>
                  updateField('subtitle_ar', value)
                }
                required
                dir="rtl"
              />

              <Field
                label="نص الزر"
                value={form.button_text_ar}
                onChange={(value) =>
                  updateField('button_text_ar', value)
                }
                dir="rtl"
              />
            </div>

            <TextAreaField
              label="الوصف"
              value={form.description_ar}
              onChange={(value) =>
                updateField('description_ar', value)
              }
              dir="rtl"
            />
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-neutral-800 pb-3">
              المحتوى الإنجليزي
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Title - Line 1"
                value={form.title_line1_en}
                onChange={(value) =>
                  updateField('title_line1_en', value)
                }
                dir="ltr"
              />

              <Field
                label="Title - Line 2"
                value={form.title_line2_en}
                onChange={(value) =>
                  updateField('title_line2_en', value)
                }
                dir="ltr"
              />

              <Field
                label="Subtitle"
                value={form.subtitle_en}
                onChange={(value) =>
                  updateField('subtitle_en', value)
                }
                dir="ltr"
              />

              <Field
                label="Button Text"
                value={form.button_text_en}
                onChange={(value) =>
                  updateField('button_text_en', value)
                }
                dir="ltr"
              />
            </div>

            <TextAreaField
              label="Description"
              value={form.description_en}
              onChange={(value) =>
                updateField('description_en', value)
              }
              dir="ltr"
            />
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-neutral-800 pb-3">
              إعدادات السلايد
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="رابط الزر"
                value={form.button_link}
                onChange={(value) =>
                  updateField('button_link', value)
                }
                dir="ltr"
                required
              />

              <label className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer">
                <span className="text-xs font-semibold text-neutral-200">
                  إظهار السلايد
                </span>

                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    updateField(
                      'is_active',
                      e.target.checked
                    )
                  }
                  className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-white accent-white cursor-pointer"
                />
              </label>
            </div>
          </section>
        </div>

        <div className="px-5 py-4 border-t border-neutral-800 flex flex-col sm:flex-row-reverse gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="py-2.5 px-6 rounded-xl bg-white hover:bg-neutral-200 text-black font-black text-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}

            <span>
              {isSaving
                ? 'جاري الحفظ...'
                : editingSlideId
                  ? 'حفظ التعديلات'
                  : 'إضافة السلايد'}
            </span>
          </button>

          <button
            type="button"
            onClick={closeForm}
            disabled={isSaving}
            className="py-2.5 px-6 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  )}
</div>
  
);
};

interface FieldProps {
label: string;
value: string;
onChange: (value: string) => void;
dir?: 'rtl' | 'ltr';
required?: boolean;
type?: 'text' | 'number';
}

const Field: React.FC<FieldProps> = ({
label,
value,
onChange,
dir = 'rtl',
required = false,
type = 'text',
}) => {
return ( <div> <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
{label}
{required && ( <span className="text-red-400 mr-1">*</span>
)} </label>

```
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    dir={dir}
    required={required}
    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors"
  />
</div>
```

);
};

interface TextAreaFieldProps {
label: string;
value: string;
onChange: (value: string) => void;
dir?: 'rtl' | 'ltr';
}

const TextAreaField: React.FC<TextAreaFieldProps> = ({
label,
value,
onChange,
dir = 'rtl',
}) => {
return ( <div> <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
{label} </label>

```
  <textarea
    rows={3}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    dir={dir}
    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-white transition-colors leading-relaxed resize-y"
  />
</div>
```

);
};
