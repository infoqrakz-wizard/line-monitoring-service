import classes from "./ActionButton.module.css";

export default function ActionButton({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button className={classes.button} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
