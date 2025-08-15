import React from "react";
import { Button, TextInput, PasswordInput, Switch, Group } from "@mantine/core";
import { Modal } from "@/components/Modal";
import classes from "./AddUserModal.module.css";

export type UserData = {
  email: string;
  password: string;
  is_admin: boolean;
};

export type AddUserModalProps = {
  opened: boolean;
  onClose: () => void;
  onSubmit: (payload: UserData) => Promise<void> | void;
  loading?: boolean;
  error?: string | null;
  onClearError?: () => void;
  // Новые пропсы для редактирования
  mode?: "create" | "edit";
  initialData?: UserData;
  userId?: string;
};

const AddUserModal: React.FC<AddUserModalProps> = ({
  opened,
  onClose,
  onSubmit,
  loading,
  error,
  onClearError,
  mode = "create",
  initialData,
}) => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const isEditMode = mode === "edit";
  const canSubmit = isEditMode
    ? Boolean(email) && !submitting && !loading // В режиме редактирования пароль не обязателен
    : Boolean(email) && Boolean(password) && !submitting && !loading;

  // Clear form and error when modal opens
  React.useEffect(() => {
    if (opened) {
      if (isEditMode && initialData) {
        // Заполняем поля данными для редактирования
        setEmail(initialData.email);
        setPassword(""); // Пароль оставляем пустым при редактировании
        setIsAdmin(initialData.is_admin);
      } else {
        // Очищаем поля для создания нового пользователя
        setEmail("");
        setPassword("");
        setIsAdmin(false);
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        email,
        password,
        is_admin: isAdmin,
      });
      onClose();
    } catch (err) {
      // Error is handled by parent component
      console.error("Failed to create/update user:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const modalTitle = isEditMode
    ? "Редактировать пользователя"
    : "Добавить пользователя";
  const submitButtonText = isEditMode ? "Сохранить" : "Добавить";

  return (
    <Modal opened={opened} onClose={handleClose} title={modalTitle}>
      <form onSubmit={handleSubmit} className={classes.form}>
        <div className={classes.formField}>
          <label htmlFor="email" className={classes.formFieldLabel}>
            Логин
          </label>
          <div className={classes.formFieldInput}>
            <TextInput
              id="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
              size="md"
              aria-label="Логин"
            />
          </div>
        </div>

        <div className={classes.formField}>
          <label htmlFor="password" className={classes.formFieldLabel}>
            {isEditMode ? "Новый пароль" : "Пароль"}
          </label>
          <div className={classes.formFieldInput}>
            <PasswordInput
              id="password"
              placeholder={
                isEditMode
                  ? "Введите новый пароль или оставьте пустым"
                  : "Введите пароль"
              }
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required={!isEditMode}
              size="md"
              aria-label={isEditMode ? "Новый пароль" : "Пароль"}
              description={
                isEditMode
                  ? "Оставьте пустым, если не хотите менять пароль"
                  : undefined
              }
            />
          </div>
        </div>

        <div className={classes.formField}>
          <div className={classes.formFieldLabel}></div>
          <div className={classes.formFieldInput}>
            <Group justify="space-between" align="center">
              <Switch
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.currentTarget.checked)}
                label="Администратор"
                aria-label="Администратор"
              />
            </Group>
          </div>
        </div>

        {error && (
          <div className={classes.error}>
            <span className={classes.errorText}>{error}</span>
          </div>
        )}

        <div className={classes.footer}>
          <Button
            variant="default"
            onClick={handleClose}
            aria-label="Отмена"
            disabled={submitting}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            loading={submitting || !!loading}
            disabled={!canSubmit}
            aria-label={submitButtonText}
          >
            {submitButtonText}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddUserModal;
