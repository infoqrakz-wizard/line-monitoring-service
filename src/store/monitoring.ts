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
  page: number;
  pageSize: number;
  pages: number;
  total: number;
  loading: boolean;
  error: string | null;
  socket: WebSocket | null;
  isConnected: boolean;
  subscribeToServers: (serverIds?: string[]) => void;
  subscribeToSpecificServer: (url: string, port: number) => void;
  unsubscribe: () => void;
  connect: () => void;
  disconnect: () => void;
  getServerStatus: (server: ServerWithMonitoring) => ServerStatus;
  getServerByUrlPort: (
    url: string,
    port: number,
  ) => ServerWithMonitoring | undefined;
  setUsers: (users: User[]) => void;
  clearError: () => void;
  fetchDowntimeEvents: (filter: DowntimeFilter) => Promise<void>;
  fetchAllDowntimeEvents: () => Promise<void>;
  deleteDowntimeEvent: (id: number) => Promise<void>;
  deleteDowntimeByUrlPort: (url: string, port: number) => Promise<void>;
  clearDowntimeEvents: () => void;
  refreshAllDowntimeEvents: () => Promise<void>;
};

export const useMonitoringStore = create<MonitoringState>((set, get) => ({
  servers: [],
  users: [],
  downtimeEvents: [],
  allDowntimeEvents: [], // Initialize new property
  page: 1,
  pageSize: 50,
  pages: 1,
  total: 0,
  loading: false,
  error: null,
  socket: null,
  isConnected: false,

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

    const wsUrl = import.meta.env.VITE_WS_URL ?? "ws://161.35.77.101:4000";
    const ws = new WebSocket(`ws://${wsUrl}/ws?token=${token}`);

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

          set({
            servers: response.data.servers,
            users: filteredUsers,
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
    ws.onclose = () => {
      console.log("Monitoring WebSocket disconnected");
      set({
        socket: null,
        isConnected: false,
        loading: false,
      });

      // Попробовать переподключиться через 5 секунд, но только если токен все еще доступен
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

  subscribeToServers: (serverIds?: string[]) => {
    const { socket, isConnected } = get();
    const token = useAuthStore.getState().token;

    if (!token) {
      console.warn("No access token available for subscription");
      set({ error: "Токен авторизации недоступен" });
      return;
    }

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
      set({ servers: [] });
      console.log("Unsubscribed from servers");
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
    }
  },

  getServerStatus: (server: ServerWithMonitoring): ServerStatus => {
    const { main } = server.sections;

    // Красный статус
    if (!main.ok || main.status !== 200) {
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
      return serverUrl === url && serverPort === port;
    });
  },

  setUsers: (users: User[]) => {
    set({ users });
  },

  clearError: () => set({ error: null }),

  fetchDowntimeEvents: async (filter: DowntimeFilter) => {
    try {
      set({
        loading: true,
        error: null,
      });
      const events = await downtime.query({ filter });
      set({
        downtimeEvents: events.data,
        page: events.meta.page,
        pageSize: events.meta.pageSize,
        pages: events.meta.pages,
        total: events.meta.total,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to fetch downtime events:", error);
      set({
        error: "Ошибка загрузки событий простоя",
        loading: false,
      });
    }
  },

  fetchAllDowntimeEvents: async () => {
    try {
      set({
        loading: true,
        error: null,
      });

      const [currentEvents, completedEvents] = await Promise.all([
        downtime.query({ filter: "servers_down" }),
        downtime.query({ filter: "completed" }),
      ]);

      const allEvents = [...currentEvents.data, ...completedEvents.data];

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
      const [currentEvents, completedEvents] = await Promise.all([
        downtime.query({ filter: "servers_down" }),
        downtime.query({ filter: "completed" }),
      ]);

      const allEvents = [...currentEvents.data, ...completedEvents.data];
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
