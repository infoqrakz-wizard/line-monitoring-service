import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Title, Button, Group, Text } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import classes from "./VideoPlayerModal.module.css";

export type VideoPlayerModalProps = {
  opened: boolean;
  onClose: () => void;
  streamUrl: string;
  streamPort: number;
  camera: number;
  login: string;
  password: string;
  protocol: "http" | "https";
  serverName: string;
};

// Интерфейс для DevLine Player
declare global {
  interface Window {
    DevLinePlayer: any;
    __DEVLINE_PLAYER_LOADER__: {
      loaded: boolean;
      onLoad: (callback: () => void) => void;
    };
  }
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  opened,
  streamUrl,
  streamPort,
  camera,
  login,
  password,
  serverName,
  protocol = "https",
  onClose,
}) => {
  const [isPlayerLoaded, setIsPlayerLoaded] = useState(false);
  const [isPlayerInitialized, setIsPlayerInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);

  // Загрузка DevLine Player
  useEffect(() => {
    if (!opened) {
      return;
    }

    const loadDevLinePlayer = () => {
      try {
        // Проверяем, загружен ли уже плеер
        if (window.DevLinePlayer) {
          setIsPlayerLoaded(true);
          return;
        }

        // Загружаем загрузчик DevLine Player
        const loaderScript = document.createElement("script");
        loaderScript.src = "/devline-player/devline-player-loader.js";
        loaderScript.setAttribute("data-base-url", "/devline-player/");
        loaderScript.async = true;

        loaderScript.onload = () => {
          // Ждем загрузки всех чанков
          if (window.__DEVLINE_PLAYER_LOADER__) {
            window.__DEVLINE_PLAYER_LOADER__.onLoad(() => {
              setIsPlayerLoaded(true);
            });
          }
        };

        loaderScript.onerror = () => {
          setError("Ошибка загрузки DevLine Player");
        };

        document.head.appendChild(loaderScript);

        return () => {
          document.head.removeChild(loaderScript);
        };
      } catch (err) {
        setError("Ошибка инициализации DevLine Player");
        console.error("Error loading DevLine Player:", err);
      }
    };

    void loadDevLinePlayer();
  }, [opened]);

  // Инициализация плеера
  useEffect(() => {
    if (
      !opened ||
      !isPlayerLoaded ||
      !playerContainerRef.current ||
      isPlayerInitialized
    ) {
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      playerInstanceRef.current = new window.DevLinePlayer(
        playerContainerRef.current,
        {
          streamUrl,
          streamPort,
          camera,
          login,
          password,
          mode: "live",
          muted: true,
          protocol,
        },
      );

      setIsPlayerInitialized(true);
      setError(null);
    } catch (err) {
      setError("Ошибка инициализации плеера");
      console.error("Error initializing player:", err);
    }
  }, [
    opened,
    isPlayerLoaded,
    streamUrl,
    streamPort,
    camera,
    login,
    password,
    protocol,
    isPlayerInitialized,
  ]);

  // Очистка при закрытии
  useEffect(() => {
    if (!opened && playerInstanceRef.current) {
      try {
        playerInstanceRef.current = null;
        setIsPlayerInitialized(false);
      } catch (err) {
        console.error("Error destroying player:", err);
      }
    }
  }, [opened]);

  const handleClose = () => {
    if (playerInstanceRef.current) {
      try {
        playerInstanceRef.current = null;
      } catch (err) {
        console.error("Error destroying player:", err);
      }
    }
    setIsPlayerInitialized(false);
    setError(null);
    onClose();
  };

  if (!opened) {
    return null;
  }

  return createPortal(
    <div className={classes.modal} role="dialog" aria-modal="true">
      <div className={classes.content}>
        <div className={classes.header}>
          <Title order={3} className={classes.title}>
            Видео-плеер: {serverName} - Камера {camera}
          </Title>
          <Button
            variant="subtle"
            color="gray"
            onClick={handleClose}
            className={classes.closeButton}
            aria-label="Закрыть плеер"
          >
            <IconX size={20} />
          </Button>
        </div>

        <div className={classes.playerContainer}>
          {error ? (
            <div className={classes.errorContainer}>
              <Text c="rgb(250, 82, 82)" size="lg" ta="center">
                {error}
              </Text>
              <Button onClick={handleClose} mt="md">
                Закрыть
              </Button>
            </div>
          ) : !isPlayerLoaded ? (
            <div className={classes.loadingContainer}>
              <Text size="lg" ta="center">
                Загрузка видео-плеера...
              </Text>
            </div>
          ) : (
            <div ref={playerContainerRef} className={classes.player} />
          )}
        </div>

        <div className={classes.footer}>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Сервер: {streamUrl}:{streamPort}
            </Text>
            <Button variant="outline" onClick={handleClose}>
              Закрыть
            </Button>
          </Group>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default VideoPlayerModal;
