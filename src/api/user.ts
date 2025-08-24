import { request } from "@/lib/request";

export type AdminUser = {
  id: number | string;
  email: string;
  is_admin: boolean;
};

export type CreateAdminRequest = {
  email: string;
  password: string;
  is_admin: boolean;
};

export type UpdateAdminRequest = Partial<CreateAdminRequest>;

export type PaginatedAdminsResponse = {
  limit: number;
  offset: number;
  pages: number;
  total: number;
  users: AdminUser[];
};

export type CreateUserRequest = {
  name: string;
  password: string;
  description: string;
};

export type DeleteUserRequest = {
  name: string;
  serverNames: string[];
};

export type CreateUserResponse = {
  results: {
    status: "ok" | "error";
    server: string;
  }[];
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

export const listAdmins = async (
  params: { limit?: number; offset?: number } = {},
): Promise<PaginatedAdminsResponse> => {
  const query = buildQueryString({
    limit: params.limit,
    offset: params.offset,
  });
  return request.get<PaginatedAdminsResponse>(`/api/users${query}`);
};

export const getAdmin = async (id: number | string): Promise<AdminUser> => {
  return request.get<AdminUser>(`/api/users/${id}`);
};

export const createAdmin = async (
  payload: CreateAdminRequest,
): Promise<AdminUser> => {
  return request.post<AdminUser>("/api/users", payload);
};

export const updateAdmin = async (
  id: number | string,
  payload: UpdateAdminRequest,
): Promise<AdminUser> => {
  return request.patch<AdminUser>(`/api/users/${id}`, payload);
};

export const deleteAdmin = async (id: number | string): Promise<void> => {
  await request.delete<void>(`/api/users/${id}`);
};

export const createUser = async (
  user: CreateUserRequest,
  serverNames: string[],
  availableServers: Array<{
    id: string;
    name: string;
    url: string;
    port: number;
  }>,
  options: {
    createOnUnavailableServers: boolean;
    createOnNewServers: boolean;
  },
): Promise<CreateUserResponse> => {
  let serverIdentifiers;

  if (serverNames.length === 0) {
    serverIdentifiers = availableServers.map((server) => {
      return `${server.url}:${server.port}`;
    });
  } else {
    serverIdentifiers = serverNames.map((serverName) => {
      const server = availableServers.find((s) => s.name === serverName);
      if (!server) {
        throw new Error(`Server with name "${serverName}" not found`);
      }
      return `${server.url}:${server.port}`;
    });
  }

  const apiPayload = {
    method: "create",
    user,
    servers: serverIdentifiers,
    options,
  };

  return request.post<CreateUserResponse>("/api/manage/users", apiPayload);
};

export const deleteUser = async (
  name: string,
  serverNames: string[],
  availableServers: Array<{
    id: string;
    name: string;
    url: string;
    port: number;
  }>,
): Promise<CreateUserResponse> => {
  const serverIdentifiers = serverNames.map((serverName) => {
    const server = availableServers.find((s) => s.name === serverName);
    if (!server) {
      throw new Error(`Server with name "${serverName}" not found`);
    }
    return `${server.url}:${server.port}`;
  });

  const apiPayload = {
    method: "delete",
    user: {
      name,
    },
    servers: serverIdentifiers,
  };

  return request.post<CreateUserResponse>("/api/manage/users", apiPayload);
};
