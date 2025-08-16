import React, { useCallback, useEffect, useState } from "react";
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
  Tooltip,
} from "@mantine/core";
import { IconEyeOff, IconTrash, IconPlus } from "@tabler/icons-react";
import { useServersStore } from "@/store/servers";
import { useServerInfo } from "@/hooks/useServerInfo";
import { downtime } from "@/api";
import type { DowntimeEvent } from "@/types";
import classes from "./ServerInfo.module.css";
import { CreateUserModal } from "@/components/CreateUserModal";
import { useUsersStore } from "@/store/users";
import PageHeader from "@/components/PageHeader";
import { useMonitoringStore } from "@/store/monitoring";

const ServerInfo: React.FC = () => {
  const [searchParams] = useSearchParams();
  const url = searchParams.get("url");
  const port = searchParams.get("port");

  const [downtimeEvents, setDowntimeEvents] = useState<DowntimeEvent[]>([]);
  const [completedEvents, setCompletedEvents] = useState<DowntimeEvent[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const { cameras, users, mediaStates, main, resubscribe } = useServerInfo(
    url,
    port,
  );
  const [createLoading, setCreateLoading] = useState(false);

  const { servers } = useMonitoringStore();

  const { deleteUser, createUser } = useUsersStore((s) => ({
    deleteUser: s.deleteUser,
    createUser: s.createUser,
  }));

  const findByUrlPort = useCallback(
    (url: string, port: number) => {
      return servers.find(
        (server) =>
          server.sections.main.url === url &&
          server.sections.main.port === port,
      );
    },
    [servers],
  );

  // Get server credentials
  const server = url && port ? findByUrlPort(url, parseInt(port)) : undefined;
  const username = server?.sections.main.username || "";
  const password = server?.sections.main.password || "";

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
      console.error(message);
      // setCreateError(message);
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
      <PageHeader
        title={`${server?.sections.main.name || ""}`}
        rightSide={
          <div className={classes.serverInfo}>
            <div className={classes.serverInfoItem}>
              <span className={classes.serverInfoItemLabel}>URL:</span>
              <span className={classes.serverInfoItemValue}>{url}</span>
            </div>
            <div className={classes.serverInfoItem}>
              <span className={classes.serverInfoItemLabel}>Port:</span>
              <span className={classes.serverInfoItemValue}>{port}</span>
            </div>
            <div className={classes.serverInfoItem}>
              <span className={classes.serverInfoItemLabel}>Логин:</span>
              <span className={classes.serverInfoItemValue}>{username}</span>
            </div>
            <div className={classes.serverInfoItem}>
              <span className={classes.serverInfoItemLabel}>Пароль:</span>
              <span className={classes.serverInfoItemValue}>{password}</span>
            </div>
          </div>
        }
      />

      <div className={classes.content}>
        {/* Event Log - Left Side */}
        <div className={classes.eventLog}>
          <div className={classes.sectionHeader}>
            <div className={classes.sectionHeaderTitle}>Журнал событий</div>
            <Tooltip label="Очистить все записи">
              <ActionIcon
                // className={classes.sectionHeaderAction}
                variant="subtle"
                onClick={handleClearAllEvents}
                aria-label="Очистить все записи"
                color="#676767"
              >
                <IconEyeOff size={20} />
              </ActionIcon>
            </Tooltip>
          </div>

          <Stack gap="md">
            {[...downtimeEvents, ...completedEvents].map((event) => {
              const isCamera =
                !!event.type && Number.isInteger(parseInt(event.type, 10));
              // debugger;
              // const cameraName = isCamera
              //   ? cameras?.find((camera) => camera.id === event.type!)?.name
              //   : "";

              return (
                <div key={event.id} className={classes.eventCard}>
                  <Stack
                    justify="space-between"
                    align="flex-start"
                    dir="column"
                    w="100%"
                  >
                    <div className={classes.eventIdContainer}>
                      <div className={classes.eventId}>
                        <Text size="sm" fw={500}>
                          № {event.id} • от{" "}
                          {new Date(event.down_at).toLocaleDateString("ru-RU")}
                        </Text>
                      </div>

                      <Tooltip label="Удалить событие">
                        <ActionIcon
                          // className={classes.sectionHeaderAction}
                          color="#676767"
                          variant="subtle"
                          onClick={() => handleDeleteEvent(event.id)}
                          aria-label="Удалить событие"
                        >
                          <IconEyeOff size={20} />
                        </ActionIcon>
                      </Tooltip>
                    </div>
                    <div className={classes.eventInfo}>
                      {event.comment && (
                        <div className={classes.eventComment}>
                          {event.comment}
                        </div>
                      )}

                      <div className={classes.eventInfoRow}>
                        <span className={classes.eventInfoItemLabel}>
                          Сервер
                        </span>
                        <span className={classes.eventInfoItemValue}>
                          {server?.sections.main.name}
                        </span>
                      </div>
                      <div className={classes.eventInfoRow}>
                        <span className={classes.eventInfoItemLabel}>
                          Down/Up
                        </span>
                        <span className={classes.eventInfoItemValue}>
                          <Badge
                            color={event.up_at ? "green" : "red"}
                            variant="light"
                            size="sm"
                          >
                            {event.up_at ? "в сети" : "вне сети"}
                          </Badge>
                        </span>
                      </div>
                      <div className={classes.eventInfoRow}>
                        <span className={classes.eventInfoItemLabel}>
                          Время простоя
                        </span>
                        <span className={classes.eventInfoItemValue}>
                          {calculateDowntime(
                            event.down_at,
                            event.up_at || new Date().toDateString(),
                          )}
                        </span>
                      </div>
                      {/* <Text size="xs" c="dimmed">
                        {isCamera ? `Камера ${event.type}` : "Сервер"} •{" "}
                        {event.up_at ? "Up" : "Down"}
                      </Text> */}
                      {/* {event.up_at && (
                        <Text size="xs" c="dimmed">
                          Время простоя:{" "}
                          {calculateDowntime(event.down_at, event.up_at)}
                        </Text>
                      )} */}
                    </div>
                  </Stack>
                </div>
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
          <div className={classes.sectionHeaderTitle}>Камеры</div>
          <div className={classes.cameraSummary}>
            <div className={`${classes.summaryBox} ${classes.summaryBoxTotal}`}>
              <div className={classes.summaryBoxTitle}>Всего камер</div>
              <div className={classes.summaryBoxValue}>
                {main?.totalCameras}
              </div>
            </div>
            <div
              className={`${classes.summaryBox} ${classes.summaryBoxActive}`}
            >
              <div className={classes.summaryBoxTitle}>Активных</div>
              <div className={classes.summaryBoxValue}>
                {main?.enabledCameras}
              </div>
            </div>
            <div
              className={`${classes.summaryBox} ${classes.summaryBoxProblem}`}
            >
              <div className={classes.summaryBoxTitle}>Проблемных</div>
              <div className={classes.summaryBoxValue}>
                {(main?.totalCameras || 0) - (main?.enabledAllStreamsOk || 0)}
              </div>
            </div>
          </div>

          <Stack gap="0px">
            {cameras.map((camera) => {
              const isWorking = camera.enabled;

              const cameraInfo = mediaStates.find(
                (state) => state.cameraId === parseInt(camera.id),
              );

              // Helper function to format bitrate with appropriate units
              const formatBitrate = (
                bitrate?: number,
                isAudio: boolean = false,
              ) => {
                if (!bitrate || bitrate <= 0) {
                  return {
                    value: "-",
                    unit: isAudio ? "kbit/s" : "Mbit/s",
                  };
                }

                if (isAudio) {
                  // For audio, prefer Kb/s if > 1, otherwise b/s
                  if (bitrate / 1024 >= 1) {
                    return {
                      value: (bitrate / 1024).toFixed(1),
                      unit: "Kb/s",
                    };
                  } else {
                    return {
                      value: bitrate.toFixed(0),
                      unit: "b/s",
                    };
                  }
                } else {
                  // For video, prefer Mb/s if > 1, otherwise Kb/s
                  if (bitrate / (1024 * 1024) >= 1) {
                    return {
                      value: (bitrate / (1024 * 1024)).toFixed(1),
                      unit: "Mb/s",
                    };
                  } else {
                    return {
                      value: (bitrate / 1024).toFixed(1),
                      unit: "Kb/s",
                    };
                  }
                }
              };

              const mainBitrate = formatBitrate(cameraInfo?.main?.bitrate);
              const subBitrate = formatBitrate(cameraInfo?.sub?.bitrate);
              const audioBitrate = formatBitrate(
                cameraInfo?.audio?.bitrate,
                true,
              );

              const mainSpeedText =
                mainBitrate.value !== "-"
                  ? `${mainBitrate.value} ${mainBitrate.unit}, ${cameraInfo?.main?.fps || "-"} fps`
                  : "";
              const subSpeedText =
                subBitrate.value !== "-"
                  ? `${subBitrate.value} ${subBitrate.unit}, ${cameraInfo?.sub?.fps || "-"} fps`
                  : "";
              const audioSpeedText =
                audioBitrate.value !== "-"
                  ? `${audioBitrate.value} ${audioBitrate.unit}`
                  : "";

              return (
                <div key={camera.id} className={classes.cameraCard}>
                  <div className={classes.cameraHeader}>
                    <div className={classes.cameraNameContainer}>
                      <span className={classes.cameraNumber}>№{camera.id}</span>
                      <span className={classes.cameraName}>{camera.name}</span>
                      <span className={classes.cameraStatus}>
                        <Badge
                          color={isWorking ? "green" : "red"}
                          variant="light"
                        >
                          {isWorking ? "работает" : "ошибка"}
                        </Badge>
                      </span>
                    </div>
                  </div>

                  <div className={classes.cameraMetrics}>
                    <Text size="sm">
                      {mainSpeedText && (
                        <>
                          <b>Main:</b> {mainSpeedText}
                          {subSpeedText && " • "}
                        </>
                      )}
                      {subSpeedText && (
                        <>
                          {mainSpeedText && " • "}
                          <b>Sub:</b> {subSpeedText}
                        </>
                      )}
                      {audioSpeedText && (
                        <>
                          {subSpeedText && " • "}
                          <b>Audio:</b> {audioSpeedText}
                        </>
                      )}
                    </Text>
                  </div>

                  <div className={classes.cameraPreview}>
                    <Image
                      src={getCameraPreviewUrl(camera.id)}
                      alt={`Preview camera ${camera.id}`}
                      fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjQ4MCIgdmlld0JveD0iMCAwIDY0MCA0ODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2NDAiIGhlaWdodD0iNDgwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjMyMCIgeT0iMjQwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7Qn9GA0LXQtNC/0YDQvtGB0LzQvtGC0YAg0L3QtdC00L7RgdGC0YPQv9C10L08L3RleHQ+Cjwvc3ZnPgo="
                    />
                  </div>
                </div>
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
          <div
            className={`${classes.sectionHeader} ${classes.sectionHeaderUsers}`}
          >
            <div className={classes.sectionHeaderTitle}>Пользователи</div>
            <Button
              variant="black"
              leftSection={<IconPlus size={20} />}
              onClick={() => setShowAddUserModal(true)}
            >
              Добавить
            </Button>
          </div>

          <Stack gap="md" mt="md">
            {users.map((user) => (
              <div key={user.id} className={classes.userCard}>
                <Group justify="space-between" align="center">
                  <Group gap="0px">
                    <div className={classes.userAvatar}>
                      {/* <span className={classes.userAvatarText}> */}
                      {user.name.charAt(0).toUpperCase()}
                      {/* </span> */}
                    </div>
                    <div className={classes.userInfo}>
                      <span className={classes.userLogin}>{user.name}</span>
                      {user.description && (
                        <span className={classes.userDescription}>
                          {user.description}
                        </span>
                      )}
                    </div>
                  </Group>

                  <ActionIcon
                    variant="subtle"
                    color="#676767"
                    onClick={() => handleDeleteUser(user.name)}
                    aria-label="Удалить пользователя"
                  >
                    <IconTrash size={32} />
                  </ActionIcon>
                </Group>
              </div>
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
        loading={createLoading}
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
