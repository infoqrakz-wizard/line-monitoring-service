import React from 'react';
import { Switch } from '@mantine/core';

export type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
};

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, id }) => {
  return (
    <Switch
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.currentTarget.checked)}
      label={label}
      size="md"
    />
  );
};

export default Toggle;
