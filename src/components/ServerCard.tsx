import React from 'react';
import { Card, Text, Badge, Group, Divider, ActionIcon, Tooltip } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import type { ServerItem } from '@/types';

export type ServerCardProps = {
  server: ServerItem;
  onDelete?: (url: string, port: number) => void;
};

const ServerCard: React.FC<ServerCardProps> = ({ server, onDelete }) => {
  const statusColor = server.enabled ? 'green' : 'red';

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" align="center">
        <div>
          <Text size="sm" c="dimmed">Логин</Text>
          <Text fw={600}>{server.name}</Text>
        </div>
        <Badge color={statusColor} variant="light" radius="xl">
          {server.enabled ? 'доступен' : 'выключен'}
        </Badge>
      </Group>

      <Divider my="sm" />

      <Group justify="space-between">
        <Text size="sm" c="dimmed">Пароль</Text>
        <Text size="sm">{server.password ?? '-'}</Text>
      </Group>
      <Divider my={6} />
      <Group justify="space-between">
        <Text size="sm" c="dimmed">URL</Text>
        <Text size="sm">{server.url}</Text>
      </Group>
      <Divider my={6} />
      <Group justify="space-between">
        <Text size="sm" c="dimmed">Порт</Text>
        <Text size="sm">{server.port ?? '-'}</Text>
      </Group>
      <Divider my={6} />
      <Group justify="space-between">
        <Text size="sm" c="dimmed">Имя сервера</Text>
        <Text size="sm">{server.name ?? '-'}</Text>
      </Group>

      <Group mt="md" justify="flex-start" gap="xs">
        <Tooltip label="Редактировать">
          <ActionIcon variant="light" aria-label="Редактировать">
            <IconPencil size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Удалить">
          <ActionIcon
            variant="light"
            color="red"
            aria-label="Удалить"
            onClick={() => onDelete?.(server.url, server.port)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Card>
  );
};

export default ServerCard;
