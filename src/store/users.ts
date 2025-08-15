import { create } from "zustand";
import { users as usersApi } from "@/api";
import type {
  UserItem as ApiUserItem,
  CreateUserRequest,
  UpdateUserRequest,
  PaginatedUsersResponse,
  CreateServerUserRequest,
  CreateServerUserResponse,
  DeleteServerUserRequest,
} from "@/api/user";

export type UsersState = {
  items: ApiUserItem[];
  loading: boolean;
  error: string | null;
  fetchUsers: (params?: {
    limit?: number;
    offset?: number;
  }) => Promise<PaginatedUsersResponse>;
  createUser: (payload: CreateUserRequest) => Promise<ApiUserItem>;
  createServerUser: (
    payload: CreateServerUserRequest,
    servers: Array<{ url: string; port: number }>,
  ) => Promise<CreateServerUserResponse>;
  deleteServerUser: (
    payload: DeleteServerUserRequest,
    servers: Array<{ url: string; port: number }>,
  ) => Promise<CreateServerUserResponse>;
  updateUser: (
    id: string | number,
    patch: UpdateUserRequest,
  ) => Promise<ApiUserItem>;
  deleteUser: (id: string | number) => Promise<void>;
  setItems: (items: ApiUserItem[]) => void;
  clearError: () => void;
};

export const useUsersStore = create<UsersState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchUsers: async (params) => {
    set({
      loading: true,
      error: null,
    });
    try {
      const res = await usersApi.listUsers({
        limit: params?.limit,
        offset: params?.offset,
      });
      set({
        items: res,
      });
      return res;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load users";
      set({
        error: message,
      });
      throw error;
    } finally {
      set({
        loading: false,
      });
    }
  },

  createUser: async (payload) => {
    const created = await usersApi.createUser(payload);
    set({
      items: [created, ...get().items],
    });
    return created;
  },

  createServerUser: async (payload, servers) => {
    return await usersApi.createServerUser(payload, servers);
  },

  deleteServerUser: async (payload, servers) => {
    return await usersApi.deleteServerUser(payload, servers);
  },

  updateUser: async (id, patch) => {
    const updated = await usersApi.updateUser(id, patch);
    set({
      items: get().items.map((u) =>
        String(u.id) === String(id)
          ? {
              ...u,
              ...updated,
            }
          : u,
      ),
    });
    return updated;
  },

  deleteUser: async (id) => {
    await usersApi.deleteUser(id);
    set({
      items: get().items.filter((u) => String(u.id) !== String(id)),
    });
  },

  setItems: (items) => set({ items }),
  clearError: () => set({ error: null }),
}));
