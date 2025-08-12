import React from 'react';
import { useSearchParams } from 'react-router-dom';

export type TabItem = { value: string; label: string };

export type TabsProps = {
  tabs: TabItem[];
  queryKey?: string;
  children?: (activeValue: string) => React.ReactNode;
};

const Tabs: React.FC<TabsProps> = ({ tabs, queryKey = 'tab', children }) => {
  const [params, setParams] = useSearchParams();
  const active = params.get(queryKey) ?? tabs[0]?.value ?? '';

  const handleSelect = (value: string) => {
    const next = new URLSearchParams(params);
    next.set(queryKey, value);
    setParams(next, { replace: true });
  };

  return (
    <div>
      <div role="tablist" aria-label="tabs" className="flex gap-2 border-b mb-3">
        {tabs.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={active === t.value}
            tabIndex={0}
            onClick={() => handleSelect(t.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSelect(t.value)}
            className={`px-3 py-2 text-sm ${active === t.value ? 'border-b-2 border-black' : 'text-gray-500'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {children ? <div>{children(active)}</div> : null}
    </div>
  );
};

export default Tabs;
