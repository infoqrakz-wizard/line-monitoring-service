import React from "react";
import { Modal, Button, Stack, Text } from "@mantine/core";

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
      centered
    >
      <Stack gap="md">
        {message && (
          <Text size="sm" c="dimmed">
            {message}
          </Text>
        )}
        <Button
          color="red"
          onClick={onConfirm}
          variant="filled"
          loading={loading}
          disabled={loading}
          aria-label="Да, удалить"
        >
          Да, удалить
        </Button>
        <Button
          variant="subtle"
          onClick={onClose}
          disabled={loading}
          aria-label="Отменить"
        >
          Отменить
        </Button>
      </Stack>
    </Modal>
  );
};

export default DeleteConfirmModal;
