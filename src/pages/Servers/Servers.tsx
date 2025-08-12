import React, { useEffect, useMemo, useState } from "react";
import {
  Stack,
  Title,
  Group,
  Button,
  SimpleGrid,
  ActionIcon,
  Tooltip,
  LoadingOverlay,
  Badge,
} from "@mantine/core";
import { IconPencil, IconTrash, IconPlus } from "@tabler/icons-react";
import SearchInput from "@/components/SearchInput";
import Table from "@/components/Table";
import ServerCard from "@/components/ServerCard";
import type {
  ServerStatus,
  ServerItemWithMonitoring,
  ServerMonitoringData,
} from "@/types";
import { useServersStore } from "@/store/servers";
import { useMonitoringStore } from "@/store/monitoring";
import Modal from "@/components/Modal/Modal";

import classes from "./Servers.module.css";
import { useNavigate } from "react-router";

const Servers: React.FC = () => {
  const [q, setQ] = useState("");
  const { items, loading, error, fetchServers, deleteServer } =
    useServersStore();
  const {
    servers: monitoringServers,
    loading: monitoringLoading,
    error: monitoringError,
    subscribeToServers,
    unsubscribe,
    getServerStatus,
    connect,
    isConnected,
  } = useMonitoringStore();

  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [selectedServer, setSelectedServer] =
    useState<ServerItemWithMonitoring | null>(null);

  const handleClickFilter = (filter: "all" | "active" | "inactive") => {
    if (filter === "active" && activeFilter === "active") {
      setActiveFilter("all");
    } else if (filter === "inactive" && activeFilter === "inactive") {
      setActiveFilter("all");
    } else {
      setActiveFilter(filter);
    }
  };

  // Объединяем данные серверов с мониторингом
  const serversWithMonitoring = useMemo((): ServerItemWithMonitoring[] => {
    if (!items || !monitoringServers) {
      return [];
    }

    return items.map((server): ServerItemWithMonitoring => {
      const monitoringData = monitoringServers.find(
        (m) => m.id === `${server.url}:${server.port}`,
      );
      return {
        ...server,
        monitoring: monitoringData?.sections.main || undefined,
        status: monitoringData ? getServerStatus(monitoringData) : "red",
      };
    });
  }, [items, monitoringServers, getServerStatus]);

  const filtered = useMemo(() => {
    return serversWithMonitoring.filter((s) => {
      let matchesFilter = true;

      if (activeFilter === "active") {
        matchesFilter = s.enabled && s.status === "green";
      } else if (activeFilter === "inactive") {
        matchesFilter = !s.enabled || s.status === "red";
      }

      const matchesSearch =
        q === "" || s.name.toLowerCase().includes(q.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [serversWithMonitoring, activeFilter, q]);

  const handleClickDeleteServer = (url: string, port: number) => {
    const server = serversWithMonitoring.find(
      (s) => s.url === url && s.port === port,
    );
    if (server) {
      setIsRemoveModalOpen(true);
      setSelectedServer(server);
    }
  };

  const handleDeleteServer = async () => {
    if (selectedServer) {
      await deleteServer(selectedServer?.url, selectedServer?.port);
    }

    setIsRemoveModalOpen(false);
  };

  const getStatusDotClass = (status?: ServerStatus) => {
    switch (status) {
      case "green":
        return classes.dotOnline;
      case "yellow":
        return classes.dotWarning;
      case "red":
        return classes.dotOffline;
      default:
        return classes.dotOffline;
    }
  };

  const formatCamerasDisplay = (monitoring?: ServerMonitoringData) => {
    if (!monitoring) {
      return "-";
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
        <Badge color="dark" size="sm">
          {Number.isInteger(totalCameras) ? totalCameras : "-"}
        </Badge>
        <Badge color="green" size="sm">
          {workingCameras}
        </Badge>
        <Badge color="red" size="sm">
          {Number.isInteger(enabledWithProblemStream)
            ? enabledWithProblemStream
            : "-"}
        </Badge>
      </Group>
    );
  };

  const formatHddStatus = (monitoring?: ServerMonitoringData) => {
    if (!monitoring) {
      return "-";
    }

    if (monitoring.lastErrorTime === null) {
      return (
        <Badge color="green" size="sm">
          OK
        </Badge>
      );
    } else {
      const errorDate = new Date(monitoring.lastErrorTime).toLocaleDateString();
      return (
        <Badge color="red" size="sm">
          {errorDate}
        </Badge>
      );
    }
  };

  useEffect(() => {
    void fetchServers();
  }, [fetchServers]);

  // Подключаемся к WebSocket при монтировании компонента
  useEffect(() => {
    connect();
    return () => {
      unsubscribe();
    };
  }, [connect, unsubscribe]);

  // Подписываемся на мониторинг серверов когда они загружены
  useEffect(() => {
    if (items && items.length > 0 && isConnected) {
      const serverIds = items.map((server) => `${server.url}:${server.port}`);
      subscribeToServers(serverIds);
    }
  }, [items, subscribeToServers, isConnected]);

  return (
    <Stack className={classes.wrapper} gap="md" pos="relative">
      <LoadingOverlay visible={loading || monitoringLoading} />
      {(error || monitoringError) && (
        <div
          style={{
            color: "red",
            padding: "16px",
            textAlign: "center",
          }}
        >
          Ошибка: {error || monitoringError}
        </div>
      )}
      <div className={classes.header}>
        <Title order={1} size="h3">
          Серверы
        </Title>

        <div className={classes.controlsRowDesktop}>
          <div className={classes.legendGroup}>
            <div
              className={`${classes.legendItem} ${activeFilter === "active" ? classes.activeFilter : ""}`}
              onClick={() => handleClickFilter("active")}
            >
              <span className={classes.dotOnline} />
              Доступные
            </div>
            <div
              className={`${classes.legendItem} ${activeFilter === "inactive" ? classes.activeFilter : ""}`}
              onClick={() => handleClickFilter("inactive")}
            >
              <span className={classes.dotOffline} />
              Выключенные
            </div>
          </div>
          <Button
            variant="filled"
            aria-label="Добавить сервер"
            leftSection={<IconPlus size={16} />}
            onClick={() => navigate("/servers/create")}
          >
            Добавить сервер
          </Button>
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Найти сервер..."
          />
        </div>
      </div>

      <div className={classes.controlsColumnMobile}>
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Найти сервер..."
          fullWidth
        />
        <div className={classes.filtersAndAddRow}>
          <div className={classes.legendRowMobile}>
            <div
              className={`${classes.legendItem} ${activeFilter === "active" ? classes.activeFilter : ""}`}
              onClick={() => handleClickFilter("active")}
            >
              <span className={classes.dotOnline} />
              Доступные
            </div>
            <div
              className={`${classes.legendItem} ${activeFilter === "inactive" ? classes.activeFilter : ""}`}
              onClick={() => handleClickFilter("inactive")}
            >
              <span className={classes.dotOffline} />
              Выключенные
            </div>
            <Button
              variant="filled"
              aria-label="Добавить сервер"
              leftSection={<IconPlus size={16} />}
              onClick={() => navigate("/servers/create")}
            >
              Добавить сервер
            </Button>
          </div>
        </div>
      </div>

      <div className={classes.desktopTable}>
        <Table
          columns={[
            {
              key: "name",
              header: "Имя сервера",
              render: (row: ServerItemWithMonitoring) => (
                <Group gap="xs">
                  <span className={getStatusDotClass(row.status)} />
                  <strong>{row.name}</strong>
                </Group>
              ),
            },
            {
              key: "urlPort",
              header: "URL:Порт",
              render: (row: ServerItemWithMonitoring) =>
                `${row.url}:${row.port}`,
            },
            {
              key: "cameras",
              header: "Камеры",
              render: (row: ServerItemWithMonitoring) =>
                formatCamerasDisplay(row.monitoring),
            },
            {
              key: "hdd",
              header: "HDD",
              render: (row: ServerItemWithMonitoring) =>
                formatHddStatus(row.monitoring),
            },
            {
              key: "uptime",
              header: "Uptime",
              render: (row: ServerItemWithMonitoring) =>
                row.monitoring?.uptime || "-",
            },
            {
              key: "actions",
              header: "Действия",
              render: (row: ServerItemWithMonitoring) => (
                <Group gap="xs">
                  <Tooltip label="Редактировать">
                    <ActionIcon
                      variant="light"
                      aria-label="Редактировать"
                      onClick={() =>
                        navigate(
                          `/servers/edit?url=${encodeURIComponent(row.url)}&port=${encodeURIComponent(row.port.toString())}`,
                        )
                      }
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Удалить">
                    <ActionIcon
                      variant="light"
                      color="red"
                      aria-label="Удалить"
                      onClick={() => handleClickDeleteServer(row.url, row.port)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              ),
            },
          ]}
          data={filtered}
          keyField="id"
        />
      </div>

      <div className={classes.mobileCards}>
        <SimpleGrid
          cols={{
            base: 1,
            sm: 2,
          }}
          spacing="md"
        >
          {filtered.map((s) => (
            <ServerCard
              key={s.id}
              server={s}
              onDelete={handleClickDeleteServer}
            />
          ))}
        </SimpleGrid>
      </div>

      <Modal
        opened={isRemoveModalOpen}
        title="Вы уверены, что хотите удалить сервер?"
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleDeleteServer}
        onClose={() => {
          setIsRemoveModalOpen(false);
          setSelectedServer(null);
        }}
      />
    </Stack>
  );
};

export default Servers;
