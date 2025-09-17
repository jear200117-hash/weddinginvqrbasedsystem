import axios from 'axios';
import Cookies from 'js-cookie';
import { offlineCacheUtils, networkStatus } from './offlineCache';
import { realtimeCache } from './realtimeCache';

// Ensure the API base URL includes /api in local dev
const API_BASE_URL = 'https://backendv2-nasy.onrender.com/api';

// Custom cache implementation
interface CacheEntry {
  data: any;
  timestamp: number;
  maxAge: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultMaxAge = 2 * 60 * 1000; // 2 minutes (reduced for more real-time)
  private pendingRequests = new Map<string, Promise<any>>();

  private shouldCache(url: string, method: string): boolean {
    // Don't cache POST, PUT, DELETE, PATCH requests
    if (['post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
      return false;
    }
    
    // Don't cache auth endpoints
    if (url.includes('/auth/login') || url.includes('/auth/logout') || url.includes('/auth/change-password')) {
      return false;
    }
    
    return true;
  }

  private getCacheKey(url: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${url}${paramString}`;
  }

  get(url: string, params?: any): any | null {
    if (!this.shouldCache(url, 'get')) return null;
    
    const key = this.getCacheKey(url, params);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if cache is still valid
    if (Date.now() - entry.timestamp > entry.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(url: string, data: any, params?: any, maxAge?: number): void {
    if (!this.shouldCache(url, 'get')) return;
    
    const key = this.getCacheKey(url, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      maxAge: maxAge || this.defaultMaxAge
    });
  }

  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Request deduplication
  async deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // If request is already pending, return the existing promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Create new request
    const requestPromise = requestFn().finally(() => {
      // Remove from pending requests when done
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, requestPromise);
    return requestPromise;
  }

  // Clear cache for specific patterns
  clearPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

const apiCache = new ApiCache();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor to add auth token and check cache
api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Check cache for GET requests
  if (config.method === 'get') {
    const cachedData = apiCache.get(config.url || '', config.params);
    if (cachedData) {
      // Return cached data immediately
      return Promise.reject({
        isCached: true,
        data: cachedData,
        config
      });
    }
  }

  return config;
});

// Response interceptor for error handling and caching
api.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method === 'get' && response.status >= 200 && response.status < 300) {
      apiCache.set(response.config.url || '', response.data, response.config.params);
    }
    return response;
  },
  (error) => {
    // Handle cached responses
    if (error.isCached) {
      return Promise.resolve({
        data: error.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: error.config
      });
    }

    const status = error.response?.status;
    const data = error.response?.data;

    const normalized = {
      statusCode: status || 0,
      message: data?.message || data?.error || error.message || 'Request failed',
      error: data?.error || 'request_error',
    };

    if (status === 401) {
      Cookies.remove('auth_token');
      apiCache.clear(); // Clear cache on logout
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/host/login')) {
        window.location.href = '/host/login';
      }
    }

    if (status === 429) {
      normalized.message = 'Too many requests. Please try again shortly.';
    }
    if (error.code === 'ECONNABORTED') {
      normalized.message = 'Request timed out. Check your connection and try again.';
    }

    // Emit toast for visibility
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'error', message: normalized.message } }))
    }

    return Promise.reject(normalized);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    Cookies.remove('auth_token');
    return response.data;
  }
};

// Invitations API
export const invitationsAPI = {
  create: async (invitation: {
    guestName: string;
    guestRole: string;
    customMessage: string;
    invitationType: string;
    qrCenterType?: string;
    qrCenterOptions?: any;
  }) => {
    const response = await api.post('/invitations', invitation);
    return response.data;
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    role?: string;
  }) => {
    const response = await api.get('/invitations', { params });
    return response.data;
  },

  getByQRCode: async (qrCode: string) => {
    const response = await api.get(`/invitations/qr/${qrCode}`);
    return response.data.invitation; // Return the invitation object directly
  },

  update: async (id: string, invitation: {
    guestName: string;
    guestRole: string;
    customMessage: string;
    isActive: boolean;
  }) => {
    const response = await api.put(`/invitations/${id}`, invitation);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/invitations/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/invitations/stats');
    return response.data;
  }
};

// Albums API
export const albumsAPI = {
  create: async (album: {
    name: string;
    description?: string;
    isPublic?: boolean;
    coverImage?: string;
    qrCenterType?: string;
    qrCenterOptions?: any;
  }) => {
    const response = await api.post('/albums', album);
    return response.data;
  },

  getHostAlbums: async () => {
    const response = await api.get('/albums/host');
    return response.data;
  },

  getByQRCode: async (qrCode: string) => {
    const response = await axios.get(`${API_BASE_URL}/albums/qr/${qrCode}`);
    return response.data;
  },

  regenerateQR: async (id: string) => {
    const response = await api.put(`/albums/${id}/regenerate-qr`);
    return response.data;
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    featured?: boolean;
  }) => {
    const response = await api.get('/albums', { params });
    return response.data;
  },

  getById: async (id: string, params?: {
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get(`/albums/${id}`, { params });
    return response.data;
  },

  update: async (id: string, album: {
    name: string;
    description?: string;
    isPublic?: boolean;
    isFeatured?: boolean;
  }) => {
    const response = await api.put(`/albums/${id}`, album);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/albums/${id}`);
    return response.data;
  },

