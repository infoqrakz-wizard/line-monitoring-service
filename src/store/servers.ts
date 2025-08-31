import { create } from "zustand";
import type { ServerItem } from "@/types";
import {
  listServers,
  getServer as apiGetServer,
  createServer as apiCreateServer,
  updateServer as apiUpdateServer,
  deleteServer as apiDeleteServer,
  forceUpdateWS as apiForceUpdateWS,
  type CreateServerRequest,
  type UpdateServerRequest,
  type PaginatedResponse,
} from "@/api/servers";
import { downtime as apiDowntime } from "@/api/downtime";

export type ServersState = {
  servers: ServerItem[];
  loading: boolean;
  error: string | null;
  limit: number;
  nextCursor: string | null;
  previousCursor: string | null;
  total: number;
  pages: number;
  currentCursor: string | null;
  currentSearch: string;
  currentFilter:
    | "all"
    | "available"
    | "unavailable"
    | "healthy"
    | "problems"
    | "disabled";
  fetchServers: (params?: {
    limit?: number;
    cursor?: string | null;
    search?: string;
    filter?:
      | "all"
      | "available"
      | "unavailable"
      | "healthy"
      | "problems"
      | "disabled";
  }) => Promise<void>;
  fetchServer: (url: string, port: number) => Promise<ServerItem>;
  createServer: (payload: CreateServerRequest) => Promise<ServerItem>;
  updateServer: (
    url: string,
    port: number,
    patch: UpdateServerRequest,
  ) => Promise<ServerItem>;
  deleteServer: (url: string, port: number) => Promise<void>;
  setServers: (servers: ServerItem[]) => void;
  clearError: () => void;
  findByUrlPort: (url: string, port: number) => ServerItem | undefined;
  forceUpdateWS: () => Promise<void>;
  updateServersStatus: () => Promise<void>;
  resetCursors: () => void;
};

export const useServersStore = create<ServersState>((set, get) => ({
  servers: [],
  loading: false,
  error: null,
  limit: 50,
  nextCursor: null,
  previousCursor: null,
  total: 0,
  pages: 0,
  currentCursor: null,
  currentSearch: "",
  currentFilter: "all",

  fetchServers: async (params) => {
    set({
      loading: true,
      error: null,
    });
    try {
      const { cursor = null, limit = 50, search, filter } = params || {};

      const response: PaginatedResponse<ServerItem> = await listServers({
        limit,
        cursor,
        search,
        filter,
      });

      const { servers, meta } = response;

      set({
        servers,
        limit: meta.limit,
        nextCursor: meta.nextCursor,
        previousCursor: meta.previousCursor,
        total: meta.total,
        pages: meta.pages,
        currentCursor: cursor,
        currentSearch: search || "",
        currentFilter: filter || "all",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load servers";
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  fetchServer: async (url: string, port: number) => {
    try {
      const server = await apiGetServer(url, port);

      // Обновляем или добавляем сервер в локальное состояние
      const currentServers = get().servers;
      const existingIndex = currentServers.findIndex(
        (s) => s.url === url && s.port === port,
      );

      if (existingIndex >= 0) {
        // Обновляем существующий сервер
        const updatedServers = [...currentServers];
        updatedServers[existingIndex] = server;
        set({ servers: updatedServers });
      } else {
        // Добавляем новый сервер
        set({ servers: [...currentServers, server] });
      }

      return server;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load server";
      set({ error: message });
      throw error;
    }
  },

  createServer: async (payload) => {
    const created = await apiCreateServer(payload);
    return created.server;
  },

  updateServer: async (url, port, patch) => {
    const updated = await apiUpdateServer(url, port, patch);
    const servers = get().servers.map((s) =>
      s.url === url && s.port === port
        ? {
            ...s,
            ...updated,
          }
        : s,
    );
    set({ servers });
    return updated;
  },

  deleteServer: async (url, port) => {
    await apiDowntime.delete({
      url,
      port,
    });

    await apiDeleteServer(url, port);
    const servers = get().servers.filter(
      (s) => !(s.url === url && s.port === port),
    );
    set({ servers });
  },

  forceUpdateWS: async () => {
    await apiForceUpdateWS();
  },

  updateServersStatus: async () => {
    const state = get();
    const { currentCursor, limit, currentSearch, currentFilter } = state;

    if (!currentCursor) {
      return;
    }

    try {
      const response: PaginatedResponse<ServerItem> = await listServers({
        limit,
        cursor: currentCursor,
        search: currentSearch,
        filter: currentFilter,
      });

      set({
        servers: response.servers,
      });
    } catch (error) {
      console.warn("Failed to update servers status:", error);
    }
  },

  setServers: (servers) => set({ servers }),
  clearError: () => set({ error: null }),
  findByUrlPort: (url, port) =>
    get().servers.find((s) => s.url === url && s.port === port),
  resetCursors: () =>
    set({
      nextCursor: null,
      previousCursor: null,
      currentCursor: null,
      total: 0,
      pages: 0,
      currentFilter: "all",
    }),
}));
