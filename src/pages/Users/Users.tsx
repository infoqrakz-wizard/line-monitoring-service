import { FC, useCallback, useEffect, useState } from "react";
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
import { User, ServerWithMonitoring } from "@/types";
import { forceUpdateWS } from "@/api/servers";
import { useDisclosure } from "@mantine/hooks";
import Toast from "@/components/Toast";
import { IconCheck, IconX } from "@tabler/icons-react";

type LogItem = {
  id: string;
  kind: "success" | "error" | "warning" | "pending";
  text: string;
  time: string;
  date: string;
};

const logItems: LogItem[] = [
  {
    id: "l1",
    kind: "success",
    text: "Пользователь «user456» удален на Чкалова, 270",
    time: "14:13:45",
    date: "20.05.2025",
  },
  {
    id: "l2",
    kind: "error",
    text: "Не удалось добавить «user456» на Чкалова, 270",
    time: "14:13:45",
    date: "20.05.2025",
  },
  {
    id: "l3",
    kind: "warning",
    text: "Пользователь «user456» не найден на Чкалова, 270",
    time: "14:13:45",
    date: "20.05.2025",
  },
  {
    id: "l4",
    kind: "success",
    text: "Пользователь «user456» удален на Чкалова, 270",
    time: "14:13:45",
    date: "20.05.2025",
  },
  {
    id: "l5",
    kind: "error",
    text: "Не удалось добавить «user456» на Чкалова, 270",
    time: "14:13:45",
    date: "20.05.2025",
  },
  {
    id: "l6",
    kind: "warning",
    text: "Пользователь «user456» не найден на Чкалова, 270",
    time: "14:13:45",
    date: "20.05.2025",
  },
];

const pendingItems: LogItem[] = [
  {
    id: "p1",
    kind: "pending",
    text: "Пользователь «user456» удален на Чкалова, 270",
    time: "14:13:45",
    date: "20.05.2025",
  },
  {
    id: "p2",
    kind: "pending",
    text: "Пользователь «user456» удален на Чкалова, 270",
    time: "14:13:45",
    date: "20.05.2025",
  },
  {
    id: "p3",
    kind: "pending",
    text: "Пользователь «user456» удален на Чкалова, 270",
    time: "14:13:45",
    date: "20.05.2025",
  },
];

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

  useEffect(() => {
    const mapping = users?.reduce(
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
    setUsersServersMapping(mapping);
  }, [users, servers]);

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
  }, []);

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
            Пользователи <span className={classes.count}>({usersServersMapping.filter((u) => u.name.includes(q)).length})</span>
          </Tabs.Tab>
          <Tabs.Tab className={classes.tab} value="logs">
            Логи событий
          </Tabs.Tab>
          <Tabs.Tab className={classes.tab} value="postponed">
            Отложенные действия
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
                  <div key={u.id} className={classes.row} role="row">
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

        <Tabs.Panel value="logs">
          <div className={classes.logsList}>
            {logItems.map((l) => (
              <div
                key={l.id}
                className={`${classes.logItem} ${classes[l.kind]}`}
              >
                <div className={classes.logIcon} aria-hidden="true" />
                <div className={classes.logText}>{l.text}</div>
                <div className={classes.logTime}>
                  <span className={classes.logTimePeriod}>{l.time}</span>
                  <span className={classes.separator}>•</span>
                  <span className={classes.logTimeDate}>{l.date}</span>
                </div>
              </div>
            ))}
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="postponed">
          <div className={classes.logsList}>
            {pendingItems.map((l) => (
              <div
                key={l.id}
                className={`${classes.logItem} ${classes[l.kind]}`}
              >
                <div className={classes.logIcon} aria-hidden="true" />
                <div className={classes.logText}>{l.text}</div>
                <div className={classes.logTime}>
                  <span className={classes.logTimePeriod}>{l.time}</span>
                  <span className={classes.separator}>•</span>
                  <span className={classes.logTimeDate}>{l.date}</span>
                </div>
              </div>
            ))}
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

            const response = await createUser(
              userData,
              payload.servers,
              availableServersData,
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
            const message =
              error instanceof Error
                ? error.message
                : "Не удалось создать пользователя";
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
            const message =
              error instanceof Error
                ? error.message
                : "Не удалось удалить пользователя с серверов";
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
