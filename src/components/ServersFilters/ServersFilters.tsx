import { Button } from "@mantine/core";
import classes from "./ServersFilters.module.css";
import IconPlus from "@/assets/icons/plus.svg?react";

export default function ServersFilters({
  activeFilter,
  isAdmin,
  handleClickAddServer,
  handleClickFilter,
}: {
  activeFilter: "all" | "available" | "unavailable";
  isAdmin: boolean;
  handleClickAddServer: () => void;
  handleClickFilter: (filter: "all" | "available" | "unavailable") => void;
}) {
  return (
    <div className={classes.controlsRowDesktopInner}>
      <div className={classes.legendGroup}>
        <div
          className={`${classes.legendItem} ${activeFilter === "available" ? classes.activeFilter : ""}`}
          onClick={() => handleClickFilter("available")}
        >
          <span className={classes.dotOnline} />
          Доступные
        </div>
        <div
          className={`${classes.legendItem} ${activeFilter === "unavailable" ? classes.activeFilter : ""}`}
          onClick={() => handleClickFilter("unavailable")}
        >
          <span className={classes.dotOffline} />
          Выключенные
        </div>
      </div>
      {isAdmin && (
        <Button
          className={classes.addServerButton}
          variant="black"
          aria-label="Добавить сервер"
          leftSection={<IconPlus />}
          onClick={handleClickAddServer}
        >
          Добавить сервер
        </Button>
      )}
    </div>
  );
}
