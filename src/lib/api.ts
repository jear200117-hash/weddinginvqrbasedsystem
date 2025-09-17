import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = 'https://backendv2-nasy.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    const normalized = {
      statusCode: status || 0,
      message: data?.message || data?.error || error.message || 'Request failed',
      error: data?.error || 'request_error',
    };

    if (status === 401) {
      Cookies.remove('auth_token');
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


// SWR fetcher using axios instance
export const swrFetcher = async (url: string) => {
  const res = await api.get(url);
  return res.data;
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
