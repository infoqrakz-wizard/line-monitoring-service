import { useEffect, useState } from "react";
import { Button, TextInput, TagsInput } from "@mantine/core";
import { Modal } from "@/components/Modal";
import classes from "./DeleteUserModal.module.css";

export type DeleteUserData = {
  login: string;
  servers: string[];
};

export type DeleteUserModalProps = {
  opened: boolean;
  onClose: () => void;
  onSubmit: (payload: DeleteUserData) => Promise<void> | void;
  loading?: boolean;
  error?: string | null;
  onClearError?: () => void;
  availableServers: Array<{
    id: string;
    name: string;
    url: string;
    port: number;
  }>;
};

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  opened,
  onClose,
  onSubmit,
  loading,
  error,
  onClearError,
  availableServers,
}) => {
  const [login, setLogin] = useState("");
  const [servers, setServers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    Boolean(login) && servers.length > 0 && !submitting && !loading;

  // Clear form and error when modal opens
  useEffect(() => {
    if (opened) {
      setLogin("");
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
        login,
        servers,
      });
      onClose();
    } catch (err) {
      // Error is handled by parent component
      console.error("Failed to delete server user:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleServerSelect = (values: string[]) => {
    setServers(values);
  };

  const serverOptions = availableServers.map((server) => ({
    value: server.name,
    label: server.name,
  }));

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Удалить пользователя с серверов"
    >
      <form onSubmit={handleSubmit} className={classes.form}>
        <div className={classes.formField}>
          <label htmlFor="login" className={classes.formFieldLabel}>
            Логин пользователя
          </label>
          <div className={classes.formFieldInput}>
            <TextInput
              id="login"
              placeholder="Введите логин пользователя для удаления"
              value={login}
              onChange={(e) => setLogin(e.currentTarget.value)}
              required
              size="md"
              aria-label="Логин пользователя"
              autoComplete="off"
            />
          </div>
        </div>

        <div className={classes.formField}>
          <label htmlFor="servers" className={classes.formFieldLabel}>
            Серверы
          </label>
          <div className={classes.formFieldInput}>
            <TagsInput
              id="servers"
              placeholder="Выберите серверы для удаления пользователя"
              value={servers}
              onChange={handleServerSelect}
              data={serverOptions}
              required
              size="md"
              aria-label="Выбор серверов"
              description="Выберите серверы, с которых будет удален пользователь"
            />
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
            color="rgb(250, 82, 82)"
            loading={submitting || !!loading}
            disabled={!canSubmit}
            aria-label="Удалить пользователя"
          >
            Удалить пользователя
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DeleteUserModal;
