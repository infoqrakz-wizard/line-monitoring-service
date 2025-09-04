import { useEffect, useState } from "react";
import { Button, Checkbox } from "@mantine/core";
import { Modal } from "@/components/Modal";
import classes from "./DeleteUserModal.module.css";

export type DeleteUserData = {
  login: string;
  servers: string[];
  createOnUnreachable: boolean;
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
  userToDelete?: {
    id: string;
    name: string;
  } | null;
};

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  opened,
  onClose,
  onSubmit,
  loading,
  error,
  onClearError,
  userToDelete,
}) => {
  const [login, setLogin] = useState("");
  const [servers, setServers] = useState<string[]>([]);
  const [createOnUnreachable, setCreateOnUnreachable] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Clear form and error when modal opens
  useEffect(() => {
    if (opened) {
      setLogin(userToDelete?.name || "");
      setServers([]);
      setCreateOnUnreachable(false);
      setSubmitting(false);
      onClearError?.();
    }
  }, [opened, onClearError, userToDelete]);

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

    setSubmitting(true);
    try {
      await onSubmit({
        login,
        servers,
        createOnUnreachable,
      });
      onClose();
    } catch (err) {
      // Error is handled by parent component
      console.error("Failed to delete server user:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        userToDelete
          ? `Удалить пользователя ${userToDelete.name}`
          : "Удалить пользователя с серверов"
      }
    >
      <form onSubmit={handleSubmit} className={classes.form}>
        <div className={classes.formField}>
          <Checkbox
            classNames={{
              label: classes.checkboxLabel,
              input: classes.checkboxInput,
              root: classes.checkboxField,
            }}
            id="createOnUnreachable"
            label="Удалить на недоступных серверах"
            checked={createOnUnreachable}
            onChange={(event) =>
              setCreateOnUnreachable(event.currentTarget.checked)
            }
            size="md"
            aria-label="Удалить на недоступных серверах"
          />
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
