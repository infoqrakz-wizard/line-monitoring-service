import { FC, useCallback, useEffect, useState } from "react";
import { Button, Stack, Tooltip, Group } from "@mantine/core";
import SearchInput from "@/components/SearchInput/SearchInput";
import { useUsersStore } from "@/store/users";
import { AddUserModal, UserData } from "@/components/AddUserModal";
import { ServerUserData } from "@/components/CreateServerUserModal";
import CreateServerUserModal from "@/components/CreateServerUserModal/CreateServerUserModal";
import { DeleteServerUserData } from "@/components/DeleteServerUserModal";
import DeleteServerUserModal from "@/components/DeleteServerUserModal/DeleteServerUserModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal/DeleteConfirmModal";
import PageHeader from "@/components/PageHeader";
import PlusIcon from "../../assets/icons/plus.svg?react";
import ActionButton from "@/components/ActionButton/ActionButton";
import { UpdateUserRequest } from "@/api/user";
import classes from "./Users.module.css";
import { useMonitoringStore } from "@/store/monitoring";
import { ServerUser, ServerWithMonitoring } from "@/types";

type UserItem = {
  id: string;
  login: string;
  isAdmin?: boolean;
  description?: string;
  servers: string[];
  actionsCount?: number;
  deletable?: boolean;
};

