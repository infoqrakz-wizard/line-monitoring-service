import React from 'react';
import { Stack, Title, Text } from '@mantine/core';

const Users: React.FC = () => {
  return (
    <Stack gap="md">
      <Title order={1} size="h3">Пользователи</Title>
      <Text size="sm" c="dimmed">Список пользователей, логи и отложенные действия будут тут.</Text>
    </Stack>
  );
};

export default Users;
