import { request } from "@/lib/request";

export type TelegramSubscriber = {
  id: string;
  bot_token: string;
  chat_id: string;
  enabled: boolean;
  servers_up_down: boolean;
  cameras_up_down: boolean;
  server_add_delete: boolean;
  user_auth: boolean;
  user_add_delete: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CreateTelegramSubscriberRequest = {
  bot_token: string;
  chat_id: string;
  enabled: boolean;
  servers_up_down: boolean;
  cameras_up_down: boolean;
  server_add_delete: boolean;
  user_auth: boolean;
  user_add_delete: boolean;
};

export type UpdateTelegramSubscriberRequest =
  Partial<CreateTelegramSubscriberRequest>;

export type TelegramSubscribersResponse = {
  ok: boolean;
  total: number;
  limit: number;
  offset: number;
  items: TelegramSubscriber[];
};

export type TestTelegramMessageRequest = {
  text: string;
};

export const listTelegramSubscribers = async (params: {
  limit?: number;
  offset?: number;
  enabled?: boolean;
  search?: string;
}): Promise<TelegramSubscribersResponse> => {
  const query = new URLSearchParams();
  if (params.limit) {
    query.set("limit", params.limit.toString());
  }
  if (params.offset) {
    query.set("offset", params.offset.toString());
  }
  if (params.enabled !== undefined) {
    query.set("enabled", params.enabled.toString());
  }
  if (params.search) {
    query.set("search", params.search);
  }

  return request.get<TelegramSubscribersResponse>(
    `/api/tg/subscribers${query.toString() ? `?${query.toString()}` : ""}`,
  );
};

export const createTelegramSubscriber = async (
  payload: CreateTelegramSubscriberRequest,
): Promise<{ subscriber: TelegramSubscriber }> => {
  return request.post<{ subscriber: TelegramSubscriber }>(
    "/api/tg/subscribers",
    payload,
  );
};

export const updateTelegramSubscriber = async (
  id: string,
  payload: UpdateTelegramSubscriberRequest,
): Promise<TelegramSubscriber> => {
  return request.patch<TelegramSubscriber>(
    `/api/tg/subscribers/${id}`,
    payload,
  );
};

export const deleteTelegramSubscriber = async (id: string): Promise<void> => {
  await request.delete<void>(`/api/tg/subscribers/${id}`);
};

export const testTelegramMessage = async (
  payload: TestTelegramMessageRequest,
): Promise<void> => {
  await request.post<void>("/api/tg/test", payload);
};
