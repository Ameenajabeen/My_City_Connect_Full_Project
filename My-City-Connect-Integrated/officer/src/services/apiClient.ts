/**
 * MY CITY CONNECT - Central API Client
 * Configured for real NestJS / REST backend integration.
 * Respects strict No-Mock-Data policy.
 */

export interface ApiClientConfig {
  baseUrl: string;
  timeoutMs: number;
}

const STORAGE_KEY_API_URL = 'mcc_api_url';
const STORAGE_KEY_TOKEN = 'mcc_auth_token';

// Read API URL from Vite env or localStorage or fallback to standard relative endpoint
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_API_URL);
    if (saved && saved.trim().length > 0) {
      return saved.trim().replace(/\/$/, '');
    }
  }
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined) ||
    (import.meta.env.NEXT_PUBLIC_API_URL as string | undefined);
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/$/, '');
  }
  // Default to window location origin with /api or relative path
  return '';
}

export function setApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url) {
      localStorage.removeItem(STORAGE_KEY_API_URL);
    } else {
      localStorage.setItem(STORAGE_KEY_API_URL, url.trim().replace(/\/$/, ''));
    }
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  }
  return null;
}

export function setAuthToken(token: string | null): void {
  if (typeof window !== 'undefined') {
    if (!token) {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    } else {
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
    }
  }
}

export class ApiError extends Error {
  status?: number;
  data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const token = getAuthToken();

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = baseUrl ? `${baseUrl}${cleanEndpoint}` : cleanEndpoint;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      const message =
        typeof errorData === 'object' && errorData !== null && 'message' in errorData
          ? String((errorData as { message: unknown }).message)
          : `HTTP error ${response.status}: ${response.statusText}`;
      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem('mcc_officer_user');
        window.dispatchEvent(new Event('mcc:auth-expired'));
      }
      throw new ApiError(message, response.status, errorData);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) {
      throw err;
    }
    if ((err as Error)?.name === 'AbortError') {
      throw new ApiError('Request timed out. Backend service took too long to respond.', 408);
    }
    const message = (err as Error)?.message || 'Failed to fetch from backend API.';
    throw new ApiError(`Network error: ${message}`, 0, err);
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  /**
   * Check connection status to real backend
   */
  checkConnection: async (): Promise<{ connected: boolean; latencyMs?: number; message?: string }> => {
    const startTime = Date.now();
    try {
      // Try /health, /api/health, or a quick ping to backend
      const baseUrl = getApiBaseUrl();
      const testUrl = baseUrl ? `${baseUrl}/health` : '/health';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;
      if (response.ok) {
        return { connected: true, latencyMs, message: 'Connected to NestJS backend' };
      }
      return {
        connected: false,
        latencyMs,
        message: `Backend returned status ${response.status}`,
      };
    } catch {
      return {
        connected: false,
        message: 'Backend server unreachable. Verify VITE_API_URL.',
      };
    }
  },
};
