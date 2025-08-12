import React from 'react';
import classes from './MonitoringSummary.module.css';

export type MonitoringSummaryProps = {
  servers: number;
  cameras: number;
  postponed: number;
  current: number;
};

const MonitoringSummary: React.FC<MonitoringSummaryProps> = ({ servers, cameras, postponed, current }) => {
  return (
    <div className={classes.items}>
      <div className={`${classes.item} ${classes.itemServers}`}>
        <p className={classes.itemName}>Серверы</p>
        <p className={classes.itemValue}>{servers}</p>
      </div>
      <div className={`${classes.item} ${classes.itemCameras}`}>
        <p className={classes.itemName}>Камеры</p>
        <p className={classes.itemValue}>{cameras}</p>
      </div>
      <div className={`${classes.item} ${classes.itemPostponed}`}>
        <p className={classes.itemName}>Отложенные проблемы</p>
        <p className={classes.itemValue}>{postponed}</p>
      </div>
      <div className={`${classes.item} ${classes.itemCurrent}`}>
        <p className={classes.itemName}>Актуальные проблемы</p>
        <p className={classes.itemValue}>{current}</p>
      </div>
    </div>
  );
};

export default MonitoringSummary;
