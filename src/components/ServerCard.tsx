import React from 'react';
import { Card, Text, Badge, Group, Divider, ActionIcon, Tooltip } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import type { ServerItemWithMonitoring, ServerStatus, ServerMonitoringData } from '@/types';

export type ServerCardProps = {
    server: ServerItemWithMonitoring;
    onDelete?: (url: string, port: number) => void;
};

const ServerCard: React.FC<ServerCardProps> = ({ server, onDelete }) => {
    const getStatusColor = (status: ServerStatus) => {
        switch (status) {
            case 'green':
                return 'green';
            case 'yellow':
                return 'yellow';
            case 'red':
                return 'red';
            default:
                return 'gray';
        }
    };

    const getStatusText = (status: ServerStatus) => {
        switch (status) {
            case 'green':
                return 'доступен';
            case 'yellow':
                return 'предупреждение';
            case 'red':
                return 'недоступен';
            default:
                return 'неизвестно';
        }
    };

    const formatCamerasDisplay = (monitoring?: ServerMonitoringData) => {
        if (!monitoring) return '-';

        const { totalCameras, enabledCameras, enabledWithProblemStream } = monitoring;
        const workingCameras = enabledCameras - enabledWithProblemStream;

        return (
            <Group gap="xs">
                <Badge color="dark" size="xs">
                    {totalCameras}
                </Badge>
                <Badge color="green" size="xs">
                    {workingCameras}
                </Badge>
                <Badge color="red" size="xs">
                    {enabledWithProblemStream}
                </Badge>
            </Group>
        );
    };

    const formatHddStatus = (monitoring?: ServerMonitoringData) => {
        if (!monitoring) return '-';

        if (monitoring.lastErrorTime === null) {
            return (
                <Badge color="green" size="xs">
                    OK
                </Badge>
            );
        } else {
            const errorDate = new Date(monitoring.lastErrorTime).toLocaleDateString();
            return (
                <Badge color="red" size="xs">
                    {errorDate}
                </Badge>
            );
        }
    };

    const statusColor = getStatusColor(server.status || 'red');

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" align="center">
                <div>
                    <Text size="sm" c="dimmed">
                        Имя сервера
                    </Text>
                    <Text fw={600}>{server.name}</Text>
                </div>
                <Badge color={statusColor} variant="light" radius="xl">
                    {getStatusText(server.status || 'red')}
                </Badge>
            </Group>

            <Divider my="sm" />

            <Group justify="space-between">
                <Text size="sm" c="dimmed">
                    URL:Порт
                </Text>
                <Text size="sm">
                    {server.url}:{server.port}
                </Text>
            </Group>
            <Divider my={6} />
            <Group justify="space-between">
                <Text size="sm" c="dimmed">
                    Камеры
                </Text>
                <div>{formatCamerasDisplay(server.monitoring)}</div>
            </Group>
            <Divider my={6} />
            <Group justify="space-between">
                <Text size="sm" c="dimmed">
                    HDD
                </Text>
                <div>{formatHddStatus(server.monitoring)}</div>
            </Group>
            <Divider my={6} />
            <Group justify="space-between">
                <Text size="sm" c="dimmed">
                    Uptime
                </Text>
                <Text size="sm">{server.monitoring?.uptime || '-'}</Text>
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
