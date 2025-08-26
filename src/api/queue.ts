import { request } from "@/lib/request";
import type { GetQueueParams, GetQueueResponse } from "@/types";

export const getQueue = async (
  params: GetQueueParams = {},
): Promise<GetQueueResponse> => {
  const { limit = 100, offset = 0, filters = {} } = params;

  const requestBody = {
    limit,
    offset,
    filters,
  };

  return await request.get<GetQueueResponse>("/api/ops/queue", {
    method: "GET",
    body: JSON.stringify(requestBody),
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const deleteQueueItem = async (id: string): Promise<void> => {
  await request.delete(`/api/ops/queue/${id}`);
};
