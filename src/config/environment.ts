/**
 * Конфигурация окружения с поддержкой разных режимов
 */

export interface EnvironmentConfig {
  apiUrl: string;
  wsUrl: string;
  appEnv: string;
}

/**
 * Получает конфигурацию окружения
 */
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const mode = import.meta.env.MODE;
  const appEnv = import.meta.env.VITE_APP_ENV;
  const isDevline = mode === "devline" || appEnv === "devline";

  return {
    apiUrl:
      import.meta.env.VITE_API_URL ||
      (isDevline
        ? "https://devline-api.example.com/"
        : "http://localhost:5173/"),
    wsUrl:
      import.meta.env.VITE_WS_URL ||
      (isDevline ? "wss://devline-ws.example.com/" : "ws://localhost:4000"),
    appEnv: appEnv || mode,
  };
};

/**
 * Получает настройки куки
 */
export const getCookieSettings = () => {
  const mode = import.meta.env.MODE;
  const appEnv = import.meta.env.VITE_APP_ENV;
  const isDevline = mode === "devline" || appEnv === "devline";

  return {
    secure: isDevline, // HTTPS только для devline
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60,
  };
};

// Экспортируем конфигурацию по умолчанию
export const env = getEnvironmentConfig();
export const cookieSettings = getCookieSettings();

// Утилита для проверки режима
export const isDevlineMode = () => {
  const mode = import.meta.env.MODE;
  const appEnv = import.meta.env.VITE_APP_ENV;
  return mode === "devline" || appEnv === "devline";
};
