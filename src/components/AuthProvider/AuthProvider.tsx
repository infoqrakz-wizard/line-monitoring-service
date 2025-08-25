import React, { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth";
import { useTokenRefresh } from "@/hooks/useTokenRefresh";

export type AuthProviderProps = {
  children: React.ReactNode;
};

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { checkAuth, isAuthenticated, isChecking, token } = useAuthStore();
  const authCheckRef = useRef<boolean>(false);

  useTokenRefresh();

  useEffect(() => {
    // Предотвращаем множественные вызовы checkAuth
    if (token && !isAuthenticated && !isChecking && !authCheckRef.current) {
      authCheckRef.current = true;
      void checkAuth().finally(() => {
        authCheckRef.current = false;
      });
    }
  }, [checkAuth, isAuthenticated, isChecking, token]);

  return <>{children}</>;
};

export default AuthProvider;
