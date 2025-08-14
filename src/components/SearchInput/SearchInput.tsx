import React from "react";
import { TextInput } from "@mantine/core";
import SearchIcon from "../../assets/icons/search.svg?react";

import classes from "./SearchInput.module.css";

export type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  containerClassName?: string;
  className?: string;
  inputClassName?: string;
  rootClassName?: string;
};

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder,
  disabled,
  containerClassName,
  className,
  inputClassName,
  rootClassName,
}) => {
  return (
    <div className={`${classes.container} ${containerClassName}`}>
      <TextInput
        classNames={{
          wrapper: `${classes.wrapper} ${className}`,
          input: `${classes.input} ${inputClassName}`,
          section: classes.section,
          root: rootClassName,
        }}
        type="search"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder={placeholder ?? "Поиск..."}
        aria-label="Поиск"
        leftSection={
          <span className={classes.searchIcon}>
            <SearchIcon />
          </span>
        }
        disabled={disabled}
      />
    </div>
  );
};

export default SearchInput;
