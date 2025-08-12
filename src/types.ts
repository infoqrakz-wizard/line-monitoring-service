export type Role = 'admin' | 'operator' | 'viewer';

export type User = {
    id: string;
    name: string;
    role: Role;
};

export type Problem = {
    id: string;
    title: string;
    status: 'active' | 'deferred';
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
    } | null;
    date_update: string;
};

export type GroupItem = {
    id: string;
    name: string;
    serverIds: string[];
};

export type ServerStatus = 'green' | 'yellow' | 'red';

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

export type ServerWithMonitoring = {
    id: string;
    sections: {
        main: ServerMonitoringData;
    };
    updated_at: number;
};

export type MonitoringResponse = {
    at: string;
    type: string;
    data: {
        servers: ServerWithMonitoring[];
        notFound: string[];
        total: number;
        at: number;
    };
};

export type SubscribeRequest = {
    type: 'subscribe';
    payload: {
        servers: string[];
        sections: string[];
    };
};
