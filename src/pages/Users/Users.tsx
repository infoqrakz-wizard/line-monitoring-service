import React, { FC, useCallback, useMemo, useState } from "react";
import { Button, Checkbox, Stack, Title, Tabs } from "@mantine/core";
import { IconPlus, IconTrash, IconEdit } from "@tabler/icons-react";
import SearchInput from "@/components/SearchInput";
import { useUsersStore } from "@/store/users";
import { AddUserModal, UserData } from "@/components/AddUserModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal/DeleteConfirmModal";
import classes from "./Users.module.css";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedServers, setExpandedServers] = useState<
    Record<string, boolean>
  >({});

  const { items, loading, fetchUsers, deleteUser, updateUser } = useUsersStore(
    (s) => ({
      items: s.items,
      loading: s.loading,
      fetchUsers: s.fetchUsers,
      deleteUser: s.deleteUser,
      updateUser: s.updateUser,
    }),
  );

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

  const handleToggleAll = useCallback(
    (checked: boolean) => {
      if (!checked) {
        setSelectedIds(new Set());
        return;
      }
      const next = new Set<string>();
      filtered.forEach((u) => {
        if (u.deletable !== false) {
          next.add(u.id);
        }
      });
      setSelectedIds(next);
    },
    [filtered],
  );

  const handleToggleOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const shownCount = filtered.length; // For the tab counter demo

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedServers((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const renderServers = useCallback(
    (user: UserItem) => {
      const limit = 8;
      const isExpanded = !!expandedServers[user.id];
      const items = isExpanded ? user.servers : user.servers.slice(0, limit);
      const hasMore = user.servers.length > limit;
      return (
        <div>
          <div className={classes.serverList}>
            {items.map((addr, idx) => (
              <span
                key={`${user.id}-srv-${idx}`}
                className={classes.serverItem}
              >
                {addr}
                {idx < items.length - 1 ? " •" : ""}
              </span>
            ))}
          </div>
          {hasMore && (
            <button
              type="button"
              className={classes.serverMore}
              onClick={() => handleToggleExpand(user.id)}
              aria-label={isExpanded ? "Скрыть" : "Показать все"}
              disabled={createLoading || editLoading || deleteLoading}
            >
              {isExpanded ? "Скрыть" : "См. все"}
            </button>
          )}
        </div>
      );
    },
    [expandedServers, handleToggleExpand],
  );

  const handleDeleteUser = async (userId: string) => {
    try {
      setDeleteLoading(true);
      await deleteUser(userId);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
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
      <div className={classes.header}>
        <Title order={1} size="h3">
          Пользователи
        </Title>
        <div className={classes.actionsDesktop}>
          <Button
            variant="filled"
            leftSection={<IconPlus size={16} />}
            aria-label="Добавить пользователя"
            disabled={createLoading}
            onClick={handleCreateOpen}
          >
            Добавить пользователя
          </Button>
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Найти пользователя..."
            disabled={createLoading || editLoading || deleteLoading}
          />
        </div>
      </div>

      <div className={classes.actionsMobile}>
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Найти пользователя..."
          fullWidth
          disabled={createLoading || editLoading || deleteLoading}
        />
        <Button
          variant="filled"
          leftSection={<IconPlus size={16} />}
          aria-label="Добавить пользователя"
          className={classes.addMobile}
          disabled={createLoading}
          onClick={handleCreateOpen}
        >
          Добавить пользователя
        </Button>
      </div>

      <Tabs
        defaultValue="users"
        className={classes.tabsRoot}
        keepMounted={false}
      >
        <Tabs.List className={classes.tabsList}>
          <Tabs.Tab value="users">
            Пользователи <span className={classes.count}>({shownCount})</span>
          </Tabs.Tab>
          <Tabs.Tab value="logs">Логи событий</Tabs.Tab>
          <Tabs.Tab value="postponed">Отложенные действия</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="users">
          <div className={classes.topBar}>
            <Checkbox
              label="Выбрать всех"
              onChange={(e) => handleToggleAll(e.currentTarget.checked)}
              disabled={deleteLoading}
            />
            {/* <Button
              leftSection={<IconTrash size={16} />}
              variant="light"
              className={classes.deleteBtn}
              disabled={selectedCount === 0 || loading}
              aria-label="Удалить пользователей"
              onClick={async () => {
                const ids = Array.from(selectedIds);
                await Promise.all(ids.map((id) => deleteUser(id)));
                setSelectedIds(new Set());
              }}
            >
              Удалить пользователей{" "}
              <span className={classes.count}>({selectedCount})</span>
            </Button> */}
          </div>

          <div
            className={classes.table}
            role="table"
            aria-label="Список пользователей"
          >
            <div className={`${classes.row} ${classes.headerRow}`} role="row">
              <div
                className={`${classes.col} ${classes.inputCol}`}
                role="columnheader"
                aria-hidden="true"
              />
              <div
                className={`${classes.col} ${classes.userCol}`}
                role="columnheader"
              >
                Пользователь (логин)
              </div>
              <div
                className={`${classes.col} ${classes.serverCol}`}
                role="columnheader"
              >
                Сервер
              </div>
              <div
                className={`${classes.col} ${classes.actionsCol}`}
                role="columnheader"
                aria-hidden="true"
              >
                Действия
              </div>
            </div>

            {filtered.map((u) => {
              const isSelected = selectedIds.has(u.id);
              return (
                <div key={u.id} className={classes.row} role="row">
                  <div
                    className={`${classes.col} ${classes.inputCol}`}
                    role="cell"
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={(e) =>
                        handleToggleOne(u.id, e.currentTarget.checked)
                      }
                      aria-label={`Выбрать пользователя ${u.login}`}
                      disabled={u.deletable === false || deleteLoading}
                    />
                  </div>

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
                    className={`${classes.col} ${classes.serverCol}`}
                    role="cell"
                  >
                    {renderServers(u)}
                  </div>

                  <div
                    className={`${classes.col} ${classes.actionsCol}`}
                    role="cell"
                  >
                    <div className={classes.actionButtons}>
                      <Button
                        className={classes.editIcon}
                        variant="light"
                        color="blue"
                        aria-label={`Редактировать пользователя ${u.login}`}
                        disabled={loading || editLoading}
                        onClick={() => handleEditOpen(u)}
                      >
                        <IconEdit size={16} />
                      </Button>
                      <Button
                        className={classes.deleteIcon}
                        variant="light"
                        color="red"
                        aria-label={`Удалить пользователя ${u.login}`}
                        disabled={
                          u.deletable === false || loading || deleteLoading
                        }
                        onClick={() => handleDeleteConfirmOpen(u)}
                      >
                        <IconTrash size={16} />
                      </Button>
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
            const updateData: any = {
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
