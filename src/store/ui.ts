import { create } from "zustand";

export type Theme = "light" | "dark";

export type UIState = {
  sidebarOpen: boolean;
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: "light",
  setTheme: (theme) => set({ theme }),
}));
