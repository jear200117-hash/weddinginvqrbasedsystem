import React, { useState, useEffect, useRef } from 'react';
import { Image, Loader2 } from 'lucide-react';

interface LazyAlbumImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  showLoadingState?: boolean;
  fallbackIcon?: React.ReactNode;
}

export const LazyAlbumImage: React.FC<LazyAlbumImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  style,
  onLoad,
  onError,
  showLoadingState = true,
  fallbackIcon,
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Only log in development mode
            if (process.env.NODE_ENV === 'development') {
              console.log('LazyAlbumImage became visible:', { src: src.substring(0, 50) + '...', alt });
            }
            setIsVisible(true);
            // Stop observing once visible
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Reduced from 100px to 50px for better performance
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [src, alt]);

  const handleImageLoad = () => {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('LazyAlbumImage loaded successfully:', { src: src.substring(0, 50) + '...', alt });
    }
    setIsImageLoaded(true);
    onLoad?.();
  };

  const handleImageError = () => {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.error('LazyAlbumImage failed to load:', { src: src.substring(0, 50) + '...', alt });
    }
    setHasImageError(true);
    onError?.();
  };

  // Custom fallback for album images
  const albumFallback = fallbackIcon || (
    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-rose-100 to-pink-100 rounded-lg">
      <Image className="text-rose-400" size={32} />
    </div>
  );

  // If there's an error, show fallback
  if (hasImageError) {
    return (
      <div 
        className={`${className} flex items-center justify-center bg-gradient-to-br from-rose-100 to-pink-100 rounded-lg`}
        style={{ width, height, ...style }}
      >
        {albumFallback}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Loading state */}
      {showLoadingState && !isImageLoaded && (
        <div 
          className={`${className} flex items-center justify-center bg-gradient-to-br from-rose-100 to-pink-100 rounded-lg animate-pulse`}
          style={{ width, height, ...style }}
        >
          <Loader2 className="text-rose-400 animate-spin" size={24} />
        </div>
      )}

      {/* Lazy loaded image */}
      {isVisible && (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-500`}
          width={width}
          height={height}
          style={{
            ...style,
            opacity: isImageLoaded ? 1 : 0,
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}
    </div>
  );
};

// Optimized version for grid layouts
export const LazyAlbumImageGrid: React.FC<LazyAlbumImageProps & {
  aspectRatio?: 'square' | 'video' | 'auto';
  gridClassName?: string;
}> = ({
  aspectRatio = 'square',
  gridClassName = '',
  ...props
}) => {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: '',
  };

  return (
    <LazyAlbumImage
      {...props}
      className={`${aspectClasses[aspectRatio]} ${gridClassName} w-full h-full object-cover rounded-lg`}
    />
  );
};

// Hook for managing multiple album images
type AlbumItem = { src: string; alt?: string };

export const useLazyAlbumImages = (
  images: AlbumItem[],
  options?: { batchSize?: number; preloadFirst?: boolean }
) => {
  const batchSize = options?.batchSize ?? 6;
  const preloadFirst = options?.preloadFirst ?? true;

  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [visibleImages, setVisibleImages] = useState<AlbumItem[]>([]);
  const [currentBatch, setCurrentBatch] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const loadNextBatch = () => {
    if (isLoading) return;
    setIsLoading(true);
    const startIndex = (currentBatch - 1) * batchSize;
    const endIndex = currentBatch * batchSize;
    const newImages = images.slice(startIndex, endIndex);
    setVisibleImages(prev => [...prev, ...newImages]);
    setCurrentBatch(prev => prev + 1);
    setIsLoading(false);
  };

  const markImageLoaded = (src: string) => {
    setLoadedImages(prev => new Set([...prev, src]));
  };

  const reset = () => {
    setLoadedImages(new Set());
    setVisibleImages(images.slice(0, batchSize));
    setCurrentBatch(1);
  };

  // Initialize with first batch
  React.useEffect(() => {
    if (preloadFirst) {
      setVisibleImages(images.slice(0, batchSize));
    } else {
      setVisibleImages([]);
    }
    setCurrentBatch(preloadFirst ? 2 : 1);
  }, [images, batchSize, preloadFirst]);

  return {
    loadedImages,
    visibleImages,
    hasMore: visibleImages.length < images.length,
    loadNextBatch,
    markImageLoaded,
    reset,
    loadingProgress: images.length === 0 ? 0 : (loadedImages.size / images.length) * 100,
    isLoading,
    totalImages: images.length,
    loadedCount: loadedImages.size,
  };
};

export default LazyAlbumImage;
