import { useAuthStore } from "@/store/auth";

const API_URL = (import.meta.env.VITE_API_URL as string) ?? "";

export type ApiError = {
  status: number;
  message: string;
  statusText?: string;
  data?: unknown;
};

const buildHeaders = (init?: RequestInit): HeadersInit => {
  const token = useAuthStore.getState().token;
  const base: HeadersInit = {
    "Content-Type": "application/json",
  };
  const auth: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
  return {
    ...base,
    ...auth,
    ...(init?.headers ?? {}),
  };
};

export const apiFetch = async <T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: buildHeaders(init),
  });
  if (!res.ok) {
    const raw = await res.text();
    let parsedBody: unknown = undefined;
    try {
      parsedBody = raw ? JSON.parse(raw) : undefined;
    } catch {
      parsedBody = undefined;
    }

    const deriveMessage = (): string => {
      if (parsedBody && typeof parsedBody === "object") {
        const obj = parsedBody as Record<string, unknown>;
        const m =
          (typeof obj.message === "string" && obj.message) ||
          (typeof obj.error === "string" && obj.error) ||
          (typeof obj.detail === "string" && obj.detail) ||
          (typeof obj.title === "string" && obj.title);
        if (m) {
          return m;
        }
      }
      return raw || res.statusText || "Request failed";
    };

    const payload: ApiError = {
      status: res.status,
      statusText: res.statusText,
      message: deriveMessage(),
      data: parsedBody ?? raw,
    };
    throw new Error(JSON.stringify(payload));
  }
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
};

export const parseApiError = (error: unknown): ApiError | null => {
  if (!(error instanceof Error)) {
    return null;
  }
  try {
    const parsed = JSON.parse(error.message) as Partial<ApiError> | undefined;
    if (!parsed || typeof parsed.status !== "number") {
      return null;
    }
    let message = typeof parsed.message === "string" ? parsed.message : "";
    // Some backends return JSON string inside message; try to unpack it
    try {
      const inner = JSON.parse(message) as unknown;
      if (
        inner &&
        typeof inner === "object" &&
        ("message" in (inner as Record<string, unknown>) ||
          "error" in (inner as Record<string, unknown>))
      ) {
        const m =
          (inner as Record<string, unknown>).message ??
          (inner as Record<string, unknown>).error;
        if (typeof m === "string") {
          message = m;
        }
      }
    } catch {
      // ignore JSON parse errors for inner message
    }
    return {
      status: parsed.status,
      message,
      statusText: parsed.statusText,
      data: parsed.data,
    };
  } catch {
    return null;
  }
};

export const request = {
  get: <T = unknown>(path: string, init?: RequestInit) =>
    apiFetch<T>(path, {
      ...init,
      method: "GET",
    }),
  post: <T = unknown>(path: string, body?: unknown, init?: RequestInit) =>
    apiFetch<T>(path, {
      ...init,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T = unknown>(path: string, body?: unknown, init?: RequestInit) =>
    apiFetch<T>(path, {
      ...init,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T = unknown>(path: string, body?: unknown, init?: RequestInit) =>
    apiFetch<T>(path, {
      ...init,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T = unknown>(path: string, init?: RequestInit) =>
    apiFetch<T>(path, {
      ...init,
      method: "DELETE",
    }),
};
