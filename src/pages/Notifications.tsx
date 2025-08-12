import React from "react";
import { Stack, Title, Text } from "@mantine/core";

const Notifications: React.FC = () => {
  return (
    <Stack gap="md">
      <Title order={1} size="h3">
        Уведомления
      </Title>
      <Text size="sm" c="dimmed">
        Центр уведомлений.
      </Text>
    </Stack>
  );
};

export default Notifications;
