import React from 'react';
import { Card, Text, Badge } from '@mantine/core';
import type { ServerItem } from '@/types';

export type ServerCardProps = {
  server: ServerItem;
};

const ServerCard: React.FC<ServerCardProps> = ({ server }) => {
  const statusColor = server.status === 'online' ? 'green' : 'red';
  
  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Text fw={500} size="md">{server.name}</Text>
      <Text size="sm" c="dimmed" mt={4}>{server.ip}</Text>
      <Badge color={statusColor} variant="light" mt={8}>
        {server.status}
      </Badge>
    </Card>
  );
};

export default ServerCard;
