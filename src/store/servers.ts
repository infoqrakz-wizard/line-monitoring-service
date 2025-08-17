import { create } from "zustand";
import type { ServerItem } from "@/types";
import {
  listServers,
  createServer as apiCreateServer,
  updateServer as apiUpdateServer,
  deleteServer as apiDeleteServer,
  forceUpdateWS as apiForceUpdateWS,
  type CreateServerRequest,
  type UpdateServerRequest,
  type PaginatedResponse,
} from "@/api/servers";

export type ServersState = {
  servers: ServerItem[];
  loading: boolean;
  error: string | null;
  limit: number;
  nextCursor: string | null;
  total: number;
  totalPages: number;
  currentPage: number;
  fetchServers: (params?: {
    limit?: number;
    offset?: number;
    page?: number;
    search?: string;
    filter?: "all" | "active" | "inactive";
  }) => Promise<void>;
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
  setCurrentPage: (page: number) => void;
  forceUpdateWS: () => Promise<void>;
};

export const useServersStore = create<ServersState>((set, get) => ({
  servers: [],
  loading: false,
  error: null,
  limit: 50,
  nextCursor: null,
  total: 0,
  totalPages: 0,
  currentPage: 1,

  fetchServers: async (params) => {
    set({
      loading: true,
      error: null,
    });
    try {
      const { page = 1, limit = 50, search, filter } = params || {};
      const offset = (page - 1) * limit;

      const response: PaginatedResponse<ServerItem> = await listServers({
        limit,
        offset,
        search,
        filter,
      });
      set({
        servers: response.servers,
        limit: response.limit,
        nextCursor: response.nextCursor,
        total: response.total,
        totalPages: response.totalPages,
        currentPage: page,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load servers";
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  createServer: async (payload) => {
    const created = await apiCreateServer(payload);
    const servers = get().servers.slice();
    servers.unshift(created);
    set({ servers });
    return created;
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
    await apiDeleteServer(url, port);
    const servers = get().servers.filter(
      (s) => !(s.url === url && s.port === port),
    );
    set({ servers });
  },

  forceUpdateWS: async () => {
    await apiForceUpdateWS();
  },

  setServers: (servers) => set({ servers }),
  clearError: () => set({ error: null }),
  findByUrlPort: (url, port) =>
    get().servers.find((s) => s.url === url && s.port === port),
  setCurrentPage: (page) => set({ currentPage: page }),
}));
