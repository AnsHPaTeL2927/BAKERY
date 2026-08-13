import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import imageFallback from '../../assets/image-fallback.svg';

export default function ImageUploader({ label, hint, dimensions, initialUrl, onChange, onRemove, required }) {
  const [preview, setPreview] = useState(initialUrl || null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const objectUrlRef = useRef(null);
  const inputRef = useRef(null);
  const recommendedSize = dimensions || hint;

  useEffect(() => {
    setPreview(initialUrl || null);
    setPreviewFailed(false);
  }, [initialUrl]);

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [],
  );

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPreview(url);
    setPreviewFailed(false);
    onChange(file);
  }

  function handleRemoveClick(e) {
    // Stop the click from bubbling up to the wrapping <label>, which would
    // otherwise re-open the file picker as soon as we clear the preview.
    e.preventDefault();
    e.stopPropagation();

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    if (inputRef.current) inputRef.current.value = '';
    setPreview(null);
    setPreviewFailed(false);
    onRemove?.();
  }

  return (
    <label className="block cursor-pointer">
      <span className="mb-1.5 block text-sm font-semibold text-cocoa">
        {label} {required && <span className="text-rose-deep">*</span>}
      </span>
      <div className="flex items-center gap-4 rounded-2xl border border-dashed border-blush bg-blush-soft/40 p-4">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
          {preview ? (
            <img
              src={previewFailed ? imageFallback : preview}
              alt="Preview"
              className="h-full w-full object-cover"
              onError={() => setPreviewFailed(true)}
            />
          ) : (
            <ImagePlus className="h-6 w-6 text-cocoa-soft/50" />
          )}
          {preview && onRemove && (
            <button
              type="button"
              onClick={handleRemoveClick}
              title={`Remove ${label || 'image'}`}
              aria-label={`Remove ${label || 'image'}`}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-cocoa/70 text-white transition-colors hover:bg-rose-deep"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="text-xs text-cocoa-soft">
          <p>Click to {preview ? 'replace' : 'upload'} an image</p>
          {recommendedSize && <p className="mt-0.5 text-cocoa-soft/70">Recommended Size: {recommendedSize}</p>}
          <p className="mt-0.5 text-cocoa-soft/70">Formats: JPG, PNG, WEBP · Max Size: 5 MB</p>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
    </label>
  );
}
