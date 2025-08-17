import { create } from "zustand";
import { users as usersApi } from "@/api";
import type {
  AdminUser as ApiAdminUser,
  CreateAdminRequest,
  UpdateAdminRequest,
  PaginatedAdminsResponse,
  CreateUserRequest,
  CreateUserResponse,
} from "@/api/user";

export type UsersState = {
  admins: ApiAdminUser[];
  loading: boolean;
  error: string | null;
  fetchAdmins: (params?: {
    limit?: number;
    offset?: number;
  }) => Promise<PaginatedAdminsResponse>;
  createAdmin: (payload: CreateAdminRequest) => Promise<ApiAdminUser>;
  updateAdmin: (
    id: string | number,
    patch: UpdateAdminRequest,
  ) => Promise<ApiAdminUser>;
  deleteAdmin: (id: string | number) => Promise<void>;
  setAdmins: (admins: ApiAdminUser[]) => void;
  createUser: (
    user: CreateUserRequest,
    serverNames: string[],
    availableServers: Array<{
      id: string;
      name: string;
      url: string;
      port: number;
    }>,
  ) => Promise<CreateUserResponse>;
  deleteUser: (
    name: string,
    serverNames: string[],
    availableServers: Array<{
      id: string;
      name: string;
      url: string;
      port: number;
    }>,
  ) => Promise<CreateUserResponse>;
  clearError: () => void;
};

export const useUsersStore = create<UsersState>((set, get) => ({
  admins: [],
  loading: false,
  error: null,

  fetchAdmins: async (params) => {
    set({
      loading: true,
      error: null,
    });
    try {
      const res = await usersApi.listAdmins({
        limit: params?.limit,
        offset: params?.offset,
      });
      set({
        admins: res,
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

  createAdmin: async (payload) => {
    const created = await usersApi.createAdmin(payload);
    set({
      admins: [created, ...get().admins],
    });
    return created;
  },

  createUser: async (user, serverNames, availableServers) => {
    return await usersApi.createUser(user, serverNames, availableServers);
  },

  deleteUser: async (name, serverNames, availableServers) => {
    return await usersApi.deleteUser(name, serverNames, availableServers);
  },

  updateAdmin: async (id, patch) => {
    const updated = await usersApi.updateAdmin(id, patch);
    set({
      admins: get().admins.map((u) =>
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

  deleteAdmin: async (id) => {
    await usersApi.deleteAdmin(id);
    set({
      admins: get().admins.filter((u) => u.id !== id),
    });
  },

  setAdmins: (admins) => set({ admins }),
  clearError: () => set({ error: null }),
}));
