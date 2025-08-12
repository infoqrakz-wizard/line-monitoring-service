import React from 'react';
import { Stack, Title, Paper } from '@mantine/core';
import { loadYMap } from '@/lib/ymap';

const MapPage: React.FC = () => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    let destroyed = false;
    loadYMap().then((ymaps) => {
      if (!ymaps || destroyed || !containerRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ymaps as any).ready?.(() => {
        // Minimal init to avoid errors when no API key – this is just a placeholder
        // Consumers can implement actual map init later
      });
    });
    return () => {
      destroyed = true;
    };
  }, []);

  return (
    <Stack gap="md">
      <Title order={1} size="h3">Карта</Title>
      <Paper 
        ref={containerRef} 
        withBorder 
        p={0}
        style={{ width: '100%', height: '384px' }}
        aria-label="Yandex map container" 
      />
    </Stack>
  );
};

export default MapPage;
