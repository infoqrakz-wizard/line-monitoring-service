/* eslint-disable @typescript-eslint/no-unsafe-return */
import { create } from "zustand";
import type { Role, User } from "@/types";
import { authApi } from "@/api/auth";
import { cookies } from "@/lib/cookies";
import { getCookieSettings } from "@/config/environment";
import { ApiError } from "@/lib/request";
import { useMonitoringStore } from "@/store/monitoring";

export type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: Role | null;
  isLoading: boolean;
  isChecking: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string>;
  checkAuth: () => Promise<void>;
  autoLogin: () => Promise<boolean>;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
};

const TOKEN_COOKIE_KEY = "lms_auth_token";
const USER_COOKIE_KEY = "lms_auth_user";

/**
 * Получает настройки куки
 */
const getCookieOptions = () => {
  const settings = getCookieSettings();

  const options = {
    maxAge: 10 * 60, // 10 минут для access token
    path: "/",
    secure: settings.secure,
    sameSite: settings.sameSite,
  };

  return options;
};

/**
 * Получает настройки для удаления куки
 */
const getCookieRemoveOptions = () => {
  return {
    path: "/",
  };
};

const readPersisted = (): { user: User | null; token: string | null } => {
  try {
    const token = cookies.get(TOKEN_COOKIE_KEY);
    const userData = cookies.get(USER_COOKIE_KEY);

    if (!token || !userData) {
      return {
        user: null,
        token: null,
      };
    }

    const user = JSON.parse(userData) as User;

    return {
      user,
      token,
    };
  } catch {
    return {
      user: null,
      token: null,
    };
  }
};

const persistData = (user: User | null, token: string | null): void => {
  const cookieOptions = getCookieOptions();

  if (token) {
    cookies.set(TOKEN_COOKIE_KEY, token, cookieOptions);
  } else {
    cookies.remove(TOKEN_COOKIE_KEY, getCookieRemoveOptions());
  }

  if (user) {
    cookies.set(USER_COOKIE_KEY, JSON.stringify(user), cookieOptions);
  } else {
    cookies.remove(USER_COOKIE_KEY, getCookieRemoveOptions());
  }
};

export const useAuthStore = create<AuthState>((set, get) => {
  const persisted =
    typeof window !== "undefined"
      ? readPersisted()
      : {
          user: null,
          token: null,
        };

  const determineRole = (user: User): Role => {
    return user.is_admin === true ? "admin" : "user";
  };

  return {
    user: persisted.user,
    token: persisted.token,
    isAuthenticated: Boolean(persisted.token && persisted.user),
    role: persisted.user ? determineRole(persisted.user) : null,
    isLoading: false,
    isChecking: false,
    login: async (email: string, password: string) => {
      set({ isLoading: true });
      try {
        const response = await authApi.login({
          email,
          password,
        });

        // Сохраняем только токен, пользователя получим через /api/auth/me
        persistData(null, response.access);

        set({
          token: response.access,
          isAuthenticated: false, // Пока не получим данные пользователя
          isLoading: false,
        });

        await get().checkAuth();
      } catch (error) {
        set({ isLoading: false });

        // Логируем ошибку с дополнительной информацией
        if (error instanceof ApiError) {
          console.error("Login failed:", {
            status: error.status,
            message: error.getServerMessage(),
            data: error.data,
          });
        } else {
          console.error("Login failed:", error);
        }

        throw error;
      }
    },
    logout: async () => {
      try {
        const { token } = get();
        if (token) {
          await authApi.logout();
        }
      } catch (error) {
        if (error instanceof ApiError) {
          console.warn("Logout error:", {
            status: error.status,
            message: error.getServerMessage(),
          });
        } else {
          console.warn("Logout error:", error);
        }
      } finally {
        cookies.remove(TOKEN_COOKIE_KEY, getCookieRemoveOptions());
        cookies.remove(USER_COOKIE_KEY, getCookieRemoveOptions());

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          role: null,
          isLoading: false,
          isChecking: false,
        });
      }
    },
    refreshToken: async () => {
      try {
        // refreshToken автоматически отправляется в HttpOnly куки
        const response = await authApi.refresh();
        const newToken = response.access;

        const current = readPersisted();
        persistData(current.user, newToken);

        set({
          token: newToken,
          isAuthenticated: Boolean(newToken && current.user),
          isChecking: false,
        });

        // Отправляем сообщение в WebSocket о обновлении токена
        try {
          const monitoringStore = useMonitoringStore.getState();
          monitoringStore.sendWebSocketMessage("auth.refresh", {
            token: newToken,
          });
        } catch (wsError) {
          console.warn(
            "Failed to send WebSocket auth.refresh message:",
            wsError,
          );
        }

        return newToken;
      } catch (error) {
        if (error instanceof ApiError) {
          console.error("Token refresh failed:", {
            status: error.status,
            message: error.getServerMessage(),
            data: error.data,
          });
        } else {
          console.error("Token refresh failed:", error);
        }
        void get().logout();
        throw error;
      }
    },
    autoLogin: async () => {
      try {
        const response = await authApi.refresh();
        const newToken = response.access;

        if (!newToken) {
          return false;
        }

        persistData(null, newToken);
        set({
          token: newToken,
          isAuthenticated: false,
          isChecking: false,
        });

        // Отправляем сообщение в WebSocket о обновлении токена
        try {
          const monitoringStore = useMonitoringStore.getState();
          monitoringStore.sendWebSocketMessage("auth.refresh", {
            token: newToken,
          });
        } catch (wsError) {
          console.warn(
            "Failed to send WebSocket auth.refresh message:",
            wsError,
          );
        }

        await get().checkAuth();
        return true;
      } catch {
        return false;
      }
    },
    checkAuth: async () => {
      const { token } = get();
      if (!token) {
        return;
      }

      set({ isChecking: true }); // Устанавливаем флаг проверки

      try {
        const response = await authApi.me();
        const user: User = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.email,
          sc: "user",
          is_admin: response.user.is_admin,
          tv: response.user.tv,
          role: response.user.is_admin ? "admin" : "user",
        };

        persistData(user, token);

        set({
          user,
          isAuthenticated: true,
          role: user.role,
          isChecking: false, // Сбрасываем флаг
        });
      } catch (error) {
        try {
          console.error("Auth check failed, trying to refresh token:", error);
          await get().refreshToken();
          await get().checkAuth();
        } catch {
          void get().logout();
        } finally {
          set({ isChecking: false }); // Сбрасываем флаг в любом случае
        }
      }
    },
    setToken: (token) => {
      const current = readPersisted();
      persistData(current.user, token);

      set({
        token,
        isAuthenticated: Boolean(token && current.user),
        isChecking: false,
      });
    },
    setUser: (user) => {
      const current = readPersisted();
      persistData(user, current.token);

      set({
        user,
        role: user ? determineRole(user) : null,
        isAuthenticated: Boolean(current.token && user),
        isChecking: false,
      });
    },
  };
});
