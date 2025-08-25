import React, { useEffect, useRef } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "@/store/auth";
import { LoadingOverlay } from "@mantine/core";
import type { Role } from "@/types";

export type ProtectedProps = {
  allowedRoles?: Role[];
};

const Protected: React.FC<ProtectedProps> = ({ allowedRoles }) => {
  const { isAuthenticated, role, isLoading, isChecking, checkAuth, token } =
    useAuthStore((s) => ({
      isAuthenticated: s.isAuthenticated,
      role: s.role,
      isLoading: s.isLoading,
      isChecking: s.isChecking,
      checkAuth: s.checkAuth,
      token: s.token,
    }));
  const location = useLocation();
  const authCheckRef = useRef<boolean>(false);

  useEffect(() => {
    // Предотвращаем множественные вызовы checkAuth
    if (
      token &&
      !isAuthenticated &&
      !isLoading &&
      !isChecking &&
      !authCheckRef.current
    ) {
      authCheckRef.current = true;
      void checkAuth().finally(() => {
        authCheckRef.current = false;
      });
    }
  }, [token, isAuthenticated, isLoading, isChecking, checkAuth]);

  if (isLoading || isChecking || (token && !isAuthenticated)) {
    return (
      <div
        style={{
          position: "relative",
          minHeight: "200px",
        }}
      >
        <LoadingOverlay visible={true} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default Protected;
