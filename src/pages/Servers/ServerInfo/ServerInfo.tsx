import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import {
  Stack,
  Group,
  Title,
  Text,
  Button,
  Badge,
  Image,
  Tooltip,
  Dialog,
  ActionIcon,
  Loader,
} from "@mantine/core";
import {
  IconTrash,
  IconPlus,
  IconCheck,
  IconPlayerPlay,
  IconPencil,
  IconEdit,
} from "@tabler/icons-react";
import { useServerInfo } from "@/hooks/useServerInfo";
import { downtime } from "@/api";
import { cameraApi, type CameraConfig } from "@/api/camera";
import type { DowntimeEvent, ServerStatus } from "@/types";
import { CreateUserModal } from "@/components/CreateUserModal";
import { useUsersStore } from "@/store/users";
import { useAuthStore } from "@/store/auth";
import PageHeader from "@/components/PageHeader";
import VideoPlayerModal from "@/components/VideoPlayerModal";
import CameraConfigModal from "@/components/CameraConfigModal";

import classes from "./ServerInfo.module.css";
import { useServersStore } from "@/store/servers";
import { useDisclosure } from "@mantine/hooks";
import LogItem from "./LogItem";
import ActionButton from "@/components/ActionButton";
import PageTitle from "@/components/PageTitle";
import { useMonitoringStore } from "@/store/monitoring";

