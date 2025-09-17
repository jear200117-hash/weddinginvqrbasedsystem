// Real-time cache invalidation system
import { cacheUtils } from './api';
import { offlineCacheUtils } from './offlineCache';

class RealtimeCacheManager {
  private invalidationCallbacks = new Map<string, (() => void)[]>();
  private lastInvalidation = new Map<string, number>();

  // Register callback for cache invalidation
  onInvalidate(key: string, callback: () => void): () => void {
    if (!this.invalidationCallbacks.has(key)) {
      this.invalidationCallbacks.set(key, []);
    }
    
    this.invalidationCallbacks.get(key)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.invalidationCallbacks.get(key);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Invalidate cache and notify listeners
  invalidate(key: string, reason?: string): void {
    console.log(`Cache invalidated: ${key}${reason ? ` (${reason})` : ''}`);
    
    // Update last invalidation time
    this.lastInvalidation.set(key, Date.now());
    
    // Clear API cache
    cacheUtils.clearPattern(key);
    
    // Clear offline cache
    switch (key) {
      case '/invitations':
        (offlineCacheUtils as any).clearInvitations();
        break;
      case '/albums':
        (offlineCacheUtils as any).clearAlbums();
        break;
      case '/rsvp':
        (offlineCacheUtils as any).clearRSVP();
        break;
      case '/stats':
        (offlineCacheUtils as any).clearStats();
        break;
    }
    
    // Notify listeners
    const callbacks = this.invalidationCallbacks.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in cache invalidation callback:', error);
        }
      });
    }
  }

  // Invalidate multiple keys
  invalidateMultiple(keys: string[], reason?: string): void {
    keys.forEach(key => this.invalidate(key, reason));
  }

  // Get last invalidation time
  getLastInvalidation(key: string): number | undefined {
    return this.lastInvalidation.get(key);
  }

  // Check if cache is stale (older than threshold)
  isStale(key: string, thresholdMs: number = 5 * 60 * 1000): boolean {
    const lastInvalidation = this.lastInvalidation.get(key);
    if (!lastInvalidation) return false;
    
    return Date.now() - lastInvalidation > thresholdMs;
  }

  // Force refresh for specific data type
  forceRefresh(dataType: 'invitations' | 'albums' | 'rsvp' | 'stats'): void {
    const keyMap = {
      invitations: '/invitations',
      albums: '/albums',
      rsvp: '/rsvp',
      stats: '/stats'
    };
    
    this.invalidate(keyMap[dataType], 'force refresh');
  }

  // Auto-invalidate based on user activity
  onUserActivity(): void {
    // Invalidate stale caches when user becomes active
    const staleThreshold = 10 * 60 * 1000; // 10 minutes
    
    ['/invitations', '/albums', '/rsvp', '/stats'].forEach(key => {
      if (this.isStale(key, staleThreshold)) {
        this.invalidate(key, 'user activity');
      }
    });
  }
}

export const realtimeCache = new RealtimeCacheManager();

// Real-time event listeners
// Socket.IO now handles realtime. Visibility/focus listeners are optional and disabled.
