import React, { useState } from "react";
import {
  TextInput,
  PasswordInput,
  NumberInput,
  Button,
  Group,
  Stack,
  Title,
  Text,
} from "@mantine/core";
import { useNavigate } from "react-router";
import classes from "./CreateServer.module.css";
import { useServersStore } from "@/store/servers";
import { parseApiError } from "@/lib/request";

export type CreateServerFormData = {
  serverName: string;
  login: string;
  password: string;
  ipAddress: string;
  port: number | "";
};

const CreateServer: React.FC = () => {
  const navigate = useNavigate();
  const { createServer } = useServersStore();
  const [formData, setFormData] = useState<CreateServerFormData>({
    serverName: "",
    login: "",
    password: "",
    ipAddress: "",
    port: "",
  });

  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    field: keyof CreateServerFormData,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleCreateServer();
  };

  const handleCancel = () => {
    void navigate("/servers");
  };

  const handleBack = () => {
    void navigate("/servers");
  };

  const handleCreateServer = async () => {
    try {
      await createServer({
        name: formData.serverName,
        url: formData.ipAddress,
        port: Number(formData.port),
        username: formData.login,
        password: formData.password,
        enabled: true,
      });
      void navigate("/servers");
    } catch (error) {
      const apiError = parseApiError(error);
      if (apiError) {
        if (apiError.status === 409) {
          setError(
            "Сервер с таким адресом и портом уже существует. Проверьте поля IP-адрес и Порт.",
          );
          return;
        }
        if (apiError.status === 500) {
          setError("Внутренняя ошибка сервера. Повторите попытку позже.");
          return;
        }
        setError(apiError.message || "Не удалось создать сервер");
        return;
      }
      setError("Не удалось создать сервер");
    }
  };

  const isFormValid =
    formData.serverName.trim() &&
    formData.login.trim() &&
    formData.password.trim() &&
    formData.ipAddress.trim() &&
    formData.port !== "";

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <Title order={1} size="h3">
          Серверы
        </Title>
      </div>

      <div className={classes.subHeader}>
        <button
          className={classes.backButton}
          onClick={handleBack}
          aria-label="Вернуться к списку серверов"
        >
          <div className={classes.backIcon} />
        </button>
        <Title order={3} className={classes.title}>
          Добавить новый сервер
        </Title>
      </div>
      <form onSubmit={handleSubmit} className={classes.form}>
        <Stack gap="md">
          <TextInput
            label="Имя сервера"
            placeholder="Введите имя сервера"
            value={formData.serverName}
            onChange={(e) => handleInputChange("serverName", e.target.value)}
            required
            size="md"
          />

          <TextInput
            label="Логин"
            placeholder="Введите логин"
            value={formData.login}
            onChange={(e) => handleInputChange("login", e.target.value)}
            required
            size="md"
          />

          <PasswordInput
            label="Пароль"
            placeholder="Введите пароль"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            required
            size="md"
          />

          <TextInput
            label="URL или IP-адрес"
            placeholder="Введите URL или IP-адрес"
            value={formData.ipAddress}
            onChange={(e) => handleInputChange("ipAddress", e.target.value)}
            required
            size="md"
          />

          <NumberInput
            label="Порт"
            placeholder="Введите порт"
            value={formData.port}
            onChange={(value) => handleInputChange("port", value || "")}
            required
            hideControls
            size="md"
            min={1}
            max={65535}
          />

          {error && (
            <Text c="red" size="sm" role="alert">
              {error}
            </Text>
          )}
          <Group className={classes.buttonGroup}>
            <Button variant="outline" onClick={handleCancel} size="md">
              Отменить
            </Button>
            <Button
              disabled={!isFormValid}
              size="md"
              onClick={handleCreateServer}
            >
              Создать сервер
            </Button>
          </Group>
        </Stack>
      </form>
    </div>
  );
};

export default CreateServer;
