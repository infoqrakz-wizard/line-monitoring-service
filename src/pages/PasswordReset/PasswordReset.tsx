import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Container,
  Stack,
  Title,
  TextInput,
  Button,
  Alert,
  Text,
  Paper,
  Anchor,
} from "@mantine/core";
import { IconAlertCircle, IconMail, IconCheck } from "@tabler/icons-react";
import { authApi } from "@/api/auth";
import classes from "./PasswordReset.module.css";

const PasswordReset: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email.trim()) {
      setError("Пожалуйста, введите email");
      setIsLoading(false);
      return;
    }

    try {
      await authApi.requestPasswordReset({ email: email.trim() });
      setIsSuccess(true);
    } catch {
      setError("Произошла ошибка при отправке запроса. Попробуйте еще раз.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (error) {
      setError(null);
    }
  };

  const handleBackToLogin = () => {
    void navigate("/login");
  };

  if (isSuccess) {
    return (
      <div className={classes.container}>
        <Container size="xs" className={classes.formContainer}>
          <Paper shadow="md" p="xl" radius="md" className={classes.form}>
            <Stack gap="lg" align="center">
              <div className={classes.successIcon}>
                <IconCheck size={48} />
              </div>

              <Title order={1} size="h2" ta="center" className={classes.title}>
                Письмо отправлено
              </Title>

              <Text c="dimmed" ta="center" size="sm">
                На указанный email было отправлено письмо с инструкциями по
                сбросу пароля. Проверьте вашу почту и следуйте указанным
                инструкциям.
              </Text>

              <Button
                onClick={handleBackToLogin}
                fullWidth
                size="md"
                variant="light"
                aria-label="Вернуться к входу"
              >
                Вернуться к входу
              </Button>
            </Stack>
          </Paper>
        </Container>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <Container size="xs" className={classes.formContainer}>
        <Paper shadow="md" p="xl" radius="md" className={classes.form}>
          <Stack gap="lg" align="center">
            <Title order={1} size="h2" ta="center" className={classes.title}>
              Сброс пароля
            </Title>

            <Text c="dimmed" ta="center" size="sm">
              Введите ваш email для получения инструкций по сбросу пароля
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
                  type="email"
                  autoComplete="email"
                  aria-label="Email address"
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
                  aria-label="Отправить запрос на сброс пароля"
                  className={classes.submitButton}
                >
                  {isLoading ? "Отправка..." : "Отправить"}
                </Button>
              </Stack>
            </form>

            <Anchor
              component="button"
              type="button"
              onClick={handleBackToLogin}
              size="sm"
              c="dimmed"
              className={classes.backLink}
            >
              Вернуться к входу
            </Anchor>
          </Stack>
        </Paper>
      </Container>
    </div>
  );
};

export default PasswordReset;
