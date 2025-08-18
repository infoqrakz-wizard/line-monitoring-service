import { ActionIcon, Stack, Tooltip, Text } from "@mantine/core";
import classes from "./LogItem.module.css";
import { IconTrash } from "@tabler/icons-react";
import type { DowntimeEvent, ServerItem } from "@/types";

const calculateDowntime = (downAt: string, upAt: string | null): string => {
  const down = new Date(downAt).getTime();
  const up = upAt ? new Date(upAt).getTime() : new Date().getTime();
  const diff = up - down;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export default function LogItem({
  event,
  server,
  handleDeleteEvent,
}: {
  event: DowntimeEvent;
  server?: ServerItem;
  handleDeleteEvent: (id: number) => void;
}) {
  const isDown = event.up_at === null;

  return (
    <div className={classes.eventCard}>
      <Stack justify="space-between" align="flex-start" dir="column" w="100%">
        <div className={classes.eventIdContainer}>
          <div
            className={`${classes.eventId} ${isDown ? classes.eventIdDown : ""}`}
          >
            <Text size="sm" fw={500} c={isDown ? "rgb(250, 82, 82)" : "black"}>
              № {event.id} • от{" "}
              {new Date(event.down_at).toLocaleDateString("ru-RU")}
            </Text>
          </div>

          <Tooltip label="Удалить событие">
            <ActionIcon
              color="#676767"
              variant="subtle"
              onClick={() => handleDeleteEvent(event.id)}
              aria-label="Удалить событие"
            >
              <IconTrash size={20} />
            </ActionIcon>
          </Tooltip>
        </div>
        <div className={classes.eventInfo}>
          {event.comment && (
            <div className={classes.eventComment}>{event.comment}</div>
          )}

          <div className={classes.eventInfoRow}>
            <span className={classes.eventInfoItemLabel}>Сервер</span>
            <span className={classes.eventInfoItemValue}>{server?.name}</span>
          </div>
          <div className={classes.eventInfoRow}>
            <span className={classes.eventInfoItemLabel}>Down</span>
            <span className={classes.eventInfoItemValue}>
              {new Date(event.down_at).toLocaleTimeString("ru-RU")}{" "}
              {new Date(event.down_at).toLocaleDateString("ru-RU")}
            </span>
          </div>
          {!isDown && (
            <div className={classes.eventInfoRow}>
              <span className={classes.eventInfoItemLabel}>Up</span>
              <span className={classes.eventInfoItemValue}>
                {new Date(event.up_at!).toLocaleTimeString("ru-RU")}{" "}
                {new Date(event.up_at!).toLocaleDateString("ru-RU")}
              </span>
            </div>
          )}

          <div className={classes.eventInfoRow}>
            <span className={classes.eventInfoItemLabel}>Время простоя</span>
            <span className={classes.eventInfoItemValue}>
              {calculateDowntime(event.down_at, event.up_at)}
            </span>
          </div>
        </div>
      </Stack>
    </div>
  );
}
