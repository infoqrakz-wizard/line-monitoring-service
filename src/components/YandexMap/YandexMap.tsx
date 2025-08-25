/* eslint-disable @typescript-eslint/no-unsafe-return */
import React, { useEffect, useRef, useCallback } from "react";
import { loadYMap } from "@/lib/ymap";
import type { ServerItem, ServerStatus } from "@/types";
import classes from "./YandexMap.module.css";

export type YandexMapProps = {
  servers: ServerItem[];
  serverStatuses: Record<string, ServerStatus>;
  onServerClick: (server: ServerItem) => void;
  className?: string;
};

const YandexMap: React.FC<YandexMapProps> = ({
  servers,
  serverStatuses,
  onServerClick,
  className,
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const placemarksRef = useRef<any[]>([]);
  const clustererRef = useRef<any>(null);

  const createPlacemark = useCallback(
    (server: ServerItem, status: ServerStatus) => {
      let color: string;
      let statusText: string;

      switch (status) {
        case "green":
          color = "#52c41a";
          statusText = "Доступен";
          break;
        case "yellow":
          color = "#f39c12";
          statusText = "Проблемы";
          break;
        case "red":
        default:
          color = "#ff4d4f";
          statusText = "Недоступен";
          break;
      }

      // В Яндекс картах координаты должны быть в формате [широта, долгота]
      // maps.y - широта, maps.x - долгота
      const coordinates = [server.maps.y, server.maps.x];

      return new (window as any).ymaps.Placemark(
        coordinates,
        {
          balloonContent: `
          <div style="padding: 8px;">
            <h4 style="margin: 0 0 8px 0; color: #333;">${server.name}</h4>
            <p style="margin: 0; color: #666;">${server.url}:${server.port}</p>
            <p style="margin: 4px 0 0 0; color: ${color}; font-weight: bold;">
              ${statusText}
            </p>
          </div>
        `,
          hintContent: `${server.name} ${coordinates[0]}, ${coordinates[1]}`,
        },
        {
          preset: "islands#circleDotIcon",
          iconColor: color,
          iconSize: [20, 20],
          iconOffset: [-10, -10],
        },
      );
    },
    [],
  );

  // Функция для очистки существующих меток
  const clearPlacemarks = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.geoObjects.removeAll();
      clustererRef.current = null;
      placemarksRef.current = [];
    }
  }, []);

  const addPlacemarksToMap = useCallback(
    (map: any, ymaps: any) => {
      if (!mapRef.current) {
        return;
      }

      if (servers.length === 0) {
        return;
      }

      const placemarks: any[] = [];

      servers.forEach((server) => {
        if (
          server.maps &&
          typeof server.maps.x === "number" &&
          typeof server.maps.y === "number" &&
          !isNaN(server.maps.x) &&
          !isNaN(server.maps.y)
        ) {
          const status =
            serverStatuses[`${server.url}:${server.port}`] || "red";

          const placemark = createPlacemark(server, status);

          placemark.events.add("click", () => {
            onServerClick(server);
          });

          placemarks.push(placemark);
        } else {
          console.warn(
            `Server ${server.name} (${server.url}:${server.port}) has invalid coordinates:`,
            server.maps,
          );
        }
      });

      if (placemarks.length > 0) {
        const clusterer = new ymaps.Clusterer({
          // Максимальное расстояние между метками для группировки (в пикселях)
          clusterDisableClickZoom: false,
          // Максимальное количество меток в кластере
          maxZoom: 20,
          // Радиус кластеризации (в пикселях)
          clusterRadius: 50,
          // Стили для кластеров
          clusterIconLayout: "default#pieChart",
          // Размер иконки кластера
          clusterIconSize: [40, 40],
          // Функция для определения цвета кластера
          clusterIconColor: (cluster: any) => {
            const placemarks = cluster.getGeoObjects();
            const hasGreen = placemarks.some(
              (pm: any) => pm.options.get("iconColor") === "#52c41a",
            );
            const hasYellow = placemarks.some(
              (pm: any) => pm.options.get("iconColor") === "#f39c12",
            );
            const hasRed = placemarks.some(
              (pm: any) => pm.options.get("iconColor") === "#ff4d4f",
            );

            // Приоритет цветов: зеленый > желтый > красный > серый
            if (hasGreen) {
              return "#52c41a";
            }
            if (hasYellow) {
              return "#f39c12";
            }
            if (hasRed) {
              return "#ff4d4f";
            }
            return "#8c8c8c";
          },
          clusterOpenBalloonOnClick: false,
          clusterBalloonLayout: "cluster#balloon",
          clusterBalloonContentLayout: "cluster#balloonContent",
          clusterBalloonPanelMaxMapArea: 0,
        });

        clusterer.add(placemarks);

        clusterer.events.add("click", (e: any) => {
          const cluster = e.get("target");
          const placemarks = cluster.getGeoObjects();

          if (placemarks.length === 1) {
            placemarks[0].balloon.open();
          } else {
            const bounds = cluster.getBounds();
            map.setBounds(bounds, {
              checkZoomRange: true,
              duration: 300,
            });
          }
        });

        map.geoObjects.add(clusterer);
        placemarksRef.current = placemarks;
        clustererRef.current = clusterer;

        // Автоматически центрируем карту по точкам
        if (placemarks.length === 1) {
          const coords = placemarks[0].geometry.getCoordinates();
          map.setCenter(coords);
        } else if (placemarks.length > 1) {
          const allCoords = placemarks.map((placemark) =>
            placemark.geometry.getCoordinates(),
          );

          // Вычисляем границы вручную
          const minLat = Math.min(...allCoords.map((coord) => coord[0])); // минимальная широта
          const maxLat = Math.max(...allCoords.map((coord) => coord[0])); // максимальная широта
          const minLng = Math.min(...allCoords.map((coord) => coord[1])); // минимальная долгота
          const maxLng = Math.max(...allCoords.map((coord) => coord[1])); // максимальная долгота

          // Устанавливаем границы карты в формате [[minLat, minLng], [maxLat, maxLng]]
          map.setBounds(
            [
              [minLat, minLng],
              [maxLat, maxLng],
            ],
            {
              checkZoomRange: true,
              duration: 300,
            },
          );
        } else {
          console.info(
            "No servers with valid coordinates found. Map centered on Moscow.",
          );
        }
      }
    },
    [servers, serverStatuses, createPlacemark, onServerClick],
  );

  const initMap = useCallback(async () => {
    if (!mapRef.current) {
      return;
    }

    if (!mapRef.current) {
      return;
    }

    try {
      const ymaps = await loadYMap();

      ymaps.ready(() => {
        if (mapInstanceRef.current) {
          clearPlacemarks();
          mapInstanceRef.current.destroy();
        }

        const map = new ymaps.Map(mapRef.current, {
          center: [55.76, 37.64],
          zoom: 10,
          controls: ["zoomControl", "fullscreenControl"],
        });

        mapInstanceRef.current = map;

        if (servers.length > 0) {
          addPlacemarksToMap(map, ymaps);
        } else {
          console.log("YandexMap: No servers available during initialization");
        }
      });
    } catch (error) {
      console.error("Failed to initialize Yandex Map:", error);
    }
  }, [servers, clearPlacemarks, addPlacemarksToMap]);

  const updatePlacemarks = useCallback(() => {
    if (!mapInstanceRef.current || !placemarksRef.current.length) {
      return;
    }

    placemarksRef.current.forEach((placemark, index) => {
      const server = servers[index];
      if (
        server &&
        server.maps &&
        typeof server.maps.x === "number" &&
        typeof server.maps.y === "number" &&
        !isNaN(server.maps.x) &&
        !isNaN(server.maps.y)
      ) {
        const status = serverStatuses[`${server.url}:${server.port}`] || "red";

        let color: string;
        let statusText: string;

        switch (status) {
          case "green":
            color = "#52c41a";
            statusText = "Доступен";
            break;
          case "yellow":
            color = "#f39c12";
            statusText = "Проблемы";
            break;
          case "red":
          default:
            color = "#ff4d4f";
            statusText = "Недоступен";
            break;
        }

        placemark.options.set("iconColor", color);

        placemark.properties.set(
          "balloonContent",
          `
          <div style="padding: 8px;">
            <h4 style="margin: 0 0 8px 0; color: #333;">${server.name}</h4>
            <p style="margin: 0; color: #666;">${server.url}:${server.port}</p>
            <p style="margin: 4px 0 0 0; color: ${color}; font-weight: bold;">
              ${statusText}
            </p>
          </div>
        `,
        );
      }
    });
  }, [servers, serverStatuses]);

  useEffect(() => {
    void initMap();
  }, [initMap]);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      void initMap();
    }
  }, [initMap]);

  useEffect(() => {
    if (mapInstanceRef.current && servers.length > 0) {
      clearPlacemarks();
      addPlacemarksToMap(mapInstanceRef.current, (window as any).ymaps);
    } else if (mapInstanceRef.current && servers.length === 0) {
      clearPlacemarks();
    }
  }, [servers, clearPlacemarks, addPlacemarksToMap]);

  // Обновляем существующие метки при изменении статусов
  useEffect(() => {
    updatePlacemarks();
  }, [updatePlacemarks]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        clearPlacemarks();
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [clearPlacemarks]);

  return (
    <div
      ref={mapRef}
      className={`${classes.mapContainer} ${className || ""}`}
      aria-label="Карта серверов"
    />
  );
};

export default YandexMap;
