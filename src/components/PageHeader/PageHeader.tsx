import { IconArrowLeft } from "@tabler/icons-react";
import PageTitle from "../PageTitle";
import classes from "./PageHeader.module.css";
import { Button } from "@mantine/core";
import { useNavigate } from "react-router";

export default function PageHeader({
  rightSide,
  title,
  withBackButton,
}: {
  rightSide?: React.ReactNode;
  title: string;
  withBackButton?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <div className={classes.header}>
      <div className={classes.leftSide}>
        {withBackButton && (
          <div className={classes.backButton} onClick={() => navigate(-1)} />
        )}
        <PageTitle>{title}</PageTitle>
      </div>
      <div className={classes.rightSide}>{rightSide}</div>
    </div>
  );
}
