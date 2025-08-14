import React from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider, createTheme, px, rgba } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import AppLayout from "@/components/AppLayout";
import Protected from "@/routes/Protected";
import Monitoring from "@/pages/Monitoring/Monitoring";
import Servers from "@/pages/Servers/Servers";
import Users from "@/pages/Users";
import MapPage from "@/pages/MapPage";
import Groups from "@/pages/Groups";
import Settings from "@/pages/Settings";
import NotificationsPage from "@/pages/Notifications";
import Login from "@/pages/Login";
import CreateServer from "@/pages/Servers/CreateServer/CreateServer";
import { WsProvider } from "@/ws/WsProvider";

import "@mantine/core/styles.css";
import "modern-css-reset/dist/reset.min.css";

const queryClient = new QueryClient();

const BLACK_BUTTON_STYLES = {
  black: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "11px 20px 11px 14px",
    gap: "12px",
    minHeight: "46px",
    fontWeight: 800,
    background: "#1D1D1D",
    color: "#FFFFFF",
    "&:hover": {
      background: "#2D2D2D",
    },
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
        params: { variant?: string },
      ) => ({
        root: {
          backgroundColor:
            params.variant === "filled" ? theme.colors["dark"][9] : undefined,
          "&:hover": {
            backgroundColor:
              params.variant === "filled" ? "#ddd" : "transparent",
          },
          // Стили для серверной кнопки
          ...(params.variant === "black" && {
            ...BLACK_BUTTON_STYLES.black,
          }),

          ...(params.variant === "white" && {
            ...BLACK_BUTTON_STYLES.white,
          }),
        },
      }),
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
          <WsProvider>
            <Routes>
              <Route element={<Protected />}>
                <Route element={<AppLayout />}>
                  <Route index element={<Monitoring />} />
                  <Route path="servers" element={<Servers />} />
                  <Route path="servers/create" element={<CreateServer />} />
                  <Route path="servers/edit" element={<CreateServer />} />
                  <Route path="users" element={<Users />} />
                  <Route path="map" element={<MapPage />} />
                  <Route path="groups" element={<Groups />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                </Route>
              </Route>
              <Route path="/login" element={<Login />} />
            </Routes>
          </WsProvider>
        </BrowserRouter>
      </MantineProvider>
    </QueryClientProvider>
  );
};

export default App;
