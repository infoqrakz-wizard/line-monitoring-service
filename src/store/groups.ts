import { create } from "zustand";
import type { GroupItem } from "@/types";
import { request } from "@/lib/request";

export type GroupsState = {
  items: GroupItem[];
  loading: boolean;
  error: string | null;
  fetchGroups: () => Promise<void>;
  createGroup: (payload: Omit<GroupItem, "id">) => Promise<GroupItem>;
  updateGroup: (
    id: string,
    patch: Partial<Omit<GroupItem, "id">>,
  ) => Promise<GroupItem>;
  deleteGroup: (id: string) => Promise<void>;
  setItems: (items: GroupItem[]) => void;
  clearError: () => void;
};

export const useGroupsStore = create<GroupsState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchGroups: async () => {
    set({
      loading: true,
      error: null,
    });
    try {
      const list = await request.get<GroupItem[]>("/groups");
      set({ items: list });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load groups";
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  createGroup: async (payload) => {
    const created = await request.post<GroupItem>("/groups", payload);
    set({ items: [created, ...get().items] });
    return created;
  },

  updateGroup: async (id, patch) => {
    const updated = await request.put<GroupItem>(`/groups/${id}`, patch);
    set({
      items: get().items.map((g) =>
        g.id === id
          ? {
              ...g,
              ...updated,
            }
          : g,
      ),
    });
    return updated;
  },

  deleteGroup: async (id) => {
    await request.delete(`/groups/${id}`);
    set({ items: get().items.filter((g) => g.id !== id) });
  },

  setItems: (items) => set({ items }),
  clearError: () => set({ error: null }),
}));
