import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { DEFAULT_API_URL, STORAGE_KEYS } from '@/constants/config';
import { normalizeError } from './errorMessages';

const API_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

// Storage keys
const ACCESS_TOKEN_KEY = 'hirelume_access_token';
const REFRESH_TOKEN_KEY = 'hirelume_refresh_token';

// Single in-flight refresh promise
let refreshPromise: Promise<string> | null = null;

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor: add auth header
    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: handle 401 with token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If 401 and not already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Use single in-flight refresh
            const newToken = await this.refreshAccessToken();
            if (newToken) {
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed - clear tokens and let app handle logout
            await this.clearTokens();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string | null> {
    // If already refreshing, wait for that promise
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      try {
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = response.data;

        // Store new tokens
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access_token);
        if (newRefreshToken) {
          await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);
        }

        return access_token;
      } catch (error) {
        console.error('Token refresh failed:', error);
        await this.clearTokens();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  }

  private async clearTokens() {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }

  /**
   * Store auth tokens
   */
  async setTokens(accessToken: string, refreshToken: string) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * Clear auth tokens (logout)
   */
  async clearAuthTokens() {
    await this.clearTokens();
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    return !!token;
  }

  /**
   * Get stored refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: InternalAxiosRequestConfig) {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: InternalAxiosRequestConfig) {
    try {
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: InternalAxiosRequestConfig) {
    try {
      const response = await this.client.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: InternalAxiosRequestConfig) {
    try {
      const response = await this.client.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: InternalAxiosRequestConfig) {
    try {
      const response = await this.client.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Multipart POST request (for file uploads)
   */
  async upload<T = any>(url: string, formData: FormData, config?: InternalAxiosRequestConfig) {
    try {
      const response = await this.client.post<T>(url, formData, {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...config?.headers,
        },
      });
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
