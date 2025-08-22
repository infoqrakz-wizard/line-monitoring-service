import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider, createTheme, px } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import AppLayout from "@/components/AppLayout";
import Protected from "@/routes/Protected";
import AuthProvider from "@/components/AuthProvider";
import Monitoring from "@/pages/Monitoring/Monitoring";
import Servers from "@/pages/Servers/Servers";
import Users from "@/pages/Users";
import MapPage from "@/pages/MapPage";
import Groups from "@/pages/Groups";
import Admins from "@/pages/Admins";
import NotificationsPage from "@/pages/Notifications";
import Login from "@/pages/Login";
import CreateServer from "@/pages/Servers/CreateServer/CreateServer";
import ServerInfo from "@/pages/Servers/ServerInfo";
import { WsProvider } from "@/ws/WsProvider";

import "@mantine/core/styles.css";
import "modern-css-reset/dist/reset.min.css";

const queryClient = new QueryClient();

const BUTTON_STYLES = {
  default: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "11px 20px 11px 20px",
    gap: "12px",
    minHeight: "46px",
    fontWeight: 800,
  },
  black: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "11px 20px 11px 20px",
    gap: "12px",
    minHeight: "46px",
    fontWeight: 800,
    backgroundColor: "#1D1D1D",
    color: "#FFFFFF",
    "&:hover": {
      background: "#2D2D2D",
    },
  },

  blackDisabled: {
    backgroundColor: "rgba(29, 29, 29, 1)",
    cursor: "not-allowed",
    opacity: 0.3,
  },

  white: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: px(44),
    height: px(44),
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    transition: ".3s",
    gap: 10,
    backgroundColor: "rgba(255, 255, 255, 1)",
    backgroundPosition: "left 14px center",
    textAlign: "right",
    padding: "6px 14px",
    width: "auto",
  },
};

const theme = createTheme({
  fontFamily:
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, Apple Color Emoji, Segoe UI Emoji",
  components: {
    Button: {
      styles: (
        theme: { colors: Record<string, string[]> },
        params: { variant?: string; disabled?: boolean },
      ) => {
        const style = {
          root: {
            backgroundColor:
              params.variant === "filled" ? theme.colors["dark"][9] : undefined,
            "&:hover": {
              backgroundColor:
                params.variant === "filled" ? "#ddd" : "transparent",
            },
            // Стили для серверной кнопки
            ...(params.variant === "black" && {
              ...BUTTON_STYLES.black,
            }),
            ...(params.variant === "black" &&
              params.disabled && {
                ...BUTTON_STYLES.blackDisabled,
              }),

            ...(params.variant === "white" && {
              ...BUTTON_STYLES.white,
            }),
            ...(params.variant === "default" && {
              ...BUTTON_STYLES.default,
            }),
          },
        };
        return style;
      },
    },
  },
  defaultRadius: 12,
  primaryColor: "blue",
});
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <Notifications position="top-right" />
        <BrowserRouter>
          <AuthProvider>
            <WsProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<Protected />}>
                  <Route element={<AppLayout />}>
                    <Route index element={<Monitoring />} />
                    <Route path="servers" element={<Servers />} />
                    <Route path="servers/create" element={<CreateServer />} />
                    <Route path="servers/edit" element={<CreateServer />} />
                    <Route path="servers/info" element={<ServerInfo />} />
                    <Route path="users" element={<Users />} />
                    <Route path="map" element={<MapPage />} />
                    <Route path="groups" element={<Groups />} />
                    <Route path="admins" element={<Admins />} />
                    <Route
                      path="notifications"
                      element={<NotificationsPage />}
                    />
                  </Route>
                </Route>
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </WsProvider>
          </AuthProvider>
        </BrowserRouter>
      </MantineProvider>
    </QueryClientProvider>
  );
};

export default App;
