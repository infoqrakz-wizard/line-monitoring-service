import { useCallback, useEffect, useState } from "react";
import { useMonitoringStore } from "@/store/monitoring";
import type { MediaState, ServerMonitoringData, User } from "@/types";

// Helper type for the flattened camera data
export type FlattenedCamera = {
  id: string;
  name: string;
  enabled: boolean;
  mediaState?: {
    enabled: boolean;
    streams?: {
      audio?: {
        enabled: boolean;
        datarate: number;
        framerate: number;
      };
      video?: {
        active: boolean;
        enabled: boolean;
        datarate: number;
        framerate: number;
      };
      video2?: {
        active: boolean;
        enabled: boolean;
        datarate: number;
        framerate: number;
      };
    };
  };
};

export const useServerInfo = (url: string | null, port: string | null) => {
  const [cameras, setCameras] = useState<FlattenedCamera[]>([]);
  const [mediaStates, setMediaStates] = useState<MediaState[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [main, setMain] = useState<ServerMonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverResponded, setServerResponded] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const {
    subscribeToSpecificServer,
    getServerByUrlPort,
    servers,
    loading: loadingMonitoring,
  } = useMonitoringStore();

  const resubscribe = useCallback(
    (url: string, port: number) => {
      subscribeToSpecificServer(url, port);
    },
    [subscribeToSpecificServer],
  );

  // Функция для принудительного обновления данных
  const forceUpdate = useCallback(() => {
    setUpdateTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (url && port) {
      setServerResponded(false);
      setLoading(true);
      subscribeToSpecificServer(url, parseInt(port));
    }
  }, [url, port, updateTrigger]);

  useEffect(() => {
    if (loadingMonitoring) {
      return;
    }

    if (url && port) {
      const server = getServerByUrlPort(url, parseInt(port));

      if (server) {
        // Сервер ответил - помечаем это
        setServerResponded(true);

        // Проверяем, есть ли основные данные сервера
        if (
          server.sections.main &&
          Object.keys(server.sections.main).length > 1
        ) {
          // Сервер доступен и предоставляет полные данные
          setMain(server.sections.main);

          // Extract cameras from the new nested structure
          const camerasData = server.sections.camerasName?.result.cameras;
          if (camerasData) {
            const flattenedCameras: FlattenedCamera[] = Object.entries(
              camerasData,
            ).map(([id, camera]) => {
              const cameraMediaState =
                server.sections.mediaState?.result.state.cameras[camera.id];

              return {
                id,
                enabled: camera.enabled,
                name: camera.name,
                mediaState: cameraMediaState,
              };
            });
            setCameras(flattenedCameras);
          } else {
            setCameras([]);
          }

          // Extract media state data
          const mediaData = server.sections.mediaState?.result.state.cameras;
          if (mediaData) {
            const flattenedMediaStates: MediaState[] = Object.entries(
              mediaData,
            ).map(([id, camera]) => ({
              cameraId: parseInt(id),
              main: {
                bitrate: camera.streams.video.datarate,
                fps: camera.streams.video.framerate,
              },
              sub: {
                bitrate: camera.streams.video2.datarate,
                fps: camera.streams.video2.framerate,
              },
              audio: {
                bitrate: camera.streams.audio?.datarate || 0,
              },
              status:
                camera.streams.video.active && camera.enabled
                  ? "working"
                  : camera.enabled
                    ? "error"
                    : "offline",
            }));
            setMediaStates(flattenedMediaStates);
          } else {
            setMediaStates([]);
          }

          setUsers(server.sections.users || []);
        } else {
          // Сервер недоступен - устанавливаем пустые данные
          setMain(server.sections.main || null);
          setCameras([]);
          setMediaStates([]);
          setUsers([]);
        }

        setLoading(false);
      } else if (serverResponded && !loadingMonitoring) {
        // Сервер не найден, но мы уже получили ответ от WebSocket
        setMain(null);
        setCameras([]);
        setMediaStates([]);
        setUsers([]);
        setLoading(false);
      }
    }
  }, [
    servers,
    url,
    port,
    getServerByUrlPort,
    loadingMonitoring,
    serverResponded,
    updateTrigger,
  ]);

  return {
    cameras,
    mediaStates,
    users,
    main,
    loading,
    serverResponded,
    resubscribe,
    forceUpdate,
  };
};
