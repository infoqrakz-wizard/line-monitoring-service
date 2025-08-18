import React, { useEffect, useMemo, useState } from "react";
import {
  Stack,
  Group,
  Button,
  SimpleGrid,
  Tooltip,
  LoadingOverlay,
  Badge,
  Table,
  Pagination,
  Text,
} from "@mantine/core";
import SearchInput from "@/components/SearchInput/SearchInput";
import type {
  ServerStatus,
  ServerItemWithMonitoring,
  ServerMonitoringData,
  DowntimeEvent,
} from "@/types";
import { useServersStore } from "@/store/servers";
import { useMonitoringStore } from "@/store/monitoring";
import Modal from "@/components/Modal/Modal";
import { formatUptime } from "@/utils/uptime";
import { downtime } from "@/api";

import { useNavigate } from "react-router";
import ActionButton from "@/components/ActionButton";
import PageHeader from "@/components/PageHeader";
import IconPlus from "@/assets/icons/plus.svg?react";

import classes from "./Servers.module.css";
import ServerCard from "@/components/ServerCard/index";

const Servers: React.FC = () => {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const {
    servers,
    loading,
    error,
    fetchServers,
    deleteServer,
    total,
    totalPages,
    currentPage,
    setCurrentPage,
  } = useServersStore();

  const {
    servers: monitoringServers,
    loading: monitoringLoading,
    error: monitoringError,
    subscribeToServers,

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

  const [serversDownMap, setServersDownMap] = useState<
    Record<string, DowntimeEvent>
  >({});

  const handleClickFilter = (filter: "all" | "active" | "inactive") => {
    if (filter === "active" && activeFilter === "active") {
      setActiveFilter("all");
    } else if (filter === "inactive" && activeFilter === "inactive") {
      setActiveFilter("all");
    } else {
      setActiveFilter(filter);
    }
  };

  const handleSearchChange = (value: string) => {
    setQ(value);
  };

  // Debounce для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q);
    }, 500);

    return () => clearTimeout(timer);
  }, [q]);

  // Инициализация данных при первой загрузке
  useEffect(() => {
    void fetchServers({
      page: 1,
      search: "",
      filter: "all",
    });
  }, [fetchServers]);

  // Загружаем данные при изменении страницы, фильтров или поиска
  useEffect(() => {
    // Пропускаем первую загрузку, так как она уже обработана в инициализации
    if (currentPage === 1 && debouncedQ === "" && activeFilter === "all") {
      return;
    }

    void fetchServers({
      page: currentPage,
      search: debouncedQ || undefined,
      filter: activeFilter,
    });
  }, [fetchServers, currentPage, debouncedQ, activeFilter]);

  // Сбрасываем страницу на первую при изменении фильтров или поиска
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [activeFilter, debouncedQ, currentPage, setCurrentPage]);

  // Объединяем данные серверов с мониторингом
  const serversWithMonitoring = useMemo((): ServerItemWithMonitoring[] => {
    if (!servers || !monitoringServers) {
      return [];
    }

    return servers.map((server): ServerItemWithMonitoring => {
      const monitoringData = monitoringServers.find(
        (m) => m.id === `${server.url}:${server.port}`,
      );
      return {
        ...server,
        monitoring: monitoringData?.sections.main || undefined,
        archiveState: monitoringData?.sections.archiveState || undefined,
        status: monitoringData ? getServerStatus(monitoringData) : "red",
      };
    });
  }, [servers, monitoringServers, getServerStatus]);

  // Убираем клиентскую фильтрацию, так как теперь фильтрация происходит на сервере
  const filtered = serversWithMonitoring;

  // Fetch current servers_down events once and on relevant changes
  useEffect(() => {
    let cancelled = false;
    const fetchServersDown = async () => {
      try {
        const resp = await downtime.query({ filter: "servers_down" });
        if (cancelled) {
          return;
        }
        const map: Record<string, DowntimeEvent> = {};
        resp.data.forEach((event) => {
          // Only events that are still active (up_at null)
          if (event.up_at === null) {
            const key = `${event.url}:${event.port}`;
            // Keep the latest down_at if multiple (compare strings as dates)
            if (!map[key]) {
              map[key] = event;
            } else if (
              new Date(event.down_at).getTime() >
              new Date(map[key].down_at).getTime()
            ) {
              map[key] = event;
            }
          }
        });
        setServersDownMap(map);
      } catch (e) {
        // silent fail; uptime will fallback
      }
    };
    void fetchServersDown();
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, activeFilter, currentPage]);

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    void fetchServers({
      page,
      search: debouncedQ || undefined,
      filter: activeFilter,
    });
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
      workingCameras = "";
    }
    return (
      <Group gap="xs">
        {Number.isInteger(totalCameras) && (
          <Tooltip label="Камер всего">
            <Badge color="dark" size="sm">
              {totalCameras}
            </Badge>
          </Tooltip>
        )}
        {workingCameras && (
          <Tooltip label="Активные">
            <Badge color="green" size="sm">
              {workingCameras}
            </Badge>
          </Tooltip>
        )}
        {enabledWithProblemStream && (
          <Tooltip label="С проблемами">
            <Badge color="rgb(250, 82, 82)" size="sm">
              {enabledWithProblemStream}
            </Badge>
          </Tooltip>
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
        <Badge color="green" size="sm">
          OK
        </Badge>
      );
    } else {
      const errorDate = new Date(monitoring.lastErrorTime).toLocaleDateString();
      if (errorDate === "Invalid Date") {
        return null;
      }

      return (
        <Badge color="rgb(250, 82, 82)" size="sm">
          {errorDate}
        </Badge>
      );
    }
  };

  // Подключаемся к WebSocket при монтировании компонента
  useEffect(() => {
    connect();
    // return () => {
    //   unsubscribe();
    // };
  }, [connect]);

  // Подписываемся на мониторинг серверов когда они загружены
  useEffect(() => {
    if (isConnected) {
      subscribeToServers();
    }
  }, [isConnected]);

  return (
    <Stack className={classes.wrapper} gap="0" pos="relative">
      <LoadingOverlay visible={loading || monitoringLoading} />
      {(error || monitoringError) && (
        <div
          style={{
            color: "rgb(250, 82, 82)",
            padding: "16px",
            textAlign: "center",
          }}
        >
          Ошибка: {error || monitoringError}
        </div>
      )}
      <PageHeader
        title="Серверы"
        rightSide={
          <div className={classes.controlsRowDesktop}>
            <div className={classes.controlsRowDesktopInner}>
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
                className={classes.addServerButton}
                variant="black"
                aria-label="Добавить сервер"
                leftSection={<IconPlus />}
                onClick={() => navigate("/servers/create")}
              >
                Добавить сервер
              </Button>
            </div>
            <SearchInput
              value={q}
              onChange={handleSearchChange}
              placeholder="Найти сервер..."
              containerClassName={classes.searchInputDesktopContainer}
              className={classes.searchInputDesktop}
              inputClassName={classes.searchInputDesktopInput}
              rootClassName={classes.searchInputDesktopRoot}
            />
          </div>
        }
      />

      <div className={classes.desktopTable}>
        <Table
          className={classes.table}
          withTableBorder
          withColumnBorders
          striped
        >
          <Table.Thead className={classes.thead}>
            <Table.Tr className={classes.tr}>
              <Table.Th className={classes.th}>Имя сервера</Table.Th>
              <Table.Th className={classes.th}>URL:Порт</Table.Th>
              <Table.Th className={classes.th}>Камеры</Table.Th>
              <Table.Th className={classes.th}>HDD</Table.Th>
              <Table.Th className={classes.th}>Uptime</Table.Th>
              <Table.Th className={classes.th}>Глубина архива</Table.Th>
              <Table.Th className={classes.th}>Действия</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map((row) => {
              const arhiveDatesCount =
                row.archiveState?.result.state.storages[0].archive.dates_count;

              return (
                <Table.Tr key={row.id}>
                  <Table.Td className={classes.td}>
                    <Group gap="xs">
                      <span className={getStatusDotClass(row.status)} />
                      <a
                        href={`/servers/info?url=${encodeURIComponent(row.url)}&port=${encodeURIComponent(row.port.toString())}`}
                      >
                        <strong>{row.name}</strong>
                      </a>
                    </Group>
                  </Table.Td>
                  <Table.Td
                    className={classes.td}
                  >{`${row.url}:${row.port}`}</Table.Td>
                  <Table.Td className={classes.td}>
                    {formatCamerasDisplay(row.monitoring)}
                  </Table.Td>
                  <Table.Td className={classes.td}>
                    {formatHddStatus(row.monitoring)}
                  </Table.Td>
                  <Table.Td className={classes.td}>
                    {row.status === "red" ? (
                      <Text size="sm" c="rgb(250, 82, 82)">
                        {formatUptime(
                          row.monitoring,
                          row.status,
                          serversDownMap[`${row.url}:${row.port}`]?.down_at ??
                            null,
                        )}
                      </Text>
                    ) : (
                      formatUptime(row.monitoring, row.status)
                    )}
                  </Table.Td>
                  <Table.Td className={classes.td}>
                    {`${arhiveDatesCount ? `${arhiveDatesCount} д.` : "-"}`}
                  </Table.Td>
                  <Table.Td className={classes.td}>
                    <Group gap="xs">
                      <Tooltip label="Редактировать">
                        <ActionButton
                          className={classes.editIcon}
                          onClick={() =>
                            navigate(
                              `/servers/edit?url=${encodeURIComponent(row.url)}&port=${encodeURIComponent(row.port.toString())}`,
                            )
                          }
                        />
                      </Tooltip>
                      <Tooltip label="Удалить">
                        <ActionButton
                          className={classes.deleteIcon}
                          onClick={() =>
                            handleClickDeleteServer(row.url, row.port)
                          }
                        />
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
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

      {totalPages > 1 && (
        <div className={classes.paginationContainer}>
          <div className={classes.paginationInfo}>
            <Text size="sm" c="dimmed">
              Показано {servers.length} из {total} серверов
            </Text>
          </div>
          <Pagination
            total={totalPages}
            value={currentPage}
            onChange={handlePageChange}
            size="sm"
            radius="md"
            withEdges
          />
        </div>
      )}

      <Modal
        opened={isRemoveModalOpen}
        title="Вы уверены, что хотите удалить сервер?"
        onClose={() => {
          setIsRemoveModalOpen(false);
          setSelectedServer(null);
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            marginTop: "16px",
          }}
        >
          <Button
            variant="subtle"
            onClick={() => {
              setIsRemoveModalOpen(false);
              setSelectedServer(null);
            }}
          >
            Отмена
          </Button>
          <Button color="rgb(250, 82, 82)" onClick={handleDeleteServer}>
            Удалить
          </Button>
        </div>
      </Modal>
    </Stack>
  );
};

export default Servers;
