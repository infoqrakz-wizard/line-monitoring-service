import React from "react";
import { TextInput } from "@mantine/core";
// import { IconSearch } from "@tabler/icons-react";
// import searchIcon from "../../assets/icons/search.svg";
import { ReactComponent as SearchIcon } from "../../assets/icons/search.svg";

import classes from "./SearchInput.module.css";

export type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
  disabled?: boolean;
};

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder,
  fullWidth,
  disabled,
}) => {
  return (
    <div className={classes.container}>
      <TextInput
        classNames={{
          wrapper: classes.wrapper,
          input: classes.input,
        }}
        type="search"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder={placeholder ?? "Поиск..."}
        aria-label="Поиск"
        leftSection={<SearchIcon />}
        disabled={disabled}
        styles={{
          input: {
            maxWidth: fullWidth ? "100%" : "320px",
            width: fullWidth ? "100%" : undefined,
          },
        }}
      />
    </div>
  );
};

export default SearchInput;
