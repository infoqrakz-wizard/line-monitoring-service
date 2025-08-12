import React from 'react';
import { Button, Checkbox, Group, Stack, Title, Tabs, Badge, Text } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import SearchInput from '@/components/SearchInput';
import classes from './Users.module.css';

type UserItem = {
  id: string;
  login: string;
  isAdmin?: boolean;
  description?: string;
  servers: string[];
  actionsCount?: number;
  deletable?: boolean;
};

const mockUsers: UserItem[] = [
  {
    id: 'u1',
    login: 'admin',
    isAdmin: true,
    description: 'описание пользователя',
    servers: [
      'Калинина, 374',
      'Чкалова, 21',
      'Гагарина, 45',
      'Ленина, 456',
      'Красная, 45',
      'Энтузиастов, 4567',
      'Чкалова, 21',
      'Гагарина, 45',
      'Ленина, 456',
      'Красная, 45',
      'Энтузиастов, 4567',
      'Чкалова, 21',
      'Гагарина, 45',
      'Ленина, 456',
      'Красная, 45',
      'Энтузиастов, 4567',
    ],
    actionsCount: 457,
    deletable: false,
  },
  {
    id: 'u2',
    login: 'user 456',
    description: 'описание пользователя',
    servers: [
      'Калинина, 374',
      'Чкалова, 21',
      'Гагарина, 45',
      'Ленина, 456',
      'Красная, 45',
      'Энтузиастов, 4567',
      'Чкалова, 21',
      'Гагарина, 45',
      'Ленина, 456',
    ],
    actionsCount: 7,
    deletable: true,
  },
  { id: 'u3', login: 'monica', description: 'описание пользователя', servers: ['Калинина, 374'], actionsCount: 17, deletable: true },
  { id: 'u4', login: 'star', description: 'описание пользователя', servers: [
    'Калинина, 374','Чкалова, 21','Гагарина, 45','Ленина, 456','Красная, 45','Энтузиастов, 4567','Чкалова, 21','Гагарина, 45','Ленина, 456','Красная, 45','Энтузиастов, 4567','Чкалова, 21','Гагарина, 45','Ленина, 456','Красная, 45','Энтузиастов, 4567'
  ], actionsCount: 1, deletable: true },
  { id: 'u5', login: 'root', description: 'описание пользователя', servers: ['Калинина, 374'], actionsCount: 1, deletable: true },
];

type LogItem = { id: string; kind: 'success' | 'error' | 'warning' | 'pending'; text: string; time: string; date: string };

const logItems: LogItem[] = [
  { id: 'l1', kind: 'success', text: 'Пользователь «user456» удален на Чкалова, 270', time: '14:13:45', date: '20.05.2025' },
  { id: 'l2', kind: 'error', text: 'Не удалось добавить «user456» на Чкалова, 270', time: '14:13:45', date: '20.05.2025' },
  { id: 'l3', kind: 'warning', text: 'Пользователь «user456» не найден на Чкалова, 270', time: '14:13:45', date: '20.05.2025' },
  { id: 'l4', kind: 'success', text: 'Пользователь «user456» удален на Чкалова, 270', time: '14:13:45', date: '20.05.2025' },
  { id: 'l5', kind: 'error', text: 'Не удалось добавить «user456» на Чкалова, 270', time: '14:13:45', date: '20.05.2025' },
  { id: 'l6', kind: 'warning', text: 'Пользователь «user456» не найден на Чкалова, 270', time: '14:13:45', date: '20.05.2025' },
];

const pendingItems: LogItem[] = [
  { id: 'p1', kind: 'pending', text: 'Пользователь «user456»  удален на Чкалова, 270', time: '14:13:45', date: '20.05.2025' },
  { id: 'p2', kind: 'pending', text: 'Пользователь «user456»  удален на Чкалова, 270', time: '14:13:45', date: '20.05.2025' },
  { id: 'p3', kind: 'pending', text: 'Пользователь «user456»  удален на Чкалова, 270', time: '14:13:45', date: '20.05.2025' },
];

