import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import {
  Stack,
  Group,
  Title,
  Text,
  Button,
  Card,
  Badge,
  Image,
  ActionIcon,
  Modal,
  TextInput,
} from "@mantine/core";
import {
  IconEyeOff,
  IconTrash,
  IconPlus,
  IconVideo,
} from "@tabler/icons-react";
import { useServersStore } from "@/store/servers";
import { useServerInfo } from "@/hooks/useServerInfo";
import { downtime } from "@/api";
import type { DowntimeEvent } from "@/types";
import classes from "./ServerInfo.module.css";
import { CreateUserModal } from "@/components/CreateUserModal";
import { useUsersStore } from "@/store/users";

const ServerInfo: React.FC = () => {
  const [searchParams] = useSearchParams();
  const url = searchParams.get("url");
  const port = searchParams.get("port");

  const [downtimeEvents, setDowntimeEvents] = useState<DowntimeEvent[]>([]);
  const [completedEvents, setCompletedEvents] = useState<DowntimeEvent[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    password: "",
    description: "",
  });

  const { findByUrlPort } = useServersStore();
  const { cameras, users, mediaStates, main, resubscribe } = useServerInfo(
    url,
    port,
  );
  const [createLoading, setCreateLoading] = useState(false);

  const { deleteUser, createUser } = useUsersStore((s) => ({
    deleteUser: s.deleteUser,
    createUser: s.createUser,
  }));

  // Get server credentials
  const server = url && port ? findByUrlPort(url, parseInt(port)) : undefined;
  const username = server?.username || "";
  const password = server?.password || "";

  useEffect(() => {
    if (url && port) {
      // Fetch initial downtime events
      void fetchDowntimeEvents();
    }
  }, [url, port]);

  const fetchDowntimeEvents = async () => {
    if (!url || !port) {
      return;
    }

    try {
      const serverDownEventsPromise = downtime.query({
        filter: "servers_down",
      });

      const cameraDownEventsPromise = downtime.query({
        filter: "cameras_down",
      });

      const completedEventsPromise = downtime.query({
        filter: "completed",
      });

      const results = Promise.allSettled([
        serverDownEventsPromise,
        cameraDownEventsPromise,
        completedEventsPromise,
      ]);

      const [serverDownEvents, cameraDownEvents, completedEvents] =
        await Promise.all([
          serverDownEventsPromise,
          cameraDownEventsPromise,
          completedEventsPromise,
        ]);

      setCompletedEvents(completedEvents.data);
      setDowntimeEvents([...serverDownEvents.data, ...cameraDownEvents.data]);
    } catch (error) {
      console.error("Failed to fetch downtime events:", error);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    try {
      await downtime.delete({ id });
      if (downtimeEvents.some((event) => event.id === id)) {
        setDowntimeEvents((prev) => prev.filter((event) => event.id !== id));
      } else {
        setCompletedEvents((prev) => prev.filter((event) => event.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  const handleClearAllEvents = async () => {
    if (!url || !port) {
      return;
    }

    try {
      await downtime.delete({
        url,
        port: parseInt(port),
      });
      setDowntimeEvents([]);
    } catch (error) {
      console.error("Failed to clear events:", error);
    }
  };

  const handleAddUser = async ({
    login,
    password,
  }: {
    login: string;
    password: string;
  }) => {
    try {
      setCreateLoading(true);
      await createUser(
        {
          name: login,
          password,
          description: "",
        },
        [`${url}:${port}`],
      );
      setCreateLoading(false);
      setShowAddUserModal(false);
      resubscribe(url!, parseInt(port!));
      // Refresh the user list to show the newly created user
      // await fetchUsers({
      //   limit: 50,
      //   offset: 0,
      // });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Не удалось создать пользователя";
      setCreateError(message);
      throw error; // Re-throw to let the modal handle the loading state
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    void deleteUser(userId, [`${url}:${port}`]);
    setTimeout(() => {
      if (url && port) {
        resubscribe(url, parseInt(port));
      }
    }, 1000);
  };

  const getCameraPreviewUrl = (cameraId: string) => {
    if (!url || !port || !username || !password) {
      return "";
    }

    const credentials = btoa(`${username}:${password}`);
    return `https://${url}:${port}/cameras/${cameraId}/image?authorization=Basic%20${credentials}&keep_aspect_ratio=0&resolution=640x480`;
  };

  if (!url || !port) {
    return (
      <div className={classes.container}>
        <Title order={1}>Server not found</Title>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <Title order={1}>
          {url}:{port}
        </Title>
        <Button variant="black" leftSection={<IconVideo size={20} />}>
          Показать график
        </Button>
      </div>

      <div className={classes.content}>
        {/* Event Log - Left Side */}
        <div className={classes.eventLog}>
          <div className={classes.sectionHeader}>
            <Title order={3}>Журнал событий</Title>
            <ActionIcon
              variant="subtle"
              onClick={handleClearAllEvents}
              aria-label="Очистить все записи"
            >
              <IconEyeOff size={20} />
            </ActionIcon>
          </div>

          <Stack gap="md">
            {[...downtimeEvents, ...completedEvents].map((event) => {
              const isCamera = Number.isInteger(parseInt(event.type, 10));
              return (
                <Card key={event.id} className={classes.eventCard}>
                  <Group justify="space-between" align="flex-start">
                    <div className={classes.eventInfo}>
                      <Text size="sm" fw={500}>
                        № {event.id} • от{" "}
                        {new Date(event.down_at).toLocaleDateString("ru-RU")}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {isCamera ? `Камера ${event.type}` : "Сервер"} •{" "}
                        {event.up_at ? "Up" : "Down"}
                      </Text>
                      {event.up_at && (
                        <Text size="xs" c="dimmed">
                          Время простоя:{" "}
                          {calculateDowntime(event.down_at, event.up_at)}
                        </Text>
                      )}
                    </div>

                    <div className={classes.eventActions}>
                      <Badge
                        color={event.up_at ? "green" : "red"}
                        variant="light"
                        size="sm"
                      >
                        {event.up_at ? "в сети" : "вне сети"}
                      </Badge>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDeleteEvent(event.id)}
                        aria-label="Удалить событие"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </div>
                  </Group>
                </Card>
              );
            })}

            {downtimeEvents.length === 0 && (
              <Text c="dimmed" ta="center" py="xl">
                Нет событий для отображения
              </Text>
            )}
          </Stack>
        </div>

        {/* Cameras - Middle */}
        <div className={classes.cameras}>
          <Title order={3}>Камеры</Title>

          <div className={classes.cameraSummary}>
            <div className={classes.summaryBox}>
              <Text size="lg" fw={700}>
                {main?.totalCameras}
              </Text>
              <Text size="sm" c="dimmed">
                Всего камер
              </Text>
            </div>
            <div className={classes.summaryBox}>
              <Text size="lg" fw={700}>
                {main?.enabledCameras}
              </Text>
              <Text size="sm" c="dimmed">
                Активных
              </Text>
            </div>
            <div className={classes.summaryBox}>
              <Text size="lg" fw={700}>
                {(main?.totalCameras || 0) - (main?.enabledAllStreamsOk || 0)}
              </Text>
              <Text size="sm" c="dimmed">
                Проблемных
              </Text>
            </div>
          </div>

          <Stack gap="md">
            {cameras.map((camera) => {
              const isWorking = camera.enabled;

              const cameraInfo = mediaStates.find(
                (state) => state.cameraId === parseInt(camera.id),
              );

              let mainBitrate = "-";
              if (cameraInfo?.main?.bitrate) {
                mainBitrate = (cameraInfo?.main?.bitrate / 1024 / 1024).toFixed(
                  2,
                );
              }

              let subBitrate = "-";
              if (cameraInfo?.sub?.bitrate) {
                subBitrate = (cameraInfo?.sub?.bitrate / 1024 / 1024).toFixed(
                  2,
                );
              }

              let audioBitrate = "-";

              if (cameraInfo?.audio?.bitrate) {
                audioBitrate = (
                  cameraInfo?.audio?.bitrate /
                  1024 /
                  1024
                ).toFixed(2);
              }

              return (
                <Card key={camera.id} className={classes.cameraCard}>
                  <div className={classes.cameraHeader}>
                    <Text fw={500}>
                      №{camera.id} {camera.name}
                    </Text>
                    <Badge color={isWorking ? "green" : "red"} variant="light">
                      {isWorking ? "работает" : "ошибка"}
                    </Badge>
                  </div>

                  <div className={classes.cameraMetrics}>
                    <div className={classes.metric}>
                      <Text size="xs" c="dimmed">
                        Main (Video)
                      </Text>
                      <Text size="sm">
                        {mainBitrate} Mbit/s, {cameraInfo?.main?.fps} fps
                      </Text>
                    </div>
                    <div className={classes.metric}>
                      <Text size="xs" c="dimmed">
                        Sub (Video2)
                      </Text>
                      <Text size="sm">
                        {subBitrate} Mbit/s, {cameraInfo?.sub?.fps} fps
                      </Text>
                    </div>
                    <div className={classes.metric}>
                      <Text size="xs" c="dimmed">
                        Audio
                      </Text>
                      <Text size="sm">{audioBitrate} kbit/s</Text>
                    </div>
                  </div>

                  <div className={classes.cameraPreview}>
                    <Image
                      src={getCameraPreviewUrl(camera.id)}
                      alt={`Preview camera ${camera.id}`}
                      fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjQ4MCIgdmlld0JveD0iMCAwIDY0MCA0ODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2NDAiIGhlaWdodD0iNDgwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjMyMCIgeT0iMjQwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7Qn9GA0LXQtNC/0YDQvtGB0LzQvtGC0YAg0L3QtdC00L7RgdGC0YPQv9C10L08L3RleHQ+Cjwvc3ZnPgo="
                    />
                  </div>
                </Card>
              );
            })}

            {cameras.length === 0 && (
              <Text c="dimmed" ta="center" py="xl">
                Нет камер для отображения
              </Text>
            )}
          </Stack>
        </div>

        {/* Users - Right Side */}
        <div className={classes.users}>
          <div className={classes.sectionHeader}>
            <Title order={3}>Пользователи</Title>
            <Button
              variant="black"
              leftSection={<IconPlus size={20} />}
              onClick={() => setShowAddUserModal(true)}
            >
              Добавить
            </Button>
          </div>

          <Stack gap="md">
            {users.map((user) => (
              <Card key={user.id} className={classes.userCard}>
                <Group justify="space-between" align="center">
                  <Group gap="sm">
                    <div className={classes.userAvatar}>
                      <Text size="sm" fw={700}>
                        {user.name.charAt(0).toUpperCase()}
                      </Text>
                    </div>
                    <div>
                      <Text fw={500}>{user.name}</Text>
                      {user.description && (
                        <Text size="xs" c="dimmed">
                          {user.description}
                        </Text>
                      )}
                    </div>
                  </Group>

                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => handleDeleteUser(user.name)}
                    aria-label="Удалить пользователя"
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Card>
            ))}

            {users.length === 0 && (
              <Text c="dimmed" ta="center" py="xl">
                Нет пользователей для отображения
              </Text>
            )}
          </Stack>
        </div>
      </div>

      <CreateUserModal
        opened={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSubmit={handleAddUser}
      />
      {/* Add User Modal */}
      {/* <Modal
        opened={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        title="Добавить пользователя"
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Имя пользователя"
            value={newUser.name}
            onChange={(e) =>
              setNewUser((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            required
          />
          <TextInput
            label="Пароль"
            value={newUser.password}
            onChange={(e) =>
              setNewUser((prev) => ({
                ...prev,
                password: e.target.value,
              }))
            }
            required
          />
          <TextInput
            label="Описание"
            placeholder="Введите описание"
            value={newUser.description}
            onChange={(e) =>
              setNewUser((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={() => setShowAddUserModal(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddUser}>Добавить</Button>
          </Group>
        </Stack>
      </Modal> */}
    </div>
  );
};

// Helper function to calculate downtime duration
const calculateDowntime = (downAt: string, upAt: string): string => {
  const down = new Date(downAt).getTime();
  const up = new Date(upAt).getTime();
  const diff = up - down;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export default ServerInfo;
