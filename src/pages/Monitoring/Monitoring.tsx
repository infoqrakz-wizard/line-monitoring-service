import React from 'react';
import { Flex, Group, Title } from '@mantine/core';
import MonitoringSummary from '@/components/MonitoringSummary';
import MonitoringControls, { MonitoringView } from '@/components/MonitoringControls';
import MonitoringTable, { ProblemRow } from '@/components/MonitoringTable';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import classes from './Monitoring.module.css';

const Monitoring: React.FC = () => {
  const [view, setView] = React.useState<MonitoringView>('current');
  const [query, setQuery] = React.useState('');
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const handleOpenDelete = (_row: ProblemRow) => {
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    // TODO: integrate with API
    setConfirmOpen(false);
  };

  const summary = { servers: 123, cameras: 3567, postponed: 100, current: 13 };

  const currentRows: ProblemRow[] = [
    { time: '07:25:43', server: 'LC1', node: 'cam01', severity: 'critical', duration: '03:15' },
    { time: '07:25:43', server: 'LC1', node: 'micro90', severity: 'critical', duration: '03:15' },
    { time: '07:25:43', server: 'LC1', node: 'disk89', severity: 'critical', duration: '03:15' },
    { time: '07:25:43', server: 'LC1', node: '-', severity: 'critical', duration: '03:15' },
    { time: '07:25:43', server: 'LC1', node: 'cam01', severity: 'non-critical', duration: '03:15' },
    { time: '07:25:43', server: 'LC1', node: 'micro90', severity: 'non-critical', duration: '03:15' },
  ];

  const postponedRows: ProblemRow[] = [
    { time: '07:25:43', endTime: '08:25:43', server: 'LC1', node: 'cam01', severity: 'critical', duration: '03:15' },
    { time: '07:25:43', endTime: '09:45:43', server: 'LC1', node: 'micro90', severity: 'critical', duration: '03:15' },
    { time: '07:25:43', endTime: '08:15:43', server: 'LC1', node: 'disk89', severity: 'critical', duration: '03:15' },
    { time: '07:25:43', endTime: '12:25:43', server: 'LC1', node: 'cam01', severity: 'non-critical', duration: '03:15' },
  ];

  const rows = (view === 'current' ? currentRows : postponedRows).filter((r) =>
    [r.time, r.server, r.node, r.duration, r.endTime].filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className={classes.container}>
      <Flex direction="row" justify="space-between" align="center" className={classes.header}>
        <Title order={2}>Мониторинг</Title>
        <MonitoringSummary {...summary} />
      </Flex>

      <MonitoringControls view={view} onChangeView={setView} query={query} onChangeQuery={setQuery} />

      <MonitoringTable type={view} rows={rows} onDelete={handleOpenDelete} />

      <DeleteConfirmModal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default Monitoring;
