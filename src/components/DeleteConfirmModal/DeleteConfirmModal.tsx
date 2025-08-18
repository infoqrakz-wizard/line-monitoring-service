import React from "react";
import { Button, Stack, Text } from "@mantine/core";
import { Modal } from "@/components/Modal";
import classes from "./DeleteConfirmModal.module.css";

export type DeleteConfirmModalProps = {
  opened: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
};

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  opened,
  title,
  message,
  onConfirm,
  onClose,
  loading = false,
}) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title ?? "Подтверждение удаления"}
      withoutTitleMargin={true}
    >
      <Stack gap="md">
        {message && (
          <Text size="sm" c="dimmed">
            {message}
          </Text>
        )}
        <div className={classes.footer}>
          <Button
            variant="default"
            onClick={onClose}
            disabled={loading}
            aria-label="Отменить"
          >
            Отменить
          </Button>
          <Button
            color="rgb(250, 82, 82)"
            onClick={onConfirm}
            variant="black"
            loading={loading}
            disabled={loading}
            aria-label="Да, удалить"
          >
            Да, удалить
          </Button>
        </div>
      </Stack>
    </Modal>
  );
};

export default DeleteConfirmModal;
