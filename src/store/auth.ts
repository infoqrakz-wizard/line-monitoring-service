import { create } from 'zustand';
import type { Role, User } from '@/types';

export type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: Role | null;
  login: (payload: { user: User; token: string }) => void;
  logout: () => void;
  setToken: (token: string | null) => void;
};

const STORAGE_KEY = 'lms_auth';

const readPersisted = (): Pick<AuthState, 'user' | 'token'> => {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (!text) {return {
      user: null,
      token: null
    };}
    const parsed = JSON.parse(text) as { user: User | null; token: string | null };
    return {
      user: parsed.user ?? null,
      token: parsed.token ?? null
    };
  } catch {
    return {
      user: null,
      token: null
    };
  }
};

export const useAuthStore = create<AuthState>((set) => {
  const persisted = typeof window !== 'undefined' ? readPersisted() : {
    user: null,
    token: null
  };
  return {
    user: persisted.user,
    token: persisted.token,
    isAuthenticated: Boolean(persisted.token && persisted.user),
    role: persisted.user?.role ?? null,
    login: ({ user, token }) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        user,
        token
      }));
      set({
        user,
        token,
        isAuthenticated: true,
        role: user.role
      });
    },
    logout: () => {
      localStorage.removeItem(STORAGE_KEY);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        role: null
      });
    },
    setToken: (token) => {
      const current = readPersisted();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        user: current.user,
        token
      }));
      set({
        token,
        isAuthenticated: Boolean(token && current.user)
      });
    }
  };
});
