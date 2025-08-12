import React from 'react';
import { Stack, Title, Group, Button } from '@mantine/core';
import SearchInput from '@/components/SearchInput';
import Table from '@/components/Table';
import type { ServerItem } from '@/types';

const mock: ServerItem[] = [
  { id: '1', name: 'Server A', ip: '10.0.0.1', status: 'online' },
  { id: '2', name: 'Server B', ip: '10.0.0.2', status: 'offline' }
];

const Servers: React.FC = () => {
  const [q, setQ] = React.useState('');
  const data = mock.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <Stack gap="md">
      <Title order={1} size="h3">Серверы</Title>
      <Group>
        <SearchInput value={q} onChange={setQ} placeholder="Поиск серверов" />
        <Button variant="outline" aria-label="Create server">Добавить</Button>
      </Group>
      <Table
        columns={[
          { key: 'name', header: 'Имя' },
          { key: 'ip', header: 'IP' },
          { key: 'status', header: 'Статус' }
        ]}
        data={data}
        keyField="id"
      />
    </Stack>
  );
};

export default Servers;
