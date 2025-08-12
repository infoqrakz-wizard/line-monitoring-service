import React from "react";
import { useLocation, useNavigate } from "react-router";
import { Container, Stack, Title, Button } from "@mantine/core";
import { useAuthStore } from "@/store/auth";

const Login: React.FC = () => {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from?.pathname || "/";

  const handleLogin = () => {
    login({
      user: {
        id: "1",
        name: "Admin",
        role: "admin",
      },
      token: "demo-token",
    });
    navigate(from, { replace: true });
  };

  return (
    <Container size="xs" mt="xl">
      <Stack gap="lg" align="center">
        <Title order={1} size="h3" ta="center">
          Вход
        </Title>
        <Button onClick={handleLogin} fullWidth size="md" aria-label="Login">
          Войти как Admin (demo)
        </Button>
      </Stack>
    </Container>
  );
};

export default Login;
