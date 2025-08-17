import { FC, useCallback, useEffect, useState } from "react";
import { Button, Stack, Tooltip, Group } from "@mantine/core";
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

const Users: FC = () => {
  const [q, setQ] = useState("");

  const { deleteUser, createUser } = useUsersStore((s) => ({
    deleteUser: s.deleteUser,
    createUser: s.createUser,
  }));

  // Состояния для модальных окон
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [createUserModalOpened, setCreateUserModalOpened] = useState(false);
  const [deleteUserModalOpened, setDeleteUserModalOpened] = useState(false);
  const [deleteConfirmOpened, setDeleteConfirmOpened] = useState(false);

  // Пользователь для удаления
  const [userToDelete, setUserToDelete] = useState<Pick<
    User,
    "id" | "name"
  > | null>(null);

  // Ошибки
  const [createError, setCreateError] = useState<string | null>(null);
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [deleteUserError, setDeleteUserError] = useState<string | null>(null);

  // Состояние загрузки для удаления
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Состояние загрузки для создания
  const [createLoading, setCreateLoading] = useState(false);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);

  const [usersServersMapping, setUsersServersMapping] = useState<
    (User & {
      servers: ServerWithMonitoring[];
    })[]
  >([]);

  const { subscribeToServers, users, servers } = useMonitoringStore();

  // Обработчики для модальных окон
  // const handleCreateOpen = () => setCreateModalOpened(true);
  const handleCreateClose = () => {
    setCreateModalOpened(false);
    setCreateError(null);
  };

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

  const handleClearCreateError = useCallback(() => setCreateError(null), []);
  const handleClearCreateUserError = useCallback(
    () => setCreateUserError(null),
    [],
  );
  const handleClearDeleteUserError = useCallback(
    () => setDeleteUserError(null),
    [],
  );

  useEffect(() => {
    subscribeToServers([]);
  }, []);

  const handleDeleteUser = async (userName: string) => {
    try {
      setDeleteLoading(true);
      const user = usersServersMapping.find((u) => u.name === userName);
      if (!user) {
        throw new Error("User not found");
      }
      await deleteUser(
        user.name,
        user.servers.map(
          (s) => `${s.sections.main.url}:${s.sections.main.port}`,
        ),
      );

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
              disabled={createLoading}
              onClick={handleCreateUserOpen}
            >
              Добавить пользователя
            </Button>
            {/* <Button
              className={classes.addButton}
              variant="outline"
              leftSection={<PlusIcon />}
              aria-label="Добавить пользователя на серверах"
              disabled={createUserLoading}
              onClick={handleCreateUserOpen}
            >
              Добавить на серверах
            </Button>
            <Button
              className={classes.addButton}
              variant="outline"
              color="red"
              leftSection={<PlusIcon />}
              aria-label="Удалить пользователя с серверов"
              disabled={deleteUserLoading}
              onClick={handleDeleteUserOpen}
            >
              Удалить с серверов
            </Button> */}
            <SearchInput
              // className={classes.searchInput}
              rootClassName={classes.searchInputRoot}
              inputClassName={classes.searchInput}
              className={classes.searchInput}
              value={q}
              onChange={setQ}
              placeholder="Найти пользователя..."
              disabled={createLoading || deleteLoading}
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
      <CreateUserModal
        opened={createModalOpened}
        onClose={handleCreateClose}
        loading={createLoading}
        error={createError}
        onClearError={handleClearCreateError}
        availableServers={servers.map((server) => ({
          id: server.id,
          name: server.sections.main.name,
          url: server.sections.main.url,
          port: server.sections.main.port,
        }))}
        onSubmit={async ({ login, password }) => {
          try {
            setCreateLoading(true);
            await createUser(
              {
                name: login,
                password,
                description: "",
              },
              [],
            );

            await forceUpdateWS();
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
        }}
      />

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

            // Подготавливаем данные для API
            const userData = {
              name: payload.login,
              password: payload.password,
              description: payload.description,
            };

            await createUser(userData, payload.servers);

            subscribeToServers([]);
            // if (result.success) {
            //   const newUser = {
            //     id: result.id,
            //     name: payload.login,
            //     description: payload.description,
            //     servers: servers.filter((server) =>
            //       payload.servers.some(
            //         (s) => `${s.url}:${s.port}` === `${server.id}`,
            //       ),
            //     ),
            //   };
            //   setUsers([...users, newUser]);
            // } else {
            //   // Если есть ошибки, показываем их
            //   const errorMessage =
            //     result.errors?.join(", ") ||
            //     result.message ||
            //     "Не удалось создать пользователя на серверах";
            //   setCreateUserError(errorMessage);
            //   throw new Error(errorMessage);
            // }
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Не удалось создать пользователя на серверах";
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

            await deleteUser(payload.login, payload.servers);
            subscribeToServers([]);
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
    </Stack>
  );
};

export default Users;
