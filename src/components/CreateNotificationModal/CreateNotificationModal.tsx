import React, { useEffect, useState } from "react";
import { Button, TextInput, Stack, Group, Text } from "@mantine/core";
import Checkbox from "@/components/Checkbox";
import { Modal } from "@/components/Modal";
import classes from "./CreateNotificationModal.module.css";

export type NotificationData = {
  bot_token: string;
  chat_id: string;
  enabled: boolean;
  servers_up_down: boolean;
  cameras_up_down: boolean;
  server_add_delete: boolean;
  user_auth: boolean;
  user_add_delete: boolean;
};

export type CreateNotificationModalProps = {
  opened: boolean;
  onClose: () => void;
  onSubmit: (payload: NotificationData) => Promise<void> | void;
  loading?: boolean;
  error?: string | null;
  onClearError?: () => void;
  mode?: "create" | "edit";
  initialData?: NotificationData;
};

const CreateNotificationModal: React.FC<CreateNotificationModalProps> = ({
  opened,
  loading,
  error,
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  onClearError,
}) => {
  const [formData, setFormData] = useState<NotificationData>({
    bot_token: "",
    chat_id: "",
    enabled: true,
    servers_up_down: false,
    cameras_up_down: false,
    server_add_delete: false,
    user_auth: false,
    user_add_delete: false,
  });

  const [submitting, setSubmitting] = useState(false);

  const isEditMode = mode === "edit";
  const canSubmit =
    Boolean(formData.bot_token.trim()) &&
    Boolean(formData.chat_id.trim()) &&
    (formData.servers_up_down ||
      formData.cameras_up_down ||
      formData.server_add_delete ||
      formData.user_auth ||
      formData.user_add_delete) &&
    !submitting &&
    !loading;

  useEffect(() => {
    if (opened) {
      if (isEditMode && initialData) {
        setFormData(initialData);
      } else {
        setFormData({
          bot_token: "",
          chat_id: "",
          enabled: true,
          servers_up_down: false,
          cameras_up_down: false,
          server_add_delete: false,
          user_auth: false,
          user_add_delete: false,
        });
      }
      setSubmitting(false);
      onClearError?.();
    }
  }, [opened, onClearError, isEditMode, initialData]);

  const handleClose = () => {
    if (submitting) {
      return;
    }
    onClearError?.();
    onClose();
  };

  const handleInputChange = (
    field: keyof NotificationData,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error("Failed to create/update notification:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const modalTitle = isEditMode
    ? "Редактировать уведомления"
    : "Создать уведомления";
  const submitButtonText = isEditMode ? "Сохранить" : "Создать";

  return (
    <Modal opened={opened} onClose={handleClose} title={modalTitle}>
      <form onSubmit={handleSubmit} className={classes.form}>
        <Stack gap="lg">
          <div className={classes.formField}>
            <TextInput
              label="Токен Telegram бота"
              placeholder="Введите токен бота"
              value={formData.bot_token}
              onChange={(e) => handleInputChange("bot_token", e.target.value)}
              required
              description="Токен, полученный от @BotFather"
              autoComplete="off"
              name="bot-token"
            />
          </div>

          <div className={classes.formField}>
            <TextInput
              label="Chat ID"
              placeholder="Введите Chat ID"
              value={formData.chat_id}
              onChange={(e) => handleInputChange("chat_id", e.target.value)}
              required
              description="ID чата или канала для отправки уведомлений"
              autoComplete="off"
              name="chat-id"
            />
          </div>

          <div className={classes.formField}>
            <Checkbox
              label="Включить уведомления"
              checked={formData.enabled}
              onChange={(e) => handleInputChange("enabled", e.target.checked)}
            />
          </div>

          <div className={classes.formField}>
            <Text size="sm" fw={500} mb="xs">
              Типы уведомлений
            </Text>
            <Stack gap="md">
              <Checkbox
                label="Мониторинг сервера"
                description="Уведомления о доступности/недоступности серверов"
                checked={formData.servers_up_down}
                onChange={(e) =>
                  handleInputChange("servers_up_down", e.target.checked)
                }
              />

              <Checkbox
                label="Мониторинг камеры"
                description="Уведомления о доступности/недоступности камер"
                checked={formData.cameras_up_down}
                onChange={(e) =>
                  handleInputChange("cameras_up_down", e.target.checked)
                }
              />

              <Checkbox
                label="Авторизация"
                description="Уведомления о входе пользователей в систему"
                checked={formData.user_auth}
                onChange={(e) =>
                  handleInputChange("user_auth", e.target.checked)
                }
              />

              <Checkbox
                label="Добавление/Удаление серверов"
                description="Уведомления об изменениях в списке серверов"
                checked={formData.server_add_delete}
                onChange={(e) =>
                  handleInputChange("server_add_delete", e.target.checked)
                }
              />

              <Checkbox
                label="Добавление/Удаление пользователей"
                description="Уведомления об изменениях в списке пользователей"
                checked={formData.user_add_delete}
                onChange={(e) =>
                  handleInputChange("user_add_delete", e.target.checked)
                }
              />
            </Stack>
          </div>

          {error && (
            <Text size="sm" c="red" ta="center">
              {error}
            </Text>
          )}

          <Group justify="flex-end" gap="md">
            <Button variant="outline" onClick={handleClose}>
              Отмена
            </Button>
            <Button type="submit" loading={submitting} disabled={!canSubmit}>
              {submitButtonText}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default CreateNotificationModal;