const ServerInfo: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const url = searchParams.get("url");
  const port = searchParams.get("port");

  const [downtimeEvents, setDowntimeEvents] = useState<DowntimeEvent[]>([]);
  const [completedEvents, setCompletedEvents] = useState<DowntimeEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<number>(0);

  const [
    openedNotification,
    { toggle: toggleNotification, close: closeNotification },
  ] = useDisclosure(false);

  const [isCameraConfigOpen, setIsCameraConfigOpen] = useState(false);
  const [selectedCameraForConfig, setSelectedCameraForConfig] =
    useState<string>("");

  const {
    cameras,
    users,
    mediaStates,
    main,
    users: serverUsers,
    loading: loadingServerInfo,
    serverResponded,
    resubscribe,
  } = useServerInfo(url, port);

  const [createLoading, setCreateLoading] = useState(false);
  const [deletingUsers, setDeletingUsers] = useState<Set<string>>(new Set());
  const [serverStatus, setServerStatus] = useState<ServerStatus | "gray">(
    "gray",
  );

  const { fetchServers, findByUrlPort, forceUpdateWS } = useServersStore();

  const {
    subscribeToSpecificServer,
    getServerStatus,
    servers: monitoringServers,
  } = useMonitoringStore();

  useEffect(() => {
    if (url && port && monitoringServers.length > 0) {
      setServerStatus(
        getServerStatus(
          monitoringServers.find(
            (s) =>
              s.sections.main.url === url &&
              s.sections.main.port === parseInt(port),
          )!,
        ),
      );
    }
  }, [url, port, monitoringServers, getServerStatus]);

  const { role } = useAuthStore((s) => ({
    role: s.role,
  }));

  useEffect(() => {
    void fetchServers();
  }, [fetchServers]);

  useEffect(() => {
    if (url && port) {
      subscribeToSpecificServer(url, parseInt(port));
    }
  }, [url, port, subscribeToSpecificServer]);

  const { deleteUser, createUser } = useUsersStore((s) => ({
    deleteUser: s.deleteUser,
    createUser: s.createUser,
  }));

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

      const [serverDownEvents, cameraDownEvents, completedEvents] =
        await Promise.all([
          serverDownEventsPromise,
          cameraDownEventsPromise,
          completedEventsPromise,
        ]);

      setCompletedEvents(
        completedEvents.data.filter(
          (event) => event.url === url && event.port === parseInt(port),
        ),
      );
      const filteredEvents = [
        ...serverDownEvents.data,
        ...cameraDownEvents.data,
      ].filter((event) => event.url === url && event.port === parseInt(port));
      setDowntimeEvents(filteredEvents);
      setLoadingEvents(false);
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
      setCompletedEvents([]);
    } catch (error) {
      console.error("Failed to clear events:", error);
    }
  };

  const handleClearActiveEvents = async () => {
    if (!url || !port) {
      return;
    }

    try {
      // Удаляем все активные события
      for (const event of downtimeEvents) {
        await downtime.delete({ id: event.id });
      }
      setDowntimeEvents([]);
    } catch (error) {
      console.error("Failed to clear active events:", error);
    }
  };

  const handleClearCompletedEvents = async () => {
    if (!url || !port) {
      return;
    }

    try {
      // Удаляем все завершенные события
      for (const event of completedEvents) {
        await downtime.delete({ id: event.id });
      }
      setCompletedEvents([]);
    } catch (error) {
      console.error("Failed to clear completed events:", error);
    }
  };

  const handleAddUser = async ({
    login,
    password,
    description,
    createOnUnavailableServers,
    createOnNewServers,
    admin,
    archive,
  }: {
    login: string;
    password: string;
    description: string;
    createOnUnavailableServers: boolean;
    createOnNewServers: boolean;
    admin: boolean;
    archive: boolean;
  }) => {
    try {
      setCreateLoading(true);

      const availableServersData = [
        {
          id: server?.id?.toString() || "",
          name: server?.name || "",
          url: url || "",
          port: parseInt(port || "0"),
        },
      ];

      const options = {
        createOnUnavailableServers,
        createOnNewServers,
      };

      const permissions = {
        admin,
        archive,
      };

      await createUser(
        {
          name: login,
          password,
          description,
        },
        [server?.name || ""],
        availableServersData,
        options,
        permissions,
      );
      await forceUpdateWS();

      setCreateLoading(false);
      setShowAddUserModal(false);
      resubscribe(url!, parseInt(port!));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Не удалось создать пользователя";
      console.error(message);
      // setCreateError(message);
      throw error;
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // Set loading state for this user
    setDeletingUsers((prev) => new Set(prev).add(userId));

    try {
      // Create availableServers data for the current server
      const availableServersData = [
        {
          id: server?.id?.toString() || "",
          name: server?.name || "",
          url: url || "",
          port: parseInt(port || "0"),
        },
      ];

      await deleteUser(userId, [server?.name || ""], availableServersData);
      await forceUpdateWS();
      setTimeout(() => {
        if (url && port) {
          resubscribe(url, parseInt(port));
        }
      }, 1000);
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const handleOpenVideoPlayer = (cameraId: number) => {
    setSelectedCamera(cameraId);
    setIsVideoPlayerOpen(true);
  };

  const handleCloseVideoPlayer = () => {
    setIsVideoPlayerOpen(false);
  };

  const handleOpenCameraConfig = (cameraId: string) => {
    setSelectedCameraForConfig(cameraId);
    setIsCameraConfigOpen(true);
  };

  const handleCloseCameraConfig = () => {
    setIsCameraConfigOpen(false);
    setSelectedCameraForConfig("");
  };

  const handleSaveCameraConfig = async (config: CameraConfig) => {
    if (!url || !port || !username || !password || !selectedCameraForConfig) {
      return;
    }

    try {
      await cameraApi.setConfig(
        url,
        parseInt(port),
        username,
        password,
        selectedCameraForConfig,
        config,
      );
      await forceUpdateWS();
      handleCloseCameraConfig();
    } catch (err) {
      console.error("Error saving camera config:", err);
      // Здесь можно добавить уведомление об ошибке если нужно
    }
  };

  const getCameraPreviewUrl = (cameraId: string) => {
    if (!url || !port || !username) {
      return "";
    }

    const credentials = btoa(`${username}:${password || ""}`);
    return `https://${url}:${port}/cameras/${cameraId}/image?authorization=Basic%20${credentials}&keep_aspect_ratio=0&resolution=640x480`;
  };

  if (!url || !port) {
    return (
      <div className={classes.container}>
        <Title order={1}>Server not found</Title>
      </div>
    );
  }

  const hasUsers = serverUsers?.length && serverUsers.length > 0;

  return (
    <div className={classes.container}>
      <PageHeader
        withBackButton
        title={
          <div className={classes.serverInfoTitle}>
            <div
              className={`${classes.serverStatusBadge} ${classes[serverStatus]}`}
            />
            <PageTitle>{server?.name || ""}</PageTitle>
          </div>
        }
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
              <span
                className={`${classes.serverInfoItemValue} ${classes.serverInfoItemValuePassword}`}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? password : "********"}
              </span>
            </div>

            <div className={classes.editIconContainer}>
              <Tooltip label="Редактировать">
                <ActionButton
                  className={classes.editIcon}
                  size="lg"
                  onClick={() =>
                    navigate(
                      `/servers/edit?url=${encodeURIComponent(url || "")}&port=${encodeURIComponent(port || "")}`,
                    )
                  }
                >
                  <IconPencil size={16} />
                </ActionButton>
              </Tooltip>
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
                <IconTrash size={20} />
              </ActionIcon>
            </Tooltip>
          </div>

          <Stack gap="md">
            {/* Активные проблемы */}
            {downtimeEvents.length > 0 && (
              <div className={classes.eventsGroup}>
                <div className={classes.eventsGroupHeader}>
                  <Text size="sm" fw={500} className={classes.eventsGroupTitle}>
                    Активные
                  </Text>
                  <Tooltip label="Удалить все активные проблемы">
                    <ActionIcon
                      color="#676767"
                      variant="subtle"
                      onClick={() => handleClearActiveEvents()}
                      aria-label="Удалить все активные проблемы"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </div>
                <Stack gap="md">
                  {downtimeEvents.map((event) => (
                    <LogItem
                      key={event.id}
                      event={event}
                      server={server}
                      handleDeleteEvent={handleDeleteEvent}
                    />
                  ))}
                </Stack>
              </div>
            )}

            {/* Завершенные проблемы */}
            {completedEvents.length > 0 && (
              <div className={classes.eventsGroup}>
                <div className={classes.eventsGroupHeader}>
                  <Text size="sm" fw={500} className={classes.eventsGroupTitle}>
                    Завершенные
                  </Text>
                  <Tooltip label="Удалить все завершенные проблемы">
                    <ActionIcon
                      color="#676767"
                      variant="subtle"
                      onClick={() => handleClearCompletedEvents()}
                      aria-label="Удалить все завершенные проблемы"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </div>
                <Stack gap="md">
                  {completedEvents.map((event) => (
                    <LogItem
                      key={event.id}
                      event={event}
                      server={server}
                      handleDeleteEvent={handleDeleteEvent}
                    />
                  ))}
                </Stack>
              </div>
            )}

            {/* Сообщение если нет событий */}
            {!loadingEvents &&
              downtimeEvents.length === 0 &&
              completedEvents.length === 0 && (
                <Text c="dimmed" ta="center" py="xl">
                  Нет событий для отображения
                </Text>
              )}

            {loadingEvents && (
              <Text c="dimmed" ta="center" py="xl">
                Загрузка...
              </Text>
            )}
          </Stack>
        </div>

        {/* Cameras - Middle */}
        <div className={classes.cameras}>
          <div className={classes.sectionHeaderTitle}>Камеры</div>
          {serverStatus === "red" && (
            <Text c="dimmed" ta="center" py="xl">
              Нет доступа
            </Text>
          )}
          {serverStatus !== "red" && (
            <>
              {!loadingServerInfo && main?.totalCameras && (
                <div className={classes.cameraSummary}>
                  <div
                    className={`${classes.summaryBox} ${classes.summaryBoxTotal}`}
                  >
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
                      {(main?.totalCameras || 0) -
                        (main?.enabledAllStreamsOk || 0)}
                    </div>
                  </div>
                </div>
              )}
              <Stack gap="0px">
                {cameras.map((camera) => {
                  const isWorking = camera.enabled;

                  const cameraInfo = mediaStates.find(
                    (state) => state.cameraId === parseInt(camera.id),
                  );

                  let mainBitrate = "-";
                  if (cameraInfo?.main?.bitrate) {
                    mainBitrate = (
                      cameraInfo?.main?.bitrate /
                      1024 /
                      1024
                    ).toFixed(2);
                  }

                  let subBitrate = "-";
                  if (cameraInfo?.sub?.bitrate) {
                    subBitrate = (
                      cameraInfo?.sub?.bitrate /
                      1024 /
                      1024
                    ).toFixed(2);
                  }

                  let audioBitrate = "-";

                  if (cameraInfo?.audio?.bitrate) {
                    audioBitrate = (
                      cameraInfo?.audio?.bitrate /
                      1024 /
                      1024
                    ).toFixed(2);
                  }

                  const isHaveVideo = mainBitrate !== "-";

                  return (
                    <div key={camera.id} className={classes.cameraCard}>
                      <div className={classes.cameraHeader}>
                        <div className={classes.cameraNameContainer}>
                          <span className={classes.cameraNumber}>
                            №{camera.id}
                          </span>
                          <span className={classes.cameraName}>
                            {camera.name}
                          </span>
                          <span className={classes.cameraStatus}>
                            <Badge
                              color={isWorking ? "green" : "rgb(250, 82, 82)"}
                              variant="light"
                            >
                              {isWorking ? "работает" : "ошибка"}
                            </Badge>
                          </span>
                        </div>
                      </div>

                      <div className={classes.cameraMetrics}>
                        <div className={classes.metric}>
                          <Text size="xs" c="dimmed">
                            Main (Video)
                          </Text>
                          <Text size="sm">
                            {mainBitrate !== "-"
                              ? `${mainBitrate} Mbit/s, ${cameraInfo?.main?.fps} fps`
                              : "-"}
                          </Text>
                        </div>
                        <div className={classes.metric}>
                          <Text size="xs" c="dimmed">
                            Sub (Video2)
                          </Text>
                          <Text size="sm">
                            {subBitrate !== "-"
                              ? `${subBitrate} Mbit/s, ${cameraInfo?.sub?.fps} fps`
                              : "-"}
                          </Text>
                        </div>
                        <div className={classes.metric}>
                          <Text size="xs" c="dimmed">
                            Audio
                          </Text>
                          <Text size="sm">
                            {audioBitrate !== "-"
                              ? `${audioBitrate} kbit/s`
                              : "-"}
                          </Text>
                        </div>
                      </div>
                      <div className={classes.cameraPreview}>
                        <div className={classes.cameraPreviewContainer}>
                          <Image
                            src={getCameraPreviewUrl(camera.id)}
                            alt={`Preview camera ${camera.id}`}
                            fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjQ4MCIgdmlld0JveD0iMCAwIDY0MCA0ODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2NDAiIGhlaWdodD0iNDgwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjMyMCIgeT0iMjQwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7Qn9GA0LXQtNC/0YDQvtGB0LzQvtGC0YAg0L3QtdC00L7RgdGC0YPQv9C10L08L3RleHQ+Cjwvc3ZnPgo="
                          />
                          {role === "admin" && (
                            <div className={classes.cameraEditButtonContainer}>
                              <Tooltip label="Редактировать настройки камеры">
                                <ActionButton
                                  size="sm"
                                  className={classes.cameraEditButton}
                                  onClick={() =>
                                    handleOpenCameraConfig(camera.id)
                                  }
                                  aria-label="Редактировать настройки камеры"
                                >
                                  <IconEdit size={16} />
                                </ActionButton>
                              </Tooltip>
                            </div>
                          )}

                          {isHaveVideo && (
                            <div className={classes.cameraPreviewOverlay}>
                              <Tooltip label="Открыть видео-плеер">
                                <Button
                                  variant="white"
                                  size="sm"
                                  radius="xl"
                                  onClick={() =>
                                    handleOpenVideoPlayer(parseInt(camera.id))
                                  }
                                  className={classes.playButton}
                                  aria-label="Открыть видео-плеер"
                                >
                                  <IconPlayerPlay size={16} />
                                </Button>
                              </Tooltip>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {loadingServerInfo && !serverResponded && (
                  <Text c="dimmed" ta="center" py="xl">
                    Загрузка...
                  </Text>
                )}

                {!loadingServerInfo &&
                  cameras.length === 0 &&
                  serverResponded && (
                    <Text c="dimmed" ta="center" py="xl">
                      Нет камер для отображения
                    </Text>
                  )}

                {!loadingServerInfo && !serverResponded && (
                  <Text c="dimmed" ta="center" py="xl">
                    Ожидание ответа от сервера...
                  </Text>
                )}
              </Stack>
            </>
          )}
        </div>

        {/* Users - Right Side */}
        <div className={classes.users}>
          <div
            className={`${classes.sectionHeader} ${classes.sectionHeaderUsers}`}
          >
            <div className={classes.sectionHeaderTitle}>Пользователи</div>
            {!!hasUsers && serverResponded && (
              <Button
                variant="black"
                leftSection={<IconPlus size={20} />}
                onClick={() => setShowAddUserModal(true)}
              >
                Добавить
              </Button>
            )}
          </div>

          {loadingServerInfo && !serverResponded && (
            <Text c="dimmed" ta="center" py="xl">
              Загрузка...
            </Text>
          )}

          {serverResponded && !hasUsers && !loadingServerInfo && (
            <Text c="dimmed" ta="center" py="xl">
              Нет доступа
            </Text>
          )}

          {!serverResponded && !loadingServerInfo && (
            <Text c="dimmed" ta="center" py="xl">
              Ожидание ответа от сервера...
            </Text>
          )}
          {!!hasUsers && serverResponded && (
            <Stack gap="md" mt="md">
              {users.map((user) => {
                const isServerUser = user.name === username;

                return (
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

                      {!isServerUser && deletingUsers.has(user.name) && (
                        <Loader size={20} color="#676767" />
                      )}

                      {!isServerUser && !deletingUsers.has(user.name) && (
                        <ActionIcon
                          variant="transparent"
                          color="#676767"
                          onClick={() => handleDeleteUser(user.name)}
                          aria-label="Удалить пользователя"
                          disabled={deletingUsers.has(user.name)}
                        >
                          <IconTrash size={32} />
                        </ActionIcon>
                      )}
                    </Group>
                  </div>
                );
              })}

              {!loadingServerInfo && users.length === 0 && serverResponded && (
                <Text c="dimmed" ta="center" py="xl">
                  Нет пользователей для отображения
                </Text>
              )}

              {loadingServerInfo && !serverResponded && (
                <Text c="dimmed" ta="center" py="xl">
                  Загрузка...
                </Text>
              )}
            </Stack>
          )}
        </div>
      </div>

      <CreateUserModal
        opened={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSubmit={handleAddUser}
        onSuccess={() => {
          toggleNotification();
          setTimeout(() => {
            closeNotification();
          }, 3000);
          void forceUpdateWS();
        }}
        loading={createLoading}
        currentServer={server?.name || ""}
        availableServers={[
          {
            id: server?.id?.toString() || "",
            name: server?.name || "",
            url: url || "",
            port: parseInt(port || "0"),
          },
        ]}
        server={server?.name || ""} // Pre-select the current server
      />

      <Dialog
        opened={openedNotification}
        withCloseButton
        onClose={closeNotification}
        size="lg"
        radius="md"
      >
        <Group gap="xs">
          <IconCheck size={18} color="green" />
          <Text>Пользователь успешно создан</Text>
        </Group>
      </Dialog>

      <VideoPlayerModal
        opened={isVideoPlayerOpen}
        onClose={handleCloseVideoPlayer}
        streamUrl={url || ""}
        streamPort={parseInt(port || "0")}
        camera={selectedCamera}
        login={username}
        password={password}
        serverName={server?.name || ""}
      />

      <CameraConfigModal
        opened={isCameraConfigOpen}
        onClose={handleCloseCameraConfig}
        onSave={handleSaveCameraConfig}
        serverUrl={url || ""}
        serverPort={parseInt(port || "0")}
        username={username}
        password={password}
        camera={selectedCameraForConfig}
        serverName={server?.name || ""}
      />
    </div>
  );
};

export default ServerInfo;
