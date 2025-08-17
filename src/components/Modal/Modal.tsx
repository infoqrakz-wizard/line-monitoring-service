import { CSSProperties, useEffect } from "react";
import { createPortal } from "react-dom";
import classes from "./Modal.module.css";

export type BaseModalProps = {
  opened: boolean;
  title?: string;
  children: React.ReactNode;
  closeOnBackdrop?: boolean;
  style?: CSSProperties;
  withoutTitleMargin?: boolean;
  onClose: () => void;
};

const ModalComponent: React.FC<BaseModalProps> = ({
  opened,
  title,
  children,
  closeOnBackdrop = false,
  withoutTitleMargin = false,
  style,
  onClose,
}) => {
  useEffect(() => {
    if (!opened) {
      return;
    }
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    const { body } = document;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      body.style.overflow = prevOverflow;
    };
  }, [opened, onClose]);

  const content = (
    <div
      className={classes.modal}
      role="dialog"
      aria-modal="true"
      aria-label={title || "Modal"}
      style={style}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={classes.content} tabIndex={-1}>
        {title ? (
          <p
            className={`${classes.title} ${withoutTitleMargin ? classes.withoutTitleMargin : ""}`}
          >
            {title}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );

  if (!opened) {
    return null;
  }
  return createPortal(content, document.body);
};

export default ModalComponent;
