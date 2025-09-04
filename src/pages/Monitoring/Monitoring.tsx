import { useEffect, useState } from "react";
import { Alert, Text } from "@mantine/core";
import Pagination from "@/components/Pagination";
import { IconAlertCircle } from "@tabler/icons-react";
import MonitoringSummary from "@/components/MonitoringSummary";
import MonitoringControls, {
  MonitoringView,
} from "@/components/MonitoringControls";
import MonitoringTable, { ProblemRow } from "@/components/MonitoringTable";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { useMonitoringStore } from "@/store/monitoring";
import { DowntimeEvent } from "@/types";
import classes from "./Monitoring.module.css";
import PageHeader from "@/components/PageHeader";
import { useServersStore } from "@/store/servers";
import { useAuthStore } from "@/store/auth";

const Monitoring: React.FC = () => {
  const [view, setView] = useState<MonitoringView>("current");
  const [query, setQuery] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "single" | "all";
    data?: ProblemRow;
  } | null>(null);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const { role } = useAuthStore();
  const isAdmin = role === "admin";

  const {
    downtimeEvents,
    nextCursor,
    previousCursor,
    pages,
    error,
    servers: monitoringServers,
    stats,
    fetchDowntimeEvents,
    refreshAllDowntimeEvents,
    deleteDowntimeEvent,
    deleteDowntimeByUrlPort,
    clearDowntimeEvents,
    subscribeToServers,
    setView: setStoreView,
  } = useMonitoringStore();

  // const { fetchServers, resetCursors } = useServersStore();

  const [totalCameras, setTotalCameras] = useState(0);

  const pageSize = 50;

  useEffect(() => {
    subscribeToServers();
  }, [subscribeToServers]);

  useEffect(() => {
    setTotalCameras(
      monitoringServers.reduce((acc, server) => {
        if (server.sections.main.totalCameras) {
          acc += server.sections.main.totalCameras;
        }
        return acc;
      }, 0),
    );
  }, [monitoringServers]);

  useEffect(() => {
    const filter = view === "current" ? "active" : "completed";
    setStoreView(view);
    setCurrentPageIndex(0);
    void fetchDowntimeEvents(filter, null, pageSize);
  }, [view]);

  const handleOpenDelete = (row: ProblemRow) => {
    setDeleteTarget({
      type: "single",
      data: row,
    });
    setConfirmOpen(true);
  };

  const handleDeleteAll = () => {
    setDeleteTarget({ type: "all" });
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      if (deleteTarget.type === "single" && deleteTarget.data) {
        if (deleteTarget.data.id) {
          await deleteDowntimeEvent(deleteTarget.data.id);
          // Refresh all events to update summary statistics
          void refreshAllDowntimeEvents();
        }
      } else if (deleteTarget.type === "all") {
        // Delete all events based on current filter
        if (view === "current") {
          // Delete only current (active) problems - those with up_at === null
          const currentProblems = downtimeEvents.filter(
            (event) => event.up_at === null,
          );
          const uniqueCombinations = Array.from(
            new Set(
              currentProblems.map((event) => `${event.url}:${event.port}`),
            ),
          );

          for (const combination of uniqueCombinations) {
            const [url, portStr] = combination.split(":");
            const port = parseInt(portStr, 10);
            await deleteDowntimeByUrlPort(url, port);
          }
        } else if (view === "postponed") {
          // Delete only postponed problems - those with up_at !== null
          const postponedProblems = downtimeEvents.filter(
            (event) => event.up_at !== null,
          );
          const uniqueCombinations = Array.from(
            new Set(
              postponedProblems.map((event) => `${event.url}:${event.port}`),
            ),
          );

          for (const combination of uniqueCombinations) {
            const [url, portStr] = combination.split(":");
            const port = parseInt(portStr, 10);
            await deleteDowntimeByUrlPort(url, port);
          }
        }

        clearDowntimeEvents();
        // Refresh all events to update summary statistics
        void refreshAllDowntimeEvents();
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  // Convert downtime events to table rows
  const convertToTableRows = (events: DowntimeEvent[]): ProblemRow[] => {
    if (!events) {
      return [];
    }
    return events.map((event) => {
      const downDate = new Date(event.down_at);
      const upDate = event.up_at ? new Date(event.up_at) : null;

      // Calculate duration
      let duration = "";
      if (upDate) {
        const diffMs = upDate.getTime() - downDate.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        duration = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
      } else {
        const now = new Date();
        const diffMs = now.getTime() - downDate.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        const seconds = Math.floor(diffMs / 1000) % 60;
        duration = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      }

      const cameraNumber = event.type ? parseInt(event.type, 10) : null;
      const isCamera = Number.isInteger(cameraNumber);

      // Get server name from servers store
      const serverInfo = useServersStore
        .getState()
        .findByUrlPort(event.url, event.port);
      const serverName = serverInfo?.name || "Неизвестный сервер";

      return {
        id: event.id,
        time: downDate.toLocaleTimeString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        server: event.url,
        serverName,
        node: isCamera ? `Камера ${cameraNumber}` : "Сервер",
        duration,
        endTime: upDate
          ? upDate.toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          : undefined,
        url: `${event.url}:${event.port}`,
        port: event.port,
      };
    });
  };

  const tableRows = convertToTableRows(downtimeEvents);

  // Filter rows based on search query
  const filteredRows = tableRows.filter((row) =>
    [row.time, row.server, row.serverName, row.node, row.duration, row.endTime]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  // Calculate summary data using all events for current statistics
  const summary = {
    servers: stats.total,
    cameras: totalCameras,
    postponed: stats.downtimeCompleted,
    current: stats.downtimeActive,
  };

  const getDeleteMessage = () => {
    if (deleteTarget?.type === "single") {
      return `Удалить проблему с сервером ${deleteTarget.data?.serverName || deleteTarget.data?.server}?`;
    }

    // Show specific message based on current filter
    if (view === "current") {
      return "Удалить все актуальные проблемы?";
    } else if (view === "postponed") {
      return "Очистить историю?";
    }

    return "Удалить все проблемы?";
  };

  return (
    <div className={classes.container}>
      <PageHeader
        title="Мониторинг"
        rightSide={<MonitoringSummary {...summary} />}
      />
      {error && (
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Ошибка"
          color="rgb(250, 82, 82)"
          className={classes.errorAlert}
        >
          <Text size="sm">{error}</Text>
        </Alert>
      )}

      <MonitoringControls
        view={view}
        onChangeView={setView}
        query={query}
        onChangeQuery={setQuery}
      />

      <MonitoringTable
        type={view}
        rows={filteredRows}
        onDelete={isAdmin ? handleOpenDelete : undefined}
        onDeleteAll={isAdmin ? handleDeleteAll : undefined}
      />

      <div
        style={{
          marginTop: "24px",
          padding: "16px 0",
        }}
      >
        <Pagination
          currentPageIndex={currentPageIndex}
          pagesCount={pages}
          pageSize={pageSize}
          nextCursor={nextCursor}
          previousCursor={previousCursor}
          onPageChange={(cursor, pageIndex) => {
            setCurrentPageIndex(pageIndex);
            const filter = view === "current" ? "active" : "completed";
            void fetchDowntimeEvents(filter, cursor, pageSize);
          }}
        />
      </div>

      <DeleteConfirmModal
        opened={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Подтверждение удаления"
        message={getDeleteMessage()}
      />
    </div>
  );
};

export default Monitoring;
