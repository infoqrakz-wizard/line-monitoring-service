import PageTitle from "../PageTitle";
import classes from "./PageHeader.module.css";

export default function PageHeader({
  rightSide,
  title,
}: {
  rightSide?: React.ReactNode;
  title: string;
}) {
  return (
    <div className={classes.header}>
      <div className={classes.leftSide}>
        <PageTitle>{title}</PageTitle>
      </div>
      <div className={classes.rightSide}>{rightSide}</div>
    </div>
  );
}
