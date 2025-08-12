import React from 'react';
import { TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

export type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder }) => {
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
          maxWidth: '320px'
        }
      }}
    />
  );
};

export default SearchInput;
