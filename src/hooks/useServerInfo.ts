import { useCallback, useEffect, useState } from "react";
import { useMonitoringStore } from "@/store/monitoring";
import type { MediaState, ServerMonitoringData, User } from "@/types";

// Helper type for the flattened camera data
export type FlattenedCamera = {
  id: string;
  name: string;
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

export const useServerInfo = (url: string | null, port: string | null) => {
  const [cameras, setCameras] = useState<FlattenedCamera[]>([]);
  const [mediaStates, setMediaStates] = useState<MediaState[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [main, setMain] = useState<ServerMonitoringData | null>(null);

  const { subscribeToSpecificServer, getServerByUrlPort, servers } =
    useMonitoringStore();

  const resubscribe = useCallback(
    (url: string, port: number) => {
      subscribeToSpecificServer(url, port);
    },
    [subscribeToSpecificServer],
  );

  useEffect(() => {
    if (url && port) {
      subscribeToSpecificServer(url, parseInt(port));
    }
  }, [url, port]);

  useEffect(() => {
    if (url && port) {
      const server = getServerByUrlPort(url, parseInt(port));
      if (server) {
        console.log(server);
        setMain(server.sections.main);
        // Extract cameras from the new nested structure
        const cameraData = server.sections.camerasName?.result.cameras;
        if (cameraData) {
          const flattenedCameras: FlattenedCamera[] = Object.entries(
            cameraData,
          ).map(([id, camera]) => ({
            id,
            enabled: camera.enabled,
            name: camera.name,
          }));
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
      }
    }
  }, [servers, url, port, getServerByUrlPort]);

  return {
    cameras,
    mediaStates,
    users,
    main,
    resubscribe,
  };
};
