import { create } from "zustand";
import type {
  ServerWithMonitoring,
  MonitoringResponse,
  SubscribeRequest,
  UnsubscribeRequest,
  ServerStatus,
  User,
  DowntimeEvent,
  DowntimeFilter,
} from "@/types";
import { downtime } from "@/api";
import { useAuthStore } from "@/store/auth";
import { ApiError } from "@/lib/request";

export type MonitoringState = {
  servers: ServerWithMonitoring[];
  users: {
    id: string;
    name: string;
    sc: string;
  }[];
  downtimeEvents: DowntimeEvent[];
  allDowntimeEvents: DowntimeEvent[]; // New property for all events
  currentCursor: string | null;
  nextCursor: string | null;
  previousCursor: string | null;
  total: number;
  loading: boolean;
  error: string | null;
  socket: WebSocket | null;
  isConnected: boolean;
  view: "current" | "postponed";
  pages: number;
  lastSubscription: {
    serverIds?: string[];
    url?: string;
    port?: number;
  } | null;
  subscribeToServers: (serverIds?: string[]) => void;
  subscribeToSpecificServer: (url: string, port: number) => void;
  unsubscribe: () => void;
  connect: () => void;
  disconnect: () => void;
  sendWebSocketMessage: (type: string, data?: any) => void;
  getServerStatus: (server: ServerWithMonitoring) => ServerStatus;
  getServerByUrlPort: (
    url: string,
    port: number,
  ) => ServerWithMonitoring | undefined;
  setUsers: (users: User[]) => void;
  clearError: () => void;
  setView: (view: "current" | "postponed") => void;
  fetchDowntimeEvents: (
    filter: DowntimeFilter,
    cursor?: string | null,
    limit?: number,
  ) => Promise<void>;
  fetchAllDowntimeEvents: () => Promise<void>;
  deleteDowntimeEvent: (id: number) => Promise<void>;
  deleteDowntimeByUrlPort: (url: string, port: number) => Promise<void>;
  clearDowntimeEvents: () => void;
  refreshAllDowntimeEvents: () => Promise<void>;
  stats: {
    bad: number;
    disabled: number;
    ok: number;
    problems: number;
    total: number;
    downtimeActive: number;
    downtimeCompleted: number;
  };
};

