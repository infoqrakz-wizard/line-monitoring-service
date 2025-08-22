export const cookies = {
  /**
   * Устанавливает cookie с заданными параметрами
   */
  set: (
    name: string,
    value: string,
    options: {
      expires?: Date;
      maxAge?: number;
      path?: string;
      domain?: string;
      secure?: boolean;
      sameSite?: "strict" | "lax" | "none";
      httpOnly?: boolean;
    } = {},
  ): void => {
    const {
      expires,
      maxAge,
      path = "/",
      secure = window.location.protocol === "https:",
      sameSite = "lax",
    } = options;

    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (expires) {
      cookieString += `; expires=${expires.toUTCString()}`;
    }

    if (maxAge) {
      cookieString += `; max-age=${maxAge}`;
    }

    if (path) {
      cookieString += `; path=${path}`;
    }

    if (secure) {
      cookieString += "; secure";
    }

    if (sameSite) {
      cookieString += `; samesite=${sameSite}`;
    }

    document.cookie = cookieString;
  },

  /**
   * Получает значение cookie по имени
   */
  get: (name: string): string | null => {
    const nameEQ = `${encodeURIComponent(name)}=`;
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];
      while (cookie.charAt(0) === " ") {
        cookie = cookie.substring(1, cookie.length);
      }
      if (cookie.indexOf(nameEQ) === 0) {
        const result = decodeURIComponent(
          cookie.substring(nameEQ.length, cookie.length),
        );

        return result;
      }
    }

    return null;
  },

  /**
   * Удаляет cookie по имени
   */
  remove: (
    name: string,
    options: { path?: string; domain?: string } = {},
  ): void => {
    const { path = "/", domain } = options;

    cookies.set(name, "", {
      expires: new Date(0),
      path,
      domain,
    });
  },

  /**
   * Проверяет, существует ли cookie с заданным именем
   */
  exists: (name: string): boolean => {
    return cookies.get(name) !== null;
  },
};
