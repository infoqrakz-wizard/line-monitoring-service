import classes from "./PageTitle.module.css";

export default function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className={classes.title}>{children}</h1>;
}