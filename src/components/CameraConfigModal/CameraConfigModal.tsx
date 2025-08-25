import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Title,
  Button,
  Group,
  Text,
  Switch,
  TextInput,
  Select,
  Stack,
  Divider,
  LoadingOverlay,
} from "@mantine/core";
import { IconX, IconDeviceFloppy } from "@tabler/icons-react";
import { cameraApi, type CameraConfig } from "@/api/camera";
import classes from "./CameraConfigModal.module.css";

export type CameraConfigModalProps = {
  opened: boolean;
  onClose: () => void;
  serverUrl: string;
  serverPort: number;
  username: string;
  password: string;
  camera: string;
  serverName: string;
};

const recordModeOptions = [
  {
    value: "permanent",
    label: "Постоянная",
  },
  {
    value: "alarm",
    label: "По детекции",
  },
  {
    value: "none",
    label: "Отключена",
  },
];

const CameraConfigModal: React.FC<CameraConfigModalProps> = ({
  opened,
  onClose,
  serverUrl,
  serverPort,
  username,
  password,
  camera,
  serverName,
}) => {
  const [config, setConfig] = useState<CameraConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load camera configuration when modal opens
  useEffect(() => {
    if (!opened) {
      return;
    }

    const loadConfig = async () => {
      setLoading(true);
      setError(null);

      try {
        const cameraConfig = await cameraApi.getConfig(
          serverUrl,
          serverPort,
          username,
          password,
          camera,
        );
        setConfig(cameraConfig);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ошибка загрузки конфигурации",
        );
        console.error("Error loading camera config:", err);
      } finally {
        setLoading(false);
      }
    };

    void loadConfig();
  }, [opened, serverUrl, serverPort, username, password, camera]);

  const handleSave = async () => {
    if (!config) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await cameraApi.setConfig(
        serverUrl,
        serverPort,
        username,
        password,
        camera,
        config,
      );
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ошибка сохранения конфигурации",
      );
      console.error("Error saving camera config:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const updateConfig = (updates: Partial<CameraConfig>) => {
    if (config) {
      setConfig({
        ...config,
        ...updates,
      });
    }
  };

  const updateVideoStream = (
    streamKey: "video" | "video2",
    updates: Partial<CameraConfig["video_streams"][typeof streamKey]>,
  ) => {
    if (config) {
      setConfig({
        ...config,
        video_streams: {
          ...config.video_streams,
          [streamKey]: {
            ...config.video_streams[streamKey],
            ...updates,
          },
        },
      });
    }
  };

  const updateAudioStream = (
    updates: Partial<CameraConfig["audio_streams"]["audio"]>,
  ) => {
    if (config) {
      setConfig({
        ...config,
        audio_streams: {
          audio: {
            ...config.audio_streams.audio,
            ...updates,
          },
        },
      });
    }
  };

  if (!opened) {
    return null;
  }

  return createPortal(
    <div className={classes.modal} role="dialog" aria-modal="true">
      <div className={classes.content}>
        <LoadingOverlay visible={loading} />

        <div className={classes.header}>
          <Title order={3} className={classes.title}>
            Настройки камеры: {serverName} - Камера {camera}
          </Title>
          <Button
            variant="subtle"
            color="gray"
            onClick={handleCancel}
            className={classes.closeButton}
            aria-label="Закрыть настройки"
          >
            <IconX size={20} />
          </Button>
        </div>

        <div className={classes.body}>
          {error && (
            <Text c="red" size="sm" mb="md">
              {error}
            </Text>
          )}

          {config && (
            <Stack gap="lg">
              {/* Global camera settings */}
              <div className={classes.section}>
                <Title order={4} mb="md">
                  Общие настройки
                </Title>

                <Switch
                  label="Камера активна"
                  checked={config.enabled}
                  onChange={(event) =>
                    updateConfig({ enabled: event.currentTarget.checked })
                  }
                  disabled={loading}
                />

                <TextInput
                  label="Имя камеры"
                  value={config.name}
                  onChange={(event) =>
                    updateConfig({ name: event.currentTarget.value })
                  }
                  disabled={!config.enabled || loading}
                  mt="md"
                  autoComplete="off"
                />
              </div>

              <Divider />

              {/* Main video stream settings */}
              <div className={classes.section}>
                <Title order={4} mb="md">
                  Основной RTSP поток
                </Title>

                <TextInput
                  label="URL потока"
                  value={config.video_streams.video.url}
                  onChange={(event) =>
                    updateVideoStream("video", {
                      url: event.currentTarget.value,
                    })
                  }
                  disabled={!config.enabled || loading}
                  readOnly
                  autoComplete="off"
                />

                <Select
                  label="Тип записи"
                  value={config.video_streams.video.record_mode}
                  onChange={(value) =>
                    updateVideoStream("video", {
                      record_mode: value as "permanent" | "alarm" | "none",
                    })
                  }
                  data={recordModeOptions}
                  disabled={!config.enabled || loading}
                  mt="md"
                  autoComplete="off"
                />
              </div>

              <Divider />

              {/* Secondary video stream settings */}
              <div className={classes.section}>
                <Title order={4} mb="md">
                  Дополнительный RTSP поток
                </Title>

                <Switch
                  label="Поток активен"
                  checked={config.video_streams.video2.enabled}
                  onChange={(event) =>
                    updateVideoStream("video2", {
                      enabled: event.currentTarget.checked,
                    })
                  }
                  disabled={!config.enabled || loading}
                />

                <TextInput
                  label="URL потока"
                  value={config.video_streams.video2.url}
                  onChange={(event) =>
                    updateVideoStream("video2", {
                      url: event.currentTarget.value,
                    })
                  }
                  disabled={
                    !config.enabled ||
                    !config.video_streams.video2.enabled ||
                    loading
                  }
                  readOnly
                  mt="md"
                />

                <Select
                  label="Тип записи"
                  value={config.video_streams.video2.record_mode}
                  onChange={(value) =>
                    updateVideoStream("video2", {
                      record_mode: value as "permanent" | "alarm" | "none",
                    })
                  }
                  data={recordModeOptions}
                  disabled={
                    !config.enabled ||
                    !config.video_streams.video2.enabled ||
                    loading
                  }
                  mt="md"
                />
              </div>

              <Divider />

              {/* Audio stream settings */}
              <div className={classes.section}>
                <Title order={4} mb="md">
                  Аудио поток
                </Title>

                <Switch
                  label="Аудио активно"
                  checked={config.audio_streams.audio.enabled}
                  onChange={(event) =>
                    updateAudioStream({ enabled: event.currentTarget.checked })
                  }
                  disabled={!config.enabled || loading}
                />
              </div>
            </Stack>
          )}
        </div>

        <div className={classes.footer}>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Сервер: {serverUrl}:{serverPort}
            </Text>
            <Group>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
              >
                Отмена
              </Button>
              <Button
                leftSection={<IconDeviceFloppy size={16} />}
                onClick={handleSave}
                loading={saving}
                disabled={!config || loading}
              >
                Сохранить
              </Button>
            </Group>
          </Group>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default CameraConfigModal;
