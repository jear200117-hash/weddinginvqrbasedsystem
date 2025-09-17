// Enhanced image caching utility
interface ImageCacheEntry {
  url: string;
  blob: string;
  timestamp: number;
  size: number;
}

class ImageCache {
  private cache = new Map<string, ImageCacheEntry>();
  private readonly maxCacheSize = 50 * 1024 * 1024; // 50MB
  private readonly maxAge = 24 * 60 * 60 * 1000; // 24 hours
  private currentCacheSize = 0;

  private isExpired(entry: ImageCacheEntry): boolean {
    return Date.now() - entry.timestamp > this.maxAge;
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.remove(oldestKey);
    }
  }

  private ensureCacheSize(additionalSize: number): void {
    while (this.currentCacheSize + additionalSize > this.maxCacheSize && this.cache.size > 0) {
      this.evictOldest();
    }
  }

  async get(url: string): Promise<string | null> {
    const entry = this.cache.get(url);
    
    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.remove(url);
      return null;
    }

    return entry.blob;
  }

  async set(url: string, blob: Blob): Promise<string> {
    const blobUrl = URL.createObjectURL(blob);
    const size = blob.size;

    // Remove existing entry if it exists
    this.remove(url);

    // Ensure we have space for the new entry
    this.ensureCacheSize(size);

    const entry: ImageCacheEntry = {
      url,
      blob: blobUrl,
      timestamp: Date.now(),
      size
    };

    this.cache.set(url, entry);
    this.currentCacheSize += size;

    return blobUrl;
  }

  remove(url: string): void {
    const entry = this.cache.get(url);
    if (entry) {
      URL.revokeObjectURL(entry.blob);
      this.currentCacheSize -= entry.size;
      this.cache.delete(url);
    }
  }

  clear(): void {
    for (const entry of this.cache.values()) {
      URL.revokeObjectURL(entry.blob);
    }
    this.cache.clear();
    this.currentCacheSize = 0;
  }

  // Preload images with caching
  async preloadImages(urls: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    const promises = urls.map(async (url) => {
      try {
        // Check cache first
        const cached = await this.get(url);
        if (cached) {
          results.set(url, cached);
          return;
        }

        // Fetch and cache
        const response = await fetch(url, { 
          cache: 'force-cache',
          headers: {
            'Cache-Control': 'max-age=86400' // 24 hours
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = await this.set(url, blob);
          results.set(url, blobUrl);
        }
      } catch (error) {
        console.warn(`Failed to preload image: ${url}`, error);
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      memoryUsage: this.currentCacheSize,
      maxSize: this.maxCacheSize,
      utilization: (this.currentCacheSize / this.maxCacheSize) * 100
    };
  }
}

export const imageCache = new ImageCache();

// Utility function to get cached image or fetch with caching
export async function getCachedImage(url: string): Promise<string> {
  // Check cache first
  const cached = await imageCache.get(url);
  if (cached) {
    return cached;
  }

  // Fetch and cache
  try {
    const response = await fetch(url, { 
      cache: 'force-cache',
      headers: {
        'Cache-Control': 'max-age=86400'
      }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      return await imageCache.set(url, blob);
    }
    
    throw new Error(`Failed to fetch image: ${response.status}`);
  } catch (error) {
    console.error(`Error caching image ${url}:`, error);
    return url; // Fallback to original URL
  }
}

// Cleanup function for component unmount
export function cleanupImageCache() {
  imageCache.clear();
}
