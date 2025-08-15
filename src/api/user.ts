import { request } from "@/lib/request";

export type UserItem = {
  id: number | string;
  email: string;
  is_admin: boolean;
};

export type CreateUserRequest = {
  email: string;
  password: string;
  is_admin: boolean;
};

export type UpdateUserRequest = Partial<CreateUserRequest>;

export type PaginatedUsersResponse = UserItem[];

export type CreateServerUserRequest = {
  name: string;
  password: string;
  description: string;
  serverIds: string[];
};

export type DeleteServerUserRequest = {
  name: string;
  serverIds: string[];
};

export type CreateServerUserResponse = {
  success: boolean;
  message?: string;
  errors?: string[];
};

const buildQueryString = (
  params: Record<string, string | number | boolean | undefined | null>,
): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
};

export const listUsers = async (
  params: { limit?: number; offset?: number } = {},
): Promise<PaginatedUsersResponse> => {
  const query = buildQueryString({
    limit: params.limit,
    offset: params.offset,
  });
  return request.get<PaginatedUsersResponse>(`/users${query}`);
};

export const getUser = async (id: number | string): Promise<UserItem> => {
  return request.get<UserItem>(`/users/${id}`);
};

export const createUser = async (
  payload: CreateUserRequest,
): Promise<UserItem> => {
  return request.post<UserItem>("/users", payload);
};

export const updateUser = async (
  id: number | string,
  payload: UpdateUserRequest,
): Promise<UserItem> => {
  return request.patch<UserItem>(`/users/${id}`, payload);
};

export const deleteUser = async (id: number | string): Promise<void> => {
  await request.delete<void>(`/users/${id}`);
};

export const createServerUser = async (
  payload: CreateServerUserRequest,
  servers: Array<{ url: string; port: number }>,
): Promise<CreateServerUserResponse> => {
  // Форматируем данные для API
  const apiPayload = {
    method: "create",
    user: {
      name: payload.name,
      password: payload.password,
      description: payload.description,
    },
    servers: payload.serverIds.map((serverId) => {
      const server = servers.find((s) => s.url === serverId);
      return server ? `${server.url}:${server.port}` : serverId;
    }),
  };

  return request.post<CreateServerUserResponse>("/manage/users", apiPayload);
};

export const deleteServerUser = async (
  payload: DeleteServerUserRequest,
  servers: Array<{ url: string; port: number }>,
): Promise<CreateServerUserResponse> => {
  // Форматируем данные для API
  const apiPayload = {
    method: "delete",
    user: {
      name: payload.name,
    },
    servers: payload.serverIds.map((serverId) => {
      const server = servers.find((s) => s.url === serverId);
      return server ? `${server.url}:${server.port}` : serverId;
    }),
  };

  return request.post<CreateServerUserResponse>("/manage/users", apiPayload);
};
