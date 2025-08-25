import { forwardRef } from "react";
import classes from "./ActionButton.module.css";

const ActionButton = forwardRef<
  HTMLButtonElement,
  {
    children?: React.ReactNode;
    className?: string;
    disabled?: boolean;
    size?: "sm" | "md" | "lg";
    onClick?: () => void;
  }
>(({ children, className, onClick, disabled = false, size = "md" }, ref) => (
  <button
    className={`${classes.button} ${className} ${classes[size]}`}
    onClick={onClick}
    disabled={disabled}
    ref={ref}
  >
    {children}
  </button>
));

export default ActionButton;
