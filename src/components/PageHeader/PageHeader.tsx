import PageTitle from "../PageTitle";
import classes from "./PageHeader.module.css";
import { useNavigate } from "react-router";

export default function PageHeader({
  rightSide,
  title,
  withBackButton,
  backPath,
}: {
  rightSide?: React.ReactNode;
  title: string;
  withBackButton?: boolean;
  backPath?: string;
}) {
  const navigate = useNavigate();

  return (
    <div className={classes.header}>
      <div className={classes.leftSide}>
        {withBackButton && backPath && (
          <div
            className={classes.backButton}
            onClick={() => navigate(backPath)}
          />
        )}
        <PageTitle>{title}</PageTitle>
      </div>
      <div className={classes.rightSide}>{rightSide}</div>
    </div>
  );
}
