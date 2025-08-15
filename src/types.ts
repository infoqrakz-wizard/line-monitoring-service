export type Role = "admin" | "operator" | "viewer";

export type User = {
  id: string;
  name: string;
  role: Role;
};

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
        archive: {
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

export type ServerUser = {
  id: string;
  name: string;
  sc: string;
  description?: string;
  enabled?: boolean;
};

export type ServerWithMonitoring = {
  id: string;
  sections: {
    main: ServerMonitoringData;
    archiveState: ArchiveState;
    users: ServerUser[];
  };
  updated_at: number;
};

export type MonitoringData = {
  servers: ServerWithMonitoring[];
  users: ServerUser[];
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

export type WebSocketMessage = SubscribeRequest | UnsubscribeRequest;

// Расширенный тип сервера с данными мониторинга
export type ServerItemWithMonitoring = ServerItem & {
  monitoring?: ServerMonitoringData;
  archiveState?: ArchiveState;
  status?: ServerStatus;
};
