import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_BASE = 'http://localhost:4000/api/v1';

async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem('nexchat_token');
  }
  return SecureStore.getItemAsync('nexchat_token');
}

export async function setStoredToken(token: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    if (token) localStorage.setItem('nexchat_token', token);
    else localStorage.removeItem('nexchat_token');
    return;
  }
  if (token) {
    await SecureStore.setItemAsync('nexchat_token', token);
  } else {
    await SecureStore.deleteItemAsync('nexchat_token');
  }
}

export async function mobileApiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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

export const mobileApi = {
  get: <T = any>(endpoint: string) => mobileApiFetch<T>(endpoint, { method: 'GET' }).then((data) => ({ data })),
  post: <T = any>(endpoint: string, body?: any) =>
    mobileApiFetch<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }).then((data) => ({ data })),
  put: <T = any>(endpoint: string, body?: any) =>
    mobileApiFetch<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }).then((data) => ({ data })),
  delete: <T = any>(endpoint: string) => mobileApiFetch<T>(endpoint, { method: 'DELETE' }).then((data) => ({ data })),
};