  setCover: async (id: string, coverImage: string) => {
    const response = await api.put(`/albums/${id}/cover`, { coverImage });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/albums/stats/overview');
    return response.data;
  },

};

// Media API
export const mediaAPI = {
  upload: async (albumId: string, files: FileList, uploadedBy: string) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('media', file);
    });
    formData.append('uploadedBy', uploadedBy);

    const response = await axios.post(
      `${API_BASE_URL}/media/upload/${albumId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for uploads
      }
    );
    return response.data;
  },

  uploadHost: async (albumId: string, files: FileList, uploadedBy?: string) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('media', file);
    });
    if (uploadedBy) {
      formData.append('uploadedBy', uploadedBy);
    }

    const response = await api.post(
      `/media/host/upload/${albumId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for uploads
      }
    );
    return response.data;
  },

  uploadByQR: async (qrCode: string, files: FileList, uploadedBy: string) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('media', file);
    });
    formData.append('uploadedBy', uploadedBy);

    const response = await axios.post(
      `${API_BASE_URL}/media/upload/qr/${qrCode}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for uploads
      }
    );
    return response.data;
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    album?: string;
    type?: string;
    approved?: boolean;
  }) => {
    const response = await api.get('/media', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/media/${id}`);
    return response.data;
  },

  approve: async (id: string, isApproved: boolean) => {
    const response = await api.put(`/media/${id}/approve`, { isApproved });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/media/${id}`);
    return response.data;
  },

  addTags: async (id: string, tags: string[]) => {
    const response = await api.put(`/media/${id}/tags`, { tags });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/media/stats/overview');
    return response.data;
  }
};

// QR Code API
export const qrAPI = {
  generate: async (url: string, size?: number, margin?: number, centerType?: string, centerOptions?: any) => {
    const response = await api.post('/qr/generate', { url, size, margin, centerType, centerOptions });
    return response.data;
  },

  generateFile: async (url: string, size?: number, margin?: number, centerType?: string, centerOptions?: any) => {
    const response = await api.post('/qr/generate-file', { url, size, margin, centerType, centerOptions }, {
      responseType: 'blob'
    });
    return response.data;
  },

  batchGenerate: async (urls: string[], size?: number, margin?: number) => {
    const response = await api.post('/qr/batch-generate', { urls, size, margin });
    return response.data;
  },

  uploadLogo: async (logoFile: File) => {
    const formData = new FormData();
    formData.append('logo', logoFile);
    
    const response = await api.post('/qr/upload-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getLogos: async () => {
    const response = await api.get('/qr/logos');
    return response.data;
  },

  deleteLogo: async (filename: string) => {
    const response = await api.delete(`/qr/logos/${filename}`);
    return response.data;
  },

  getOptions: async () => {
    const response = await api.get('/qr/options');
    return response.data;
  }
};

// RSVP API
export const rsvpAPI = {
  submit: async (qrCode: string, rsvpData: {
    status: 'attending' | 'not_attending';
    attendeeCount?: number;
    guestNames?: string[];
    email?: string;
    phone?: string;
  }) => {
    const response = await api.post(`/rsvp/submit/${qrCode}`, rsvpData);
    return response.data;
  },

  getStatus: async (qrCode: string) => {
    const response = await api.get(`/rsvp/status/${qrCode}`);
    return response.data;
  },

  getAll: async (params?: {
    status?: string;
    role?: string;
    search?: string;
  }) => {
    const response = await api.get('/rsvp/all', { params });
    return response.data;
  },

  getDetails: async (id: string) => {
    const response = await api.get(`/rsvp/details/${id}`);
    return response.data;
  },

  update: async (id: string, updateData: {
    status?: string;
    attendeeCount?: number;
    notes?: string;
  }) => {
    const response = await api.put(`/rsvp/update/${id}`, updateData);
    return response.data;
  }
};

export default api;


  // Cache management functions (no realtime calls here to avoid cycles)
export const cacheUtils = {
  clearAll: () => {
    apiCache.clear();
  },
  clearPattern: (pattern: string) => {
    apiCache.clearPattern(pattern);
  },
  // Clear cache for specific data types
  clearInvitations: () => {
    apiCache.clearPattern('/invitations');
  },
  clearAlbums: () => {
    apiCache.clearPattern('/albums');
  },
  clearMedia: () => {
    apiCache.clearPattern('/media');
  },
  clearRSVP: () => {
    apiCache.clearPattern('/rsvp');
  },
};

// SWR fetcher using axios instance with optimized caching and offline support
export const swrFetcher = async (url: string) => {
  try {
    const res = await api.get(url);
    
    // Cache data offline for critical endpoints
    if (url.includes('/albums') && !url.includes('/albums/')) {
      offlineCacheUtils.setAlbums(res.data.albums || res.data);
    } else if (url.includes('/invitations') && !url.includes('/invitations/')) {
      offlineCacheUtils.setInvitations(res.data.invitations || res.data);
    } else if (url.includes('/rsvp')) {
      offlineCacheUtils.setRSVP(res.data.rsvp || res.data);
    } else if (url.includes('/stats')) {
      offlineCacheUtils.setStats(res.data);
    }
    
    return res.data;
  } catch (error) {
    // Try to return offline data if network fails
    if (!networkStatus.getOnlineStatus()) {
      if (url.includes('/albums') && !url.includes('/albums/')) {
        const offlineData = offlineCacheUtils.getAlbums();
        if (offlineData) return { albums: offlineData };
      } else if (url.includes('/invitations') && !url.includes('/invitations/')) {
        const offlineData = offlineCacheUtils.getInvitations();
        if (offlineData) return { invitations: offlineData };
      } else if (url.includes('/rsvp')) {
        const offlineData = offlineCacheUtils.getRSVP();
        if (offlineData) return { rsvp: offlineData };
      } else if (url.includes('/stats')) {
        const offlineData = offlineCacheUtils.getStats();
        if (offlineData) return offlineData;
      }
    }
    
    throw error;
  }
};

// Enhanced SWR configuration for better caching with real-time support
export const swrConfig = {
  // Enable real-time revalidation
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  // Shorter deduplication for more real-time updates
  dedupingInterval: 2000, // 2 seconds
  // Add error retry
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  // Shorter focus throttle for real-time
  focusThrottleInterval: 5000, // 5 seconds
  // Add polling for critical data
  refreshInterval: 0, // Disabled by default, can be enabled per use case
};

// Real-time configuration for socket-backed data (no polling, no focus revalidate)
export const realtimeConfig = {
  ...swrConfig,
  refreshInterval: 0,
  revalidateOnFocus: false,
  dedupingInterval: 5000, // 5 seconds, socket pushes invalidate
};

// Helper to create a stable SWR key for RSVP list
export const rsvpAllKey = (params?: { status?: string; role?: string; search?: string }) => {
  const sp = new URLSearchParams();
  if (params?.status && params.status !== 'all') sp.set('status', params.status);
  if (params?.role && params.role !== 'all') sp.set('role', params.role);
  if (params?.search && params.search.trim()) sp.set('search', params.search.trim());
  const query = sp.toString();
  return `/rsvp/all${query ? `?${query}` : ''}`;
};
