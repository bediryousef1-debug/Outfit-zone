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

/**
 * Upload image to Supabase Storage bucket 'product-images'
 */
export async function uploadProductImage(file: File): Promise<string> {
  if (isSupabaseConfigured && supabase) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (!uploadError) {
        const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
        if (data?.publicUrl) {
          return data.publicUrl;
        }
      }
    } catch {
      // Fall back to server upload route
    }
  }

  // Fallback 1: Try server-side upload endpoint
  try {
    const token = localStorage.getItem('oz_admin_token') || '';
    const formData = new FormData();
    formData.append('file', file);

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
    }
  } catch {
    // Fall back to FileReader data URL
  }

  // Fallback 2: Read as data URL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(file);
  });
}
