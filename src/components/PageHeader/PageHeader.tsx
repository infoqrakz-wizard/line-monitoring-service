import PageTitle from "../PageTitle";
import classes from "./PageHeader.module.css";
import { useNavigate } from "react-router";

export default function PageHeader({
  rightSide,
  title,
  withBackButton,
}: {
  rightSide?: React.ReactNode;
  title: string | React.ReactNode;
  withBackButton?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <div className={classes.header}>
      <div className={classes.leftSide}>
        {withBackButton && (
          <div className={classes.backButton} onClick={() => navigate(-1)} />
        )}
        {typeof title === "string" ? <PageTitle>{title}</PageTitle> : title}
      </div>
      <div className={classes.rightSide}>{rightSide}</div>
    </div>
  );
}
