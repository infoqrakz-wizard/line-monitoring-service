import { useEffect, useState } from "react";
import {
  Button,
  TextInput,
  PasswordInput,
  TagsInput,
} from "@mantine/core";
import { Modal } from "@/components/Modal";
import classes from "./CreateUserModal.module.css";
import Checkbox from "../Checkbox";

export type UserData = {
  login: string;
  password: string;
  description: string;
  servers: string[];
  createOnUnavailableServers: boolean;
  createOnNewServers: boolean;
  admin: boolean;
  archive: boolean;
};

export type CreateUserModalProps = {
  opened: boolean;
  loading?: boolean;
  error?: string | null;
  server?: string;
  availableServers?: Array<{
    id: string;
    name: string;
    url: string;
    port: number;
  }>;
  currentServer?: string;
  onClose: () => void;
  onSubmit: (payload: UserData) => Promise<void> | void;
  onSuccess?: () => void;
  onClearError?: () => void;
};

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  opened,
  loading,
  error,
  availableServers,
  currentServer,
  onClose,
  onSubmit,
  onSuccess,
  onClearError,
}) => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [description, setDescription] = useState("");
  const [servers, setServers] = useState<string[]>([]);
  const [createOnUnavailableServers, setCreateOnUnavailableServers] =
    useState(false);
  const [createOnNewServers, setCreateOnNewServers] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [archive, setArchive] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    Boolean(login) && Boolean(password) && !submitting && !loading;

  useEffect(() => {
    if (currentServer) {
      setServers([currentServer]);
    }
    return () => {
      setServers([]);
    };
  }, [currentServer]);

  useEffect(() => {
    if (opened) {
      setLogin("");
      setPassword("");
      setDescription("");
      setCreateOnUnavailableServers(false);
      setCreateOnNewServers(false);
      setAdmin(false);
      setArchive(false);
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
        createOnUnavailableServers,
        createOnNewServers,
        admin,
        archive,
      });

      onSuccess?.();

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

  // serverOptions now uses server names as values
  const serverOptions = availableServers?.map((server) => ({
    value: server.name || server.id,
    label: server.name || server.id,
  }));

  const getServerDisplayText = (serverName: string) => {
    return serverName;
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Создать пользователя"
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
              autoComplete="off"
              name="new-login"
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
              autoComplete="off"
              name="new-password"
            />
          </div>
        </div>

        <div className={classes.formField}>
          <label htmlFor="description" className={classes.formFieldLabel}>
            Описание
          </label>
          <div className={classes.formFieldInput}>
            <TextInput
              id="description"
              placeholder="Введите описание пользователя (необязательно)"
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              size="md"
              aria-label="Описание пользователя"
              autoComplete="off"
              name="new-description"
            />
          </div>
        </div>

        {availableServers && !currentServer && (
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
                size="md"
                aria-label="Выбор серверов"
                description="Выберите серверы, на которые будет добавлен пользователь"
              />
            </div>
          </div>
        )}

        <div className={classes.formField}>
          <div className={classes.checkboxesContainer}>
            <Checkbox
              id="createOnUnavailableServers"
              label="Создать на недоступных серверах"
              checked={createOnUnavailableServers}
              onChange={(event) =>
                setCreateOnUnavailableServers(event.currentTarget.checked)
              }
              disabled={submitting || !!loading}
            />
            <Checkbox
              id="createOnNewServers"
              label="Создание на новых серверах"
              checked={createOnNewServers}
              onChange={(event) =>
                setCreateOnNewServers(event.currentTarget.checked)
              }
              disabled={submitting || !!loading}
            />
          </div>
        </div>
        <div className={classes.formField}>
          <div className={classes.checkboxesContainer}>
            <div className={classes.formFieldLabel}>Права</div>
            <Checkbox
              id="admin"
              label="Администратор"
              checked={admin}
              onChange={(event) => setAdmin(event.currentTarget.checked)}
              disabled={submitting || !!loading}
            />
            <Checkbox
              id="archive"
              label="Доступ к архиву"
              checked={archive}
              onChange={(event) => setArchive(event.currentTarget.checked)}
              disabled={submitting || !!loading}
            />
          </div>
        </div>

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
            variant="black"
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
