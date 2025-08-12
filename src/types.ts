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
  id: string;
  name: string;
  ip: string;
  status: 'online' | 'offline';
  groupId?: string;
};

export type GroupItem = {
  id: string;
  name: string;
  serverIds: string[];
};
