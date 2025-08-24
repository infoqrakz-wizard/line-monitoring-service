import * as servers from "./servers";
import * as users from "./user";
import * as notifications from "./notifications";
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
export { notifications };
export type {
  TelegramSubscriber,
  CreateTelegramSubscriberRequest,
  UpdateTelegramSubscriberRequest,
  TelegramSubscribersResponse,
  TestTelegramMessageRequest,
} from "./notifications";
export { downtime };
export type {
  DowntimeEvent,
  DowntimeEventResponse,
  DowntimeFilter,
  DowntimeQueryRequest,
  DowntimeDeleteRequest,
} from "@/types";
