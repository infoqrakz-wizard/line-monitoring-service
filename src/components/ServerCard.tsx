import React from 'react';
import type { ServerItem } from '@/types';

export type ServerCardProps = {
  server: ServerItem;
};

const ServerCard: React.FC<ServerCardProps> = ({ server }) => {
  const statusColor = server.status === 'online' ? 'text-green-600' : 'text-red-600';
  return (
    <div className="border rounded p-3 flex flex-col gap-1">
      <div className="font-medium">{server.name}</div>
      <div className="text-sm text-gray-600">{server.ip}</div>
      <div className={`text-sm ${statusColor}`}>{server.status}</div>
    </div>
  );
};

export default ServerCard;
