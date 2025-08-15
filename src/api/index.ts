import * as servers from "./servers";
import * as users from "./user";
import { downtime } from "./downtime";

export { servers };
export type {
  CreateServerRequest,
  UpdateServerRequest,
  PaginatedResponse,
} from "./servers";
export { users };
export type {
  AdminUser,
  CreateAdminRequest,
  UpdateAdminRequest,
  PaginatedAdminsResponse,
} from "./user";
export { downtime };
export type {
  DowntimeEvent,
  DowntimeEventResponse,
  DowntimeFilter,
  DowntimeQueryRequest,
  DowntimeDeleteRequest,
} from "@/types";