const Users: FC = () => {
  const [q, setQ] = useState("");

  const { fetchUsers, deleteUser, updateUser } = useUsersStore((s) => ({
    // items: s.items,
    fetchUsers: s.fetchUsers,
    deleteUser: s.deleteUser,
    updateUser: s.updateUser,
  }));

  const createUser = useUsersStore((s) => s.createUser);
  const createServerUser = useUsersStore((s) => s.createServerUser);
  const deleteServerUser = useUsersStore((s) => s.deleteServerUser);

  // Состояния для модальных окон
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [createServerUserModalOpened, setCreateServerUserModalOpened] =
    useState(false);
  const [deleteServerUserModalOpened, setDeleteServerUserModalOpened] =
    useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteConfirmOpened, setDeleteConfirmOpened] = useState(false);

  // Данные для редактирования
  const [editingUser, setEditingUser] = useState<{
    id: string;
    data: UserData;
  } | null>(null);

  // Пользователь для удаления
  const [userToDelete, setUserToDelete] = useState<{
    id: string;
    login: string;
  } | null>(null);

  // Ошибки
  const [createError, setCreateError] = useState<string | null>(null);
  const [createServerUserError, setCreateServerUserError] = useState<
    string | null
  >(null);
  const [deleteServerUserError, setDeleteServerUserError] = useState<
    string | null
  >(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Состояние загрузки для редактирования
  const [editLoading, setEditLoading] = useState(false);

  // Состояние загрузки для удаления
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Состояние загрузки для создания
  const [createLoading, setCreateLoading] = useState(false);
  const [createServerUserLoading, setCreateServerUserLoading] = useState(false);
  const [deleteServerUserLoading, setDeleteServerUserLoading] = useState(false);

  const [usersServersMapping, setUsersServersMapping] = useState<
    (ServerUser & {
      servers: ServerWithMonitoring[];
    })[]
  >([]);

  const { subscribeToServers, users, servers } = useMonitoringStore();

  // Обработчики для модальных окон
  const handleCreateOpen = () => setCreateModalOpened(true);
  const handleCreateClose = () => {
    setCreateModalOpened(false);
    setCreateError(null);
  };

  const handleCreateServerUserOpen = () => setCreateServerUserModalOpened(true);
  const handleCreateServerUserClose = () => {
    setCreateServerUserModalOpened(false);
    setCreateServerUserError(null);
  };

  const handleDeleteServerUserOpen = () => setDeleteServerUserModalOpened(true);
  const handleDeleteServerUserClose = () => {
    setDeleteServerUserModalOpened(false);
    setDeleteServerUserError(null);
  };

  useEffect(() => {
    const mapping = users?.reduce(
      (acc, user) => {
        acc.push({
          ...user,
          servers: servers.filter((server) =>
            server.sections.users?.some((u) => u.id === user.id),
          ),
        });
        return acc;
      },
      [] as (ServerUser & {
        servers: ServerWithMonitoring[];
      })[],
    );
    setUsersServersMapping(mapping);
  }, [users, servers]);

  const handleEditClose = () => {
    setEditModalOpened(false);
    setEditingUser(null);
    setEditError(null);
  };

  const handleDeleteConfirmOpen = (user: UserItem) => {
    setUserToDelete({
      id: user.id,
      login: user.login,
    });
    setDeleteConfirmOpened(true);
  };

  const handleDeleteConfirmClose = () => {
    setDeleteConfirmOpened(false);
    setUserToDelete(null);
  };

  const handleClearCreateError = useCallback(() => setCreateError(null), []);
  const handleClearCreateServerUserError = useCallback(
    () => setCreateServerUserError(null),
    [],
  );
  const handleClearDeleteServerUserError = useCallback(
    () => setDeleteServerUserError(null),
    [],
  );
  const handleClearEditError = useCallback(() => setEditError(null), []);

  useEffect(() => {
    fetchUsers({
      limit: 50,
      offset: 0,
    }).catch(() => void 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    subscribeToServers([]);
  }, []);

  // const viewUsers: UserItem[] = React.useMemo(
  //   () =>
  //     items.map((u) => ({
  //       id: String(u.id),
  //       login: u.email,
  //       isAdmin: u.is_admin,
  //       description: undefined,
  //       servers: [],
  //       actionsCount: undefined,
  //       deletable: true,
  //     })),
  //   [items],
  // );

  // const filtered = useMemo(() => {
  //   const query = q.toLowerCase();
  //   return viewUsers.filter((u) =>
  //     [u.login, u.description ?? "", u.servers.join(" ")]
  //       .join(" ")
  //       .toLowerCase()
  //       .includes(query),
  //   );
  // }, [q, viewUsers]);

  const handleDeleteUser = async (userId: string) => {
    try {
      setDeleteLoading(true);
      await deleteUser(userId);
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
              disabled={createLoading}
              onClick={handleCreateOpen}
            >
              Добавить пользователя
            </Button>
            <Button
              className={classes.addButton}
              variant="outline"
              leftSection={<PlusIcon />}
              aria-label="Добавить пользователя на серверах"
              disabled={createServerUserLoading}
              onClick={handleCreateServerUserOpen}
            >
              Добавить на серверах
            </Button>
            <Button
              className={classes.addButton}
              variant="outline"
              color="red"
              leftSection={<PlusIcon />}
              aria-label="Удалить пользователя с серверов"
              disabled={deleteServerUserLoading}
              onClick={handleDeleteServerUserOpen}
            >
              Удалить с серверов
            </Button>
            <SearchInput
              // className={classes.searchInput}
              rootClassName={classes.searchInputRoot}
              inputClassName={classes.searchInput}
              className={classes.searchInput}
              value={q}
              onChange={setQ}
              placeholder="Найти пользователя..."
              disabled={createLoading || editLoading || deleteLoading}
            />
          </div>
        }
      />

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

        {usersServersMapping.map((u) => {
          // const isSelected = selectedIds.has(u.id);
          return (
            <div key={u.id} className={classes.row} role="row">
              <div className={`${classes.col} ${classes.userCol}`} role="cell">
                <div className={classes.userInfo}>
                  <p className={classes.userName}>{u.name}</p>
                  <div className={classes.serversCount}>{u.servers.length}</div>
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
                    {/* <Tooltip label="Редактировать">
                      <ActionButton
                        className={classes.editIcon}
                        onClick={() => {
                          handleEditOpen(u);
                        }}
                      />
                    </Tooltip> */}
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

      {/* Модальное окно создания пользователя */}
      <AddUserModal
        opened={createModalOpened}
        onClose={handleCreateClose}
        loading={createLoading}
        error={createError}
        onClearError={handleClearCreateError}
        mode="create"
        onSubmit={async ({ email, password, is_admin }) => {
          try {
            setCreateLoading(true);
            await createUser({
              email,
              password,
              is_admin,
            });
            // Refresh the user list to show the newly created user
            await fetchUsers({
              limit: 50,
              offset: 0,
            });
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
        }}
      />

      {/* Модальное окно редактирования пользователя */}
      <AddUserModal
        opened={editModalOpened}
        onClose={handleEditClose}
        loading={editLoading}
        error={editError}
        onClearError={handleClearEditError}
        mode="edit"
        initialData={editingUser?.data}
        userId={editingUser?.id}
        onSubmit={async ({ email, password, is_admin }) => {
          if (!editingUser) {
            return;
          }

          try {
            setEditLoading(true);
            const updateData: UpdateUserRequest = {
              email,
              is_admin,
            };

            // Добавляем пароль только если он был введен
            if (password && password.trim()) {
              updateData.password = password;
            }

            await updateUser(editingUser.id, updateData);

            // Refresh the user list
            await fetchUsers({
              limit: 50,
              offset: 0,
            });
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Не удалось обновить пользователя";
            setEditError(message);
            throw error;
          } finally {
            setEditLoading(false);
          }
        }}
      />

      {/* Модальное окно создания пользователя на серверах */}
      <CreateServerUserModal
        opened={createServerUserModalOpened}
        onClose={handleCreateServerUserClose}
        loading={createServerUserLoading}
        error={createServerUserError}
        onClearError={handleClearCreateServerUserError}
        availableServers={servers.map((server) => ({
          id: server.id,
          name: server.sections.main.name,
          url: server.sections.main.url,
          port: server.sections.main.port,
        }))}
        onSubmit={async (payload: ServerUserData) => {
          try {
            setCreateServerUserLoading(true);

            // Подготавливаем данные для API
            const apiPayload = {
              name: payload.login,
              password: payload.password,
              description: payload.description,
              serverIds: payload.servers,
            };

            // Подготавливаем информацию о серверах для API
            const serversInfo = servers.map((server) => ({
              url: server.sections.main.url,
              port: server.sections.main.port,
            }));

            const result = await createServerUser(apiPayload, serversInfo);

            if (result.success) {
              // Обновляем список пользователей после успешного создания
              await fetchUsers({
                limit: 50,
                offset: 0,
              });
            } else {
              // Если есть ошибки, показываем их
              const errorMessage =
                result.errors?.join(", ") ||
                result.message ||
                "Не удалось создать пользователя на серверах";
              setCreateServerUserError(errorMessage);
              throw error;
            }
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Не удалось создать пользователя на серверах";
            setCreateServerUserError(message);
            throw error;
          } finally {
            setCreateServerUserLoading(false);
          }
        }}
      />

      {/* Модальное окно удаления пользователя с серверов */}
      <DeleteServerUserModal
        opened={deleteServerUserModalOpened}
        onClose={handleDeleteServerUserClose}
        loading={deleteServerUserLoading}
        error={deleteServerUserError}
        onClearError={handleClearDeleteServerUserError}
        availableServers={servers.map((server) => ({
          id: server.id,
          name: server.sections.main.name,
          url: server.sections.main.url,
          port: server.sections.main.port,
        }))}
        onSubmit={async (payload: DeleteServerUserData) => {
          try {
            setDeleteServerUserLoading(true);

            // Подготавливаем данные для API
            const apiPayload = {
              name: payload.login,
              serverIds: payload.servers,
            };

            // Подготавливаем информацию о серверах для API
            const serversInfo = servers.map((server) => ({
              url: server.sections.main.url,
              port: server.sections.main.port,
            }));

            const result = await deleteServerUser(apiPayload, serversInfo);

            if (result.success) {
              // Обновляем список пользователей после успешного удаления
              await fetchUsers({
                limit: 50,
                offset: 0,
              });
            } else {
              // Если есть ошибки, показываем их
              const errorMessage =
                result.errors?.join(", ") ||
                result.message ||
                "Не удалось удалить пользователя с серверов";
              setDeleteServerUserError(errorMessage);
              throw new Error(errorMessage);
            }
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Не удалось удалить пользователя с серверов";
            setDeleteServerUserError(message);
            throw error;
          } finally {
            setDeleteServerUserLoading(false);
          }
        }}
      />

      {/* Модальное окно подтверждения удаления */}
      <DeleteConfirmModal
        opened={deleteConfirmOpened}
        title={`Вы уверены, что хотите удалить пользователя "${userToDelete?.login}"?`}
        onConfirm={() => userToDelete && handleDeleteUser(userToDelete.id)}
        onClose={handleDeleteConfirmClose}
        loading={deleteLoading}
      />
    </Stack>
  );
};

export default Users;
