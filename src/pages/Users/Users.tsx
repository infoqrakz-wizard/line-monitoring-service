import { FC, useEffect, useState, useMemo, useCallback } from "react";
import { Button, Stack, Tooltip, Group, Tabs } from "@mantine/core";
import SearchInput from "@/components/SearchInput/SearchInput";
import { useUsersStore } from "@/store/users";
import { CreateUserModal, UserData } from "@/components/CreateUserModal";
import { DeleteUserData } from "@/components/DeleteUserModal";
import DeleteUserModal from "@/components/DeleteUserModal/DeleteUserModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal/DeleteConfirmModal";
import PageHeader from "@/components/PageHeader";
import PlusIcon from "../../assets/icons/plus.svg?react";
import ActionButton from "@/components/ActionButton/ActionButton";
import classes from "./Users.module.css";
import { useMonitoringStore } from "@/store/monitoring";
import { useQueueStore } from "@/store/queue";
import { User, ServerWithMonitoring, QueueItem } from "@/types";
import { forceUpdateWS } from "@/api/servers";
import { useDisclosure } from "@mantine/hooks";
import Toast from "@/components/Toast";
import { IconCheck, IconX, IconTrash } from "@tabler/icons-react";
import { ApiError } from "@/lib/request";
import { deepEqual } from "@/utils/deepEqual";

