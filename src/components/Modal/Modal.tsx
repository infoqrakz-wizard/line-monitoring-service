import { Modal } from "@mantine/core";
import classes from "./Modal.module.css";
import { describe } from "node:test";

export default function ModalComponent({
  opened,
  title,
  confirmText,
  cancelText,
  onClose,
  onConfirm,
}: {
  opened: boolean;
  title: string;
  confirmText: string;
  cancelText: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal opened={opened} onClose={onClose} withCloseButton={false}>
      <div className={classes.content}>
        <p className={classes.title}>{title}</p>
        <div className={classes.buttons}>
          <button className={classes.btnDelete} onClick={onConfirm}>
            {confirmText}
          </button>
          {cancelText && (
            <button className={classes.btnCancel} onClick={onClose}>
              {cancelText}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
