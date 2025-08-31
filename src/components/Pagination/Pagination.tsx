import React from "react";
import { Group, Button, Text } from "@mantine/core";
import classes from "./Pagination.module.css";

export interface PaginationProps {
  currentPageIndex: number;
  pagesCount: number;
  pageSize: number;
  nextCursor?: string | null;
  previousCursor?: string | null;
  onPageChange: (cursor: string | null, pageIndex: number) => void;
  showPageInfo?: boolean;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPageIndex,
  pagesCount,
  nextCursor,
  previousCursor,
  onPageChange,
  showPageInfo = true,
  className,
}) => {
  const shouldShowPagination = pagesCount > 1;

  if (!shouldShowPagination) {
    return null;
  }

  const handlePrevious = () => {
    if (previousCursor) {
      onPageChange(previousCursor, currentPageIndex - 1);
    }
  };

  const handleNext = () => {
    if (nextCursor) {
      onPageChange(nextCursor, currentPageIndex + 1);
    }
  };

  return (
    <div className={`${classes.paginationContainer} ${className || ""}`}>
      <Group gap="xs" justify="center">
        <Button
          variant="subtle"
          size="sm"
          disabled={!previousCursor}
          onClick={handlePrevious}
          aria-label="Предыдущая страница"
        >
          Назад
        </Button>

        {showPageInfo && (
          <Text size="sm" c="dimmed">
            Страница {currentPageIndex + 1}
          </Text>
        )}

        <Button
          variant="subtle"
          size="sm"
          disabled={!nextCursor}
          onClick={handleNext}
          aria-label="Следующая страница"
        >
          Вперед
        </Button>
      </Group>
    </div>
  );
};

export default Pagination;
