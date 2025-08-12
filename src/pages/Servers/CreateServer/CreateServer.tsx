import React, { useEffect, useMemo, useState } from "react";
import {
  TextInput,
  PasswordInput,
  NumberInput,
  Button,
  Group,
  Stack,
  Title,
  Text,
  LoadingOverlay,
} from "@mantine/core";
import { useNavigate, useSearchParams } from "react-router";
import classes from "./CreateServer.module.css";
import { useServersStore } from "@/store/servers";
import { parseApiError } from "@/lib/request";
import { getServer as apiGetServer } from "@/api/servers";
import type { ServerItem } from "@/types";

export type CreateServerFormData = {
  serverName: string;
  login: string;
  password: string;
  ipAddress: string;
  port: number | "";
};

const CreateServer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createServer, updateServer, findByUrlPort } = useServersStore();
  const isEditMode = useMemo(
    () => Boolean(searchParams.get("url") && searchParams.get("port")),
    [searchParams],
  );
  const [originalServer, setOriginalServer] = useState<ServerItem | null>(null);
  const [formData, setFormData] = useState<CreateServerFormData>({
    serverName: "",
    login: "",
    password: "",
    ipAddress: "",
    port: "",
  });

  const [error, setError] = useState<string | null>(null);
  // simple loading flag to guard fetch; currently unused in UI
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  // Prefill on edit mode
  useEffect(() => {
    if (!isEditMode) {
      return;
    }
    const urlParam = searchParams.get("url") ?? undefined;
    const portParam = searchParams.get("port") ?? undefined;
    if (!urlParam || !portParam) {
      return;
    }
    const portNum = Number(portParam);
    const fromStore = findByUrlPort(urlParam, portNum);
    if (fromStore) {
      setOriginalServer(fromStore);
      setFormData({
        serverName: fromStore.name,
        login: fromStore.username,
        password: "",
        ipAddress: fromStore.url,
        port: fromStore.port,
      });
      return;
    }
    setIsLoadingDetails(true);
    apiGetServer(urlParam, portNum)
      .then((server) => {
        setOriginalServer(server);
        setFormData({
          serverName: server.name,
          login: server.username,
          password: "",
          ipAddress: server.url,
          port: server.port,
        });
      })
      .catch(() => {
        setError("Не удалось загрузить сервер");
      })
      .finally(() => setIsLoadingDetails(false));
  }, [isEditMode, searchParams, findByUrlPort]);

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
    if (isEditMode) {
      void handleUpdateServer();
    } else {
      void handleCreateServer();
    }
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

  const handleUpdateServer = async () => {
    if (!originalServer) {
      return;
    }
    try {
      const patch: Record<string, unknown> = {};
      if (formData.serverName !== originalServer.name) {
        patch.name = formData.serverName;
      }
      if (formData.login !== originalServer.username) {
        patch.username = formData.login;
      }
      if (formData.ipAddress !== originalServer.url) {
        patch.url = formData.ipAddress;
      }
      if (Number(formData.port) !== originalServer.port) {
        patch.port = Number(formData.port);
      }
      if (formData.password && formData.password.trim().length > 0) {
        patch.password = formData.password;
      }

      if (Object.keys(patch).length === 0) {
        void navigate("/servers");
        return;
      }

      await updateServer(originalServer.url, originalServer.port, patch);
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
        setError(apiError.message || "Не удалось сохранить изменения");
        return;
      }
      setError("Не удалось сохранить изменения");
    }
  };

  const isFormValid = isEditMode
    ? Boolean(
        formData.serverName.trim() &&
          formData.login.trim() &&
          formData.ipAddress.trim() &&
          formData.port !== "",
      )
    : Boolean(
        formData.serverName.trim() &&
          formData.login.trim() &&
          formData.password.trim() &&
          formData.ipAddress.trim() &&
          formData.port !== "",
      );

  return (
    <div className={classes.container} style={{ position: "relative" }}>
      {isEditMode && (
        <LoadingOverlay visible={isLoadingDetails} zIndex={1000} />
      )}
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
          {isEditMode ? "Редактировать сервер" : "Добавить новый сервер"}
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
            placeholder={
              isEditMode ? "Оставьте пустым, чтобы не менять" : "Введите пароль"
            }
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            required={!isEditMode}
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
              onClick={isEditMode ? handleUpdateServer : handleCreateServer}
            >
              {isEditMode ? "Сохранить изменения" : "Создать сервер"}
            </Button>
          </Group>
        </Stack>
      </form>
    </div>
  );
};

export default CreateServer;
