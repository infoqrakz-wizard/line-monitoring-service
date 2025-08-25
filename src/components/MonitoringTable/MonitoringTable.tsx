import React from "react";
import classes from "./MonitoringTable.module.css";

export type ProblemRow = {
  id: number;
  time: string;
  server: string;
  serverName: string;
  node: string;
  duration: string;
  endTime?: string; // for postponed
  url: string;
  port: number;
};

export type MonitoringTableProps = {
  type: "current" | "postponed";
  rows: ProblemRow[];
  onDelete?: (row: ProblemRow) => void;
  onDeleteAll?: () => void;
};

const MonitoringTable: React.FC<MonitoringTableProps> = ({
  type,
  rows,
  onDelete,
  onDeleteAll,
}) => {
  const isPostponed = type === "postponed";

  return (
    <div className={classes.table}>
      {rows.length > 0 && onDeleteAll && (
        <div className={classes.actions}>
          <button
            className={classes.deleteAllBtn}
            onClick={onDeleteAll}
            title={
              isPostponed
                ? "Удалить все отложенные проблемы"
                : "Удалить все актуальные проблемы"
            }
            aria-label={
              isPostponed
                ? "Удалить все отложенные проблемы"
                : "Удалить все актуальные проблемы"
            }
          >
            {isPostponed ? "Удалить все отложенные" : "Удалить все актуальные"}
          </button>
        </div>
      )}

      <div
        className={classes.list}
        role="table"
        aria-label={isPostponed ? "Отложенные проблемы" : "Актуальные проблемы"}
      >
        <div className={classes.header} role="row">
          {isPostponed ? (
            <>
              <div className={classes.headerCell} role="columnheader">
                Начало
              </div>
              <div className={classes.headerCell} role="columnheader">
                Окончание
              </div>
              <div className={classes.headerCell} role="columnheader">
                Сервер
              </div>
              <div className={classes.headerCell} role="columnheader">
                Имя сервера
              </div>
              <div className={classes.headerCell} role="columnheader">
                Узел
              </div>
              <div className={classes.headerCell} role="columnheader">
                Длительность
              </div>
              <div
                className={classes.headerCell}
                role="columnheader"
                aria-hidden="true"
              />
            </>
          ) : (
            <>
              <div className={classes.headerCell} role="columnheader">
                Время
              </div>
              <div className={classes.headerCell} role="columnheader">
                Сервер
              </div>
              <div className={classes.headerCell} role="columnheader">
                Имя сервера
              </div>
              <div className={classes.headerCell} role="columnheader">
                Узел
              </div>
              <div className={classes.headerCell} role="columnheader">
                Длительность
              </div>
              <div
                className={classes.headerCell}
                role="columnheader"
                aria-hidden="true"
              />
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
                  <div
                    className={`${classes.field} ${classes.fStart}`}
                    role="cell"
                  >
                    <span className={classes.value}>{r.time}</span>
                  </div>
                  <div
                    className={`${classes.field} ${classes.fEnd}`}
                    role="cell"
                  >
                    <span className={classes.value}>{r.endTime ?? "-"}</span>
                  </div>
                  <div
                    className={`${classes.field} ${classes.fServer}`}
                    role="cell"
                  >
                    <span className={classes.value}>
                      {r.server}:{r.port}
                    </span>
                  </div>
                  <div
                    className={`${classes.field} ${classes.fServerName}`}
                    role="cell"
                  >
                    <span className={classes.value}>{r.serverName}</span>
                  </div>
                  <div
                    className={`${classes.field} ${classes.fNode}`}
                    role="cell"
                  >
                    <span className={classes.value}>{r.node}</span>
                  </div>
                  <div
                    className={`${classes.field} ${classes.fDuration}`}
                    role="cell"
                  >
                    <span className={classes.value}>{r.duration}</span>
                  </div>
                  <div
                    className={`${classes.field} ${classes.fActions}`}
                    role="cell"
                  >
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
                  <div
                    className={`${classes.field} ${classes.fTime}`}
                    role="cell"
                  >
                    <span className={classes.value}>{r.time}</span>
                  </div>
                  <div
                    className={`${classes.field} ${classes.fServer}`}
                    role="cell"
                  >
                    <span className={classes.value}>
                      {r.server}:{r.port}
                    </span>
                  </div>
                  <div
                    className={`${classes.field} ${classes.fServerName}`}
                    role="cell"
                  >
                    <span className={classes.value}>{r.serverName}</span>
                  </div>
                  <div
                    className={`${classes.field} ${classes.fNode}`}
                    role="cell"
                  >
                    <span className={classes.value}>{r.node}</span>
                  </div>
                  <div
                    className={`${classes.field} ${classes.fDuration}`}
                    role="cell"
                  >
                    <span className={classes.value}>{r.duration}</span>
                  </div>
                  <div
                    className={`${classes.field} ${classes.fActions}`}
                    role="cell"
                  >
                    <button
                      className={classes.deleteBtn}
                      title="Удалить"
                      aria-label="Удалить проблему"
                      onClick={() => onDelete?.(r)}
                    />
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
