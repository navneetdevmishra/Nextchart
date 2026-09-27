import { useAuthStore } from '@/store/useAuthStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const authToken = token || useAuthStore.getState().accessToken;

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || response.statusText || 'An unexpected error occurred';
    throw new Error(errorMessage);
  }

  return data as T;
}

export const api = {
  get: <T = any>(endpoint: string) => apiFetch<T>(endpoint, { method: 'GET' }).then((data) => ({ data })),
  post: <T = any>(endpoint: string, body?: any) =>
    apiFetch<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }).then((data) => ({ data })),
  put: <T = any>(endpoint: string, body?: any) =>
    apiFetch<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }).then((data) => ({ data })),
  delete: <T = any>(endpoint: string) => apiFetch<T>(endpoint, { method: 'DELETE' }).then((data) => ({ data })),
};
