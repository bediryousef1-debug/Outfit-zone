import { createClient, SupabaseClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Detect if an external remote Supabase project is configured with valid non-placeholder keys
export const hasRemoteSupabase = Boolean(
  envUrl &&
  envKey &&
  !envUrl.includes('your-project') &&
  !envKey.includes('your-anon')
);

export const supabaseUrl: string = hasRemoteSupabase ? envUrl : '';
export const supabaseAnonKey: string = hasRemoteSupabase ? envKey : '';

export const isSupabaseConfigured: boolean = hasRemoteSupabase;

export const supabase: SupabaseClient | null = hasRemoteSupabase
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

const MAX_IMAGE_DIMENSION = 1800;
const MAX_IMAGE_BYTES = 900 * 1024;

/**
 * Convert admin-selected images to optimized WebP in the browser before upload.
 * This avoids paid server-side image transformations and keeps originals untouched.
 */
export async function optimizeImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('يرجى اختيار ملف صورة صالح.');
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('تعذر قراءة الصورة. جرّب صورة أخرى.'));
    });

    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error('أبعاد الصورة غير صالحة.');
    }

    const scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / image.naturalWidth,
      MAX_IMAGE_DIMENSION / image.naturalHeight
    );
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('المتصفح لا يدعم معالجة الصور المطلوبة.');
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const toWebP = (quality: number) =>
      new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('فشل ضغط الصورة.'));
              return;
            }
            if (blob.type !== 'image/webp') {
              reject(new Error('المتصفح لا يدعم تحويل الصور إلى WebP. حدّث المتصفح ثم حاول مرة أخرى.'));
              return;
            }
            resolve(blob);
          },
          'image/webp',
          quality
        );
      });

    let blob = await toWebP(0.82);

    if (blob.size > MAX_IMAGE_BYTES) {
      blob = await toWebP(0.68);
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${baseName}.webp`, {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Upload optimized WebP images to the existing public Supabase Storage bucket 'site-images'.
 * Every uploaded image is converted and compressed in the browser before upload.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const optimizedFile = await optimizeImageForUpload(file);

  if (isSupabaseConfigured && supabase) {
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.webp`;
    const filePath = `products/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('site-images')
        .upload(filePath, optimizedFile, {
          cacheControl: '31536000',
          contentType: 'image/webp',
          upsert: false,
        });

      if (!uploadError) {
        const { data } = supabase.storage.from('site-images').getPublicUrl(filePath);
        if (data?.publicUrl) {
          return data.publicUrl;
        }
      } else {
        console.warn('Supabase image upload failed:', uploadError.message);
      }
    } catch (error) {
      console.warn('Supabase image upload failed:', error);
    }
  }

  // Fallback to the existing server upload route, still sending only the optimized WebP file.
  try {
    const token = localStorage.getItem('oz_admin_token') || '';
    const formData = new FormData();
    formData.append('file', optimizedFile, optimizedFile.name);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (res.ok) {
      const json = await res.json();
      if (json?.url) {
        return json.url;
      }
      throw new Error('لم يتم استلام رابط صالح للصورة بعد الرفع.');
    }

    const response = await res.json().catch(() => ({}));
    throw new Error(response?.error || 'فشل رفع الصورة إلى التخزين.');
  } catch (error) {
    if (error instanceof Error && error.message !== 'Failed to fetch') {
      throw error;
    }
  }

  // Never silently store a large base64 data URL in product or CMS records.
  throw new Error('تعذر رفع الصورة إلى التخزين. تأكد من اتصال الإنترنت وصلاحيات الأدمن ثم حاول مرة أخرى.');
}
