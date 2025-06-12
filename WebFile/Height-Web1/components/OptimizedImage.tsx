// components/OptimizedImage.tsx
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  quality?: number;
  lazy?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  placeholder = 'blur',
  blurDataURL,
  quality = 75,
  lazy = true,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(!lazy || priority);
  const imageRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Local intersection observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || !imageRef.current) {
      setShouldLoad(true);
      return;
    }

    const handleIntersection: IntersectionObserverCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry: IntersectionObserverEntry) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          if (observerRef.current && imageRef.current) {
            observerRef.current.unobserve(imageRef.current);
          }
        }
      });
    };

    observerRef.current = new window.IntersectionObserver(handleIntersection, {
      rootMargin: '50px',
      threshold: 0.01,
    });

    if (imageRef.current) {
      observerRef.current.observe(imageRef.current);
    }

    return () => {
      if (observerRef.current && imageRef.current) {
        observerRef.current.unobserve(imageRef.current);
      }
    };
  }, [lazy, priority]);

  // Generate low quality placeholder
  const generateBlurDataURL = () => {
    if (blurDataURL) return blurDataURL;
    // Simple base64 placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==';
  };

  return (
    <div ref={imageRef} className={`relative ${className}`}>
      {shouldLoad ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={generateBlurDataURL()}
          onLoadingComplete={() => setIsLoaded(true)}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : (
        <div
          className="bg-gray-200 animate-pulse"
          style={{
            width: width || '100%',
            height: height || '100%',
            aspectRatio: width && height ? `${width}/${height}` : undefined,
          }}
        />
      )}
    </div>
  );
}

// components/ProgressiveImage.tsx
// Only import useState and useEffect once at the top

interface ProgressiveImageProps {
  lowQualitySrc: string;
  highQualitySrc: string;
  alt: string;
  className?: string;
}

export function ProgressiveImage({
  lowQualitySrc,
  highQualitySrc,
  alt,
  className = '',
}: ProgressiveImageProps) {
  const [imageSrc, setImageSrc] = useState(lowQualitySrc);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const img = new window.Image();
    img.src = highQualitySrc;

    img.onload = () => {
      setImageSrc(highQualitySrc);
      setIsLoading(false);
    };

    return () => {
      img.onload = null;
    };
  }, [highQualitySrc]);

  return (
    <div className={`relative ${className}`}>
      <img
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-500 ${
          isLoading ? 'filter blur-sm scale-105' : 'filter-none scale-100'
        }`}
      />
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-gray-200 bg-opacity-50" />
      )}
    </div>
  );
}