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

export type MonitoringState = {
  servers: ServerWithMonitoring[];
  users: {
    id: string;
    name: string;
    sc: string;
  }[];
  downtimeEvents: DowntimeEvent[];
  page: number;
  pageSize: number;
  pages: number;
  total: number;
  loading: boolean;
  error: string | null;
  socket: WebSocket | null;
  isConnected: boolean;
  subscribeToServers: (serverIds: string[]) => void;
  unsubscribe: () => void;
  connect: () => void;
  disconnect: () => void;
  getServerStatus: (server: ServerWithMonitoring) => ServerStatus;
  setUsers: (users: User[]) => void;
  clearError: () => void;
  fetchDowntimeEvents: (filter: DowntimeFilter) => Promise<void>;
  deleteDowntimeEvent: (id: number) => Promise<void>;
  deleteDowntimeByUrlPort: (url: string, port: number) => Promise<void>;
  clearDowntimeEvents: () => void;
};

export const useMonitoringStore = create<MonitoringState>((set, get) => ({
  servers: [],
  users: [],
  downtimeEvents: [],
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

    set({
      loading: true,
      error: null,
    });

    const ws = new WebSocket("ws://161.35.77.101:4000/ws");

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
        console.error("Failed to parse monitoring message:", error);
        set({ error: "Ошибка парсинга данных" });
      }
    };

    ws.onclose = () => {
      console.log("Monitoring WebSocket disconnected");
      set({
        socket: null,
        isConnected: false,
        loading: false,
      });

      // Попробовать переподключиться через 5 секунд
      setTimeout(() => {
        const currentSocket = get().socket;
        if (!currentSocket || currentSocket.readyState === WebSocket.CLOSED) {
          get().connect();
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
      });
    }
  },

  subscribeToServers: (serverIds: string[]) => {
    const { socket, isConnected } = get();

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
        // servers: serverIds,
        servers: "all",
        sections: ["main", "archiveState", "users"],
      },
    };

    try {
      socket.send(JSON.stringify(subscribeMessage));
      console.log("Subscribed to servers:", serverIds);
    } catch (error) {
      console.error("Failed to subscribe to servers:", error);
      set({ error: "Ошибка подписки на серверы" });
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

  deleteDowntimeEvent: async (id: number) => {
    try {
      await downtime.delete({ id });
      const currentEvents = get().downtimeEvents;
      const updatedEvents = currentEvents.filter((event) => event.id !== id);
      set({ downtimeEvents: updatedEvents });
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
      const updatedEvents = currentEvents.filter(
        (event) => !(event.url === url && event.port === port),
      );
      set({ downtimeEvents: updatedEvents });
    } catch (error) {
      console.error("Failed to delete downtime events by URL/port:", error);
      set({ error: "Ошибка удаления событий простоя" });
    }
  },

  clearDowntimeEvents: () => {
    set({ downtimeEvents: [] });
  },
}));
