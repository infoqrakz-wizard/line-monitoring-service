import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth";

export const useTokenRefresh = () => {
  const { token, refreshToken } = useAuthStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (token) {
      // Обновляем токен каждые 9 минут (до истечения 10-минутного срока)
      intervalRef.current = setInterval(
        () => {
          void refreshToken();
        },
        9 * 60 * 1000,
      );

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [token, refreshToken]);

  return null;
};
