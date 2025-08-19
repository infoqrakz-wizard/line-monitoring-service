import React from "react";
import {
  Card,
  Text,
  Badge,
  Group,
  Divider,
  Tooltip,
  Button,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import type {
  ServerItemWithMonitoring,
  ServerStatus,
  ServerMonitoringData,
  DowntimeEvent,
} from "@/types";
import { useNavigate } from "react-router";
import { formatUptime } from "@/utils/uptime";
import { downtime } from "@/api";
import classes from "./ServerCard.module.css";
import EditIcon from "@/assets/icons/edit.svg?react";
import DeleteIcon from "@/assets/icons/delete.svg?react";

export type ServerCardProps = {
  server: ServerItemWithMonitoring;
  onDelete?: (url: string, port: number) => void;
};

const ServerCard: React.FC<ServerCardProps> = ({ server, onDelete }) => {
  const navigate = useNavigate();
  const [downEvent, setDownEvent] = React.useState<DowntimeEvent | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const fetchDown = async () => {
      try {
        if (server.status !== "red") {
          setDownEvent(null);
          return;
        }
        const resp = await downtime.query({ filter: "servers_down" });
        if (cancelled) {
          return;
        }
        const key = `${server.url}:${server.port}`;
        const found = resp.data
          .filter((e) => e.up_at === null)
          .find((e) => `${e.url}:${e.port}` === key);
        setDownEvent(found ?? null);
      } catch {
        if (!cancelled) {
          setDownEvent(null);
        }
      }
    };
    void fetchDown();
    const id = setInterval(fetchDown, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [server.status, server.url, server.port]);

  const getStatusColor = (status: ServerStatus) => {
    switch (status) {
      case "green":
        return "#2ecc71";
      case "yellow":
        return "#f1c40f";
      case "red":
        return "#e74c3c";
      default:
        return "#95a5a6";
    }
  };

  const formatCamerasDisplay = (monitoring?: ServerMonitoringData) => {
    if (!monitoring) {
      return "";
    }

    const { totalCameras, enabledCameras, enabledWithProblemStream } =
      monitoring;

    let workingCameras;

    if (
      Number.isInteger(enabledCameras) &&
      Number.isInteger(enabledWithProblemStream)
    ) {
      workingCameras = enabledCameras - enabledWithProblemStream;
    } else {
      workingCameras = "-";
    }

    return (
      <Group gap="xs">
        <Badge color="dark" size="xs">
          {Number.isInteger(totalCameras) ? totalCameras : "-"}
        </Badge>
        <Badge color="green" size="xs">
          {workingCameras}
        </Badge>
        {enabledWithProblemStream && (
          <Badge color="rgb(250, 82, 82)" size="xs">
            {enabledWithProblemStream}
          </Badge>
        )}
      </Group>
    );
  };

  const formatHddStatus = (monitoring?: ServerMonitoringData) => {
    if (!monitoring) {
      return "-";
    }

    if (monitoring.lastErrorTime === null) {
      return (
        <Badge color="green" size="xs">
          OK
        </Badge>
      );
    } else {
      const errorDate = new Date(monitoring.lastErrorTime).toLocaleDateString();
      if (errorDate === "Invalid Date") {
        return null;
      }

      return (
        <Badge color="rgb(250, 82, 82)" size="xs">
          {errorDate}
        </Badge>
      );
    }
  };

  const statusColor = getStatusColor(server.status || "red");
  const arhiveDatesCount =
    server.archiveState?.result?.state?.storages[0]?.archive?.dates_count;

  return (
    <div className={classes.cardWrapper}>
      <Card
        shadow="sm"
        padding="lg"
        radius="md"
        withBorder
        className={classes.card}
      >
        <Group justify="space-between" align="center">
          <div>
            <Text fw={600} size="sm" className={classes.serverName}>
              Имя сервера
            </Text>
            <Text className={classes.serverNameValue}>{server.name}</Text>
          </div>
          <div
            className={classes.statusIndicator}
            style={{ background: statusColor }}
          />
        </Group>

        <Group justify="space-between" className={classes.mobileRow}>
          <Text fw={600} size="sm" className={classes.tableKeyName}>
            URL:Порт
          </Text>
          <Text size="sm" className={classes.tableValue}>
            {server.url}:{server.port}
          </Text>
        </Group>
        <Divider className={classes.divider} />
        <Group justify="space-between">
          <Text fw={600} size="sm" className={classes.tableKeyName}>
            Камеры
          </Text>
          <div className={classes.tableValue}>
            {formatCamerasDisplay(server.monitoring)}
          </div>
        </Group>
        <Divider className={classes.divider} />
        <Group justify="space-between">
          <Text fw={600} size="sm" className={classes.tableKeyName}>
            HDD
          </Text>
          <div className={classes.tableValue}>
            {formatHddStatus(server.monitoring)}
          </div>
        </Group>
        <Divider className={classes.divider} />
        <Group justify="space-between">
          <Text fw={600} size="sm" className={classes.tableKeyName}>
            Uptime
          </Text>
          {server.status === "red" ? (
            <Text size="sm" className={classes.tableValue}>
              {formatUptime(
                server.monitoring,
                server.status,
                downEvent?.down_at ?? null,
              )}
            </Text>
          ) : (
            <Text size="sm" className={classes.tableValue}>
              {formatUptime(server.monitoring, server.status)}
            </Text>
          )}
        </Group>
        <Divider className={classes.divider} />
        <Group justify="space-between">
          <Text fw={600} size="sm" className={classes.tableKeyName}>
            Глубина архива
          </Text>
          <Text size="sm" className={classes.tableValue}>
            {`${arhiveDatesCount ? `${arhiveDatesCount}д.` : "-"}`}
          </Text>
        </Group>
        <Divider className={classes.divider} />

        <Group justify="flex-start" className={classes.actions}>
          <Tooltip label="Информация">
            <Button
              variant="white"
              aria-label="Информация"
              onClick={() =>
                navigate(
                  `/servers/info?url=${encodeURIComponent(server.url)}&port=${encodeURIComponent(server.port.toString())}`,
                )
              }
            >
              <span className={classes.infoBtn}>
                <IconInfoCircle size={16} />
                Информация
              </span>
            </Button>
          </Tooltip>
          <Tooltip label="Редактировать">
            <Button
              variant="white"
              aria-label="Редактировать"
              onClick={() =>
                navigate(
                  `/servers/edit?url=${encodeURIComponent(server.url)}&port=${encodeURIComponent(server.port.toString())}`,
                )
              }
            >
              <span className={classes.editBtn}>
                <EditIcon />
                Редактировать
              </span>
            </Button>
          </Tooltip>
          <Tooltip label="Удалить">
            <Button
              className={classes.deleteBtn}
              variant="white"
              color="rgb(250, 82, 82)"
              aria-label="Удалить"
              onClick={() => onDelete?.(server.url, server.port)}
            >
              <span className={classes.deleteIcon}>
                <DeleteIcon />
              </span>
            </Button>
          </Tooltip>
        </Group>
      </Card>
    </div>
  );
};

export default ServerCard;
