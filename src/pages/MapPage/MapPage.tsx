import React, { useEffect, useMemo } from "react";
import { Stack, Title, LoadingOverlay, Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useNavigate } from "react-router";
import YandexMap from "@/components/YandexMap";
import { useServersStore } from "@/store/servers";
import { useMonitoringStore } from "@/store/monitoring";
import type { ServerItem, ServerStatus } from "@/types";
import classes from "./MapPage.module.css";
import PageHeader from "@/components/PageHeader";

const MapPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    servers,
    loading: serversLoading,
    error: serversError,
    fetchServers,
  } = useServersStore();

  const {
    servers: monitoringServers,
    loading: monitoringLoading,
    getServerStatus,
    subscribeToServers,
    connect,
    isConnected,
  } = useMonitoringStore();

  const serverStatuses = useMemo(() => {
    const statuses: Record<string, ServerStatus> = {};

    monitoringServers.forEach((monitoringServer) => {
      const serverWithMonitoring = {
        id: monitoringServer.id,
        sections: monitoringServer.sections,
        updated_at: monitoringServer.updated_at,
      };
      const status = getServerStatus(serverWithMonitoring);

      const mainSection = monitoringServer.sections.main;
      if (mainSection) {
        statuses[`${mainSection.url}:${mainSection.port}`] = status;
      }
    });

    return statuses;
  }, [monitoringServers, getServerStatus]);

  const serversWithCoordinates = useMemo(() => {
    const filtered = servers.filter(
      (server) =>
        server.maps && server.maps.x && server.maps.y && server.enabled,
    );
    return filtered;
  }, [servers]);

  const handleServerClick = (server: ServerItem) => {
    void navigate(
      `/servers/info?url=${server.url}&port=${server.port.toString()}`,
    );
  };

  useEffect(() => {
    void fetchServers({ limit: 1000 });
  }, [fetchServers]);

  useEffect(() => {
    if (!isConnected) {
      void connect();
    }
  }, [connect, isConnected]);

  useEffect(() => {
    if (isConnected) {
      subscribeToServers(servers.map((s) => `${s.url}:${s.port}`));
    }
  }, [isConnected, servers]);

  const isLoading = serversLoading || monitoringLoading;
  const hasError = serversError;

  if (hasError) {
    return (
      <Stack gap="md">
        <Title order={1} size="h3">
          Карта
        </Title>
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Ошибка загрузки"
          color="red"
        >
          Не удалось загрузить данные серверов: {serversError}
        </Alert>
      </Stack>
    );
  }

  return (
    <div>
      {isLoading ? (
        <div className={classes.mapWrapper}>
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "#666",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
            }}
          >
            <LoadingOverlay visible={true} />
            Загрузка карты...
          </div>
        </div>
      ) : serversWithCoordinates.length > 0 ? (
        <YandexMap
          servers={serversWithCoordinates}
          serverStatuses={serverStatuses}
          onServerClick={handleServerClick}
        />
      ) : (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "#666",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
          }}
        >
          Нет серверов с координатами для отображения на карте
        </div>
      )}
    </div>
  );
};

export default MapPage;
