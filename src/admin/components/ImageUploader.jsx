import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X, AlertCircle } from 'lucide-react';
import imageFallback from '../../assets/image-fallback.svg';

// Mirrors server/middleware/upload.js. Checking here too means the common
// mistakes are caught instantly instead of after a full upload round-trip —
// the `accept` attribute alone is not enough, since every OS file picker lets
// you switch it to "All files".
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 4 * 1024 * 1024;

const FORMAT_NAMES = {
  'image/avif': 'AVIF images',
  'image/heic': 'HEIC images',
  'image/heif': 'HEIF images',
  'image/gif': 'GIF images',
  'image/bmp': 'BMP images',
  'image/tiff': 'TIFF images',
  'image/svg+xml': 'SVG files',
  'application/pdf': 'PDF files',
};

function describeFormat(file) {
  const known = FORMAT_NAMES[file.type];
  if (known) return `${known} are`;

  const ext = file.name?.includes('.') ? file.name.split('.').pop().toUpperCase() : '';
  if (ext) return `${ext} files are`;

  return 'That file type is';
}

function validateImage(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `${describeFormat(file)} not supported. Please upload a JPG, PNG, or WEBP image instead.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `This image is ${mb}MB, over the 4MB limit. Please compress it or choose a smaller file.`;
  }
  return null;
}

export default function ImageUploader({ label, hint, dimensions, initialUrl, onChange, onRemove, required }) {
  const [preview, setPreview] = useState(initialUrl || null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [error, setError] = useState('');
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

    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError);
      // Clear the input so re-picking the *same* file still fires onChange —
      // otherwise a corrected re-selection of an identical name looks ignored.
      e.target.value = '';
      return;
    }
    setError('');

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
    setError('');
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
          <p className="mt-0.5 text-cocoa-soft/70">Formats: JPG, PNG, WEBP · Max Size: 4 MB</p>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs text-admin-danger">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
    </label>
  );
}
