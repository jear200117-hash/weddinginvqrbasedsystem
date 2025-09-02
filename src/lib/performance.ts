// Performance monitoring service for lazy loading
export interface PerformanceMetrics {
  imageLoadTime: number;
  totalImages: number;
  loadedImages: number;
  failedImages: number;
  averageLoadTime: number;
  totalBandwidth: number;
  cacheHitRate: number;
}

export interface ImageLoadEvent {
  src: string;
  loadTime: number;
  success: boolean;
  timestamp: number;
  size?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    imageLoadTime: 0,
    totalImages: 0,
    loadedImages: 0,
    failedImages: 0,
    averageLoadTime: 0,
    totalBandwidth: 0,
    cacheHitRate: 0,
  };

  private imageEvents: ImageLoadEvent[] = [];
  private startTime: number = Date.now();
  private cache = new Map<string, { timestamp: number; size: number }>();

  // Track image load event
  trackImageLoad(event: ImageLoadEvent) {
    this.imageEvents.push(event);
    
    if (event.success) {
      this.metrics.loadedImages++;
      this.metrics.imageLoadTime += event.loadTime;
      this.metrics.averageLoadTime = this.metrics.imageLoadTime / this.metrics.loadedImages;
      
      if (event.size) {
        this.metrics.totalBandwidth += event.size;
      }
    } else {
      this.metrics.failedImages++;
    }

    this.metrics.totalImages = this.imageEvents.length;
    
    // Update cache hit rate
    this.updateCacheHitRate();
    
    // Log performance data in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Image Load Event:', event);
      console.log('Current Metrics:', this.getMetrics());
    }
  }

  // Track cache hit
  trackCacheHit(src: string, size: number) {
    this.cache.set(src, { timestamp: Date.now(), size });
  }

  // Check if image is cached
  isCached(src: string): boolean {
    return this.cache.has(src);
  }

  // Update cache hit rate
  private updateCacheHitRate() {
    const cacheHits = this.imageEvents.filter(event => this.cache.has(event.src)).length;
    this.metrics.cacheHitRate = (cacheHits / this.metrics.totalImages) * 100;
  }

  // Get current performance metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get detailed image events
  getImageEvents(): ImageLoadEvent[] {
    return [...this.imageEvents];
  }

  // Calculate performance improvement
  calculateImprovement(): {
    bandwidthSaved: number;
    loadTimeReduced: number;
    cacheEfficiency: number;
  } {
    const estimatedOriginalBandwidth = this.metrics.totalImages * 500; // Assume 500KB per image
    const bandwidthSaved = estimatedOriginalBandwidth - this.metrics.totalBandwidth;
    
    const estimatedOriginalLoadTime = this.metrics.totalImages * 1000; // Assume 1s per image
    const loadTimeReduced = estimatedOriginalLoadTime - this.metrics.imageLoadTime;
    
    const cacheEfficiency = this.metrics.cacheHitRate;

    return {
      bandwidthSaved: Math.max(0, bandwidthSaved),
      loadTimeReduced: Math.max(0, loadTimeReduced),
      cacheEfficiency: cacheEfficiency,
    };
  }

  // Reset metrics
  reset() {
    this.metrics = {
      imageLoadTime: 0,
      totalImages: 0,
      loadedImages: 0,
      failedImages: 0,
      averageLoadTime: 0,
      totalBandwidth: 0,
      cacheHitRate: 0,
    };
    this.imageEvents = [];
    this.startTime = Date.now();
    this.cache.clear();
  }

  // Export performance report
  exportReport(): string {
    const improvement = this.calculateImprovement();
    const uptime = Date.now() - this.startTime;
    
    return `
Performance Report (${new Date().toISOString()})
================================================
Uptime: ${Math.round(uptime / 1000)}s
Total Images: ${this.metrics.totalImages}
Successfully Loaded: ${this.metrics.loadedImages}
Failed Loads: ${this.metrics.failedImages}
Success Rate: ${((this.metrics.loadedImages / this.metrics.totalImages) * 100).toFixed(2)}%

Performance Metrics:
- Average Load Time: ${this.metrics.averageLoadTime.toFixed(2)}ms
- Total Bandwidth: ${(this.metrics.totalBandwidth / 1024 / 1024).toFixed(2)}MB
- Cache Hit Rate: ${this.metrics.cacheHitRate.toFixed(2)}%

Improvements:
- Bandwidth Saved: ${(improvement.bandwidthSaved / 1024 / 1024).toFixed(2)}MB
- Load Time Reduced: ${(improvement.loadTimeReduced / 1000).toFixed(2)}s
- Cache Efficiency: ${improvement.cacheEfficiency.toFixed(2)}%
    `.trim();
  }

  // Get performance summary for display
  getSummary(): {
    totalImages: number;
    successRate: string;
    averageLoadTime: string;
    bandwidthUsed: string;
    cacheHitRate: string;
  } {
    const successRate = this.metrics.totalImages > 0 
      ? ((this.metrics.loadedImages / this.metrics.totalImages) * 100).toFixed(1)
      : '0.0';

    return {
      totalImages: this.metrics.totalImages,
      successRate: `${successRate}%`,
      averageLoadTime: `${this.metrics.averageLoadTime.toFixed(0)}ms`,
      bandwidthUsed: `${(this.metrics.totalBandwidth / 1024 / 1024).toFixed(2)}MB`,
      cacheHitRate: `${this.metrics.cacheHitRate.toFixed(1)}%`,
    };
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for easy tracking
export const trackImagePerformance = (src: string, loadTime: number, success: boolean, size?: number) => {
  performanceMonitor.trackImageLoad({
    src,
    loadTime,
    success,
    timestamp: Date.now(),
    size,
  });
};

export const trackCacheHit = (src: string, size: number) => {
  performanceMonitor.trackCacheHit(src, size);
};

export const getPerformanceMetrics = () => performanceMonitor.getMetrics();
export const getPerformanceSummary = () => performanceMonitor.getSummary();
export const exportPerformanceReport = () => performanceMonitor.exportReport();
export const resetPerformanceMetrics = () => performanceMonitor.reset();

export default performanceMonitor;
