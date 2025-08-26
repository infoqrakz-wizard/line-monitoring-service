import { cookies } from "@/lib/cookies";
import { env } from "@/config/environment";

const buildHeaders = (init?: RequestInit): HeadersInit => {
  const token = cookies.get("lms_auth_token");

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

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// Кастомный класс для ошибок API
export class ApiError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly data: any;

  constructor(status: number, statusText: string, message: string, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }

  getServerMessage(): string {
    if (this.data && typeof this.data === "object") {
      const obj = this.data as Record<string, unknown>;
      return (
        (typeof obj.error === "string" && obj.error) ||
        (typeof obj.message === "string" && obj.message) ||
        (typeof obj.detail === "string" && obj.detail) ||
        (typeof obj.title === "string" && obj.title) ||
        this.message
      );
    }
    return this.message;
  }
}

export const apiFetch = async <T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const url = `${env.apiUrl}${path}`;

  try {
    const res = await fetch(url, {
      ...init,
      headers: buildHeaders(init),
    });

    if (res.ok) {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return (await res.json()) as T;
      }
      return (await res.text()) as unknown as T;
    }

    // Обработка 401 Unauthorized - попытка обновить токен
    if (
      res.status === 401 &&
      path !== "/api/auth/refresh" &&
      path !== "/api/auth/login"
    ) {
      if (isRefreshing) {
        // Если токен уже обновляется, добавляем запрос в очередь
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve,
            reject,
          });
        }).then(() => apiFetch(path, init));
      }

      isRefreshing = true;

      try {
        // Пытаемся обновить токен
        const { useAuthStore } = await import("@/store/auth");
        const newToken = await useAuthStore.getState().refreshToken();

        if (newToken) {
          // Повторяем изначальный запрос с новым токеном
          const retryRes = await fetch(url, {
            ...init,
            headers: buildHeaders(init),
          });

          if (retryRes.ok) {
            const contentType = retryRes.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              return (await retryRes.json()) as T;
            }
            return (await retryRes.text()) as unknown as T;
          } else {
            // Если повторный запрос тоже не удался, обрабатываем как ошибку
            const raw = await retryRes.text();
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
              return raw || retryRes.statusText || "Request failed";
            };

            throw new ApiError(
              retryRes.status,
              retryRes.statusText,
              deriveMessage(),
              parsedBody ?? raw,
            );
          }
        } else {
          throw new ApiError(401, "Unauthorized", "Failed to refresh token");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        throw refreshError;
      } finally {
        isRefreshing = false;
        processQueue(null, null);
      }
    }

    // Handle other errors
    let parsedBody: unknown = undefined;
    try {
      parsedBody = await res.json();
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
      return res.statusText || "Request failed";
    };

    throw new ApiError(res.status, res.statusText, deriveMessage(), parsedBody);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const parseApiError = (error: unknown): ApiError | null => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as
        | Partial<{
            status: number;
            message: string;
            statusText: string;
            data: unknown;
          }>
        | undefined;

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

      return new ApiError(
        parsed.status,
        parsed.statusText || "",
        message,
        parsed.data,
      );
    } catch {
      return null;
    }
  }

  return null;
};

export const request = {
  get: <T = unknown>(path: string, init?: RequestInit, body?: unknown) =>
    apiFetch<T>(path, {
      ...init,
      method: "GET",
      body: body ? JSON.stringify(body) : undefined,
    }),
  post: <T = unknown>(path: string, body?: unknown, init?: RequestInit) =>
    apiFetch<T>(path, {
      ...init,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  create: <T = unknown>(path: string, body?: unknown, init?: RequestInit) =>
    apiFetch<T>(path, {
      ...init,
      method: "CREATE",
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
  delete: <T = unknown>(path: string, body?: unknown, init?: RequestInit) =>
    apiFetch<T>(path, {
      ...init,
      method: "DELETE",
      body: body ? JSON.stringify(body) : undefined,
    }),
};
