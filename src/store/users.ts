import { create } from 'zustand';
import type { User } from '@/types';
import { request } from '@/lib/request';

export type UsersState = {
  items: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  createUser: (payload: Omit<User, 'id'>) => Promise<User>;
  updateUser: (id: string, patch: Partial<Omit<User, 'id'>>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  setItems: (items: User[]) => void;
  clearError: () => void;
};

export const useUsersStore = create<UsersState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({
      loading: true,
      error: null
    });
    try {
      const list = await request.get<User[]>('/users');
      set({ items: list });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load users';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  createUser: async (payload) => {
    const created = await request.post<User>('/users', payload);
    set({ items: [created, ...get().items] });
    return created;
  },

  updateUser: async (id, patch) => {
    const updated = await request.put<User>(`/users/${id}`, patch);
    set({
      items: get().items.map((u) => (u.id === id ? {
        ...u,
        ...updated
      } : u))
    });
    return updated;
  },

  deleteUser: async (id) => {
    await request.delete(`/users/${id}`);
    set({ items: get().items.filter((u) => u.id !== id) });
  },

  setItems: (items) => set({ items }),
  clearError: () => set({ error: null }),
}));


