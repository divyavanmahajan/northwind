import axios from 'axios';
import type { AxiosError, AxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types/api';
import { toast } from 'sonner';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  try {
    const storageItem = localStorage.getItem('auth-storage');
    if (storageItem) {
      const { state } = JSON.parse(storageItem);
      const token = state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (error) {
    // Ignore error parsing storage
  }
  return config;
});


api.interceptors.response.use(
  (response) => {
    // Optional: Show success toast for mutations
    if (['post', 'put', 'delete'].includes(response.config.method || '') && !response.config.url?.includes('login')) {
      // success toast is usually handled by the component using the promise
    }
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;
    const data = error.response?.data as any;
    const message = data?.error?.message || data?.detail || error.message || 'An unexpected error occurred';

    if (status === 401) {
      localStorage.removeItem('auth-storage');
      if (!window.location.pathname.includes('/login')) {
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
      }
    } else if (status === 403) {
      toast.error(message || 'Permission denied: You do not have access to this resource.');
    } else if (status === 404) {
      // 404s might be expected in some cases, so maybe don't toast globally
    } else if (status && status >= 500) {
      toast.error('Server error: Our team has been notified. Please try again later.');
    } else if (error.code === 'ERR_NETWORK') {
      toast.error('Network error: Please check your internet connection.');
    } else {
      // For other status codes (400, etc.), show the message if it's a mutation
      if (['post', 'put', 'delete'].includes(error.config?.method || '')) {
        toast.error(message);
      }
    }

    return Promise.reject(error);
  }
);

export function isApiError(error: unknown): error is AxiosError<ApiError> {
  return axios.isAxiosError(error) && error.response?.data?.error !== undefined;
}

export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    api.get<T>(url, config).then((res) => res.data),

  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    api.post<T>(url, data, config).then((res) => res.data),

  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    api.put<T>(url, data, config).then((res) => res.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    api.delete<T>(url, config).then((res) => res.data),
};

export default api;