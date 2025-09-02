import React, { useEffect, useRef, useState, useCallback } from 'react';

// Types for lazy loading
export interface LazyLoadOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  fallback?: string;
  placeholder?: string;
}

export interface LazyLoadImageOptions extends LazyLoadOptions {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Default options
const defaultOptions: LazyLoadOptions = {
  rootMargin: '50px',
  threshold: 0.1,
  fallback: '/images/placeholder.jpg',
  placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzkjY2EzYjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg=='
};

// Hook for lazy loading any element
export const useLazyLoad = (options: LazyLoadOptions = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        // Once visible, we can stop observing
        if (elementRef.current) {
          observer.unobserve(elementRef.current);
        }
      }
    });
  }, []);

  const observer = new IntersectionObserver(handleIntersection, {
    root: options.root || null,
    rootMargin: options.rootMargin || defaultOptions.rootMargin,
    threshold: options.threshold || defaultOptions.threshold,
  });

  useEffect(() => {
    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [observer]);

  const triggerLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  return {
    elementRef,
    isVisible,
    isLoaded,
    triggerLoad,
  };
};

// Hook specifically for lazy loading images
export const useLazyLoadImage = (options: LazyLoadImageOptions) => {
  const [imageSrc, setImageSrc] = useState<string>(options.placeholder || defaultOptions.placeholder!);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const { elementRef, isVisible, triggerLoad } = useLazyLoad({
    root: options.root,
    rootMargin: options.rootMargin,
    threshold: options.threshold,
  });

  const loadImage = useCallback(async () => {
    if (!options.src) return;

    setIsLoading(true);
    setHasError(false);

    try {
      // Create a new image to test loading
      const img = new Image();
      
      img.onload = () => {
        setImageSrc(options.src);
        setIsLoading(false);
        options.onLoad?.();
        triggerLoad();
      };

      img.onerror = () => {
        setImageSrc(options.fallback || defaultOptions.fallback!);
        setIsLoading(false);
        setHasError(true);
        options.onError?.();
      };

      img.src = options.src;
    } catch (error) {
      setImageSrc(options.fallback || defaultOptions.fallback!);
      setIsLoading(false);
      setHasError(true);
      options.onError?.();
    }
  }, [options.src, options.fallback, options.onLoad, options.onError, triggerLoad]);

  useEffect(() => {
    if (isVisible && !isLoading) {
      loadImage();
    }
  }, [isVisible, isLoading, loadImage]);

  return {
    elementRef,
    imageSrc,
    isLoading,
    hasError,
    isVisible,
    reload: loadImage,
  };
};

// Component for lazy loading images
export const LazyImage: React.FC<LazyLoadImageOptions & { 
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
}> = ({ 
  src, 
  alt, 
  className = '', 
  width, 
  height, 
  style,
  onLoad,
  onError,
  ...options 
}) => {
  const { elementRef, imageSrc, isLoading, hasError } = useLazyLoadImage({
    src,
    alt,
    className,
    onLoad,
    onError,
    ...options,
  });

  return (
    <img
      ref={elementRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoading ? 'animate-pulse' : ''} ${hasError ? 'opacity-50' : ''}`}
      width={width}
      height={height}
      style={style}
      loading="lazy"
    />
  );
};

// Hook for lazy loading content (like album lists)
export const useLazyLoadContent = (items: any[], pageSize: number = 12) => {
  const [visibleItems, setVisibleItems] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const startIndex = 0;
    const endIndex = pageSize;
    setVisibleItems(items.slice(startIndex, endIndex));
    setHasMore(items.length > pageSize);
  }, [items, pageSize]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const startIndex = 0;
      const endIndex = nextPage * pageSize;
      
      setVisibleItems(items.slice(startIndex, endIndex));
      setCurrentPage(nextPage);
      setHasMore(endIndex < items.length);
      setIsLoading(false);
    }, 300);
  }, [currentPage, hasMore, isLoading, items, pageSize]);

  const reset = useCallback(() => {
    setCurrentPage(1);
    setVisibleItems(items.slice(0, pageSize));
    setHasMore(items.length > pageSize);
    setIsLoading(false);
  }, [items, pageSize]);

  return {
    visibleItems,
    hasMore,
    isLoading,
    loadMore,
    reset,
    currentPage,
  };
};

// Utility function to preload critical images
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Utility function to preload multiple images
export const preloadImages = async (srcs: string[]): Promise<void> => {
  const promises = srcs.map(src => preloadImage(src));
  await Promise.allSettled(promises);
};

// Hook for infinite scroll with lazy loading
export const useInfiniteScroll = (
  loadMore: () => void,
  hasMore: boolean,
  isLoading: boolean,
  threshold: number = 100
) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !isLoading) {
            loadMore();
          }
        });
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0.1,
      }
    );

    observerRef.current = observer;

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMore, isLoading, threshold]);

  return { loadingRef };
};

// Export default for easy importing
export default {
  useLazyLoad,
  useLazyLoadImage,
  useLazyLoadContent,
  useInfiniteScroll,
  preloadImage,
  preloadImages,
  LazyImage,
};
