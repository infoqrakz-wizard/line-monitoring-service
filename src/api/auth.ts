import { request } from "@/lib/request";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access: string;
  user: {
    id: string;
    email: string;
    is_admin: boolean;
  };
};

export type RefreshResponse = {
  access: string;
};

export type MeResponse = {
  user: {
    id: string;
    email: string;
    is_admin: boolean;
    tv: number;
  };
};

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return request.post<LoginResponse>("/api/auth/login", credentials);
  },

  logout: async (): Promise<void> => {
    return request.post("/api/auth/logout");
  },

  refresh: async (): Promise<RefreshResponse> => {
    return request.post<RefreshResponse>("/api/auth/refresh");
  },

  me: async (): Promise<MeResponse> => {
    return request.get<MeResponse>("/api/auth/me");
  },
};
