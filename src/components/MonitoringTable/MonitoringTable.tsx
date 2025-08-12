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
      <div className={classes.list} role="table" aria-label={isPostponed ? 'Отложенные проблемы' : 'Актуальные проблемы'}>
        <div className={classes.header} role="row">
          {isPostponed ? (
            <>
              <div className={classes.headerCell} role="columnheader">Начало</div>
              <div className={classes.headerCell} role="columnheader">Окончание</div>
              <div className={classes.headerCell} role="columnheader">Сервер</div>
              <div className={classes.headerCell} role="columnheader">Узел</div>
              <div className={classes.headerCell} role="columnheader">Важность</div>
              <div className={classes.headerCell} role="columnheader">Длительность</div>
              <div className={classes.headerCell} role="columnheader" aria-hidden="true" />
            </>
          ) : (
            <>
              <div className={classes.headerCell} role="columnheader">Время</div>
              <div className={classes.headerCell} role="columnheader">Сервер</div>
              <div className={classes.headerCell} role="columnheader">Узел</div>
              <div className={classes.headerCell} role="columnheader">Важность</div>
              <div className={classes.headerCell} role="columnheader">Длительность</div>
            </>
          )}
        </div>

        <div className={classes.body} role="rowgroup">
          {rows.map((r, idx) => (
            <div
              key={idx}
              className={`${classes.card} ${isPostponed ? classes.cardPostponed : classes.cardCurrent}`}
              role="row"
            >
              {isPostponed ? (
                <>
                  <div className={`${classes.field} ${classes.fStart}`} role="cell">
                    <span className={classes.label}>Начало</span>
                    <span className={classes.value}>{r.time}</span>
                  </div>
                  <div className={`${classes.field} ${classes.fEnd}`} role="cell">
                    <span className={classes.label}>Окончание</span>
                    <span className={classes.value}>{r.endTime ?? '-'}</span>
                  </div>
                  <div className={`${classes.field} ${classes.fServer}`} role="cell">
                    <span className={classes.label}>Сервер</span>
                    <span className={classes.value}>{r.server}</span>
                  </div>
                  <div className={`${classes.field} ${classes.fNode}`} role="cell">
                    <span className={classes.label}>Узел</span>
                    <span className={classes.value}>{r.node}</span>
                  </div>
                  <div
                    className={`${classes.field} ${classes.fSeverity} ${r.severity === 'critical' ? classes.critical : classes.nonCritical}`}
                    role="cell"
                  >
                    <span className={classes.label}>Важность</span>
                    <span className={classes.value}><span className={classes.icon} />{r.severity === 'critical' ? 'критично' : 'некритично'}</span>
                  </div>
                  <div className={`${classes.field} ${classes.fDuration}`} role="cell">
                    <span className={classes.label}>Длительность</span>
                    <span className={classes.value}>{r.duration}</span>
                  </div>
                  <div className={`${classes.field} ${classes.fActions}`} role="cell">
                    <button
                      className={classes.deleteBtn}
                      title="Удалить"
                      aria-label="Удалить проблему"
                      onClick={() => onDelete?.(r)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className={`${classes.field} ${classes.fTime}`} role="cell">
                    <span className={classes.label}>Время</span>
                    <span className={classes.value}>{r.time}</span>
                  </div>
                  <div className={`${classes.field} ${classes.fServer}`} role="cell">
                    <span className={classes.label}>Сервер</span>
                    <span className={classes.value}>{r.server}</span>
                  </div>
                  <div className={`${classes.field} ${classes.fNode}`} role="cell">
                    <span className={classes.label}>Узел</span>
                    <span className={classes.value}>{r.node}</span>
                  </div>
                  <div
                    className={`${classes.field} ${classes.fSeverity} ${r.severity === 'critical' ? classes.critical : classes.nonCritical}`}
                    role="cell"
                  >
                    <span className={classes.label}>Важность</span>
                    <span className={classes.value}><span className={classes.icon} />{r.severity === 'critical' ? 'критично' : 'некритично'}</span>
                  </div>
                  <div className={`${classes.field} ${classes.fDuration}`} role="cell">
                    <span className={classes.label}>Длительность</span>
                    <span className={classes.value}>{r.duration}</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MonitoringTable;
