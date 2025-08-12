import React from "react";
import { Stack, Title, Text } from "@mantine/core";

const Groups: React.FC = () => {
  return (
    <Stack gap="md">
      <Title order={1} size="h3">
        Группы
      </Title>
      <Text size="sm" c="dimmed">
        Управление группами серверов.
      </Text>
    </Stack>
  );
};

export default Groups;
