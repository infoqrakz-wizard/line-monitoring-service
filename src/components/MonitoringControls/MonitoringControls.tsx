import React from "react";
import { Button, Group, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import classes from "./MonitoringControls.module.css";

export type MonitoringView = "current" | "postponed";

export type MonitoringControlsProps = {
  view: MonitoringView;
  onChangeView: (view: MonitoringView) => void;
  query: string;
  onChangeQuery: (value: string) => void;
};

const MonitoringControls: React.FC<MonitoringControlsProps> = ({
  view,
  onChangeView,
  query,
  onChangeQuery,
}) => {
  return (
    <div className={classes.wrapper}>
      <Group className={classes.buttons} gap={4} wrap="nowrap">
        <Button
          size="md"
          variant={view === "current" ? "filled" : "default"}
          className={`${classes.btn} ${view === "current" ? classes.active : ""}`}
          onClick={() => onChangeView("current")}
        >
          Актуальные <span className={classes.onlyDesk}>проблемы</span>
        </Button>
        <Button
          size="md"
          variant={view === "postponed" ? "filled" : "default"}
          className={`${classes.btn} ${view === "postponed" ? classes.active : ""}`}
          onClick={() => onChangeView("postponed")}
        >
          <span className={classes.onlyDesk}>История</span>
        </Button>
      </Group>
      <TextInput
        value={query}
        onChange={(e) => onChangeQuery(e.currentTarget.value)}
        placeholder="Поиск по проблемам..."
        leftSection={<IconSearch size={20} />}
        className={classes.search}
        autoComplete="off"
      />
    </div>
  );
};

export default MonitoringControls;
