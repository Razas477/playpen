import { CSSProperties, useEffect, useRef, useState } from 'react';
import { sanitizeImageUrl } from '../lib/storeDb';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  style?: CSSProperties;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackTitle,
  style,
}: ResilientImageProps) {
  const safeSrc = sanitizeImageUrl(src);
  const [hasError, setHasError] = useState(!safeSrc);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setHasError(!safeSrc);
    if (safeSrc && imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [safeSrc]);

  if (hasError || !safeSrc) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#E6EAE4] via-[#D7DDD5] to-[#D5DDD8] text-[#3C4B48] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="font-serif text-lg tracking-[0.22em] uppercase opacity-80">PLAYPEN</span>
        {fallbackTitle && (
          <span className="mt-1 text-xs tracking-wide opacity-70">{fallbackTitle}</span>
        )}
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={safeSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onLoad={() => setIsLoaded(true)}
      onError={() => setHasError(true)}
      style={style}
      className={`${className} transition-opacity duration-500 ease-out ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`}
      loading="lazy"
    />
  );
}
