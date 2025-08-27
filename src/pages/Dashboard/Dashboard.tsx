import React, { useEffect, useState, useRef, useCallback } from "react";
import { Text, Group, Pagination, Badge, Divider } from "@mantine/core";
import CustomTooltip from "@/components/CustomTooltip";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useServersStore } from "@/store/servers";
import { useMonitoringStore } from "@/store/monitoring";
import { ServerStatus, ServerItem } from "@/types";
import { formatUptime } from "@/utils/uptime";
import classes from "./Dashboard.module.css";

// Grid calculation types
interface GridConfig {
  rows: number;
  cols: number;
  tileW: number;
  tileH: number;
  usedW: number;
  usedH: number;
  empty: number;
  area: number;
  arDiff: number;
  offsetX: number;
  offsetY: number;
}

interface GridParams {
  W: number;
  H: number;
  aspect: number;
}

const GRID_GAP = 8; // Размер gap между элементами в px

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [openTooltipId, setOpenTooltipId] = useState<number | null>(null);
  const [clickPosition, setClickPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [gridConfig, setGridConfig] = useState<GridConfig | null>(null);
  const serverRefs = useRef<{ [key: number]: React.RefObject<HTMLDivElement> }>(
    {},
  );
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Получаем активный фильтр из query-параметра
  const filterParam = searchParams.get("filter");
  const activeFilter =
    filterParam === "available" || filterParam === "unavailable"
      ? filterParam
      : "all";

  const pageSize = 60; // Фиксированное количество элементов на странице

  const {
    servers,
    loading,
    error,
    total,
    totalPages: totalPagesFromStore,
    fetchServers,
    setCurrentPage: setCurrentPageStore,
  } = useServersStore();

  const currentServers = servers;

  const { getServerStatus, servers: monitoringServers } = useMonitoringStore();

  // Helper to determine if pagination should be shown
  const shouldShowPagination = total > pageSize;

  // Grid calculation functions - основан на оригинальном рабочем алгоритме
  const bestRectGrid = useCallback(
    (N: number, { W, H }: GridParams): GridConfig => {
      const screenAR = W / H;
      let best: GridConfig | null = null;
      const gap = GRID_GAP;

      // Учитываем gap и пагинацию в доступном пространстве
      const availableW = W;
      let availableH = H;

      if (shouldShowPagination) {
        availableH = availableH - 60 - 25;
      } else {
        availableH = availableH - 20;
      }

      // Оригинальный алгоритм - перебираем все возможные конфигурации строк
      for (let rows = 1; rows <= N; rows++) {
        const cols = Math.ceil(N / rows);

        // Рассчитываем доступное пространство с учетом gap'ов
        const spaceW = availableW - (cols - 1) * gap;
        const spaceH = availableH - (rows - 1) * gap;

        // Рассчитываем размер квадратной плитки (aspect = 1)
        const s = Math.floor(Math.min(spaceW / cols, spaceH / rows));
        if (s <= 0) {
          continue;
        }

        // Квадратные карточки
        const tileW = s;
        const tileH = s;

        const usedW = cols * tileW + (cols - 1) * gap;
        const usedH = rows * tileH + (rows - 1) * gap;
        const empty = cols * rows - N;
        const area = tileW * tileH;
        const arDiff = Math.abs(cols / rows - screenAR);

        const cand: GridConfig = {
          rows,
          cols,
          tileW,
          tileH,
          usedW,
          usedH,
          empty,
          area,
          arDiff,
          offsetX: 0,
          offsetY: 0,
        };

        // Оригинальная логика выбора лучшей конфигурации
        if (
          !best ||
          cand.area > best.area ||
          (cand.area === best.area && cand.empty < best.empty) ||
          (cand.area === best.area &&
            cand.empty === best.empty &&
            cand.arDiff < best.arDiff)
        ) {
          best = cand;
        }
      }

      if (!best) {
        // Fallback configuration
        const fallbackRows = 1;
        const fallbackCols = N;
        const spaceW = availableW - (fallbackCols - 1) * gap;
        const spaceH = availableH - (fallbackRows - 1) * gap;
        const tileSize = Math.floor(
          Math.min(spaceW / fallbackCols, spaceH / fallbackRows),
        );

        return {
          rows: fallbackRows,
          cols: fallbackCols,
          tileW: tileSize,
          tileH: tileSize,
          usedW: fallbackCols * tileSize + (fallbackCols - 1) * gap,
          usedH: fallbackRows * tileSize + (fallbackRows - 1) * gap,
          empty: 0,
          area: tileSize * tileSize,
          arDiff: 0,
          offsetX: Math.floor(
            (W - (fallbackCols * tileSize + (fallbackCols - 1) * gap)) / 2,
          ),
          offsetY: Math.floor(
            (H - (fallbackRows * tileSize + (fallbackRows - 1) * gap)) / 2,
          ),
        };
      }

      const offsetX = Math.floor((W - best.usedW) / 2);
      const offsetY = Math.floor((H - best.usedH) / 2);

      return {
        ...best,
        offsetX,
        offsetY,
      };
    },
    [shouldShowPagination],
  );

  const parseAspect = useCallback((str: string): number => {
    if (!str) {
      return 16 / 9;
    }
    const s = String(str).trim();
    if (s.includes("/")) {
      const [a, b] = s.split("/").map(Number);
      return a > 0 && b > 0 ? a / b : 16 / 9;
    }
    const f = Number(s);
    return f > 0 ? f : 16 / 9;
  }, []);

  const calculateGridLayout = useCallback(() => {
    if (!gridContainerRef.current) {
      return;
    }

    // Принудительно получаем актуальные размеры контейнера
    const rect = gridContainerRef.current.getBoundingClientRect();
    const W = Math.floor(rect.width);
    const H = Math.floor(rect.height);

    const N = currentServers.length;
    const aspect = parseAspect("1/1"); // Always 1:1 aspect ratio

    // Проверяем, что контейнер имеет размеры и есть серверы
    if (N > 0 && W > 0 && H > 0) {
      console.log(`Calculating grid for ${N} servers, container: ${W}x${H}px`);

      const config = bestRectGrid(N, {
        W,
        H,
        aspect,
      });

      console.log(
        `Grid config: ${config.cols}x${config.rows}, tile: ${config.tileW}x${config.tileH}px (square), used: ${config.usedW}x${config.usedH}px, empty: ${config.empty}`,
      );

      setGridConfig(config);
    } else {
      setGridConfig(null);
    }
  }, [bestRectGrid, parseAspect, currentServers.length, shouldShowPagination]);

  // Функция для получения статуса сервера из monitoring store
  const getServerStatusFromMonitoring = useCallback(
    (server: ServerItem): ServerStatus => {
      const monitoringServer = monitoringServers.find(
        (ms) =>
          ms.sections.main.url === server.url &&
          ms.sections.main.port === server.port,
      );

      if (monitoringServer) {
        return getServerStatus(monitoringServer);
      }

      // Если нет данных мониторинга, возвращаем red
      return "red";
    },
    [monitoringServers, getServerStatus],
  );

  useEffect(() => {
    void fetchServers({
      page: currentPage,
      limit: pageSize,
      filter: activeFilter,
    });
  }, [fetchServers, currentPage, pageSize, activeFilter]);

  // Сбрасываем страницу на первую при изменении фильтра
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
      setCurrentPageStore(1);
    }
  }, [activeFilter, currentPage, setCurrentPageStore]);

  // Подписываемся на мониторинг для получения статусов серверов
  useEffect(() => {
    const { subscribeToServers } = useMonitoringStore.getState();
    subscribeToServers();
  }, []);

  // Calculate grid layout when servers change, pagination state changes, or component mounts
  useEffect(() => {
    if (currentServers.length > 0) {
      // Сразу рассчитываем сетку без сброса конфигурации
      requestAnimationFrame(() => {
        calculateGridLayout();
      });
    } else {
      // Если нет серверов, сбрасываем конфигурацию
      setGridConfig(null);
    }
  }, [calculateGridLayout, currentServers.length, shouldShowPagination]);

  // Handle window resize
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
      // Очищаем предыдущий таймаут
      clearTimeout(resizeTimeout);

      // Устанавливаем новый таймаут для пересчета
      resizeTimeout = setTimeout(() => {
        calculateGridLayout();
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [calculateGridLayout]);

  // Принудительный вызов расчета при монтировании
  useEffect(() => {
    if (currentServers.length > 0) {
      calculateGridLayout();
    }
  }, [calculateGridLayout, currentServers.length]); // Добавляем зависимости

  // ResizeObserver для отслеживания изменений размера контейнера
  useEffect(() => {
    if (!gridContainerRef.current || currentServers.length === 0) {
      return;
    }

    let timeoutId: NodeJS.Timeout;
    const resizeObserver = new ResizeObserver((entries) => {
      // Debounce the resize event
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (entries.length > 0) {
          calculateGridLayout();
        }
      }, 100);
    });

    resizeObserver.observe(gridContainerRef.current);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [calculateGridLayout, currentServers.length]);

  const getStatusColor = useCallback((status: ServerStatus) => {
    switch (status) {
      case "green":
        return "#2ecc71";
      case "yellow":
        return "#f1c40f";
      case "red":
        return "#e74c3c";
      default:
        return "#95a5a6";
    }
  }, []);

  const getStatusLabel = useCallback((status: ServerStatus) => {
    switch (status) {
      case "green":
        return "Работает";
      case "yellow":
        return "Проблемы";
      case "red":
        return "Не работает";
      default:
        return "Неизвестно";
    }
  }, []);

  const handleServerClick = useCallback(
    (url: string, port: number) => {
      void navigate(
        `/servers/info?url=${encodeURIComponent(url)}&port=${encodeURIComponent(port.toString())}`,
      );
    },
    [navigate],
  );

  const handleTooltipToggle = useCallback(
    (serverId: number, event: React.MouseEvent) => {
      if (openTooltipId === serverId) {
        setOpenTooltipId(null);
        setClickPosition(null);
      } else {
        setOpenTooltipId(serverId);
        setClickPosition({
          x: event.clientX,
          y: event.clientY,
        });
      }
    },
    [openTooltipId],
  );

  const handleTooltipClose = useCallback(() => {
    setOpenTooltipId(null);
    setClickPosition(null);
  }, []);

  const getServerRef = useCallback((serverId: number) => {
    if (!serverRefs.current[serverId]) {
      serverRefs.current[serverId] = React.createRef<HTMLDivElement>();
    }
    return serverRefs.current[serverId];
  }, []);

  // Функция рендеринга карточки сервера
  const renderServerCard = useCallback(
    (server: ServerItem) => {
      const status = getServerStatusFromMonitoring(server);
      const statusColor = getStatusColor(status);
      const statusLabel = getStatusLabel(status);

      // Получаем данные мониторинга для текущего сервера
      const monitoringServer = monitoringServers.find(
        (ms) =>
          ms.sections.main.url === server.url &&
          ms.sections.main.port === server.port,
      );

      // Получаем данные о камерах и uptime
      const totalCameras = monitoringServer?.sections.main.totalCameras || 0;
      const uptime = formatUptime(monitoringServer?.sections.main, status);

      return (
        <CustomTooltip
          content={
            <div className={classes.tooltipContent}>
              <Text size="sm" fw={600} mb="xs">
                {server.name}
              </Text>
              <Text size="xs" mb="xs">
                {server.url}:{server.port}
              </Text>
              <Divider my="xs" />
              <Group gap="xs" mb="xs">
                <Text size="xs">Статус:</Text>
                <Badge
                  size="xs"
                  color={
                    status === "green"
                      ? "green"
                      : status === "yellow"
                        ? "yellow"
                        : "red"
                  }
                >
                  {statusLabel}
                </Badge>
              </Group>
              <Group gap="xs" mb="xs">
                <Text size="xs">Камеры:</Text>
                <Text size="xs">{totalCameras > 0 ? totalCameras : "Н/Д"}</Text>
              </Group>
              <Group gap="xs" mb="xs">
                <Text size="xs">Uptime:</Text>
                <Text size="xs">{uptime}</Text>
              </Group>
              <Divider my="xs" />
              <Group gap="xs" justify="center">
                <Link
                  to={`/servers/info?url=${server.url}&port=${server.port}`}
                >
                  <Text size="xs" c="blue" fw={800}>
                    Перейти к серверу
                  </Text>
                </Link>
              </Group>
            </div>
          }
          position="top"
          isOpen={openTooltipId === server.id}
          onClose={handleTooltipClose}
          clickPosition={clickPosition}
        >
          <div
            ref={getServerRef(server.id)}
            className={`${classes.serverCard} ${classes[status]}`}
            onClick={(event) => handleTooltipToggle(server.id, event)}
            onDoubleClick={() => handleServerClick(server.url, server.port)}
            style={{
              borderColor: statusColor,
              borderWidth: "2px",
              width: gridConfig ? `${gridConfig.tileW}px` : "100%",
              height: gridConfig ? `${gridConfig.tileH}px` : "100%",
            }}
          >
            <Text className={classes.serverName} ta="left" size="sm" fw={500}>
              {server.name}
            </Text>
          </div>
        </CustomTooltip>
      );
    },
    [
      getServerStatusFromMonitoring,
      getStatusColor,
      getStatusLabel,
      monitoringServers,
      openTooltipId,
      handleTooltipClose,
      clickPosition,
      handleTooltipToggle,
      handleServerClick,
      gridConfig,
      getServerRef,
    ],
  );

  // Функция рендеринга всех элементов сетки
  const renderGridElements = useCallback(() => {
    if (!gridConfig) {
      // Fallback рендеринг когда сетка еще не рассчитана
      return currentServers.map((server) => (
        <div key={server.id} className={classes.serverItem}>
          {renderServerCard(server)}
        </div>
      ));
    }

    // Расчитываем количество ghost элементов для центрирования последней строки
    const N = currentServers.length;
    const { cols } = gridConfig;
    const fullRows = Math.floor(N / cols);
    const rem = N % cols; // плиток в неполном последнем ряду
    const emptiesLastRow = rem === 0 ? 0 : cols - rem;
    const ghostLeft = Math.floor(emptiesLastRow / 2);
    const ghostRight = emptiesLastRow - ghostLeft;

    const elements = [];
    let serverIndex = 0;

    // Полные ряды
    for (let r = 0; r < fullRows; r++) {
      for (let c = 0; c < cols; c++) {
        const server = currentServers[serverIndex++];
        elements.push(
          <div key={server.id} className={classes.serverItem}>
            {renderServerCard(server)}
          </div>,
        );
      }
    }

    // Последний ряд (неполный) — добавляем призраки слева/справа
    if (rem > 0) {
      // Призраки слева
      for (let i = 0; i < ghostLeft; i++) {
        elements.push(
          <div key={`ghost-left-${i}`} className={classes.ghostTile} />,
        );
      }

      // Оставшиеся серверы
      for (let i = 0; i < rem; i++) {
        const server = currentServers[serverIndex++];
        elements.push(
          <div key={server.id} className={classes.serverItem}>
            {renderServerCard(server)}
          </div>,
        );
      }

      // Призраки справа
      for (let i = 0; i < ghostRight; i++) {
        elements.push(
          <div key={`ghost-right-${i}`} className={classes.ghostTile} />,
        );
      }
    }

    return elements;
  }, [gridConfig, currentServers, renderServerCard]);

  const totalPages = totalPagesFromStore || 1;

  if (loading) {
    return (
      <div className={classes.wrapper}>
        <div className={classes.loading}>Загрузка серверов...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes.wrapper}>
        <div className={classes.error}>Ошибка: {error}</div>
      </div>
    );
  }

  return (
    <div className={classes.wrapper}>
      <div className={classes.content}>
        <div
          ref={gridContainerRef}
          className={classes.serverGrid}
          data-page-size={pageSize}
          data-servers-count={currentServers.length}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
          }}
        >
          {currentServers.length > 0 && (
            <div className={classes.stage}>
              <div
                className={classes.grid}
                style={{
                  left: gridConfig ? `${gridConfig.offsetX}px` : "0px",
                  width: gridConfig
                    ? `${gridConfig.cols * gridConfig.tileW}px`
                    : "100%",
                  height: gridConfig
                    ? `${gridConfig.rows * gridConfig.tileH}px`
                    : "100%",
                  gridTemplateColumns: gridConfig
                    ? `repeat(${gridConfig.cols}, ${gridConfig.tileW}px)`
                    : "repeat(auto-fit, minmax(100px, 1fr))",
                  gridTemplateRows: gridConfig
                    ? `repeat(${gridConfig.rows}, ${gridConfig.tileH}px)`
                    : "repeat(auto-fit, minmax(100px, 1fr))",
                  opacity: gridConfig ? 1 : 0.7,
                  transition: "opacity 0.2s ease-in-out",
                }}
              >
                {renderGridElements()}
              </div>
            </div>
          )}
        </div>

        {shouldShowPagination && (
          <div className={classes.paginationContainer}>
            <Pagination
              total={totalPages}
              value={currentPage}
              onChange={(page) => {
                setCurrentPage(page);
                void fetchServers({
                  page,
                  limit: pageSize,
                  filter: activeFilter,
                });
              }}
              size="sm"
              radius="md"
            />
          </div>
        )}

        {servers.length === 0 && (
          <div className={classes.emptyState}>
            <Text size="lg" c="dimmed" ta="center">
              Серверы не найдены
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
