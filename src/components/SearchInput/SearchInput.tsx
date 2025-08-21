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
  withClearIcon?: boolean;
};

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  placeholder,
  disabled,
  containerClassName,
  className,
  inputClassName,
  rootClassName,
  withClearIcon,
  onChange,
}) => {
  const handleClearSearch = () => {
    onChange("");
  };

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
        rightSection={
          withClearIcon &&
          value.length > 0 && (
            <button
              type="button"
              className={classes.clearButton}
              onClick={handleClearSearch}
              aria-label="Очистить поиск"
              tabIndex={0}
            >
              X
            </button>
          )
        }
        disabled={disabled}
      />
    </div>
  );
};

export default SearchInput;
