import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { getApiUrl } from '@/constants/config';
import { normalizeError } from './errorMessages';
import { deleteAuthToken, getAuthToken, setAuthToken } from './tokenStorage';

const API_URL = getApiUrl();
const ACCESS_TOKEN_KEY = 'hirelume_access_token';

if (__DEV__) {
  console.log(`[api] using ${API_URL}`);
}

class ApiClient {
  private client: AxiosInstance;
  private unauthorizedHandler: (() => void) | null = null;

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
        const token = await getAuthToken(ACCESS_TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // This API issues access tokens only, so an unauthorized session is cleared.
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig | undefined;
        if (error.response?.status === 401 && originalRequest?.headers.Authorization) {
          await this.clearAuthTokens();
          this.unauthorizedHandler?.();
        }
        return Promise.reject(error);
      }
    );
  }

  setUnauthorizedHandler(handler: (() => void) | null) {
    this.unauthorizedHandler = handler;
  }

  async setAccessToken(accessToken: string) {
    await setAuthToken(ACCESS_TOKEN_KEY, accessToken);
  }

  async getAccessToken() {
    return getAuthToken(ACCESS_TOKEN_KEY);
  }

  /**
   * Clear auth tokens (logout)
   */
  async clearAuthTokens() {
    await deleteAuthToken(ACCESS_TOKEN_KEY);
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await getAuthToken(ACCESS_TOKEN_KEY);
    return !!token;
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig) {
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
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
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
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
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
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
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
  async delete<T = any>(url: string, config?: AxiosRequestConfig) {
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
  async upload<T = any>(url: string, formData: FormData, config?: AxiosRequestConfig) {
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
