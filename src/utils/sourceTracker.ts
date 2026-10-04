/**
 * Outfit Zone - Marketing & Order Source Tracker
 *
 * Detects visitor channel via:
 * 1. UTM parameters (?utm_source=facebook, etc.)
 * 2. Ad click identifiers (fbclid, igshid, ttclid, gclid)
 * 3. HTTP Document Referrer (facebook.com, instagram.com, tiktok.com, google.com)
 * 4. Fallback: 'Direct' (مباشر)
 */

const STORAGE_KEY = 'outfit_zone_order_source';

export function normalizeSourceName(raw: string | null | undefined): string {
  if (!raw) return 'Direct';

  const clean = raw.trim().toLowerCase();

  if (clean.includes('fb') || clean.includes('facebook')) {
    return 'Facebook';
  }
  if (clean.includes('ig') || clean.includes('instagram')) {
    return 'Instagram';
  }
  if (clean.includes('tt') || clean.includes('tiktok')) {
    return 'TikTok';
  }
  if (clean.includes('google') || clean.includes('gclid') || clean.includes('organic')) {
    return 'Google';
  }
  if (clean.includes('snap') || clean.includes('snapchat')) {
    return 'Snapchat';
  }
  if (clean.includes('twitter') || clean.includes('x.com')) {
    return 'X (Twitter)';
  }
  if (clean === 'direct' || clean === 'none' || clean === '') {
    return 'Direct';
  }

  // Capitalize custom source name nicely
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function initSourceTracker(): string {
  if (typeof window === 'undefined') return 'Direct';

  try {
    // If already stored in current session, return existing
    const existing = sessionStorage.getItem(STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const searchParams = new URLSearchParams(window.location.search);

    // 1. Check explicit UTM source
    const utmSource =
      searchParams.get('utm_source') ||
      searchParams.get('source') ||
      searchParams.get('ref');

    if (utmSource) {
      const normalized = normalizeSourceName(utmSource);
      sessionStorage.setItem(STORAGE_KEY, normalized);
      return normalized;
    }

    // 2. Check ad click query parameters
    if (searchParams.has('fbclid')) {
      const source = 'Facebook';
      sessionStorage.setItem(STORAGE_KEY, source);
      return source;
    }
    if (searchParams.has('igshid')) {
      const source = 'Instagram';
      sessionStorage.setItem(STORAGE_KEY, source);
      return source;
    }
    if (searchParams.has('ttclid')) {
      const source = 'TikTok';
      sessionStorage.setItem(STORAGE_KEY, source);
      return source;
    }
    if (searchParams.has('gclid')) {
      const source = 'Google';
      sessionStorage.setItem(STORAGE_KEY, source);
      return source;
    }

    // 3. Check document referrer
    const referrer = document.referrer ? document.referrer.toLowerCase() : '';
    if (referrer) {
      if (referrer.includes('facebook.com') || referrer.includes('fb.me')) {
        sessionStorage.setItem(STORAGE_KEY, 'Facebook');
        return 'Facebook';
      }
      if (referrer.includes('instagram.com')) {
        sessionStorage.setItem(STORAGE_KEY, 'Instagram');
        return 'Instagram';
      }
      if (referrer.includes('tiktok.com')) {
        sessionStorage.setItem(STORAGE_KEY, 'TikTok');
        return 'TikTok';
      }
      if (referrer.includes('google.')) {
        sessionStorage.setItem(STORAGE_KEY, 'Google');
        return 'Google';
      }
    }

    // Default to Direct
    sessionStorage.setItem(STORAGE_KEY, 'Direct');
    return 'Direct';
  } catch (err) {
    console.warn('[Source Tracker] Notice initializing source tracker:', err);
    return 'Direct';
  }
}

export function getOrderSource(): string {
  if (typeof window === 'undefined') return 'Direct';
  try {
    return sessionStorage.getItem(STORAGE_KEY) || initSourceTracker();
  } catch {
    return 'Direct';
  }
}
