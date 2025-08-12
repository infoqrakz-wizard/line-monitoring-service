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
