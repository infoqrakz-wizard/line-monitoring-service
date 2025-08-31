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
  Text,
} from "@mantine/core";
import Pagination from "@/components/Pagination";
import SearchInput from "@/components/SearchInput/SearchInput";
import type {
  ServerStatus,
  ServerItemWithMonitoring,
  ServerMonitoringData,
  ServerFilter,
} from "@/types";
import { useServersStore } from "@/store/servers";
import { useMonitoringStore } from "@/store/monitoring";
import Modal from "@/components/Modal/Modal";
import { formatUptime } from "@/utils/uptime";

import { useNavigate } from "react-router";
import ActionButton from "@/components/ActionButton";
import PageHeader from "@/components/PageHeader";

import classes from "./Servers.module.css";
import ServerCard from "@/components/ServerCard/index";
import { useAuthStore } from "@/store/auth";
import ServerSummary from "@/components/ServerSummary";

const Servers: React.FC = () => {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const {
    servers,
    loading,
    error,
    nextCursor,
    previousCursor,
    pages: pagesCount,
    fetchServers,
    resetCursors,
    deleteServer,
    updateServersStatus,
  } = useServersStore();

  const { role } = useAuthStore();
  const isAdmin = role === "admin";

  const {
    servers: monitoringServers,
    loading: monitoringLoading,
    error: monitoringError,
    stats,
    subscribeToServers,
    getServerStatus,
    connect,
    isConnected,
  } = useMonitoringStore();

  const navigate = useNavigate();

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [selectedServer, setSelectedServer] =
    useState<ServerItemWithMonitoring | null>(null);

  // Состояние для cursor-based пагинации
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const [activeFilter, setActiveFilter] = useState<ServerFilter>("all");

  const pageSize = 50;

  const handleSearchChange = (value: string) => {
    setQ(value);
  };

  const handleFilterClick = (filter: ServerFilter) => {
    if (filter === activeFilter) {
      setActiveFilter("all");
    } else {
      setActiveFilter(filter);
    }
  };

  // Debounce для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q);
    }, 500);

    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    return () => {
      void resetCursors();
    };
  }, []);

  useEffect(() => {
    // Сбрасываем пагинацию при изменении фильтров или поиска
    setCurrentPageIndex(0);

    if (debouncedQ === "" && activeFilter === "all") {
      void fetchServers({
        cursor: null,
        search: "",
        limit: pageSize,
        filter: "all",
      });
      return;
    }

    void fetchServers({
      cursor: null,
      search: debouncedQ || "",
      filter: activeFilter,
      limit: pageSize,
    });
  }, [fetchServers, debouncedQ, activeFilter]);

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

  // const filteredServers = useMemo(() => {
  //   if (activeFilter === "all") {
  //     return serversWithMonitoring;
  //   }

  //   return serversWithMonitoring.filter((server) => {
  //     switch (activeFilter) {
  //       case "healthy":
  //         return server.enabled && server.status === "green";
  //       case "problems":
  //         return (
  //           server.enabled &&
  //           (server.status === "yellow" || server.status === "red")
  //         );
  //       case "unavailable":
  //         return server.enabled && server.status === "red";
  //       case "disabled":
  //         return !server.enabled;
  //       default:
  //         return true;
  //     }
  //   });
  // }, [serversWithMonitoring, activeFilter]);

  useEffect(() => {
    let cancelled = false;

    const updateStatus = async () => {
      if (cancelled) {
        return;
      }

      try {
        await updateServersStatus();
      } catch {
        // silent fail; uptime will fallback
      }
    };

    void updateStatus();

    // Периодическое обновление каждую минуту
    const id = setInterval(updateStatus, 60000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [updateServersStatus]);

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
    if (selectedServer?.url && selectedServer?.port) {
      await deleteServer(selectedServer.url, selectedServer.port);
    }

    setIsRemoveModalOpen(false);
  };

  const getStatusDotClass = (status?: ServerStatus, enabled?: boolean) => {
    if (enabled === false) {
      return classes.dotDisabled;
    }

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

    const { totalCameras, enabledAllStreamsOk, enabledWithProblemStream } =
      monitoring;

    return (
      <Group gap="xs">
        {Number.isInteger(totalCameras) && (
          <Tooltip label="Камер всего">
            <Badge color="dark" size="sm">
              {totalCameras}
            </Badge>
          </Tooltip>
        )}
        {enabledAllStreamsOk && (
          <Tooltip label="Активные">
            <Badge color="green" size="sm">
              {enabledAllStreamsOk}
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
      subscribeToServers(servers.map((s) => `${s.url}:${s.port}`));
    }
  }, [isConnected, servers]);

  return (
    <>
      <LoadingOverlay visible={loading || monitoringLoading} />
      <Stack className={classes.wrapper} gap="0" pos="relative">
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
            <ServerSummary
              workingServers={stats.ok}
              problemServers={stats.problems}
              unavailableServers={stats.bad}
              disabledServers={stats.disabled}
              activeFilter={activeFilter}
              onFilterClick={handleFilterClick}
            />
          }
        />

        <div className={classes.controlsRowDesktop}>
          <Button
            variant="black"
            onClick={() => navigate("/servers/create")}
            size="md"
          >
            Добавить сервер
          </Button>

          <SearchInput
            value={q}
            onChange={handleSearchChange}
            placeholder="Найти сервер..."
            containerClassName={classes.searchInputDesktopContainer}
            className={classes.searchInputDesktop}
            withClearIcon={q.length > 0}
            inputClassName={classes.searchInputDesktopInput}
            rootClassName={classes.searchInputDesktopRoot}
          />
        </div>

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
              {serversWithMonitoring.map((row) => {
                const arhiveDatesCount =
                  row.archiveState?.result?.state?.storages[0]?.archive
                    ?.dates_count;

                return (
                  <Table.Tr key={row.id}>
                    <Table.Td className={classes.td}>
                      <Group gap="xs">
                        <span
                          className={getStatusDotClass(row.status, row.enabled)}
                        />
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
                          {formatUptime(row.monitoring, row.status, null)}
                        </Text>
                      ) : (
                        formatUptime(row.monitoring, row.status)
                      )}
                    </Table.Td>
                    <Table.Td className={classes.td}>
                      {`${arhiveDatesCount ? `${arhiveDatesCount} д.` : "-"}`}
                    </Table.Td>
                    <Table.Td className={classes.td}>
                      {isAdmin && (
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
                      )}
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
            {serversWithMonitoring.map((s) => (
              <ServerCard
                key={s.id}
                server={s}
                onDelete={handleClickDeleteServer}
                downEvent={null}
                isAdmin={isAdmin}
              />
            ))}
          </SimpleGrid>
        </div>

        {(nextCursor || previousCursor) && (
          <div className={classes.paginationContainer}>
            <Pagination
              currentPageIndex={currentPageIndex}
              pagesCount={pagesCount}
              pageSize={pageSize}
              nextCursor={nextCursor}
              previousCursor={previousCursor}
              onPageChange={(cursor, pageIndex) => {
                setCurrentPageIndex(pageIndex);
                void fetchServers({
                  cursor,
                  search: debouncedQ || undefined,
                  filter: activeFilter,
                  limit: pageSize,
                });
              }}
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
    </>
  );
};

export default Servers;
