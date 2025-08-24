import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Button, Stack, Tooltip, Group } from "@mantine/core";
import SearchInput from "@/components/SearchInput/SearchInput";
import { useUsersStore } from "@/store/users";
import { CreateAdminModal, UserData } from "@/components/CreateAdminModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal/DeleteConfirmModal";
import classes from "./Admins.module.css";
import PageHeader from "@/components/PageHeader";
import PlusIcon from "../../assets/icons/plus.svg?react";
import ActionButton from "@/components/ActionButton/ActionButton";
import { UpdateAdminRequest } from "@/api/user";
import { forceUpdateWS } from "@/api/servers";
import { ApiError } from "@/lib/request";

type AdminUser = {
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

  const { admins, fetchAdmins, deleteAdmin, updateAdmin } = useUsersStore(
    (s) => ({
      admins: s.admins,
      fetchAdmins: s.fetchAdmins,
      deleteAdmin: s.deleteAdmin,
      updateAdmin: s.updateAdmin,
    }),
  );

  const createAdmin = useUsersStore((s) => s.createAdmin);

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

  const handleEditOpen = (user: AdminUser) => {
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

  const handleDeleteConfirmOpen = (user: AdminUser) => {
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

  useEffect(() => {
    fetchAdmins({
      limit: 50,
      offset: 0,
    }).catch(() => void 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const viewUsers: AdminUser[] = useMemo(
    () =>
      admins.map((u) => ({
        id: String(u.id),
        login: u.email,
        isAdmin: u.is_admin,
        description: undefined,
        servers: [],
        actionsCount: undefined,
        deletable: true,
      })),
    [admins],
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

  const handleDeleteAdmin = async (userId: string) => {
    try {
      setDeleteLoading(true);
      await deleteAdmin(userId);
      await forceUpdateWS();
      handleDeleteConfirmClose();
    } catch (error) {
      console.error("Failed to delete user:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Stack className={classes.wrapper} gap="md">
      <PageHeader
        title="Администраторы"
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
              <div className={`${classes.col} ${classes.userCol}`} role="cell">
                <div className={classes.userInfo}>
                  <p className={classes.userName}>
                    {u.login}{" "}
                    {u.isAdmin && <span aria-label="Администратор">⭐</span>}
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

      {/* Модальное окно создания пользователя */}
      <CreateAdminModal
        opened={createModalOpened}
        onClose={handleCreateClose}
        loading={createLoading}
        error={createError}
        onClearError={handleClearCreateError}
        mode="create"
        onSubmit={async ({ email, password, is_admin }) => {
          try {
            setCreateLoading(true);
            await createAdmin({
              email,
              password,
              is_admin,
            });
            // Refresh the user list to show the newly created user
            await fetchAdmins({
              limit: 50,
              offset: 0,
            });
          } catch (error) {
            let message = "Не удалось создать пользователя";

            if (error instanceof ApiError) {
              message = error.data.error;
            } else if (error instanceof Error) {
              message = error.message;
            }

            setCreateError(message);
            throw error; // Re-throw to let the modal handle the loading state
          } finally {
            setCreateLoading(false);
          }
        }}
      />

      {/* Модальное окно редактирования пользователя */}
      <CreateAdminModal
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
            const updateData: UpdateAdminRequest = {
              email,
              is_admin,
            };

            // Добавляем пароль только если он был введен
            if (password && password.trim()) {
              updateData.password = password;
            }

            await updateAdmin(editingUser.id, updateData);

            // Refresh the user list
            await fetchAdmins({
              limit: 50,
              offset: 0,
            });
          } catch (error) {
            let message = "Не удалось обновить пользователя";

            if (error instanceof ApiError) {
              message = error.getServerMessage();
            } else if (error instanceof Error) {
              message = error.message;
            }

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
        title={`Удалить пользователя ${userToDelete?.login}?`}
        onConfirm={() => userToDelete && handleDeleteAdmin(userToDelete.id)}
        onClose={handleDeleteConfirmClose}
        loading={deleteLoading}
      />
    </Stack>
  );
};

export default Users;
