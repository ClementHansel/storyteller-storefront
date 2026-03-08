// ============================================================
// Zenvix Retail Gateway — Axios Client
// ============================================================
// Reusable axios instance with:
// - Tenant/client headers on every request
// - Auto-attach Bearer token when available
// - 401 interceptor → token refresh → retry
// - Global structured error handling
// ============================================================

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
} from './tokenManager';

// ---- Config from env ----

const BASE_URL = import.meta.env.VITE_ZENVIX_API_URL || 'http://localhost:3001/api/retail/public';
const TENANT_ID = import.meta.env.VITE_ZENVIX_TENANT_ID || '';
const CLIENT_ID = import.meta.env.VITE_ZENVIX_CLIENT_ID || '';
const CLIENT_SECRET = import.meta.env.VITE_ZENVIX_CLIENT_SECRET || '';

// ---- Structured API Error ----

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export class ZenvixApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: Record<string, unknown>;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ZenvixApiError';
    this.status = error.status;
    this.code = error.code;
    this.details = error.details;
  }
}

// ---- Axios instance ----

const zenvixClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---- Request interceptor: inject headers ----

zenvixClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Tenant & client credentials on every request
  config.headers.set('x-tenant-id', TENANT_ID);
  config.headers.set('x-client-id', CLIENT_ID);
  config.headers.set('x-client-secret', CLIENT_SECRET);

  // Bearer token if available
  const token = getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  return config;
});

// ---- Response interceptor: 401 refresh + global error handler ----

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

zenvixClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // ---- Token refresh on 401 ----
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refresh = getRefreshToken();
      if (!refresh) {
        clearTokens();
        return Promise.reject(toApiError(error));
      }

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken: string) => {
            originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
            resolve(zenvixClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: refresh }, {
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': TENANT_ID,
            'x-client-id': CLIENT_ID,
            'x-client-secret': CLIENT_SECRET,
          },
        });

        const { accessToken, refreshToken: newRefresh } = res.data;
        setAccessToken(accessToken);
        if (newRefresh) setRefreshToken(newRefresh);

        onTokenRefreshed(accessToken);
        originalRequest.headers.set('Authorization', `Bearer ${accessToken}`);
        return zenvixClient(originalRequest);
      } catch {
        clearTokens();
        onTokenRefreshed('');
        return Promise.reject(
          new ZenvixApiError({ status: 401, message: 'Session expired. Please sign in again.', code: 'TOKEN_EXPIRED' })
        );
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(toApiError(error));
  }
);

// ---- Error normalizer ----

function toApiError(error: AxiosError): ZenvixApiError {
  if (error.response) {
    const data = error.response.data as Record<string, unknown> | undefined;
    return new ZenvixApiError({
      status: error.response.status,
      message: (data?.message as string) || 'An error occurred',
      code: (data?.code as string) || undefined,
      details: (data?.details as Record<string, unknown>) || undefined,
    });
  }

  if (error.request) {
    return new ZenvixApiError({
      status: 0,
      message: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
    });
  }

  return new ZenvixApiError({
    status: 0,
    message: error.message || 'An unexpected error occurred',
    code: 'UNKNOWN',
  });
}

export default zenvixClient;