const Users: FC = () => {
  const [q, setQ] = useState("");

  const { deleteUser, createUser } = useUsersStore((s) => ({
    deleteUser: s.deleteUser,
    createUser: s.createUser,
  }));

  // Состояния для модальных окон
  const [createUserModalOpened, setCreateUserModalOpened] = useState(false);
  const [deleteUserModalOpened, setDeleteUserModalOpened] = useState(false);
  const [deleteConfirmOpened, setDeleteConfirmOpened] = useState(false);

  // сервера, на которых удалось создать пользователя
  const [successServers, setSuccessServers] = useState<string[]>([]);
  // сервера, на которых не удалось создать пользователя
  const [errorServers, setErrorServers] = useState<string[]>([]);

  // Пользователь для удаления
  const [userToDelete, setUserToDelete] = useState<Pick<
    User,
    "id" | "name"
  > | null>(null);

  // Ошибки
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [deleteUserError, setDeleteUserError] = useState<string | null>(null);

  // Состояние загрузки для удаления
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Состояние загрузки для создания
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);

  const [usersServersMapping, setUsersServersMapping] = useState<
    (User & {
      servers: ServerWithMonitoring[];
    })[]
  >([]);

  const [toastOpened, { toggle: toggleToast, close: closeToast }] =
    useDisclosure(false);

  const { subscribeToServers, users, servers } = useMonitoringStore();

  // Queue store
  const {
    items: queueItems,
    loading: queueLoading,
    loadQueue,
    deleteItem: deleteQueueItem,
  } = useQueueStore();

  // Состояние для удаления отложенного действия
  const [deletingQueueItemId, setDeletingQueueItemId] = useState<string | null>(
    null,
  );

  const handleCreateUserOpen = () => setCreateUserModalOpened(true);
  const handleCreateUserClose = () => {
    setCreateUserModalOpened(false);
    setCreateUserError(null);
  };

  // const handleDeleteUserOpen = () => setDeleteUserModalOpened(true);
  const handleDeleteUserClose = () => {
    setDeleteUserModalOpened(false);
    setDeleteUserError(null);
  };

  const sortedMapping = useMemo(() => {
    if (!users || !servers) {
      return [];
    }

    const mapping = users.reduce(
      (acc, user) => {
        acc.push({
          ...user,
          servers: servers.filter((server) =>
            server.sections.users?.some((u) => u.name === user.name),
          ),
        });
        return acc;
      },
      [] as (User & {
        servers: ServerWithMonitoring[];
      })[],
    );

    return mapping.sort((a, b) => a.sc.localeCompare(b.sc));
  }, [users, servers]);

  useEffect(() => {
    if (!deepEqual(usersServersMapping, sortedMapping)) {
      setUsersServersMapping(sortedMapping);
    }
  }, [sortedMapping, usersServersMapping]);

  const handleDeleteConfirmOpen = (user: User) => {
    setUserToDelete({
      id: user.id,
      name: user.name,
    });
    setDeleteConfirmOpened(true);
  };

  const handleDeleteConfirmClose = () => {
    setDeleteConfirmOpened(false);
    setUserToDelete(null);
  };

  const handleClearCreateUserError = useCallback(
    () => setCreateUserError(null),
    [],
  );
  const handleClearDeleteUserError = useCallback(
    () => setDeleteUserError(null),
    [],
  );

  useEffect(() => {
    subscribeToServers();
    void loadQueue();
  }, [subscribeToServers, loadQueue]);

  // Функция для получения текста отложенного действия
  const getQueueItemText = useCallback(
    (item: QueueItem): string => {
      if (item.url && item.port) {
        // Найти название сервера по URL и порту
        const server = servers.find(
          (s) =>
            s.sections.main.url === item.url &&
            s.sections.main.port === item.port,
        );
        const serverName =
          server?.sections.main.name || `${item.url}:${item.port}`;
        return `Создание «${item.login}» на ${serverName}`;
      } else {
        return `Создание «${item.login}» на новых серверах`;
      }
    },
    [servers],
  );

  // Функция для удаления отложенного действия
  const handleDeleteQueueItem = useCallback(
    async (id: string) => {
      try {
        setDeletingQueueItemId(id);
        await deleteQueueItem(id);
      } catch (error) {
        console.error("Failed to delete queue item:", error);
      } finally {
        setDeletingQueueItemId(null);
      }
    },
    [deleteQueueItem],
  );

  const handleDeleteUser = async (userName: string) => {
    try {
      setDeleteLoading(true);
      const user = usersServersMapping.find((u) => u.name === userName);
      if (!user) {
        throw new Error("User not found");
      }

      const serverNames = user.servers.map((s) => s.sections.main.name);

      const availableServersData = servers.map((server) => ({
        id: server.id,
        name: server.sections.main.name,
        url: server.sections.main.url,
        port: server.sections.main.port,
      }));

      await deleteUser(user.name, serverNames, availableServersData);

      await forceUpdateWS();

      handleDeleteConfirmClose();
    } catch (error) {
      console.error("Failed to delete user:", error);
      // Можно добавить уведомление об ошибке
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Stack className={classes.wrapper} gap="md">
      <PageHeader
        title="Пользователи"
        rightSide={
          <div className={classes.actionsDesktop}>
            <Button
              className={classes.addButton}
              variant="black"
              leftSection={<PlusIcon />}
              aria-label="Добавить пользователя"
              disabled={createUserLoading}
              onClick={handleCreateUserOpen}
            >
              Добавить пользователя
            </Button>
            <SearchInput
              // className={classes.searchInput}
              rootClassName={classes.searchInputRoot}
              inputClassName={classes.searchInput}
              className={classes.searchInput}
              value={q}
              onChange={setQ}
              placeholder="Найти пользователя..."
              disabled={createUserLoading || deleteLoading}
            />
          </div>
        }
      />

      <Tabs
        variant="none"
        defaultValue="users"
        className={classes.tabsRoot}
        keepMounted={false}
      >
        <Tabs.List className={classes.tabsList}>
          <Tabs.Tab className={classes.tab} value="users">
            Пользователи{" "}
            <span className={classes.count}>
              ({usersServersMapping.filter((u) => u.name.includes(q)).length})
            </span>
          </Tabs.Tab>
          {/* <Tabs.Tab className={classes.tab} value="logs">
            Логи событий
          </Tabs.Tab> */}
          <Tabs.Tab className={classes.tab} value="postponed">
            Отложенные действия{" "}
            <span className={classes.count}>({queueItems.length})</span>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="users">
          <div
            className={classes.table}
            role="table"
            aria-label="Список пользователей"
          >
            <div className={`${classes.row} ${classes.headerRow}`} role="row">
              <div
                className={`${classes.col} ${classes.userCol}`}
                role="columnheader"
              >
                Пользователь
              </div>
              <div
                className={`${classes.col} ${classes.serverCol}`}
                role="columnheader"
              >
                Серверы
              </div>
              <div
                className={`${classes.col} ${classes.actionsCol}`}
                role="columnheader"
                aria-hidden="true"
              />
            </div>

            {usersServersMapping
              .filter((u) => u.name.includes(q))
              .map((u) => {
                // const isSelected = selectedIds.has(u.id);
                return (
                  <div
                    key={`${u.id}-${u.name}`}
                    className={classes.row}
                    role="row"
                  >
                    <div
                      className={`${classes.col} ${classes.userCol}`}
                      role="cell"
                    >
                      <div className={classes.userInfo}>
                        <p className={classes.userName}>{u.name}</p>
                        <div className={classes.serversCount}>
                          {u.servers.length}
                        </div>
                      </div>
                      {u.description && (
                        <p className={classes.userDesc}>{u.description}</p>
                      )}
                    </div>

                    <div
                      className={`${classes.col} ${classes.serverCol}`}
                      role="cell"
                    >
                      <div className={classes.serverList}>
                        {u.servers.map((s) => (
                          <div key={s.id} className={classes.serverItem}>
                            {s.sections.main.name}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div
                      className={`${classes.col} ${classes.actionsCol}`}
                      role="cell"
                    >
                      <div className={classes.actionButtons}>
                        <Group gap="xs">
                          <Tooltip label="Удалить">
                            <ActionButton
                              className={classes.deleteIcon}
                              onClick={() => handleDeleteConfirmOpen(u)}
                            />
                          </Tooltip>
                        </Group>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="postponed">
          <div className={classes.logsList}>
            {queueLoading ? (
              <div className={classes.loadingMessage}>Загрузка...</div>
            ) : queueItems.length === 0 ? (
              <div className={classes.emptyMessage}>
                Нет отложенных действий
              </div>
            ) : (
              queueItems.map((item) => (
                <div
                  key={item.id}
                  className={`${classes.logItem} ${classes.pending}`}
                >
                  <div className={classes.logIcon} aria-hidden="true" />
                  <div className={classes.logText}>
                    {getQueueItemText(item)}
                  </div>
                  <div className={classes.logActions}>
                    <Tooltip label="Удалить">
                      <button
                        className={classes.deleteQueueButton}
                        onClick={() => handleDeleteQueueItem(item.id)}
                        disabled={deletingQueueItemId === item.id}
                        aria-label={`Удалить отложенное действие для ${item.login}`}
                      >
                        <IconTrash size={16} />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              ))
            )}
          </div>
        </Tabs.Panel>
      </Tabs>

      {/* Модальное окно создания пользователя на серверах */}
      <CreateUserModal
        opened={createUserModalOpened}
        onClose={handleCreateUserClose}
        loading={createUserLoading}
        error={createUserError}
        onClearError={handleClearCreateUserError}
        availableServers={servers.map((server) => ({
          id: server.id,
          name: server.sections.main.name,
          url: server.sections.main.url,
          port: server.sections.main.port,
        }))}
        onSubmit={async (payload: UserData) => {
          try {
            setCreateUserLoading(true);

            const userData = {
              name: payload.login,
              password: payload.password,
              description: payload.description,
            };

            const availableServersData = servers.map((server) => ({
              id: server.id,
              name: server.sections.main.name,
              url: server.sections.main.url,
              port: server.sections.main.port,
            }));

            const options = {
              createOnUnavailableServers: payload.createOnUnavailableServers,
              createOnNewServers: payload.createOnNewServers,
            };

            const permissions = {
              admin: payload.admin,
              archive: payload.archive,
            };

            const response = await createUser(
              userData,
              payload.servers,
              availableServersData,
              options,
              permissions,
            );

            const getServerNames = (r: { server: string }) => {
              return (
                servers.find(
                  (s) =>
                    `${s.sections.main.url}:${s.sections.main.port}` ===
                    r.server,
                )?.sections.main.name || ""
              );
            };

            const problemServersNames = response.results
              .filter((r) => r.status !== "ok")
              .map(getServerNames);

            const successServersNames = response.results
              .filter((r) => r.status === "ok")
              .map(getServerNames);

            setSuccessServers(successServersNames);
            setErrorServers(problemServersNames);

            toggleToast();

            setTimeout(() => {
              closeToast();
              setSuccessServers([]);
              setErrorServers([]);
            }, 3000);

            await forceUpdateWS();

            subscribeToServers();
          } catch (error) {
            let message = "Не удалось создать пользователя";

            if (error instanceof ApiError) {
              message = error.getServerMessage();
            } else if (error instanceof Error) {
              message = error.message;
            }

            setCreateUserError(message);
            throw error;
          } finally {
            setCreateUserLoading(false);
          }
        }}
      />

      {/* Модальное окно удаления пользователя с серверов */}
      <DeleteUserModal
        opened={deleteUserModalOpened}
        onClose={handleDeleteUserClose}
        loading={deleteUserLoading}
        error={deleteUserError}
        onClearError={handleClearDeleteUserError}
        availableServers={servers.map((server) => ({
          id: server.id,
          name: server.sections.main.name,
          url: server.sections.main.url,
          port: server.sections.main.port,
        }))}
        onSubmit={async (payload: DeleteUserData) => {
          try {
            setDeleteUserLoading(true);

            // Get available servers data for the API call
            const availableServersData = servers.map((server) => ({
              id: server.id,
              name: server.sections.main.name,
              url: server.sections.main.url,
              port: server.sections.main.port,
            }));

            await deleteUser(
              payload.login,
              payload.servers,
              availableServersData,
            );
            subscribeToServers();
          } catch (error) {
            let message = "Не удалось удалить пользователя с серверов";

            if (error instanceof ApiError) {
              message = error.getServerMessage();
            } else if (error instanceof Error) {
              message = error.message;
            }

            setDeleteUserError(message);
            throw error;
          } finally {
            setDeleteUserLoading(false);
          }
        }}
      />

      {/* Модальное окно подтверждения удаления */}
      <DeleteConfirmModal
        opened={deleteConfirmOpened}
        title={`Удалить пользователя ${userToDelete?.name}?`}
        onConfirm={() => userToDelete && handleDeleteUser(userToDelete.name)}
        onClose={handleDeleteConfirmClose}
        loading={deleteLoading}
      />

      <Toast opened={toastOpened} close={closeToast}>
        <Group gap="xs">
          {successServers.length > 0 && (
            <div className={classes.toastText}>
              <IconCheck size={18} color="green" />
              <span>
                <b>Пользователь успешно добавлен на серверах:</b>{" "}
                {successServers.join(", ")}
              </span>
            </div>
          )}
          {errorServers.length > 0 && (
            <div className={classes.toastText}>
              <IconX size={18} color="rgb(250, 82, 82)" />
              <span>
                <b>Не удалось добавить пользователя на серверах:</b>{" "}
                {errorServers.join(", ")}
              </span>
            </div>
          )}
        </Group>
      </Toast>
    </Stack>
  );
};

export default Users;
