import type { ServerStatus, ServerMonitoringData } from "@/types";

export const formatUptime = (
  monitoring?: ServerMonitoringData,
  status?: ServerStatus,
  downAtOverride?: string | null,
): string => {
  if (!monitoring) {
    return "-";
  }

  // Если сервер недоступен (красный статус), показываем время недоступности с минусом
  if (status === "red") {
    const startTime = downAtOverride ?? monitoring.lastErrorTime;
    if (startTime) {
      const errorTime = new Date(startTime);
      
      // Проверяем, что дата валидна
      if (isNaN(errorTime.getTime())) {
        return "-";
      }
      
      const now = new Date();
      const downtimeMs = now.getTime() - errorTime.getTime();
      
      // Если время недоступности отрицательное, значит что-то не так с датой
      if (downtimeMs < 0) {
        return "-";
      }
      
      // Конвертируем в часы и минуты
      const hours = Math.floor(downtimeMs / (1000 * 60 * 60));
      const minutes = Math.floor((downtimeMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `-${hours}ч ${minutes}м`;
      } else if (minutes > 0) {
        return `-${minutes}м`;
      } else {
        return "-0м";
      }
    }
    return "-";
  }

  // Если сервер доступен, показываем обычный uptime
  return monitoring.uptime || "-";
};
