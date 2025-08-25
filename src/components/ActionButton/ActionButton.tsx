import { forwardRef } from "react";
import classes from "./ActionButton.module.css";

const ActionButton = forwardRef<
  HTMLButtonElement,
  {
    children?: React.ReactNode;
    className?: string;
    disabled?: boolean;
    onClick?: () => void;
  }
>(({ children, className, onClick, disabled = false }, ref) => (
  <button
    className={`${classes.button} ${className}`}
    onClick={onClick}
    disabled={disabled}
    ref={ref}
  >
    {children}
  </button>
));

export default ActionButton;
