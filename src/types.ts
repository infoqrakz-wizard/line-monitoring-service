export type Problem = {
  id: string;
  title: string;
  status: "active" | "deferred";
  serverId: string;
  createdAt: string; // ISO date string
};

export type ServerItem = {
  id: number;
  url: string;
  port: number;
  username: string;
  password: string | null;
  name: string;
  enabled: boolean;
  address: string | null;
  maps: {
    x: number;
    y: number;
  };
  date_update: string;
};

export type GroupItem = {
  id: string;
  name: string;
  serverIds: string[];
};

// Мониторинг серверов
export type ServerStatus = "green" | "yellow" | "red";

export type ServerMonitoringData = {
  url: string;
  port: number;
  username: string;
  name: string;
  ok: boolean;
  status: number;
  uptime: string;
  lastErrorTime: string | null;
  totalCameras: number;
  enabledCameras: number;
  enabledWithProblemStream: number;
  enabledAllStreamsOk: number;
  updated_at: number;
};

export type ArchiveState = {
  id: number;
  result: {
    state: {
      storages: Array<{
        archive?: {
          dates_count: number;
          first_date: [number, number, number];
          last_date: [number, number, number];
        };
        available: boolean;
        free_space: number;
        path: string;
        write: {
          datarate: number;
          queue_size: number;
        };
      }>;
    };
  };
};

export type User = {
  id: string;
  email?: string;
  is_admin?: boolean;
  tv?: number;
  name: string;
  sc: string;
  description?: string;
  enabled?: boolean;
  role?: Role;
};

export type Role = "admin" | "user";

export type MediaStateResult = {
  id: number;
  result: {
    state: {
      cameras: {
        [key: string]: {
          enabled: boolean;
          streams: {
            audio?: {
              enabled: boolean;
              datarate: number;
              framerate: number;
            };
            video: {
              active: boolean;
              enabled: boolean;
              datarate: number;
              framerate: number;
            };
            video2: {
              active: boolean;
              enabled: boolean;
              datarate: number;
              framerate: number;
            };
          };
        };
      };
    };
  };
};

export type ServerWithMonitoring = {
  id: string;
  sections: {
    main: ServerMonitoringData;
    archiveState: ArchiveState;
    users: User[];
    camerasName?: CameraInfoResult;
    mediaState?: MediaStateResult;
  };
  updated_at: number;
};

export type MonitoringData = {
  servers: ServerWithMonitoring[];
  users: User[];
  notFound: string[];
  total: number;
  at: number;
};

export type MonitoringResponse = {
  at: string;
  type: string;
  data: MonitoringData;
};

// WebSocket типы
export type SubscribeRequest = {
  type: "subscribe";
  payload: {
    servers: string | string[];
    sections: string[];
  };
};

export type UnsubscribeRequest = {
  type: "unsubscribe";
};

export type AuthExpiringMessage = {
  type: "auth.expiring";
  msLeft: number;
};

export type WebSocketMessage =
  | SubscribeRequest
  | UnsubscribeRequest
  | AuthExpiringMessage;

// Расширенный тип сервера с данными мониторинга
export type ServerItemWithMonitoring = ServerItem & {
  monitoring?: ServerMonitoringData;
  archiveState?: ArchiveState;
  status?: ServerStatus;
};

export type DowntimeEventResponse = {
  data: DowntimeEvent[];
  meta: {
    page: number;
    pageSize: number;
    pages: number;
    total: number;
  };
};

// Downtime event types
export type DowntimeEvent = {
  id: number;
  url: string;
  port: number;
  down_at: string;
  up_at: string | null;
  acknowledged: boolean;
  comment: string;
  type: string | null;
};

export type DowntimeFilter = "servers_down" | "cameras_down" | "completed";

export type DowntimeQueryRequest = {
  filter: DowntimeFilter;
};

export type DowntimeDeleteRequest = {
  id?: number;
  url?: string;
  port?: number;
};

export type CameraInfo = {
  card_name: string;
  card_num: number;
  enabled: boolean;
  id: number;
  name: string;
};

// Camera and Media State types for server info page
export type CameraInfoResult = {
  id: number;
  result: {
    cameras: {
      [key: string]: {
        enabled: boolean;
        card_name: string;
        card_num: number;
        id: number;
        name: string;
      };
    };
  };
};

// Legacy MediaState type for backward compatibility
export type MediaState = {
  cameraId: number;
  main: {
    bitrate: number;
    fps: number;
  };
  sub: {
    bitrate: number;
    fps: number;
  };
  audio: {
    bitrate: number;
  };
  status: "working" | "error" | "offline";
};

// Queue types for postponed actions
export type QueueItem = {
  id: string;
  login: string;
  password: string;
  url: string | null;
  port: number | null;
};

export type QueueFilters = {
  url?: string | null;
  login?: string | null;
  q?: string | null;
};

export type GetQueueParams = {
  limit?: number;
  offset?: number;
  filters?: QueueFilters;
};

export type GetQueueResponse = {
  table: string;
  total: number;
  limit: number;
  offset: number;
  filters: QueueFilters;
  rows: QueueItem[];
};
