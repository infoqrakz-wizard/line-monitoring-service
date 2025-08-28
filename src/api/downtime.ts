import { request } from "@/lib/request";
import type {
  DowntimeQueryRequest,
  DowntimeServerQueryRequest,
  DowntimeDeleteRequest,
  DowntimeEventResponse,
} from "@/types";

export const downtime = {
  query: async (
    filter: DowntimeQueryRequest,
  ): Promise<DowntimeEventResponse> => {
    return request.post<DowntimeEventResponse>("/api/downtime/query", filter);
  },

  queryByServer: async (
    serverRequest: DowntimeServerQueryRequest,
  ): Promise<DowntimeEventResponse> => {
    return request.post<DowntimeEventResponse>("/api/downtime/query", serverRequest);
  },

  delete: async (deleteRequest: DowntimeDeleteRequest): Promise<void> => {
    return request.delete<void>("/api/downtime", deleteRequest);
  },
};
