/**
 * Простая конфигурация окружения
 */

export interface EnvironmentConfig {
  apiUrl: string;
}

/**
 * Получает конфигурацию окружения
 */
export const getEnvironmentConfig = (): EnvironmentConfig => {
  return {
    apiUrl: import.meta.env.VITE_API_URL || "http://localhost:5173/",
  };
};

/**
 * Получает настройки куки
 */
export const getCookieSettings = () => {
  return {
    secure: false,
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60,
  };
};

// Экспортируем конфигурацию по умолчанию
export const env = getEnvironmentConfig();
export const cookieSettings = getCookieSettings();
