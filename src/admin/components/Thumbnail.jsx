import { useState } from 'react';
import imageFallback from '../../assets/image-fallback.svg';

export default function Thumbnail({ src, alt }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="h-12 w-12 overflow-hidden rounded-xl bg-blush-soft">
      {src ? (
        <img
          src={failed ? imageFallback : src}
          alt={alt || ''}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <img src={imageFallback} alt={alt || ''} className="h-full w-full object-cover opacity-70" />
      )}
    </div>
  );
}
