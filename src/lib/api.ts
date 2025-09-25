import axios from 'axios';
import Cookies from 'js-cookie';
import { offlineCacheUtils, networkStatus } from './offlineCache';

// API Configuration - Firebase Functions with optimized endpoints
const API_BASE_URL = 'https://api-rpahsncjpa-as.a.run.app';
const MEDIA_API_BASE_URL = 'https://mediaapi-rpahsncjpa-as.a.run.app';

// Custom cache implementation
interface CacheEntry {
  data: any;
  timestamp: number;
  maxAge: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<any>>();
  private defaultMaxAge = 5 * 60 * 1000; // 5 minutes

  // Generate cache key from URL and params
  private getCacheKey(url: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${url}${paramString}`;
  }

  // Check if we should cache this request
  private shouldCache(url: string, method: string): boolean {
    return method === 'get' && !url.includes('/auth/');
  }

  get(url: string, params?: any): any | null {
    if (!this.shouldCache(url, 'get')) return null;
    
    const key = this.getCacheKey(url, params);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
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
    const requestPromise = requestFn();
    this.pendingRequests.set(key, requestPromise);

    // Clean up when request completes
    requestPromise.finally(() => {
      this.pendingRequests.delete(key);
    });

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

// Create axios instances
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

const mediaApi = axios.create({
  baseURL: MEDIA_API_BASE_URL,
  timeout: 60000, // Longer timeout for media uploads
});

// Shared request interceptor function
const createRequestInterceptor = (apiName: string) => (config: any) => {
  const token = Cookies.get('auth_token');
  console.log(`${apiName} Request to:`, config.url, 'Token available:', !!token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Authorization header set for:', config.url);
  } else {
    console.log('No token found for request to:', config.url);
  }

  // Check cache for GET requests (only for main API)
  if (config.method === 'get' && apiName === 'API') {
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

  // Ensure FormData requests use proper multipart headers set by the browser
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers && (config.headers as any)['Content-Type']) {
      delete (config.headers as any)['Content-Type'];
    }
    // Some adapters may store lowercase header keys
    if (config.headers && (config.headers as any)['content-type']) {
      delete (config.headers as any)['content-type'];
    }
    console.log('Detected FormData payload for:', config.url, '- ensuring Content-Type is not preset');
  }

  return config;
};

// Apply request interceptors
api.interceptors.request.use(createRequestInterceptor('API'));
mediaApi.interceptors.request.use(createRequestInterceptor('MediaAPI'));

// Shared response interceptor function
const createResponseInterceptor = (apiName: string) => [
  (response: any) => {
    // Cache successful GET responses (only for main API)
    if (response.config.method === 'get' && apiName === 'API') {
      apiCache.set(response.config.url || '', response.data, response.config.params);
    }
    return response;
  },
  (error: any) => {
    // Handle cached responses
    if (error.isCached) {
      return Promise.resolve(error);
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      console.warn(`${apiName} Authentication error detected:`, error.response.data);
      
      // Clear invalid token
      const currentToken = Cookies.get('auth_token');
      if (currentToken) {
        console.log('Removing invalid auth token');
        Cookies.remove('auth_token');
      }
      
      // For certain endpoints, try to redirect to login
      if (typeof window !== 'undefined' && window.location.pathname.includes('/host/')) {
        console.log('Redirecting to login due to auth error');
        window.location.href = '/host/login';
      }
    }

    // Handle network errors (only for main API with cache)
    if (!navigator.onLine && apiName === 'API') {
      const cachedData = apiCache.get(error.config?.url || '', error.config?.params);
      if (cachedData) {
        return Promise.resolve({ data: cachedData, fromCache: true });
      }
    }

    // Normalize error response
    const normalized = {
      ...error,
      data: error.response?.data || { error: 'Network error' },
      status: error.response?.status || 0
    };

    return Promise.reject(normalized);
  }
];

// Apply response interceptors
api.interceptors.response.use(...createResponseInterceptor('API'));
mediaApi.interceptors.response.use(...createResponseInterceptor('MediaAPI'));

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
    const response = await api.get(`/albums/qr/${qrCode}`);
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
    includeMedia?: boolean;
    limit?: number;
  }) => {
    const response = await api.get(`/albums/${id}`, { params });
    return response.data;
  },

  getPublicById: async (id: string) => {
    const response = await api.get(`/albums/public/${id}`);
    return response.data;
  },

  // Smart function that tries authenticated access first, then falls back to public
  getByIdSmart: async (id: string, params?: {
    includeMedia?: boolean;
    limit?: number;
  }) => {
    const token = Cookies.get('auth_token');
    
    // If we have a token, try the authenticated endpoint first
    if (token) {
      try {
        const response = await api.get(`/albums/${id}`, { params });
        return response.data;
      } catch (error: any) {
        // If authentication fails, fall back to public endpoint
        if (error.status === 401 || error.status === 403) {
          console.log('Authenticated access failed, trying public access for album:', id);
          try {
            const publicResponse = await api.get(`/albums/public/${id}`);
            return publicResponse.data;
          } catch (publicError) {
            // If public access also fails, throw the original error
            throw error;
          }
        }
        throw error;
      }
    } else {
      // No token, go directly to public endpoint
      const response = await api.get(`/albums/public/${id}`);
      return response.data;
    }
  },

  update: async (id: string, album: {
    name?: string;
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
  }
};

// Media API (uses dedicated high-memory endpoint)
export const mediaAPI = {
  upload: async (albumId: string, files: FileList, uploadedBy: string) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
    formData.append('media', file);
    });
    formData.append('uploadedBy', uploadedBy);

    const response = await mediaApi.post(
      `/media/upload/${albumId}`,
      formData,
      {
        timeout: 60000
      }
    );
    return response.data;
  },

  uploadHost: async (albumId: string, files: FileList, uploadedBy?: string) => {
    // Always use base64 for host uploads (one by one)
    const uploadedMedia: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const resp = await mediaApi.post(`/media/host/upload-base64/${albumId}`, {
        fileData: base64Data,
        fileName: file.name,
        fileType: file.type,
        uploadedBy
      }, { timeout: 60000 });

      if (resp?.data?.media) {
        if (Array.isArray(resp.data.media)) uploadedMedia.push(...resp.data.media);
        else uploadedMedia.push(resp.data.media);
      }
    }
    return { media: uploadedMedia };
  },

  uploadByQR: async (qrCode: string, files: FileList, uploadedBy: string) => {
    // Always use base64 route for guest QR uploads for reliability
    const uploadedMedia: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const resp = await mediaApi.post(`/media/upload/qr-base64/${qrCode}`, {
        fileData: base64Data,
        fileName: file.name,
        fileType: file.type,
        uploadedBy
      }, { timeout: 60000 });

      if (resp?.data?.media) {
        if (Array.isArray(resp.data.media)) uploadedMedia.push(...resp.data.media);
        else uploadedMedia.push(resp.data.media);
      }
    }

    return { media: uploadedMedia };
  },

  // Media metadata operations use the lightweight API
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
    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(logoFile);
    });
    
    const response = await api.post('/qr/upload-logo', {
      fileData: base64Data,
      fileName: logoFile.name,
      fileType: logoFile.type
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
    guestNames: string[];
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
    page?: number;
    limit?: number;
    status?: string;
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
    guestNames?: string[];
    email?: string;
    phone?: string;
    notes?: string;
  }) => {
    const response = await api.put(`/rsvp/update/${id}`, updateData);
    return response.data;
  }
};

// Utility function to create RSVP query parameters
export const createRSVPQuery = (filters: {
  status?: string;
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const params: any = {};
  
  if (filters.status && filters.status !== 'all') {
    params.status = filters.status;
  }
  
  if (filters.role && filters.role !== 'all') {
    params.role = filters.role;
  }
  
  if (filters.search) {
    params.search = filters.search;
  }
  
  if (filters.page) {
    params.page = filters.page;
  }
  
  if (filters.limit) {
    params.limit = filters.limit;
  }
  
  return params;
};

// Firebase configuration for real-time data
export const firebaseConfig = {};

// Export cache utilities for manual cache management
export { apiCache };