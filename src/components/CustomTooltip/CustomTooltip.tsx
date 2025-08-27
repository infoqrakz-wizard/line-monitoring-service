import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import classes from "./CustomTooltip.module.css";

export type CustomTooltipProps = {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: "top" | "bottom";
  isOpen: boolean;
  onClose: () => void;
  clickPosition: { x: number; y: number } | null;
};

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  children,
  content,
  position = "top",
  isOpen,
  onClose,
  clickPosition,
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState({
    top: 0,
    left: 0,
  });
  const [actualDirection, setActualDirection] = useState<"top" | "bottom">(
    position,
  );

  // Позиционирование тултипа относительно координаты клика
  const updatePosition = useCallback(() => {
    if (!clickPosition || !tooltipRef.current) {
      return;
    }

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    let top = 0;
    let left = 0;
    let direction = position;

    if (position === "top") {
      // Позиционируем сверху от точки клика
      top = clickPosition.y - tooltipRect.height - 12; // 12px отступ
      left = clickPosition.x - tooltipRect.width / 2; // центрируем по горизонтали
    } else {
      // Позиционируем снизу от точки клика
      top = clickPosition.y + 12; // 12px отступ
      left = clickPosition.x - tooltipRect.width / 2; // центрируем по горизонтали
    }

    // Проверяем, чтобы тултип не выходил за границы экрана
    if (left < 16) {
      left = 16;
    } else if (left + tooltipRect.width > window.innerWidth - 16) {
      left = window.innerWidth - tooltipRect.width - 16;
    }

    if (position === "top" && top < 16) {
      // Если сверху не помещается, показываем снизу
      top = clickPosition.y + 12;
      direction = "bottom";
    } else if (
      position === "bottom" &&
      top + tooltipRect.height > window.innerHeight - 16
    ) {
      // Если снизу не помещается, показываем сверху
      top = clickPosition.y - tooltipRect.height - 12;
      direction = "top";
    }

    setTooltipPosition({
      top,
      left,
    });
    setActualDirection(direction);
  }, [position, clickPosition]);

  // Обновляем позицию при изменении размера окна
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      return () => window.removeEventListener("resize", updatePosition);
    }
  }, [isOpen, updatePosition]);

  // Обработчик клика вне тултипа
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Обработчик клавиши Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {createPortal(
        <div
          ref={tooltipRef}
          className={classes.tooltip}
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          <div className={classes.content}>{content}</div>
          <div className={`${classes.arrow} ${classes[actualDirection]}`} />
        </div>,
        document.body,
      )}
    </>
  );
};

export default CustomTooltip;
