import React from 'react';
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
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Карта</h1>
      <div ref={containerRef} className="w-full h-96 border rounded" aria-label="Yandex map container" />
    </div>
  );
};

export default MapPage;
