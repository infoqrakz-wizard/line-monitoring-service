import React from 'react';

export type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
};

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, id }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked);
  const inputId = id ?? `toggle-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <label htmlFor={inputId} className="inline-flex items-center gap-2 cursor-pointer select-none">
      <input id={inputId} type="checkbox" checked={checked} onChange={handleChange} className="peer sr-only" />
      <span
        aria-hidden
        className="w-10 h-6 rounded-full bg-gray-300 relative transition-colors peer-checked:bg-green-500"
      >
        <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
      </span>
      {label ? <span className="text-sm text-gray-700">{label}</span> : null}
    </label>
  );
};

export default Toggle;
