import classes from "./ActionButton.module.css";

export default function ActionButton({
  children,
  className,
  onClick,
  disabled = false,
}: {
  children?: React.ReactNode;
  className?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className={`${classes.button} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
