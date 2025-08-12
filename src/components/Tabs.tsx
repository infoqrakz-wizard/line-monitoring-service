import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs as MantineTabs } from '@mantine/core';

export type TabItem = { value: string; label: string };

export type TabsProps = {
  tabs: TabItem[];
  queryKey?: string;
  children?: (activeValue: string) => React.ReactNode;
};

const Tabs: React.FC<TabsProps> = ({ tabs, queryKey = 'tab', children }) => {
  const [params, setParams] = useSearchParams();
  const active = params.get(queryKey) ?? tabs[0]?.value ?? '';

  const handleSelect = (value: string | null) => {
    if (value) {
      const next = new URLSearchParams(params);
      next.set(queryKey, value);
      setParams(next, { replace: true });
    }
  };

  return (
    <MantineTabs value={active} onChange={handleSelect}>
      <MantineTabs.List>
        {tabs.map((t) => (
          <MantineTabs.Tab key={t.value} value={t.value}>
            {t.label}
          </MantineTabs.Tab>
        ))}
      </MantineTabs.List>
      
      {children && (
        <MantineTabs.Panel value={active} pt="md">
          {children(active)}
        </MantineTabs.Panel>
      )}
    </MantineTabs>
  );
};

export default Tabs;
