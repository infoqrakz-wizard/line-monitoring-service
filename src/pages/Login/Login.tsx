import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
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
  Anchor,
} from "@mantine/core";
import { IconAlertCircle, IconMail, IconLock } from "@tabler/icons-react";
import { useAuthStore } from "@/store/auth";
import classes from "./Login.module.css";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { login, isLoading, isAuthenticated, autoLogin } = useAuthStore();
  const navigate = useNavigate();

  // Автоматическая попытка входа при загрузке страницы
  useEffect(() => {
    const attemptAutoLogin = async () => {
      try {
        const success = await autoLogin();
        if (success) {
          // Автоматическая авторизация прошла успешно
          // checkAuth уже вызван в autoLogin, поэтому isAuthenticated обновится автоматически
          return;
        }
      } catch (error) {
        console.error("Auto login error:", error);
      }
    };

    void attemptAutoLogin();
  }, [autoLogin]);

  // Редирект если уже авторизован
  useEffect(() => {
    if (isAuthenticated) {
      void navigate("/servers", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Пожалуйста, заполните все поля");
      return;
    }

    try {
      await login(email.trim(), password);
      void navigate("/servers", { replace: true });
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

                <Anchor
                  href="/password-reset"
                  size="sm"
                  c="dimmed"
                  ta="center"
                  className={classes.forgotPassword}
                >
                  Забыли пароль?
                </Anchor>
              </Stack>
            </form>
          </Stack>
        </Paper>
      </Container>
    </div>
  );
};

export default Login;
