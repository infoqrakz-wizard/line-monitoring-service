import { create } from "zustand";
import type {
  ServerWithMonitoring,
  MonitoringResponse,
  SubscribeRequest,
  UnsubscribeRequest,
  ServerStatus,
  ServerUser,
} from "@/types";

export type MonitoringState = {
  servers: ServerWithMonitoring[];
  users: {
    id: string;
    name: string;
    sc: string;
  }[];
  loading: boolean;
  error: string | null;
  socket: WebSocket | null;
  isConnected: boolean;
  subscribeToServers: (serverIds: string[]) => void;
  // subscribeToServersUsers: () => void;
  unsubscribe: () => void;
  connect: () => void;
  disconnect: () => void;
  getServerStatus: (server: ServerWithMonitoring) => ServerStatus;
  clearError: () => void;
};

export const useMonitoringStore = create<MonitoringState>((set, get) => ({
  servers: [],
  users: [],
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

          const filteredUsers: ServerUser[] = [];

          serversUsers.forEach((user) => {
            if (filteredUsers.some((u) => u.id === user.id)) {
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

  // subscribeToServersUsers: () => {
  //   const { socket, isConnected } = get();

  //   if (!socket || !isConnected) {
  //     get().connect();
  //     // Попробуем подписаться после подключения
  //     setTimeout(() => {
  //       get().subscribeToServersUsers();
  //     }, 1000);
  //     return;
  //   }

  //   const subscribeMessage: SubscribeRequest = {
  //     type: "subscribe",
  //     payload: {
  //       servers: "all",
  //       sections: ["users"],
  //     },
  //   };

  //   try {
  //     socket.send(JSON.stringify(subscribeMessage));
  //     console.log("Subscribed to servers users");
  //   } catch (error) {
  //     console.error("Failed to subscribe to servers:", error);
  //     set({ error: "Ошибка подписки на серверы" });
  //   }
  // },

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

  clearError: () => set({ error: null }),
}));
