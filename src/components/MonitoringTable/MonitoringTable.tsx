import React from 'react';
import classes from './MonitoringTable.module.css';

export type ProblemRow = {
  time: string;
  server: string;
  node: string;
  severity: 'critical' | 'non-critical';
  duration: string;
  endTime?: string; // for postponed
};

export type MonitoringTableProps = {
  type: 'current' | 'postponed';
  rows: ProblemRow[];
  onDelete?: (row: ProblemRow) => void;
};

const MonitoringTable: React.FC<MonitoringTableProps> = ({ type, rows, onDelete }) => {
  const isPostponed = type === 'postponed';

  return (
    <div className={`${classes.table} ${isPostponed ? classes.postponed : classes.current}`}>
      <table className={classes.eventLog}>
        <thead>
          <tr>
            {isPostponed ? (
              <>
                <th>Начало</th>
                <th>Окончание</th>
                <th>Сервер</th>
                <th>Узел</th>
                <th>Важность</th>
                <th>Длительность</th>
                <th></th>
              </>
            ) : (
              <>
                <th>Время</th>
                <th>Сервер</th>
                <th>Узел</th>
                <th>Важность</th>
                <th>Длительность</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}>
              {isPostponed ? (
                <>
                  <td>{r.time}</td>
                  <td>{r.endTime ?? '-'}</td>
                  <td>{r.server}</td>
                  <td>{r.node}</td>
                  <td className={r.severity === 'critical' ? classes.critical : classes.nonCritical}>
                    <span className={classes.icon} /> {r.severity === 'critical' ? 'критично' : 'некритично'}
                  </td>
                  <td>{r.duration}</td>
                  <td>
                    <button
                      className={classes.deleteBtn}
                      title="Удалить"
                      onClick={() => onDelete?.(r)}
                    />
                  </td>
                </>
              ) : (
                <>
                  <td>{r.time}</td>
                  <td>{r.server}</td>
                  <td>{r.node}</td>
                  <td className={r.severity === 'critical' ? classes.critical : classes.nonCritical}>
                    <span className={classes.icon} /> {r.severity === 'critical' ? 'критично' : 'некритично'}
                  </td>
                  <td>{r.duration}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MonitoringTable;
