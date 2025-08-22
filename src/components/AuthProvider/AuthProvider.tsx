import React, { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { useTokenRefresh } from "@/hooks/useTokenRefresh";

export type AuthProviderProps = {
  children: React.ReactNode;
};

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { checkAuth, isAuthenticated, token } = useAuthStore();

  useTokenRefresh();

  useEffect(() => {
    if (token && !isAuthenticated) {
      void checkAuth();
    }
  }, [checkAuth, isAuthenticated, token]);

  return <>{children}</>;
};

export default AuthProvider;
