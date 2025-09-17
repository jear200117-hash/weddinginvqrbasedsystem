// Offline cache utility for critical data
interface OfflineCacheEntry<T> {
  data: T;
  timestamp: number;
  maxAge: number;
  version: string;
}

class OfflineCache {
  private readonly version = '1.0.0';
  private readonly prefix = 'wedding_app_';

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private isExpired(entry: OfflineCacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.maxAge;
  }

  set<T>(key: string, data: T, maxAge: number = 24 * 60 * 60 * 1000): void {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    try {
      const entry: OfflineCacheEntry<T> = {
        data,
        timestamp: Date.now(),
        maxAge,
        version: this.version
      };

      localStorage.setItem(this.getKey(key), JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to save to offline cache:', error);
    }
  }

  get<T>(key: string): T | null {
    // Only run on client side
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.getKey(key));
      if (!stored) return null;

      const entry: OfflineCacheEntry<T> = JSON.parse(stored);
      
      // Check version compatibility
      if (entry.version !== this.version) {
        this.remove(key);
        return null;
      }

      // Check expiration
      if (this.isExpired(entry)) {
        this.remove(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Failed to read from offline cache:', error);
      this.remove(key);
      return null;
    }
  }

  remove(key: string): void {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.warn('Failed to remove from offline cache:', error);
    }
  }

  clear(): void {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear offline cache:', error);
    }
  }

  // Get all cached keys
  getKeys(): string[] {
    // Only run on client side
    if (typeof window === 'undefined') return [];
    
    try {
      const keys = Object.keys(localStorage);
      return keys
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.replace(this.prefix, ''));
    } catch (error) {
      console.warn('Failed to get cache keys:', error);
      return [];
    }
  }

  // Get cache statistics
  getStats() {
    // Only run on client side
    if (typeof window === 'undefined') return { keyCount: 0, totalSize: 0, keys: [] };
    
    const keys = this.getKeys();
    let totalSize = 0;

    keys.forEach(key => {
      try {
        const stored = localStorage.getItem(this.getKey(key));
        if (stored) {
          totalSize += stored.length;
        }
      } catch (error) {
        // Ignore errors
      }
    });

    return {
      keyCount: keys.length,
      totalSize,
      keys
    };
  }
}

export const offlineCache = new OfflineCache();

// Specific cache functions for different data types with shorter cache times for real-time
export const offlineCacheUtils = {
  // Albums cache (2 hours - reduced for more real-time)
  setAlbums: (albums: any[]) => {
    offlineCache.set('albums', albums, 2 * 60 * 60 * 1000);
  },
  
  getAlbums: () => {
    return offlineCache.get<any[]>('albums');
  },

  // Invitations cache (1 hour - reduced for more real-time)
  setInvitations: (invitations: any[]) => {
    offlineCache.set('invitations', invitations, 60 * 60 * 1000);
  },
  
  getInvitations: () => {
    return offlineCache.get<any[]>('invitations');
  },

  // RSVP cache (30 minutes - reduced for more real-time)
  setRSVP: (rsvp: any[]) => {
    offlineCache.set('rsvp', rsvp, 30 * 60 * 1000);
  },
  
  getRSVP: () => {
    return offlineCache.get<any[]>('rsvp');
  },

  // Stats cache (15 minutes - reduced for more real-time)
  setStats: (stats: any) => {
    offlineCache.set('stats', stats, 15 * 60 * 1000);
  },
  
  getStats: () => {
    return offlineCache.get<any>('stats');
  },

  // Clear all wedding app data
  clearAll: () => {
    offlineCache.clear();
  },

  // Clear specific data types
  clearInvitations: () => {
    offlineCache.remove('invitations');
  },
  
  clearAlbums: () => {
    offlineCache.remove('albums');
  },
  
  clearRSVP: () => {
    offlineCache.remove('rsvp');
  },
  
  clearStats: () => {
    offlineCache.remove('stats');
  }
};

// Network status detection
export class NetworkStatus {
  private static instance: NetworkStatus;
  private isOnline = true; // Default to online for SSR
  private listeners: ((isOnline: boolean) => void)[] = [];

  private constructor() {
    // Only run on client side
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyListeners();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyListeners();
      });
    }
  }

  static getInstance(): NetworkStatus {
    if (!NetworkStatus.instance) {
      NetworkStatus.instance = new NetworkStatus();
    }
    return NetworkStatus.instance;
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  addListener(callback: (isOnline: boolean) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.isOnline));
  }
}

export const networkStatus = NetworkStatus.getInstance();
