import React, { useEffect, useMemo, useState } from 'react';
import { Stack, Title, Group, Button, SimpleGrid, ActionIcon, Tooltip, LoadingOverlay } from '@mantine/core';
import { IconPencil, IconTrash, IconPlus } from '@tabler/icons-react';
import SearchInput from '@/components/SearchInput';
import Table from '@/components/Table';
import ServerCard from '@/components/ServerCard';
import type { ServerItem } from '@/types';
import { useServersStore } from '@/store/servers';

import classes from './Servers.module.css';

// const mock: ServerItem[] = [
//   {
//     id: '1',
//     name: 'IPC-F665P',
//     ip: '34.182.173.247',
//     status: 'online',
//     password: 'pass01',
//     port: '2222',
//     serverName: 'server02'
//   },
//   {
//     id: '2',
//     name: 'IPC-F665P',
//     ip: '34.182.173.247',
//     status: 'online',
//     password: 'pass01',
//     port: 'H.264',
//     serverName: '-'
//   },
//   {
//     id: '3',
//     name: 'IPC-F665P',
//     ip: '34.182.173.247',
//     status: 'online',
//     password: 'pass01',
//     port: 'H.264',
//     serverName: '-'
//   },
//   {
//     id: '4',
//     name: 'IPC-F665P',
//     ip: '34.182.173.247',
//     status: 'online',
//     password: 'pass01',
//     port: 'H.264',
//     serverName: '-'
//   },
//   {
//     id: '5',
//     name: 'IPC-F665P',
//     ip: '34.182.173.247',
//     status: 'online',
//     password: 'pass01',
//     port: 'H.264',
//     serverName: '-'
//   },
//   {
//     id: '6',
//     name: 'IPC-F665P',
//     ip: '34.182.173.247',
//     status: 'online',
//     password: 'pass01',
//     port: 'H.264',
//     serverName: '-'
//   },
//   {
//     id: '7',
//     name: 'IPC-F665P',
//     ip: '34.182.173.247',
//     status: 'offline',
//     password: 'pass01',
//     port: 'MJPEG/H.264',
//     serverName: '-'
//   },
// ];

const Servers: React.FC = () => {
  const [q, setQ] = useState('');
  const { items, loading, error, fetchServers, deleteServer } = useServersStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const handleClickFilter = (filter: 'all' | 'active' | 'inactive') => {
    if (filter === 'active' && activeFilter === 'active') {
      setActiveFilter('all');
    } else if (filter === 'inactive' && activeFilter === 'inactive') {
      setActiveFilter('all');
    } else {
      setActiveFilter(filter);
    }
  };

  const filtered = useMemo(() => {
    return items?.filter((s) => {
      if (activeFilter === 'active') {
        return s.enabled;
      } else if (activeFilter === 'inactive') {
        return !s.enabled;
      } else {
        return items;
        // return s.name.toLowerCase().includes(q.toLowerCase());
      }
    }) ?? [];
  }, [items, activeFilter]);

  const handleDeleteServer = async (url: string, port: number) => {
    await deleteServer(url, port);
  };


  useEffect(() => {
    void fetchServers();
  }, [fetchServers]);

  return (
    <Stack className={classes.wrapper} gap="md" pos="relative">
      <LoadingOverlay visible={loading} />
      {error && (
        <div style={{
          color: 'red',
          padding: '16px',
          textAlign: 'center'
        }}>
          Ошибка: {error}
        </div>
      )}
      <div className={classes.header}>
        <Title order={1} size="h3">Серверы</Title>

        <div className={classes.controlsRowDesktop}>
          <div className={classes.legendGroup}>
            <div className={`${classes.legendItem} ${activeFilter === 'active' ? classes.activeFilter : ''}`} onClick={() => handleClickFilter('active')}>
              <span className={classes.dotOnline} />
              Доступные
            </div>
            <div className={`${classes.legendItem} ${activeFilter === 'inactive' ? classes.activeFilter : ''}`} onClick={() => handleClickFilter('inactive')}>
              <span className={classes.dotOffline} />
              Выключенные
            </div>
          </div>
          <Button variant="filled" aria-label="Добавить сервер" leftSection={<IconPlus size={16} />}>Добавить сервер</Button>
          <SearchInput value={q} onChange={setQ} placeholder="Найти сервер..." />
        </div>
      </div>

      <div className={classes.controlsColumnMobile}>
        <SearchInput value={q} onChange={setQ} placeholder="Найти сервер..." fullWidth />
        <div className={classes.filtersAndAddRow}>
          <div className={classes.legendRowMobile}>
            <div className={`${classes.legendItem} ${activeFilter === 'active' ? classes.activeFilter : ''}`} onClick={() => handleClickFilter('active')}>
              <span className={classes.dotOnline} />
              Доступные
            </div>
            <div className={`${classes.legendItem} ${activeFilter === 'inactive' ? classes.activeFilter : ''}`} onClick={() => handleClickFilter('inactive')}>
              <span className={classes.dotOffline} />
              Выключенные
            </div>
            <Button variant="filled" aria-label="Добавить сервер" leftSection={<IconPlus size={16} />}>Добавить сервер</Button>
          </div>
        </div>
      </div>

      <div className={classes.desktopTable}>
        <Table
          columns={[
            {
              key: 'name',
              header: 'Логин',
              render: (row: ServerItem) => (
                <Group gap="xs">
                  <span className={row.enabled ? classes.dotOnline : classes.dotOffline} />
                  <strong>{row.name}</strong>
                </Group>
              )
            },
            {
              key: 'password',
              header: 'Пароль',
              render: (row: ServerItem) => row.password ?? '-'
            },
            {
              key: 'url',
              header: 'URL'
            },
            {
              key: 'port',
              header: 'Порт',
              render: (row: ServerItem) => row.port ?? '-'
            },
            {
              key: 'serverName',
              header: 'Имя сервера',
              render: (row: ServerItem) => row.name ?? '-'
            },
            {
              key: 'actions',
              header: 'Действия',
              render: (row: ServerItem) => (
                <Group gap="xs">
                  <Tooltip label="Редактировать"><ActionIcon variant="light" aria-label="Редактировать"><IconPencil size={16} /></ActionIcon></Tooltip>
                  <Tooltip label="Удалить"><ActionIcon variant="light" color="red" aria-label="Удалить" onClick={() => handleDeleteServer(row.url, row.port)}><IconTrash size={16} /></ActionIcon></Tooltip>
                </Group>
              )
            },
          ]}
          data={filtered}
          keyField="id"
        />
      </div>

      <div className={classes.mobileCards}>
        <SimpleGrid cols={{
          base: 1,
          sm: 2
        }} spacing="md">
          {filtered.map((s) => (
            <ServerCard key={s.id} server={s} onDelete={handleDeleteServer} />
          ))}
        </SimpleGrid>
      </div>
    </Stack>
  );
};

export default Servers;
