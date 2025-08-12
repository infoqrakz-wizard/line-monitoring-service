import { useAuthStore } from '@/store/auth';

const API_URL = import.meta.env.VITE_API_URL ?? '';

export type ApiError = {
  status: number;
  message: string;
};

const buildHeaders = (init?: RequestInit): HeadersInit => {
  const token = useAuthStore.getState().token;
  const base: HeadersInit = {
    'Content-Type': 'application/json'
  };
  const auth: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
  return { ...base, ...auth, ...(init?.headers ?? {}) };
};

export const apiFetch = async <T = unknown>(path: string, init?: RequestInit): Promise<T> => {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, { ...init, headers: buildHeaders(init) });
  if (!res.ok) {
    const text = await res.text();
    throw { status: res.status, message: text } as ApiError;
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
};

export const api = {
  get: <T = unknown>(path: string, init?: RequestInit) => apiFetch<T>(path, { ...init, method: 'GET' }),
  post: <T = unknown>(path: string, body?: unknown, init?: RequestInit) =>
    apiFetch<T>(path, { ...init, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T = unknown>(path: string, body?: unknown, init?: RequestInit) =>
    apiFetch<T>(path, { ...init, method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T = unknown>(path: string, body?: unknown, init?: RequestInit) =>
    apiFetch<T>(path, { ...init, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T = unknown>(path: string, init?: RequestInit) => apiFetch<T>(path, { ...init, method: 'DELETE' })
};
