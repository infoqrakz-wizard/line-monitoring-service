import { create } from "zustand";
import type {
  ServerWithMonitoring,
  MonitoringResponse,
  SubscribeRequest,
  UnsubscribeRequest,
  ServerStatus,
} from "@/types";

export type MonitoringState = {
  servers: ServerWithMonitoring[];
  loading: boolean;
  error: string | null;
  socket: WebSocket | null;
  isConnected: boolean;
  subscribeToServers: (serverIds: string[]) => void;
  unsubscribe: () => void;
  connect: () => void;
  disconnect: () => void;
  getServerStatus: (server: ServerWithMonitoring) => ServerStatus;
  clearError: () => void;
};

export const useMonitoringStore = create<MonitoringState>((set, get) => ({
  servers: [],
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
        const response: MonitoringResponse = JSON.parse(event.data);
        if (response.type === "snapshot" && response.data) {
          set({
            servers: response.data.servers,
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
        servers: serverIds,
        sections: ["main"],
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
