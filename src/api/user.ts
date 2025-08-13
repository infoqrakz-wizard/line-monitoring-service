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
