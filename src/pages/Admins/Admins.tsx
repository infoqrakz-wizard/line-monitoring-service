import React, { FC, useCallback, useMemo, useState } from "react";
import { Button, Stack, Tabs, Tooltip, Group } from "@mantine/core";
import SearchInput from "@/components/SearchInput/SearchInput";
import { useUsersStore } from "@/store/users";
import { AddUserModal, UserData } from "@/components/AddUserModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal/DeleteConfirmModal";
import classes from "./Admins.module.css";
import PageHeader from "@/components/PageHeader";
import PlusIcon from "../../assets/icons/plus.svg?react";
import ActionButton from "@/components/ActionButton/ActionButton";
import { UpdateUserRequest } from "@/api/user";

type UserItem = {
  id: string;
  login: string;
  isAdmin?: boolean;
  description?: string;
  servers: string[];
  actionsCount?: number;
  deletable?: boolean;
};

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

  const { items, fetchUsers, deleteUser, updateUser } = useUsersStore((s) => ({
    items: s.items,
    fetchUsers: s.fetchUsers,
    deleteUser: s.deleteUser,
    updateUser: s.updateUser,
  }));

  const createUser = useUsersStore((s) => s.createUser);

  // Состояния для модальных окон
  const [createModalOpened, setCreateModalOpened] = useState(false);
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
  const [editError, setEditError] = useState<string | null>(null);

  // Состояние загрузки для редактирования
  const [editLoading, setEditLoading] = useState(false);

  // Состояние загрузки для удаления
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Состояние загрузки для создания
  const [createLoading, setCreateLoading] = useState(false);

  // Обработчики для модальных окон
  const handleCreateOpen = () => setCreateModalOpened(true);
  const handleCreateClose = () => {
    setCreateModalOpened(false);
    setCreateError(null);
  };

  const handleEditOpen = (user: UserItem) => {
    setEditingUser({
      id: user.id,
      data: {
        email: user.login,
        password: "",
        is_admin: user.isAdmin || false,
      },
    });
    setEditModalOpened(true);
  };

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
  const handleClearEditError = useCallback(() => setEditError(null), []);

  React.useEffect(() => {
    fetchUsers({
      limit: 50,
      offset: 0,
    }).catch(() => void 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const viewUsers: UserItem[] = React.useMemo(
    () =>
      items.map((u) => ({
        id: String(u.id),
        login: u.email,
        isAdmin: u.is_admin,
        description: undefined,
        servers: [],
        actionsCount: undefined,
        deletable: true,
      })),
    [items],
  );

  const filtered = useMemo(() => {
    const query = q.toLowerCase();
    return viewUsers.filter((u) =>
      [u.login, u.description ?? "", u.servers.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [q, viewUsers]);

  const shownCount = filtered.length; // For the tab counter demo

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

      <Tabs
        variant="none"
        defaultValue="users"
        className={classes.tabsRoot}
        keepMounted={false}
      >
        <Tabs.List className={classes.tabsList}>
          <Tabs.Tab className={classes.tab} value="users">
            Пользователи <span className={classes.count}>({shownCount})</span>
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
                className={`${classes.col} ${classes.userCol} ${classes.headerCol}`}
                role="columnheader"
              >
                Пользователь
              </div>
              <div
                className={`${classes.col} ${classes.actionsCol}`}
                role="columnheader"
                aria-hidden="true"
              />
            </div>

            {filtered.map((u) => {
              // const isSelected = selectedIds.has(u.id);
              return (
                <div key={u.id} className={classes.row} role="row">
                  <div
                    className={`${classes.col} ${classes.userCol}`}
                    role="cell"
                  >
                    <div className={classes.userInfo}>
                      <p className={classes.userName}>
                        {u.login}{" "}
                        {u.isAdmin && (
                          <span aria-label="Администратор">⭐</span>
                        )}
                      </p>
                      {typeof u.actionsCount === "number" && (
                        <div className={classes.badge}>{u.actionsCount}</div>
                      )}
                    </div>
                    {u.description && (
                      <p className={classes.userDesc}>{u.description}</p>
                    )}
                  </div>

                  <div
                    className={`${classes.col} ${classes.actionsCol}`}
                    role="cell"
                  >
                    <div className={classes.actionButtons}>
                      <Group gap="xs">
                        <Tooltip label="Редактировать">
                          <ActionButton
                            className={classes.editIcon}
                            onClick={() => {
                              handleEditOpen(u);
                            }}
                          />
                        </Tooltip>
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
