import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "@/store/auth";
import { LoadingOverlay } from "@mantine/core";
import type { Role } from "@/types";

export type ProtectedProps = {
  allowedRoles?: Role[];
};

const Protected: React.FC<ProtectedProps> = ({ allowedRoles }) => {
  const { isAuthenticated, role, isLoading, checkAuth, token } = useAuthStore(
    (s) => ({
      isAuthenticated: s.isAuthenticated,
      role: s.role,
      isLoading: s.isLoading,
      checkAuth: s.checkAuth,
      token: s.token,
    }),
  );
  const location = useLocation();

  useEffect(() => {
    if (token && !isAuthenticated && !isLoading) {
      void checkAuth();
    }
  }, [token, isAuthenticated, isLoading, checkAuth]);

  if (isLoading) {
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