export const useMonitoringStore = create<MonitoringState>((set, get) => ({
  servers: [],
  users: [],
  downtimeEvents: [],
  allDowntimeEvents: [], // Initialize new property
  currentCursor: null,
  nextCursor: null,
  previousCursor: null,
  total: 0,
  loading: false,
  error: null,
  socket: null,
  isConnected: false,
  view: "current",
  pages: 0,
  lastSubscription: null,
  stats: {
    bad: 0,
    disabled: 0,
    ok: 0,
    problems: 0,
    total: 0,
    downtimeActive: 0,
    downtimeCompleted: 0,
  },

  connect: () => {
    const socket = get().socket;
    if (socket && socket.readyState === WebSocket.OPEN) {
      return;
    }

    // Получаем токен из auth store
    const token = useAuthStore.getState().token;
    if (!token) {
      console.warn("No access token available for WebSocket connection");
      set({ error: "Токен авторизации недоступен" });
      return;
    }

    set({
      loading: true,
      error: null,
    });

    // const wsUrl = import.meta.env.VITE_WS_URL ?? "ws://161.35.77.101:4000";
    const wsUrl =
      import.meta.env.VITE_WS_URL ||
      `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`;

    const ws = new WebSocket(`${wsUrl}/ws?token=${token}`);

    ws.onopen = () => {
      console.log("Monitoring WebSocket connected");
      set({
        socket: ws,
        isConnected: true,
        loading: false,
      });
    };

    ws.onmessage = (event) => {
      try {
        const response: MonitoringResponse = JSON.parse(event.data as string);

        if (response.type === "auth.expiring") {
          const authStore = useAuthStore.getState();
          void authStore.refreshToken();
          return;
        }

        if (response.type === "snapshot" && response.data) {
          const serversUsers = response.data.servers
            .flatMap((server) => server.sections.users)
            .filter(Boolean);

          const filteredUsers: User[] = [];

          serversUsers.forEach((user) => {
            if (filteredUsers.some((u) => u.name === user.name)) {
              return;
            }
            filteredUsers.push(user);
          });

          const stats = response.data.total_stats;

          set({
            servers: response.data.servers,
            users: filteredUsers,
            stats: {
              bad: stats.bad,
              disabled: stats.disabled,
              ok: stats.ok,
              problems: stats.problems,
              total: stats.total,
              downtimeActive: stats.downtime_active,
              downtimeCompleted: stats.downtime_completed,
            },
            error: null,
          });
        }
      } catch (error) {
        if (error instanceof ApiError) {
          console.error("Failed to parse monitoring message:", {
            status: error.status,
            message: error.getServerMessage(),
            data: error.data,
          });
        } else {
          console.error("Failed to parse monitoring message:", error);
        }
        set({ error: "Ошибка парсинга данных" });
      }
    };

    ws.onerror = (error) => {
      console.error("Monitoring WebSocket error:", error);
      set({
        error: "Ошибка подключения к серверу мониторинга",
        loading: false,
        isConnected: false,
      });
    };
    ws.onclose = (event) => {
      console.log("Monitoring WebSocket disconnected", {
        code: event.code,
        reason: event.reason,
      });

      // Если сокет закрылся с кодом 4003, переподключаемся с новым токеном
      if (event.code === 4003) {
        console.log(
          "WebSocket closed with code 4003, reconnecting with new token...",
        );

        // Обновляем токен
        const authStore = useAuthStore.getState();
        authStore
          .refreshToken()
          .then(() => {
            // Переподключаемся после обновления токена
            get().connect();

            // Восстанавливаем подписку если она была
            const { lastSubscription } = get();
            if (lastSubscription) {
              setTimeout(() => {
                if (lastSubscription.serverIds) {
                  get().subscribeToServers(lastSubscription.serverIds);
                } else if (lastSubscription.url && lastSubscription.port) {
                  get().subscribeToSpecificServer(
                    lastSubscription.url,
                    lastSubscription.port,
                  );
                }
              }, 1000); // Небольшая задержка для стабилизации соединения
            }
          })
          .catch((error) => {
            console.error(
              "Failed to refresh token after WebSocket close 4003:",
              error,
            );
          });
      } else {
        // Обычное переподключение для других кодов
        setTimeout(() => {
          const currentSocket = get().socket;
          const currentToken = useAuthStore.getState().token;
          if (!currentSocket || currentSocket.readyState === WebSocket.CLOSED) {
            if (currentToken) {
              get().connect();
            } else {
              console.log("No token available, skipping reconnection");
            }
          }
        }, 5000);
      }

      set({
        socket: null,
        isConnected: false,
        loading: false,
      });
    };

    ws.onerror = (error) => {
      console.error("Monitoring WebSocket error:", error);
      set({
        error: "Ошибка подключения к серверу мониторинга",
        loading: false,
        isConnected: false,
      });
    };
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.close();
      set({
        socket: null,
        isConnected: false,
        servers: [],
        users: [],
      });
    }
  },

  sendWebSocketMessage: (type: string, data?: any) => {
    const { socket, isConnected } = get();

    if (!socket || !isConnected) {
      console.warn("WebSocket is not connected, cannot send message");
      return;
    }

    try {
      const message = data
        ? {
            type,
            ...data,
          }
        : { type };
      socket.send(JSON.stringify(message));
    } catch (error) {
      console.error("Failed to send WebSocket message:", error);
    }
  },

  subscribeToServers: (serverIds?: string[]) => {
    const { socket, isConnected } = get();
    const token = useAuthStore.getState().token;

    if (!token) {
      console.warn("No access token available for subscription");
      set({ error: "Токен авторизации недоступен" });
      return;
    }

    // Сохраняем информацию о подписке для восстановления
    set({ lastSubscription: { serverIds } });

    if (!socket || !isConnected) {
      get().connect();
      // Попробуем подписаться после подключения
      setTimeout(() => {
        get().subscribeToServers(serverIds);
      }, 1000);
      return;
    }

    const subscribeMessage: SubscribeRequest = {
      type: "subscribe",
      payload: {
        servers: serverIds || "all",
        sections: [
          "main",
          "archiveState",
          "users",
          "camerasName",
          "mediaState",
        ],
      },
    };

    try {
      socket.send(JSON.stringify(subscribeMessage));
    } catch (error) {
      if (error instanceof ApiError) {
        console.error("Failed to subscribe to servers:", {
          status: error.status,
          message: error.getServerMessage(),
          data: error.data,
        });
      } else {
        console.error("Failed to subscribe to servers:", error);
      }
      set({ error: "Ошибка подписки на серверы" });
    }
  },

  subscribeToSpecificServer: (url: string, port: number) => {
    const { socket, isConnected } = get();
    const token = useAuthStore.getState().token;

    if (!token) {
      console.warn("No access token available for subscription");
      set({ error: "Токен авторизации недоступен" });
      return;
    }

    // Сохраняем информацию о подписке для восстановления
    set({
      lastSubscription: {
        url,
        port,
      },
    });

    if (!socket || !isConnected) {
      get().connect();
      // Попробуем подписаться после подключения
      setTimeout(() => {
        get().subscribeToSpecificServer(url, port);
      }, 1000);
      return;
    }

    const serverId = `${url}:${port}`;
    const subscribeMessage: SubscribeRequest = {
      type: "subscribe",
      payload: {
        servers: [serverId],
        sections: [
          "main",
          "archiveState",
          "users",
          "camerasName",
          "mediaState",
        ],
      },
    };

    try {
      socket.send(JSON.stringify(subscribeMessage));
      console.log("Subscribed to specific server:", serverId);
    } catch (error) {
      console.error("Failed to subscribe to specific server:", error);
      set({ error: "Ошибка подписки на сервер" });
    }
  },

  unsubscribe: () => {
    const { socket, isConnected } = get();

    if (!socket || !isConnected) {
      return;
    }

    const unsubscribeMessage: UnsubscribeRequest = {
      type: "unsubscribe",
    };

    try {
      socket.send(JSON.stringify(unsubscribeMessage));
      set({
        servers: [],
        lastSubscription: null, // Очищаем информацию о последней подписке
      });
      console.log("Unsubscribed from servers");
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
    }
  },

  getServerStatus: (server: ServerWithMonitoring): ServerStatus => {
    const main = server?.sections?.main;

    // Красный статус
    if (!main || !main.ok || main.status !== 200) {
      return "red";
    }

    // Желтый статус
    if (main.lastErrorTime !== null || main.enabledWithProblemStream > 0) {
      return "yellow";
    }

    // Зеленый статус
    if (
      main.ok &&
      main.status === 200 &&
      main.lastErrorTime === null &&
      main.enabledWithProblemStream === 0
    ) {
      return "green";
    }

    return "red"; // fallback
  },

  getServerByUrlPort: (url: string, port: number) => {
    const { servers } = get();
    return servers.find((server) => {
      const serverUrl = server.sections.main.url;
      const serverPort = server.sections.main.port;
      return (
        (serverUrl === url && serverPort === port) ||
        server.id === `${url}:${port}`
      );
    });
  },

  setUsers: (users: User[]) => {
    set({ users });
  },

  clearError: () => set({ error: null }),

  setView: (view: "current" | "postponed") => {
    set({ view });
  },

  fetchDowntimeEvents: async (
    filter: DowntimeFilter,
    cursor?: string | null,
    limit: number = 50,
  ) => {
    try {
      set({
        loading: true,
        error: null,
      });

      const response = await downtime.query({
        filter,
        cursor,
        limit,
      });

      const { data, meta } = response;

      set({
        downtimeEvents: data,
        currentCursor: cursor,
        nextCursor: meta.nextCursor,
        previousCursor: meta.previousCursor,
        total: meta.total,
        pages: meta.pages,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to fetch downtime events:", error);
      set({
        error: "Ошибка загрузки событий простоя",
        loading: false,
      });
      throw error;
    }
  },

  fetchAllDowntimeEvents: async () => {
    try {
      set({
        loading: true,
        error: null,
      });

      const [activeEvents, completedEvents] = await Promise.all([
        downtime.query({ filter: "active" }),
        downtime.query({ filter: "completed" }),
      ]);

      const allEvents = [...activeEvents.data, ...completedEvents.data];

      set({
        allDowntimeEvents: allEvents,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to fetch all downtime events:", error);
      set({
        error: "Ошибка загрузки событий простоя",
        loading: false,
      });
    }
  },

  // Refresh all events after deletions
  refreshAllDowntimeEvents: async () => {
    try {
      const [activeEvents, completedEvents] = await Promise.all([
        downtime.query({ filter: "active" }),
        downtime.query({ filter: "completed" }),
      ]);

      const allEvents = [...activeEvents.data, ...completedEvents.data];
      set({ allDowntimeEvents: allEvents });
    } catch (error) {
      console.error("Failed to refresh all downtime events:", error);
    }
  },

  deleteDowntimeEvent: async (id: number) => {
    try {
      await downtime.delete({ id });
      const currentEvents = get().downtimeEvents;
      const allEvents = get().allDowntimeEvents;
      const updatedEvents = currentEvents.filter((event) => event.id !== id);
      const updatedAllEvents = allEvents.filter((event) => event.id !== id);
      set({
        downtimeEvents: updatedEvents,
        allDowntimeEvents: updatedAllEvents,
      });
    } catch (error) {
      console.error("Failed to delete downtime event:", error);
      set({ error: "Ошибка удаления события простоя" });
    }
  },

  deleteDowntimeByUrlPort: async (url: string, port: number) => {
    try {
      await downtime.delete({
        url,
        port,
      });
      const currentEvents = get().downtimeEvents;
      const allEvents = get().allDowntimeEvents;
      const updatedEvents = currentEvents.filter(
        (event) => !(event.url === url && event.port === port),
      );
      const updatedAllEvents = allEvents.filter(
        (event) => !(event.url === url && event.port === port),
      );
      set({
        downtimeEvents: updatedEvents,
        allDowntimeEvents: updatedAllEvents,
      });
    } catch (error) {
      console.error("Failed to delete downtime events by URL/port:", error);
      set({ error: "Ошибка удаления событий простоя" });
    }
  },

  clearDowntimeEvents: () => {
    set({
      downtimeEvents: [],
      allDowntimeEvents: [],
    });
  },
}));
