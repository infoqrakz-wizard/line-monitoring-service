import React from 'react';
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
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Серверы</h1>
      <div className="flex items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Поиск серверов" />
        <button className="px-3 py-2 border rounded" aria-label="Create server">Добавить</button>
      </div>
      <Table
        columns={[
          { key: 'name', header: 'Имя' },
          { key: 'ip', header: 'IP' },
          { key: 'status', header: 'Статус' }
        ]}
        data={data}
        keyField="id"
      />
    </div>
  );
};

export default Servers;
