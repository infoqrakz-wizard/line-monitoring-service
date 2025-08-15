import React from "react";
import {
  Button,
  TextInput,
  PasswordInput,
  Textarea,
  TagsInput,
} from "@mantine/core";
import { Modal } from "@/components/Modal";
import classes from "./CreateUserModal.module.css";

export type UserData = {
  login: string;
  password: string;
  description: string;
  servers: string[];
};

export type CreateUserModalProps = {
  opened: boolean;
  onClose: () => void;
  onSubmit: (payload: UserData) => Promise<void> | void;
  loading?: boolean;
  error?: string | null;
  onClearError?: () => void;
  server?: string;
  availableServers?: Array<{
    id: string;
    name: string;
    url: string;
    port: number;
  }>;
};

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  opened,
  onClose,
  onSubmit,
  loading,
  error,
  onClearError,
  availableServers,
}) => {
  const [login, setLogin] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [servers, setServers] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  const canSubmit =
    Boolean(login) &&
    Boolean(password) &&
    (!availableServers ||
      (availableServers &&
        availableServers?.length > 0 &&
        servers.length > 0)) &&
    !submitting &&
    !loading;

  // Clear form and error when modal opens
  React.useEffect(() => {
    if (opened) {
      setLogin("");
      setPassword("");
      setDescription("");
      setServers([]);
      setSubmitting(false);
      onClearError?.();
    }
  }, [opened, onClearError]);

  const handleClose = () => {
    if (submitting) {
      return;
    }
    onClearError?.();
    onClose();
  };

  const handleCreateUser = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        login,
        password,
        description,
        servers,
      });
      onClose();
    } catch (err) {
      // Error is handled by parent component
      console.error("Failed to create server user:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleServerSelect = (values: string[]) => {
    setServers(values);
  };

  const serverOptions = availableServers?.map((server) => ({
    value: server.id,
  }));

  // Функция для получения отображаемого текста сервера по ID
  const getServerDisplayText = (serverId: string) => {
    const server = availableServers!.find((s) => s.id === serverId);
    return server ? `${server.name} (${server.url}:${server.port})` : serverId;
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Создать пользователя на серверах"
      style={{
        zIndex: 50,
      }}
    >
      <form onSubmit={handleCreateUser} className={classes.form}>
        <div className={classes.formField}>
          <label htmlFor="login" className={classes.formFieldLabel}>
            Логин
          </label>
          <div className={classes.formFieldInput}>
            <TextInput
              id="login"
              placeholder="Введите логин пользователя"
              value={login}
              onChange={(e) => setLogin(e.currentTarget.value)}
              required
              size="md"
              aria-label="Логин пользователя"
            />
          </div>
        </div>

        <div className={classes.formField}>
          <label htmlFor="password" className={classes.formFieldLabel}>
            Пароль
          </label>
          <div className={classes.formFieldInput}>
            <PasswordInput
              id="password"
              placeholder="Введите пароль пользователя"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
              size="md"
              aria-label="Пароль пользователя"
            />
          </div>
        </div>

        <div className={classes.formField}>
          <label htmlFor="description" className={classes.formFieldLabel}>
            Описание
          </label>
          <div className={classes.formFieldInput}>
            <Textarea
              id="description"
              placeholder="Введите описание пользователя (необязательно)"
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              size="md"
              rows={3}
              aria-label="Описание пользователя"
            />
          </div>
        </div>

        {availableServers && (
          <div className={classes.formField}>
            <label htmlFor="servers" className={classes.formFieldLabel}>
              Серверы
            </label>
            <div className={classes.formFieldInput}>
              <TagsInput
                id="servers"
                placeholder="Выберите серверы для добавления пользователя"
                value={servers}
                onChange={handleServerSelect}
                renderOption={({ option }) => {
                  const serverName = getServerDisplayText(option.value);
                  return <div>{serverName}</div>;
                }}
                data={serverOptions}
                required
                size="md"
                aria-label="Выбор серверов"
                description="Выберите серверы, на которые будет добавлен пользователь"
              />
            </div>
          </div>
        )}

        {error && (
          <div className={classes.error}>
            <span className={classes.errorText}>
              Ошибка при создании пользователя
            </span>
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
            aria-label="Создать пользователя"
          >
            Создать пользователя
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateUserModal;
