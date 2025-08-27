import React, { useCallback, useEffect, useState } from "react";
import { Button, Tooltip, Group, Text, Badge, Pagination } from "@mantine/core";
import SearchInput from "@/components/SearchInput/SearchInput";
import CreateNotificationModal, {
  type NotificationData,
} from "@/components/CreateNotificationModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal/DeleteConfirmModal";
import classes from "./Notifications.module.css";
import PageHeader from "@/components/PageHeader";
import PlusIcon from "@/assets/icons/plus.svg?react";
import ActionButton from "@/components/ActionButton/ActionButton";
import {
  notifications as notificationsApi,
  type TelegramSubscriber,
} from "@/api";
import { ApiError } from "@/lib/request";
import { useAuthStore } from "@/store/auth";

const ITEMS_PER_PAGE = 20;

const Notifications: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [subscribers, setSubscribers] = useState<TelegramSubscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const { role } = useAuthStore();
  const isAdmin = role === "admin";

  // Состояния для модальных окон
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteConfirmOpened, setDeleteConfirmOpened] = useState(false);

  // Данные для редактирования
  const [editingSubscriber, setEditingSubscriber] = useState<{
    id: string;
    data: NotificationData;
  } | null>(null);

  // Подписчик для удаления
  const [subscriberToDelete, setSubscriberToDelete] = useState<{
    id: string;
    chatId: string;
  } | null>(null);

  // Ошибки
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Состояния загрузки
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Загрузка списка подписок
  const fetchSubscribers = useCallback(
    async (page: number = 1) => {
      try {
        setLoading(true);
        const offset = (page - 1) * ITEMS_PER_PAGE;
        const response = await notificationsApi.listTelegramSubscribers({
          limit: ITEMS_PER_PAGE,
          offset,
          search: searchQuery || undefined,
        });

        if (response.ok) {
          setSubscribers(response.items);
          setTotal(response.total);
          setCurrentPage(page);
        } else {
          console.error("API returned error:", response);
          setSubscribers([]);
          setTotal(0);
        }
      } catch (error) {
        console.error("Failed to fetch subscribers:", error);
        setSubscribers([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery],
  );

  useEffect(() => {
    void fetchSubscribers(1);
  }, [fetchSubscribers]);

  // Обработчик изменения страницы
  const handlePageChange = (page: number) => {
    void fetchSubscribers(page);
  };

  // Обработчик поиска
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Обработчики для модальных окон
  const handleCreateOpen = () => setCreateModalOpened(true);
  const handleCreateClose = () => {
    setCreateModalOpened(false);
    setCreateError(null);
  };

  const handleEditOpen = (subscriber: TelegramSubscriber) => {
    setEditingSubscriber({
      id: subscriber.id,
      data: {
        bot_token: subscriber.bot_token,
        chat_id: subscriber.chat_id,
        enabled: subscriber.enabled,
        servers_up_down: subscriber.servers_up_down,
        cameras_up_down: subscriber.cameras_up_down,
        server_add_delete: subscriber.server_add_delete,
        user_auth: subscriber.user_auth,
        user_add_delete: subscriber.user_add_delete,
      },
    });
    setEditModalOpened(true);
  };

  const handleEditClose = () => {
    setEditModalOpened(false);
    setEditingSubscriber(null);
    setEditError(null);
  };

  const handleDeleteConfirmOpen = (subscriber: TelegramSubscriber) => {
    setSubscriberToDelete({
      id: subscriber.id,
      chatId: subscriber.chat_id,
    });
    setDeleteConfirmOpened(true);
  };

  const handleDeleteConfirmClose = () => {
    setDeleteConfirmOpened(false);
    setSubscriberToDelete(null);
  };

  const handleClearCreateError = useCallback(() => setCreateError(null), []);
  const handleClearEditError = useCallback(() => setEditError(null), []);

  // Обработчик удаления
  const handleDeleteSubscriber = async (subscriberId: string) => {
    try {
      setDeleteLoading(true);
      await notificationsApi.deleteTelegramSubscriber(subscriberId);
      await fetchSubscribers(currentPage);
      handleDeleteConfirmClose();
    } catch (error) {
      console.error("Failed to delete subscriber:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Получение списка активных типов уведомлений
  const getNotificationTypes = (subscriber: TelegramSubscriber) => {
    const types = [];
    if (subscriber.servers_up_down) {
      types.push("Серверы");
    }
    if (subscriber.cameras_up_down) {
      types.push("Камеры");
    }
    if (subscriber.user_auth) {
      types.push("Авторизация");
    }
    if (subscriber.server_add_delete) {
      types.push("Серверы +/-");
    }
    if (subscriber.user_add_delete) {
      types.push("Пользователи +/-");
    }
    return types;
  };

  // Вычисляем общее количество страниц
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className={classes.wrapper}>
      <PageHeader
        title="Настройки уведомлений"
        rightSide={
          <div className={classes.actionsDesktop}>
            {isAdmin && (
              <Button
                className={classes.addButton}
                variant="black"
                leftSection={<PlusIcon />}
                aria-label="Создать уведомления"
                disabled={createLoading}
                onClick={handleCreateOpen}
              >
                Создать
              </Button>
            )}
            <SearchInput
              rootClassName={classes.searchInputRoot}
              inputClassName={classes.searchInput}
              className={classes.searchInput}
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Найти подписку..."
              disabled={createLoading || editLoading || deleteLoading}
            />
          </div>
        }
      />

      <div
        className={classes.table}
        role="table"
        aria-label="Список подписок на уведомления"
      >
        <div className={`${classes.row} ${classes.headerRow}`} role="row">
          <div
            className={`${classes.col} ${classes.subscriberCol} ${classes.headerCol}`}
            role="columnheader"
          >
            Подписка
          </div>
          <div
            className={`${classes.col} ${classes.statusCol} ${classes.headerCol}`}
            role="columnheader"
          >
            Статус
          </div>
          <div
            className={`${classes.col} ${classes.typesCol} ${classes.headerCol}`}
            role="columnheader"
          >
            Типы уведомлений
          </div>
          <div
            className={`${classes.col} ${classes.actionsCol}`}
            role="columnheader"
            aria-hidden="true"
          />
        </div>

        {subscribers.map((subscriber) => (
          <div key={subscriber.id} className={classes.row} role="row">
            <div
              className={`${classes.col} ${classes.subscriberCol}`}
              role="cell"
            >
              <div className={classes.subscriberInfo}>
                <p className={classes.chatId}>Chat ID: {subscriber.chat_id}</p>
                <p className={classes.botToken}>
                  Бот: {subscriber.bot_token.substring(0, 20)}...
                </p>
              </div>
            </div>

            <div className={`${classes.col} ${classes.statusCol}`} role="cell">
              <Badge
                color={subscriber.enabled ? "green" : "red"}
                variant="light"
              >
                {subscriber.enabled ? "Активна" : "Неактивна"}
              </Badge>
            </div>

            <div className={`${classes.col} ${classes.typesCol}`} role="cell">
              <div className={classes.notificationTypes}>
                {getNotificationTypes(subscriber).map((type, index) => (
                  <Badge key={index} variant="outline" size="sm">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            <div className={`${classes.col} ${classes.actionsCol}`} role="cell">
              <div className={classes.actionButtons}>
                {isAdmin && (
                  <Group gap="xs">
                    <Tooltip label="Редактировать">
                      <ActionButton
                        className={classes.editIcon}
                        onClick={() => handleEditOpen(subscriber)}
                      />
                    </Tooltip>
                    <Tooltip label="Удалить">
                      <ActionButton
                        className={classes.deleteIcon}
                        onClick={() => handleDeleteConfirmOpen(subscriber)}
                      />
                    </Tooltip>
                  </Group>
                )}
              </div>
            </div>
          </div>
        ))}

        {subscribers.length === 0 && !loading && (
          <div className={classes.emptyState}>
            <Text c="dimmed" ta="center">
              {searchQuery
                ? "Подписки не найдены"
                : "Подписки на уведомления отсутствуют"}
            </Text>
          </div>
        )}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className={classes.pagination}>
          <Pagination
            total={totalPages}
            value={currentPage}
            onChange={handlePageChange}
            size="sm"
            radius="md"
            disabled={loading}
          />
          <Text size="sm" c="dimmed">
            Показано {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, total)} из {total}
          </Text>
        </div>
      )}

      {/* Модальное окно создания подписки */}
      <CreateNotificationModal
        opened={createModalOpened}
        onClose={handleCreateClose}
        loading={createLoading}
        error={createError}
        onClearError={handleClearCreateError}
        mode="create"
        onSubmit={async (data: NotificationData) => {
          try {
            setCreateLoading(true);
            await notificationsApi.createTelegramSubscriber(data);
            await fetchSubscribers(1);
          } catch (error) {
            let message = "Не удалось создать подписку";

            if (error instanceof ApiError) {
              message = error.data.error;
            } else if (error instanceof Error) {
              message = error.message;
            }

            setCreateError(message);
            throw error;
          } finally {
            setCreateLoading(false);
          }
        }}
      />

      {/* Модальное окно редактирования подписки */}
      <CreateNotificationModal
        opened={editModalOpened}
        onClose={handleEditClose}
        loading={editLoading}
        error={editError}
        onClearError={handleClearEditError}
        mode="edit"
        initialData={editingSubscriber?.data}
        onSubmit={async (data: NotificationData) => {
          if (!editingSubscriber) {
            return;
          }

          try {
            setEditLoading(true);
            await notificationsApi.updateTelegramSubscriber(
              editingSubscriber.id,
              data,
            );
            await fetchSubscribers(currentPage);
          } catch (error) {
            let message = "Не удалось обновить подписку";

            if (error instanceof ApiError) {
              message = error.data.error;
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
        title={`Удалить подписку на уведомления для Chat ID: ${subscriberToDelete?.chatId}?`}
        onConfirm={() =>
          subscriberToDelete && handleDeleteSubscriber(subscriberToDelete.id)
        }
        onClose={handleDeleteConfirmClose}
        loading={deleteLoading}
      />
    </div>
  );
};

export default Notifications;
