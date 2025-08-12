import React from 'react';
import { Modal, Button, Stack, Text } from '@mantine/core';

export type DeleteConfirmModalProps = {
  opened: boolean;
  title?: string;
  onConfirm: () => void;
  onClose: () => void;
};

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ opened, title, onConfirm, onClose }) => {
  return (
    <Modal opened={opened} onClose={onClose} title={title ?? 'Вы уверены, что хотите удалить проблему?'} centered>
      <Stack>
        <Button color="dark" onClick={onConfirm}>Да, удалить</Button>
        <Button variant="subtle" onClick={onClose}>Отменить</Button>
      </Stack>
    </Modal>
  );
};

export default DeleteConfirmModal;
