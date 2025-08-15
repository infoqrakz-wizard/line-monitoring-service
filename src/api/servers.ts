import { request } from "@/lib/request";
import { ServerItem } from "@/types";

export type CreateServerRequest = {
  url: string;
  port: number;
  username: string;
  password: string;
  name: string;
  enabled: boolean;
  maps?: {
    x: number;
    y: number;
  };
};

export type UpdateServerRequest = Partial<CreateServerRequest>;

export type PaginatedResponse<T> = {
  limit: number;
  nextCursor: string | null;
  servers: T[];
  total: number;
  totalPages: number;
};

const buildQueryString = (
  params: Record<string, string | number | undefined>,
): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
};

const buildUrlPort = (url: string, port: number | string): string =>
  `${url}:${port}`;

export const listServers = async (
  params: {
    limit?: number;
    offset?: number;
    search?: string;
    filter?: "all" | "active" | "inactive";
  } = {},
): Promise<PaginatedResponse<ServerItem>> => {
  const query = buildQueryString({
    limit: params.limit,
    offset: params.offset,
    search: params.search,
    filter: params.filter,
  });
  return request.get<PaginatedResponse<ServerItem>>(`/servers${query}`);
};

export const getServer = async (
  url: string,
  port: number,
): Promise<PaginatedResponse<ServerItem>> => {
  const query = buildQueryString({ urlPort: buildUrlPort(url, port) });
  return request.get<PaginatedResponse<ServerItem>>(`/servers${query}`);
};

export const createServer = async (
  payload: CreateServerRequest,
): Promise<ServerItem> => {
  return request.post<ServerItem>("/servers", payload);
};

export const updateServer = async (
  url: string,
  port: number,
  payload: UpdateServerRequest,
): Promise<ServerItem> => {
  const query = buildQueryString({ urlPort: buildUrlPort(url, port) });
  return request.patch<ServerItem>(`/servers${query}`, payload);
};

export const deleteServer = async (
  url: string,
  port: number,
): Promise<void> => {
  // const query = buildQueryString({ urlPort: buildUrlPort(url, port) });
  await request.delete<void>(`/servers?urlPort=${url}:${port}`);
};
