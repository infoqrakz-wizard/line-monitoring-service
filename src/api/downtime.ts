import { request } from "@/lib/request";
import type {
  DowntimeQueryRequest,
  DowntimeDeleteRequest,
  DowntimeEventResponse,
} from "@/types";

export const downtime = {
  query: async (
    filter: DowntimeQueryRequest,
  ): Promise<DowntimeEventResponse> => {
    return request.post<DowntimeEventResponse>("/downtime/query", filter);
  },

  delete: async (deleteRequest: DowntimeDeleteRequest): Promise<void> => {
    return request.delete<void>("/downtime", deleteRequest);
  },
};
