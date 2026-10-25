import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, Check, Loader2, Link, Image as ImageIcon } from 'lucide-react';
import { uploadProductImage } from '../../lib/supabase';

interface AdminImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
  className?: string;
}

export const AdminImageUpload: React.FC<AdminImageUploadProps> = ({
  value = '',
  onChange,
  label = 'صورة',
  helperText,
  aspectRatio = 'portrait',
  className = '',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = previewUrl || value;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validation
    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة صالح (JPG, PNG, WEBP, SVG).');
      return;
    }

    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`حجم الصورة كبير جدًا. الحد الأقصى المسموح به هو ${MAX_SIZE_MB} ميجابايت.`);
      return;
    }

    setError(null);

    // 2. Safe local preview
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setIsUploading(true);

    try {
      // 3. Upload to Storage
      const uploadedUrl = await uploadProductImage(file);
      if (!uploadedUrl) {
        throw new Error('لم يتم استلام رابط صالح للصورة بعد الرفع.');
      }

      // 4. Save new URL only on success
      onChange(uploadedUrl);
      setPreviewUrl(null);
      setError(null);
    } catch (err: any) {
      console.error('Image upload failed:', err);
      // Revert preview on failure to prevent losing reference to old image
      setPreviewUrl(null);
      setError(err?.message || 'تعذر رفع الصورة من جهازك حاليًا. تم الاحتفاظ بالصورة السابقة.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearImage = () => {
    if (window.confirm('هل تريد إزالة هذه الصورة؟')) {
      setPreviewUrl(null);
      onChange('');
    }
  };

  const handleManualUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;
    onChange(manualUrl.trim());
    setManualUrl('');
    setShowUrlInput(false);
    setError(null);
  };

  const aspectClass =
    aspectRatio === 'video'
      ? 'aspect-[16/9]'
      : aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'portrait'
      ? 'aspect-[3/4]'
      : 'min-h-[160px]';

  return (
    <div className={`space-y-2 text-right ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-300 block">{label}</label>
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[11px] text-neutral-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Link className="w-3 h-3" />
            <span>{showUrlInput ? 'إخفاء إدخال الرابط' : 'إدخال رابط يدويًا'}</span>
          </button>
        </div>
      )}

      {/* Manual URL input fallback if needed */}
      {showUrlInput && (
        <form onSubmit={handleManualUrlSubmit} className="flex gap-2 mb-2">
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-white focus:outline-none font-mono"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            حفظ
          </button>
        </form>
      )}

      {/* Main Upload Box */}
      <div className="relative rounded-2xl border-2 border-dashed border-neutral-800 bg-neutral-950/60 p-3 overflow-hidden group hover:border-neutral-700 transition-colors">
        {displayUrl ? (
          <div className="relative flex flex-col items-center">
            {/* Preview image */}
            <div className={`w-full max-w-xs rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 relative ${aspectClass}`}>
              <img
                src={displayUrl}
                alt="معاينة الصورة"
                className="w-full h-full object-cover"
              />

              {isUploading && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                  <span className="font-bold">جاري رفع الصورة...</span>
                </div>
              )}
            </div>

            {/* Actions under preview */}
            <div className="flex items-center gap-2 mt-3 w-full justify-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="py-1.5 px-3.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>تغيير الصورة من الجهاز</span>
              </button>

              <button
                type="button"
                onClick={handleClearImage}
                disabled={isUploading}
                className="p-1.5 rounded-lg bg-red-950/50 hover:bg-red-900 border border-red-800 text-red-200 text-xs transition-colors cursor-pointer disabled:opacity-50"
                title="إزالة الصورة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Empty state: Large friendly file picker */
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className="py-8 px-4 flex flex-col items-center justify-center gap-3 cursor-pointer text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:border-neutral-600 transition-colors shadow-inner">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-bold text-white">
                {isUploading ? 'جاري رفع الصورة...' : 'اضغط لاختيار صورة من هاتفك أو جهازك'}
              </p>
              <p className="text-[11px] text-neutral-500">
                JPG وPNG وWebP وSVG حتى 10 ميجابايت — يتم التحويل إلى WebP مضغوط قبل الرفع
              </p>
            </div>

            <button
              type="button"
              disabled={isUploading}
              className="mt-1 py-2 px-5 bg-white text-black hover:bg-neutral-200 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>اختر ملف الصورة</span>
            </button>
          </div>
        )}

        {/* Hidden Native File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/jpg,image/svg+xml"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
          aria-label={label}
        />
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {helperText && !error && (
        <p className="text-[10px] text-neutral-500">{helperText}</p>
      )}
    </div>
  );
};
