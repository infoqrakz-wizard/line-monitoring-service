import React from "react";
import { Stack, Title, Text } from "@mantine/core";

const Settings: React.FC = () => {
  return (
    <Stack gap="md">
      <Title order={1} size="h3">
        Настройки
      </Title>
      <Text size="sm" c="dimmed">
        Настройки аккаунта и профиля.
      </Text>
    </Stack>
  );
};

export default Settings;
