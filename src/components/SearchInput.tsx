import React from 'react';

export type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value);
  return (
    <input
      type="search"
      value={value}
      onChange={handleChange}
      placeholder={placeholder ?? 'Поиск...'}
      aria-label="Поиск"
      className="w-full max-w-xs px-3 py-2 border rounded outline-none focus:ring"
    />
  );
};

export default SearchInput;
