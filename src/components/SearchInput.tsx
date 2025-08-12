import React from 'react';
import { TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

export type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
};

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder, fullWidth }) => {
  return (
    <TextInput
      type="search"
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      placeholder={placeholder ?? 'Поиск...'}
      aria-label="Поиск"
      leftSection={<IconSearch size={16} />}
      styles={{
        input: {
          maxWidth: fullWidth ? '100%' : '320px',
          width: fullWidth ? '100%' : undefined
        }
      }}
    />
  );
};

export default SearchInput;
