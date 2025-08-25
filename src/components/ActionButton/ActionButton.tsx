import { forwardRef } from "react";
import classes from "./ActionButton.module.css";

const ActionButton = forwardRef<
  HTMLButtonElement,
  {
    children?: React.ReactNode;
    className?: string;
    disabled?: boolean;
    size?: "sm" | "lg";
    onClick?: () => void;
  }
>(({ children, className, onClick, disabled = false, size = "lg" }, ref) => (
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
