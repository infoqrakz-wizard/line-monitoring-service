import { useEffect, useState } from "react";
import { Flex, Title, Alert, Text } from "@mantine/core";
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

const Monitoring: React.FC = () => {
  const [view, setView] = useState<MonitoringView>("current");
  const [query, setQuery] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "single" | "all";
    data?: ProblemRow;
  } | null>(null);

  const {
    downtimeEvents,
    error,
    fetchDowntimeEvents,
    deleteDowntimeEvent,
    deleteDowntimeByUrlPort,
    clearDowntimeEvents,
  } = useMonitoringStore();

  // Fetch data when view changes
  useEffect(() => {
    const filter = view === "current" ? "servers_down" : "completed";
    void fetchDowntimeEvents(filter);
  }, [view, fetchDowntimeEvents]);

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
        node: isCamera ? `Камера ${cameraNumber}` : "Сервер",
        duration,
        endTime: upDate
          ? upDate.toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          : undefined,
        url: event.url,
        port: event.port,
      };
    });
  };

  const tableRows = convertToTableRows(downtimeEvents);

  // Filter rows based on search query
  const filteredRows = tableRows.filter((row) =>
    [row.time, row.server, row.node, row.duration, row.endTime]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  // Calculate summary data
  const summary = {
    servers: downtimeEvents?.filter((e) => e.type === null).length || 0,
    cameras: downtimeEvents?.filter((e) => e.type === "2").length || 0,
    postponed: downtimeEvents?.filter((e) => e.up_at !== null).length || 0,
    current: downtimeEvents?.filter((e) => e.up_at === null).length || 0,
  };

  const getDeleteMessage = () => {
    if (deleteTarget?.type === "single") {
      return `Удалить проблему с сервером ${deleteTarget.data?.server}?`;
    }

    // Show specific message based on current filter
    if (view === "current") {
      return "Удалить все актуальные проблемы?";
    } else if (view === "postponed") {
      return "Удалить все отложенные проблемы?";
    }

    return "Удалить все проблемы?";
  };

  return (
    <div className={classes.container}>
      <Flex
        direction="row"
        justify="space-between"
        align="center"
        className={classes.header}
      >
        <Title order={2}>Мониторинг</Title>
        <MonitoringSummary {...summary} />
      </Flex>

      {error && (
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Ошибка"
          color="red"
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
        onDelete={handleOpenDelete}
        onDeleteAll={handleDeleteAll}
      />

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
