import { create } from 'zustand';
import type { ServerItem } from '@/types';
import {
  listServers,
  createServer as apiCreateServer,
  updateServer as apiUpdateServer,
  deleteServer as apiDeleteServer,
  type CreateServerRequest,
  type UpdateServerRequest,
  type PaginatedResponse
} from '@/api/servers';

export type ServersState = {
  items: ServerItem[];
  loading: boolean;
  error: string | null;
  limit: number;
  nextCursor: string | null;
  total: number;
  totalPages: number;
  fetchServers: (params?: { limit?: number; offset?: number }) => Promise<void>;
  createServer: (payload: CreateServerRequest) => Promise<ServerItem>;
  updateServer: (url: string, port: number, patch: UpdateServerRequest) => Promise<ServerItem>;
  deleteServer: (url: string, port: number) => Promise<void>;
  setItems: (items: ServerItem[]) => void;
  clearError: () => void;
  findByUrlPort: (url: string, port: number) => ServerItem | undefined;
};

export const useServersStore = create<ServersState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  limit: 50,
  nextCursor: null,
  total: 0,
  totalPages: 0,

  fetchServers: async (params) => {
    set({
      loading: true,
      error: null
    });
    try {
      const response: PaginatedResponse<ServerItem> = await listServers(params);
      set({
        items: response.servers,
        limit: response.limit,
        nextCursor: response.nextCursor,
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load servers';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  createServer: async (payload) => {
    const created = await apiCreateServer(payload);
    const items = get().items.slice();
    items.unshift(created);
    set({ items });
    return created;
  },

  updateServer: async (url, port, patch) => {
    const updated = await apiUpdateServer(url, port, patch);
    const items = get().items.map((s) => (s.url === url && s.port === port ? {
      ...s,
      ...updated
    } : s));
    set({ items });
    return updated;
  },

  deleteServer: async (url, port) => {
    await apiDeleteServer(url, port);
    const items = get().items.filter((s) => !(s.url === url && s.port === port));
    set({ items });
  },

  setItems: (items) => set({ items }),
  clearError: () => set({ error: null }),
  findByUrlPort: (url, port) => get().items.find((s) => s.url === url && s.port === port),
}));


