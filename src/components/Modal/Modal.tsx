import { Modal } from '@mantine/core';
import classes from './Modal.module.css';

export default function ModalComponent({
  opened,
  onClose,
  title, onConfirm
}: { opened: boolean, onClose: () => void, title: string, onConfirm: () => void }) {
  return (
        <Modal opened={opened} onClose={onClose} title={title}>
            <div className={classes.modalContent}>
                <p className={classes.modalTitle}>{title}</p>
                <div className={classes.modalButtons}>
                    <button className={classes.btnCancel} onClick={onClose}>Отменить</button>
                    <button className={classes.btnDelete} onClick={onConfirm}>Да, удалить</button>
                </div>
            </div>
        </Modal>
  );
}
