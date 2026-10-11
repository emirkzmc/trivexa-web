import { useState, useEffect, useRef, type ImgHTMLAttributes } from 'react';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  lazy?: boolean;
  sizes?: string;
  srcSet?: string;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized Image Component
 *
 * Features:
 * - Lazy loading with Intersection Observer
 * - Responsive images with srcset
 * - WebP support with fallback
 * - Loading placeholder
 * - Error fallback
 *
 * Usage:
 * ```tsx
 * <OptimizedImage
 *   src="/images/hero.jpg"
 *   alt="Hero image"
 *   width={800}
 *   height={600}
 *   lazy
 *   sizes="(max-width: 768px) 100vw, 50vw"
 * />
 * ```
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  lazy = true,
  sizes,
  srcSet,
  fallback = '/images/placeholder.png',
  className = '',
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(lazy ? undefined : src);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!lazy || !imgRef.current) {
      setCurrentSrc(src);
      return;
    }

    // Intersection Observer for lazy loading
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setCurrentSrc(src);
            if (observerRef.current && imgRef.current) {
              observerRef.current.unobserve(imgRef.current);
            }
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, lazy]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setHasError(true);
    setCurrentSrc(fallback);
    if (onError) onError();
  };

  const aspectRatio = width && height ? (height / width) * 100 : undefined;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        paddingBottom: aspectRatio ? `${aspectRatio}%` : undefined,
        backgroundColor: isLoaded ? 'transparent' : '#f3f4f6',
      }}
    >
      {/* Loading placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse bg-gray-300 w-full h-full" />
        </div>
      )}

      {/* Image */}
      <img
        ref={imgRef}
        src={currentSrc}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={lazy ? 'lazy' : 'eager'}
        onLoad={handleLoad}
        onError={handleError}
        className={`
          ${aspectRatio ? 'absolute inset-0' : ''}
          w-full h-full object-cover
          transition-opacity duration-300
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
        `}
        {...props}
      />

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs">Resim yüklenemedi</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Avatar Image Component
 * Optimized for profile pictures with circular crop
 */
export function AvatarImage({
  src,
  alt,
  size = 40,
  fallbackInitial,
  className = '',
}: {
  src?: string;
  alt: string;
  size?: number;
  fallbackInitial?: string;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`
          flex items-center justify-center
          bg-blue-500 text-white font-semibold
          rounded-full
          ${className}
        `}
        style={{ width: size, height: size, fontSize: size / 2.5 }}
      >
        {fallbackInitial || alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      onError={() => setHasError(true)}
      className={`rounded-full object-cover ${className}`}
      loading="lazy"
    />
  );
}

/**
 * Background Image Component
 * Optimized for hero sections and backgrounds
 */
export function BackgroundImage({
  src,
  alt,
  children,
  overlay = false,
  overlayOpacity = 0.5,
  className = '',
}: {
  src: string;
  alt: string;
  children?: React.ReactNode;
  overlay?: boolean;
  overlayOpacity?: number;
  className?: string;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background image */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className={`
          absolute inset-0 w-full h-full object-cover
          transition-opacity duration-500
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
        `}
        loading="lazy"
      />

      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Overlay */}
      {overlay && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Content */}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}
