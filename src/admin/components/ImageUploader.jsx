import { useEffect, useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import imageFallback from '../../assets/image-fallback.svg';

export default function ImageUploader({ label, hint, dimensions, initialUrl, onChange, required }) {
  const [preview, setPreview] = useState(initialUrl || null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const objectUrlRef = useRef(null);
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

  return (
    <label className="block cursor-pointer">
      <span className="mb-1.5 block text-sm font-semibold text-cocoa">
        {label} {required && <span className="text-rose-deep">*</span>}
      </span>
      <div className="flex items-center gap-4 rounded-2xl border border-dashed border-blush bg-blush-soft/40 p-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
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
        </div>
        <div className="text-xs text-cocoa-soft">
          <p>Click to {preview ? 'replace' : 'upload'} an image</p>
          {recommendedSize && <p className="mt-0.5 text-cocoa-soft/70">Recommended Size: {recommendedSize}</p>}
          <p className="mt-0.5 text-cocoa-soft/70">Formats: JPG, PNG, WEBP · Max Size: 5 MB</p>
        </div>
      </div>
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
    </label>
  );
}
