import { useState, useEffect, useCallback, useRef } from 'react';
import { trackImagePerformance, trackCacheHit } from '@/lib/performance';

interface UseLazyLoadWithPerformanceOptions {
  src: string;
  alt: string;
  threshold?: number;
  rootMargin?: string;
  enablePerformanceTracking?: boolean;
  preload?: boolean;
}

interface LazyLoadState {
  isVisible: boolean;
  isLoaded: boolean;
  isLoading: boolean;
  hasError: boolean;
  loadTime: number;
}

export const useLazyLoadWithPerformance = ({
  src,
  alt,
  threshold = 0.1,
  rootMargin = '50px',
  enablePerformanceTracking = true,
  preload = false,
}: UseLazyLoadWithPerformanceOptions) => {
  const [state, setState] = useState<LazyLoadState>({
    isVisible: false,
    isLoaded: false,
    isLoading: false,
    hasError: false,
    loadTime: 0,
  });

  const elementRef = useRef<HTMLDivElement>(null);
  const loadStartTime = useRef<number>(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Load image function
  const loadImage = useCallback(async () => {
    if (!src || state.isLoaded || state.isLoading) return;

    setState(prev => ({ ...prev, isLoading: true }));
    loadStartTime.current = performance.now();

    try {
      // Check if image is already cached
      const isCached = performance.getEntriesByType('resource').some(
        entry => entry.name === src
      );

      if (isCached && enablePerformanceTracking) {
        trackCacheHit(src, 0); // Size unknown for cached resources
      }

      // Create image element to test loading
      const img = new Image();
      
      img.onload = () => {
        const loadTime = performance.now() - loadStartTime.current;
        
        setState({
          isVisible: true,
          isLoaded: true,
          isLoading: false,
          hasError: false,
          loadTime,
        });

        // Track performance
        if (enablePerformanceTracking) {
          trackImagePerformance(src, loadTime, true);
        }
      };

      img.onerror = () => {
        const loadTime = performance.now() - loadStartTime.current;
        
        setState({
          isVisible: true,
          isLoaded: false,
          isLoading: false,
          hasError: true,
          loadTime,
        });

        // Track performance
        if (enablePerformanceTracking) {
          trackImagePerformance(src, loadTime, false);
        }
      };

      img.src = src;
    } catch (error) {
      const loadTime = performance.now() - loadStartTime.current;
      
      setState({
        isVisible: true,
        isLoaded: false,
        isLoading: false,
        hasError: true,
        loadTime,
      });

      // Track performance
      if (enablePerformanceTracking) {
        trackImagePerformance(src, loadTime, false);
      }
    }
  }, [src, state.isLoaded, state.isLoading, enablePerformanceTracking]);

  // Intersection observer setup
  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setState(prev => ({ ...prev, isVisible: true }));
            loadImage();
            
            // Stop observing once visible
            if (elementRef.current) {
              observer.unobserve(elementRef.current);
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current = observer;
    observer.observe(elementRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadImage, threshold, rootMargin]);

  // Preload if requested
  useEffect(() => {
    if (preload && src) {
      loadImage();
    }
  }, [preload, src, loadImage]);

  // Retry loading on error
  const retry = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasError: false,
      isLoading: false,
      isLoaded: false,
    }));
    loadImage();
  }, [loadImage]);

  // Force load (bypass intersection observer)
  const forceLoad = useCallback(() => {
    setState(prev => ({ ...prev, isVisible: true }));
    loadImage();
  }, [loadImage]);

  return {
    elementRef,
    state,
    retry,
    forceLoad,
    // Convenience getters
    isVisible: state.isVisible,
    isLoaded: state.isLoaded,
    isLoading: state.isLoading,
    hasError: state.hasError,
    loadTime: state.loadTime,
  };
};

// Hook for managing multiple images with performance tracking
export const useLazyLoadMultipleImages = (
  images: Array<{ src: string; alt: string }>,
  options: {
    batchSize?: number;
    enablePerformanceTracking?: boolean;
    preloadFirst?: boolean;
  } = {}
) => {
  const {
    batchSize = 6,
    enablePerformanceTracking = true,
    preloadFirst = true,
  } = options;

  const [visibleImages, setVisibleImages] = useState<typeof images>([]);
  const [currentBatch, setCurrentBatch] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with first batch
  useEffect(() => {
    const firstBatch = images.slice(0, batchSize);
    setVisibleImages(firstBatch);
  }, [images, batchSize]);

  // Load next batch
  const loadNextBatch = useCallback(() => {
    if (isLoading || visibleImages.length >= images.length) return;

    setIsLoading(true);
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      const nextBatch = currentBatch + 1;
      const startIndex = 0;
      const endIndex = nextBatch * batchSize;
      
      const newImages = images.slice(startIndex, endIndex);
      setVisibleImages(newImages);
      setCurrentBatch(nextBatch);
      setIsLoading(false);
    }, 300);
  }, [currentBatch, isLoading, images, batchSize, visibleImages.length]);

  // Reset to initial state
  const reset = useCallback(() => {
    setCurrentBatch(1);
    setVisibleImages(images.slice(0, batchSize));
    setIsLoading(false);
  }, [images, batchSize]);

  return {
    visibleImages,
    hasMore: visibleImages.length < images.length,
    isLoading,
    loadNextBatch,
    reset,
    currentBatch,
    totalImages: images.length,
    loadedCount: visibleImages.length,
  };
};

// Hook for infinite scroll with performance tracking
export const useInfiniteScrollWithPerformance = (
  loadMore: () => void,
  hasMore: boolean,
  isLoading: boolean,
  options: {
    threshold?: number;
    rootMargin?: string;
    enablePerformanceTracking?: boolean;
  } = {}
) => {
  const {
    threshold = 100,
    rootMargin = '0px',
    enablePerformanceTracking = true,
  } = options;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !isLoading) {
            // Track scroll-triggered load
            if (enablePerformanceTracking) {
              trackImagePerformance('scroll-trigger', 0, true);
            }
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
  }, [loadMore, hasMore, isLoading, threshold, enablePerformanceTracking]);

  return { loadingRef };
};

export default useLazyLoadWithPerformance;
