import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Container,
  Stack,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Alert,
  Text,
  Paper,
} from "@mantine/core";
import { IconAlertCircle, IconMail, IconLock } from "@tabler/icons-react";
import { useAuthStore } from "@/store/auth";
import classes from "./Login.module.css";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { login, isLoading, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  // Редирект если уже авторизован
  useEffect(() => {
    if (isAuthenticated) {
      void navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Пожалуйста, заполните все поля");
      return;
    }

    try {
      await login(email.trim(), password);
      void navigate(from, { replace: true });
    } catch {
      const errorMessage = "Проверьте email и пароль.";
      setError(errorMessage);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (error) {
      setError(null);
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (error) {
      setError(null);
    }
  };

  return (
    <div className={classes.container}>
      <Container size="xs" className={classes.formContainer}>
        <Paper shadow="md" p="xl" radius="md" className={classes.form}>
          <Stack gap="lg" align="center">
            <Title order={1} size="h2" ta="center" className={classes.title}>
              Вход в систему
            </Title>

            <Text c="dimmed" ta="center" size="sm">
              Введите ваши учетные данные для входа
            </Text>

            <form onSubmit={handleSubmit} className={classes.formElement}>
              <Stack gap="md" w="100%">
                <TextInput
                  label="Email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  leftSection={<IconMail size={16} />}
                  required
                  type="text"
                  // autoComplete="email"
                  aria-label="Email address"
                />

                <PasswordInput
                  label="Пароль"
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  leftSection={<IconLock size={16} />}
                  // required
                  autoComplete="current-password"
                  aria-label="Password"
                />

                {error && (
                  <Alert
                    icon={<IconAlertCircle size={16} />}
                    title="Ошибка"
                    color="red"
                    variant="light"
                  >
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  fullWidth
                  size="md"
                  loading={isLoading}
                  disabled={isLoading}
                  aria-label="Sign in"
                  className={classes.submitButton}
                >
                  {isLoading ? "Вход..." : "Войти"}
                </Button>
              </Stack>
            </form>
          </Stack>
        </Paper>
      </Container>
    </div>
  );
};

export default Login;
