import { Checkbox as MantineCheckbox, type CheckboxProps } from "@mantine/core";
import classes from "./Checkbox.module.css";

export default function Checkbox(props: CheckboxProps) {
  return (
    <MantineCheckbox
      {...props}
      classNames={{
        label: classes.checkboxLabel,
        input: classes.checkboxInput,
      }}
    />
  );
}
