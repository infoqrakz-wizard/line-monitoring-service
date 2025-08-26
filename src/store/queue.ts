import { create } from "zustand";
import { QueueItem, GetQueueParams } from "@/types";
import { getQueue, deleteQueueItem } from "@/api/queue";

type QueueStore = {
  // State
  items: QueueItem[];
  total: number;
  loading: boolean;
  error: string | null;

  // Actions
  loadQueue: (params?: GetQueueParams) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
};

const initialState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
};

export const useQueueStore = create<QueueStore>((set, get) => ({
  ...initialState,

  loadQueue: async (params = {}) => {
    try {
      set({
        loading: true,
        error: null,
      });

      const response = await getQueue(params);

      set({
        items: response.rows,
        total: response.total,
        loading: false,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Не удалось загрузить отложенные действия";
      set({
        loading: false,
        error: message,
      });
      throw error;
    }
  },

  deleteItem: async (id: string) => {
    try {
      set({ error: null });

      await deleteQueueItem(id);

      // Remove item from local state
      const currentItems = get().items;
      const updatedItems = currentItems.filter((item) => item.id !== id);

      set({
        items: updatedItems,
        total: get().total - 1,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Не удалось удалить отложенное действие";
      set({ error: message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