const Users: React.FC = () => {
  const [q, setQ] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [expandedServers, setExpandedServers] = React.useState<Record<string, boolean>>({});

  const filtered = React.useMemo(() => {
    const query = q.toLowerCase();
    return mockUsers.filter((u) =>
      [
        u.login,
        u.description ?? '',
        u.servers.join(' '),
      ].join(' ').toLowerCase().includes(query)
    );
  }, [q]);

  const handleToggleAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    const next = new Set<string>();
    filtered.forEach((u) => {
      if (u.deletable !== false) next.add(u.id);
    });
    setSelectedIds(next);
  };

  const handleToggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const selectedCount = selectedIds.size;

  const shownCount = filtered.length; // For the tab counter demo

  const handleToggleExpand = (id: string) => {
    setExpandedServers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderServers = (user: UserItem) => {
    const limit = 8;
    const isExpanded = !!expandedServers[user.id];
    const items = isExpanded ? user.servers : user.servers.slice(0, limit);
    const hasMore = user.servers.length > limit;
    return (
      <div>
        <div className={classes.serverList}>
          {items.map((addr, idx) => (
            <span key={`${user.id}-srv-${idx}`} className={classes.serverItem}>
              {addr}{idx < items.length - 1 ? ' •' : ''}
            </span>
          ))}
        </div>
        {hasMore && (
          <button
            type="button"
            className={classes.serverMore}
            onClick={() => handleToggleExpand(user.id)}
            aria-label={isExpanded ? 'Скрыть' : 'Показать все'}
          >
            {isExpanded ? 'Скрыть' : 'См. все'}
          </button>
        )}
      </div>
    );
  };

  return (
    <Stack className={classes.wrapper} gap="md">
      <div className={classes.header}>
        <Title order={1} size="h3">Пользователи</Title>
        <div className={classes.actionsDesktop}>
          <Button variant="filled" leftSection={<IconPlus size={16} />} aria-label="Добавить пользователя">
            Добавить пользователя
          </Button>
          <SearchInput value={q} onChange={setQ} placeholder="Найти пользователя..." />
        </div>
      </div>

      <div className={classes.actionsMobile}>
        <SearchInput value={q} onChange={setQ} placeholder="Найти пользователя..." fullWidth />
        <Button variant="filled" leftSection={<IconPlus size={16} />} aria-label="Добавить пользователя" className={classes.addMobile}>
          Добавить пользователя
        </Button>
      </div>

      <Tabs defaultValue="users" className={classes.tabsRoot} keepMounted={false}>
        <Tabs.List className={classes.tabsList}>
          <Tabs.Tab value="users">Пользователи <span className={classes.count}>({shownCount})</span></Tabs.Tab>
          <Tabs.Tab value="logs">Логи событий</Tabs.Tab>
          <Tabs.Tab value="postponed">Отложенные действия</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="users">
          <div className={classes.topBar}>
            <Checkbox
              label="Выбрать всех"
              onChange={(e) => handleToggleAll(e.currentTarget.checked)}
            />
            <Button
              leftSection={<IconTrash size={16} />}
              variant="light"
              className={classes.deleteBtn}
              disabled={selectedCount === 0}
              aria-label="Удалить пользователей"
            >
              Удалить пользователей <span className={classes.count}>({selectedCount})</span>
            </Button>
          </div>

          <div className={classes.table} role="table" aria-label="Список пользователей">
            <div className={`${classes.row} ${classes.headerRow}`} role="row">
              <div className={`${classes.col} ${classes.inputCol}`} role="columnheader" aria-hidden="true" />
              <div className={`${classes.col} ${classes.userCol}`} role="columnheader">Пользователь (логин)</div>
              <div className={`${classes.col} ${classes.serverCol}`} role="columnheader">Сервер</div>
              <div className={`${classes.col} ${classes.deleteCol}`} role="columnheader" aria-hidden="true" />
            </div>

            {filtered.map((u) => {
              const isSelected = selectedIds.has(u.id);
              return (
                <div key={u.id} className={classes.row} role="row">
                  <div className={`${classes.col} ${classes.inputCol}`} role="cell">
                    <Checkbox
                      checked={isSelected}
                      onChange={(e) => handleToggleOne(u.id, e.currentTarget.checked)}
                      aria-label={`Выбрать пользователя ${u.login}`}
                      disabled={u.deletable === false}
                    />
                  </div>

                  <div className={`${classes.col} ${classes.userCol}`} role="cell">
                    <div className={classes.userInfo}>
                      <p className={classes.userName}>
                        {u.login} {u.isAdmin && <span aria-label="Администратор">⭐</span>}
                      </p>
                      {typeof u.actionsCount === 'number' && (
                        <div className={classes.badge}>{u.actionsCount}</div>
                      )}
                    </div>
                    {u.description && (
                      <p className={classes.userDesc}>{u.description}</p>
                    )}
                  </div>

                  <div className={`${classes.col} ${classes.serverCol}`} role="cell">
                    {renderServers(u)}
                  </div>

                  <div className={`${classes.col} ${classes.deleteCol}`} role="cell">
                    <Button
                      className={classes.deleteIcon}
                      variant="light"
                      color="red"
                      aria-label={`Удалить пользователя ${u.login}`}
                      disabled={u.deletable === false}
                    >
                      <IconTrash size={16} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="logs">
          <div className={classes.logsList}>
            {logItems.map((l) => (
              <div key={l.id} className={`${classes.logItem} ${classes[l.kind]}`}>
                <div className={classes.logIcon} aria-hidden="true" />
                <div className={classes.logText}>{l.text}</div>
                <div className={classes.logTime}>
                  <span className={classes.logTimePeriod}>{l.time}</span>
                  <span className={classes.separator}>•</span>
                  <span className={classes.logTimeDate}>{l.date}</span>
                </div>
              </div>
            ))}
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="postponed">
          <div className={classes.logsList}>
            {pendingItems.map((l) => (
              <div key={l.id} className={`${classes.logItem} ${classes[l.kind]}`}>
                <div className={classes.logIcon} aria-hidden="true" />
                <div className={classes.logText}>{l.text}</div>
                <div className={classes.logTime}>
                  <span className={classes.logTimePeriod}>{l.time}</span>
                  <span className={classes.separator}>•</span>
                  <span className={classes.logTimeDate}>{l.date}</span>
                </div>
              </div>
            ))}
          </div>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};

export default Users;


