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

export type PaginatedAdminsResponse = AdminUser[];

export type CreateUserRequest = {
  name: string;
  password: string;
  description: string;
};

export type DeleteUserRequest = {
  name: string;
  serverIds: string[];
};

export type CreateUserResponse = {
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

export const listAdmins = async (
  params: { limit?: number; offset?: number } = {},
): Promise<PaginatedAdminsResponse> => {
  const query = buildQueryString({
    limit: params.limit,
    offset: params.offset,
  });
  return request.get<PaginatedAdminsResponse>(`/users${query}`);
};

export const getAdmin = async (id: number | string): Promise<AdminUser> => {
  return request.get<AdminUser>(`/users/${id}`);
};

export const createAdmin = async (
  payload: CreateAdminRequest,
): Promise<AdminUser> => {
  return request.post<AdminUser>("/users", payload);
};

export const updateAdmin = async (
  id: number | string,
  payload: UpdateAdminRequest,
): Promise<AdminUser> => {
  return request.patch<AdminUser>(`/users/${id}`, payload);
};

export const deleteAdmin = async (id: number | string): Promise<void> => {
  await request.delete<void>(`/users/${id}`);
};

export const createUser = async (
  user: CreateUserRequest,
  servers: string[],
): Promise<CreateUserResponse> => {
  // Форматируем данные для API
  const apiPayload = {
    method: "create",
    user,
    servers,
  };

  return request.post<CreateUserResponse>("/manage/users", apiPayload);
};

export const deleteUser = async (
  name: string,
  serverIds: string[],
): Promise<CreateUserResponse> => {
  // Форматируем данные для API
  const apiPayload = {
    method: "delete",
    user: {
      name,
    },
    servers: serverIds,
  };

  return request.post<CreateUserResponse>("/manage/users", apiPayload);
};
