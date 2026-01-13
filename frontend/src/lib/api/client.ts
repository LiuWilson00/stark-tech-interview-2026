import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '@/types/api';
import { TokenService } from '@/lib/services/token-service';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token refresh state
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Request interceptor - Add auth header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authHeader = TokenService.getAuthHeader();
    if (authHeader) {
      config.headers.Authorization = authHeader;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Skip refresh for auth endpoints to avoid infinite loops
    const shouldAttemptRefresh =
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/');

    if (shouldAttemptRefresh) {
      if (isRefreshing) {
        // Queue the request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = TokenService.getRefreshToken();

      if (!refreshToken) {
        handleAuthFailure();
        return Promise.reject(error.response?.data || error);
      }

      try {
        // Call refresh endpoint directly with axios to avoid interceptor loop
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Store new tokens via TokenService
        TokenService.setTokens(accessToken, newRefreshToken);

        // Update the authorization header for retry
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Process queued requests
        processQueue();

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        handleAuthFailure();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error.response?.data || error);
  }
);

/**
 * Handle authentication failure - clear tokens and redirect to login
 */
function handleAuthFailure(): void {
  TokenService.clearTokens();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export default apiClient;
