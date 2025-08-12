import React, { useEffect, useMemo, useState } from 'react';
import { Stack, Title, Group, Button, SimpleGrid, ActionIcon, Tooltip, LoadingOverlay } from '@mantine/core';
import { IconPencil, IconTrash, IconPlus } from '@tabler/icons-react';
import SearchInput from '@/components/SearchInput';
import Table from '@/components/Table';
import ServerCard from '@/components/ServerCard';
import type { ServerItem } from '@/types';
import * as api from '@/api';

import classes from './Servers.module.css';

// const mock: ServerItem[] = [
//   { id: '1', name: 'IPC-F665P', ip: '34.182.173.247', status: 'online', password: 'pass01', port: '2222', serverName: 'server02' },
//   { id: '2', name: 'IPC-F665P', ip: '34.182.173.247', status: 'online', password: 'pass01', port: 'H.264', serverName: '-' },
//   { id: '3', name: 'IPC-F665P', ip: '34.182.173.247', status: 'online', password: 'pass01', port: 'H.264', serverName: '-' },
//   { id: '4', name: 'IPC-F665P', ip: '34.182.173.247', status: 'online', password: 'pass01', port: 'H.264', serverName: '-' },
//   { id: '5', name: 'IPC-F665P', ip: '34.182.173.247', status: 'online', password: 'pass01', port: 'H.264', serverName: '-' },
//   { id: '6', name: 'IPC-F665P', ip: '34.182.173.247', status: 'online', password: 'pass01', port: 'H.264', serverName: '-' },
//   { id: '7', name: 'IPC-F665P', ip: '34.182.173.247', status: 'offline', password: 'pass01', port: 'MJPEG/H.264', serverName: '-' },
// ];

const Servers: React.FC = () => {
  const [q, setQ] = useState('');
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const filtered = useMemo(() => {
    return servers?.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())) ?? [];
  }, [servers, q]);

  const handleDeleteServer = async (url: string, port: number) => {
    try {
      // Find the server in mock data to get IP and port
      const server = servers.find((s: ServerItem) => s.url === url && s.port === port);
      if (server) {
        // Note: This would need to be updated when using real API data
        await api.servers.deleteServer(server.url, server.port);
        // console.log('Deleting server:', serverId);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete server';
      setError(errorMessage);
      console.error('Failed to delete server:', err);
    }
  };


  useEffect(() => {
    const fetchServers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.servers.listServers();
        setServers(response.servers);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch servers';
        setError(errorMessage);
        console.error('Failed to fetch servers:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchServers();
  }, []);

  return (
    <Stack className={classes.wrapper} gap="md" pos="relative">
      <LoadingOverlay visible={loading} />
      {error && (
        <div style={{ color: 'red', padding: '16px', textAlign: 'center' }}>
          Ошибка: {error}
        </div>
      )}
      <div className={classes.header}>
        <Title order={1} size="h3">Серверы</Title>

        <div className={classes.controlsRowDesktop}>
          <div className={classes.legendGroup}>
            <span className={classes.legendItem}><span className={classes.dotOnline} /> Доступные</span>
            <span className={classes.legendItem}><span className={classes.dotOffline} /> Выключенные</span>
          </div>
          <Button variant="filled" aria-label="Добавить сервер" leftSection={<IconPlus size={16} />}>Добавить сервер</Button>
          <SearchInput value={q} onChange={setQ} placeholder="Найти сервер..." />
        </div>
      </div>

      <div className={classes.controlsColumnMobile}>
        <SearchInput value={q} onChange={setQ} placeholder="Найти сервер..." fullWidth />
        <div className={classes.filtersAndAddRow}>
          <div className={classes.legendRowMobile}>
            <span className={classes.legendItem}><span className={classes.dotOnline} /> Доступные</span>
            <span className={classes.legendItem}><span className={classes.dotOffline} /> Выключенные</span>
            <Button variant="filled" aria-label="Добавить сервер" leftSection={<IconPlus size={16} />}>Добавить сервер</Button>
          </div>
        </div>
      </div>

      <div className={classes.desktopTable}>
        <Table
          columns={[
            { key: 'name', header: 'Логин', render: (row: ServerItem) => (
              <Group gap="xs">
                <span className={row.status === 'online' ? classes.dotOnline : classes.dotOffline} />
                <strong>{row.name}</strong>
              </Group>
            ) },
            { key: 'password', header: 'Пароль', render: (row: ServerItem) => row.password ?? '-' },
            { key: 'ip', header: 'IP адрес' },
            { key: 'port', header: 'Порт', render: (row: ServerItem) => row.port ?? '-' },
            { key: 'serverName', header: 'Имя сервера', render: (row: ServerItem) => row.name ?? '-' },
            { key: 'actions', header: 'Действия', render: (row: ServerItem) => (
              <Group gap="xs">
                <Tooltip label="Редактировать"><ActionIcon variant="light" aria-label="Редактировать"><IconPencil size={16} /></ActionIcon></Tooltip>
                <Tooltip label="Удалить"><ActionIcon variant="light" color="red" aria-label="Удалить" onClick={() => handleDeleteServer(row.url, row.port)}><IconTrash size={16} /></ActionIcon></Tooltip>
              </Group>
            ) },
          ]}
          data={filtered}
          keyField="id"
        />
      </div>

      <div className={classes.mobileCards}>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {filtered.map((s) => (
            <ServerCard key={s.id} server={s} onDelete={handleDeleteServer} />
          ))}
        </SimpleGrid>
      </div>
    </Stack>
  );
};

export default Servers;
