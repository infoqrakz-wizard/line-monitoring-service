import React from "react";
import classes from "./ServerSummary.module.css";
import { ServerFilter } from "@/types";

export type ServerSummaryProps = {
  workingServers: number;
  problemServers: number;
  unavailableServers: number;
  disabledServers: number;
  activeFilter: ServerFilter;
  onFilterClick: (filter: ServerFilter) => void;
};

const ServerSummary: React.FC<ServerSummaryProps> = ({
  workingServers,
  problemServers,
  unavailableServers,
  disabledServers,
  activeFilter,
  onFilterClick,
}) => {
  return (
    <div className={classes.items}>
      <div
        className={`${classes.item} ${classes.itemWorking} ${activeFilter === "healthy" ? classes.itemActive : ""}`}
        onClick={() => onFilterClick("healthy")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onFilterClick("healthy");
          }
        }}
      >
        <p className={classes.itemName}>Работающие</p>
        <p className={classes.itemValue}>{workingServers}</p>
      </div>
      <div
        className={`${classes.item} ${classes.itemProblems} ${activeFilter === "problems" ? classes.itemActive : ""}`}
        onClick={() => onFilterClick("problems")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onFilterClick("problems");
          }
        }}
      >
        <p className={classes.itemName}>С проблемами</p>
        <p className={classes.itemValue}>{problemServers}</p>
      </div>
      <div
        className={`${classes.item} ${classes.itemUnavailable} ${activeFilter === "unavailable" ? classes.itemActive : ""}`}
        onClick={() => onFilterClick("unavailable")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onFilterClick("unavailable");
          }
        }}
      >
        <p className={classes.itemName}>Недоступные</p>
        <p className={classes.itemValue}>{unavailableServers}</p>
      </div>
      <div
        className={`${classes.item} ${classes.itemDisabled} ${activeFilter === "disabled" ? classes.itemActive : ""}`}
        onClick={() => onFilterClick("disabled")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onFilterClick("disabled");
          }
        }}
      >
        <p className={classes.itemName}>Выключенные</p>
        <p className={classes.itemValue}>{disabledServers}</p>
      </div>
    </div>
  );
};

export default ServerSummary;
