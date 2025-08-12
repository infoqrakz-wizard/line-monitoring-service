import React from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider, createTheme } from "@mantine/core";
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

const queryClient = new QueryClient();

const theme = createTheme({
  fontFamily:
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, Apple Color Emoji, Segoe UI Emoji",
  components: {
    Button: {
      // Subscribe to theme and component params
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
