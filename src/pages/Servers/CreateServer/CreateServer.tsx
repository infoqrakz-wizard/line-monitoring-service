import React, { useEffect, useMemo, useState } from "react";
import {
  TextInput,
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
import { getServer as apiGetServer, CreateServerRequest } from "@/api/servers";
import type { ServerItem } from "@/types";
import PageHeader from "@/components/PageHeader";

export type CreateServerFormData = {
  serverName: string;
  login: string;
  password: string;
  ipAddress: string;
  port: number | "";
  coordinates?: string;
  address?: string;
};

export type FormErrors = {
  serverName?: string;
  login?: string;
  password?: string;
  ipAddress?: string;
  port?: string;
  coordinates?: string;
  address?: string;
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
    coordinates: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string | null>(null);

  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  const validateServerName = (value: string): string | undefined => {
    if (!value.trim()) {
      return "Имя сервера обязательно для заполнения";
    }

    return undefined;
  };

  const validateIpAddress = (value: string): string | undefined => {
    if (!value.trim()) {
      return "IP-адрес обязателен для заполнения";
    }
    if (value.includes(":")) {
      return "Адрес не может содержать символ ':'";
    }
    return undefined;
  };

  const validatePort = (value: number | ""): string | undefined => {
    if (value === "") {
      return "Порт обязателен для заполнения";
    }
    if (value < 1 || value > 65535) {
      return "Порт должен быть в диапазоне от 1 до 65535";
    }
    return undefined;
  };

  const validateLogin = (value: string): string | undefined => {
    if (!value.trim()) {
      return "Логин обязателен для заполнения";
    }
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!isEditMode && !value.trim()) {
      return "Пароль обязателен для заполнения";
    }
    return undefined;
  };

  const validateCoordinates = (value?: string): string | undefined => {
    if (!value) {
      return;
    }

    const coordinates = value.split(",").map((coord) => coord.trim());

    if (coordinates.length !== 2) {
      return "Координаты должны быть в формате: число, число";
    }

    const [x, y] = coordinates;
    const xNum = parseFloat(x);
    const yNum = parseFloat(y);

    if (isNaN(xNum) || isNaN(yNum)) {
      return "Координаты должны быть числами";
    }

    if (xNum === 0 && yNum === 0) {
      return "Координаты не могут быть равны нулю";
    }
  };

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
        coordinates: fromStore.maps
          ? `${fromStore.maps.x}, ${fromStore.maps.y}`
          : "",
      });
      return;
    }
    setIsLoadingDetails(true);
    apiGetServer(urlParam, portNum)
      .then((server) => {
        if (!server) {
          setError("Сервер не найден");
          return;
        }

        setOriginalServer(server);
        setFormData({
          serverName: server.name,
          login: server.username,
          password: "",
          ipAddress: server.url,
          port: server.port,
          coordinates: server.maps ? `${server.maps.x}, ${server.maps.y}` : "",
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

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {};

    newErrors.serverName = validateServerName(formData.serverName);
    newErrors.ipAddress = validateIpAddress(formData.ipAddress);
    newErrors.port = validatePort(formData.port);
    newErrors.login = validateLogin(formData.login);
    newErrors.password = validatePassword(formData.password);
    newErrors.coordinates = validateCoordinates(formData.coordinates || "");

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error !== undefined)) {
      return;
    }

    if (isEditMode) {
      void handleUpdateServer();
    } else {
      void handleCreateServer();
    }
  };

  const handleCancel = () => {
    void navigate(-1);
  };

  const handleBack = () => {
    void navigate(-1);
  };

  const handleCreateServer = async () => {
    try {
      const coordinates = (formData.coordinates || "")
        .split(",")
        .map((coord) => parseFloat(coord.trim()));

      const payload: CreateServerRequest = {
        name: formData.serverName,
        url: formData.ipAddress,
        port: Number(formData.port),
        username: formData.login,
        password: formData.password,
        enabled: true,
        address: formData.address,
      };

      if (coordinates.length === 2) {
        payload.maps = {
          x: coordinates[0],
          y: coordinates[1],
        };
      }

      await createServer(payload);
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

      const coordinates = (formData.coordinates || "")
        .split(",")
        .map((coord) => parseFloat(coord.trim()));
      const newMaps = {
        x: coordinates[0],
        y: coordinates[1],
      };

      if (
        newMaps.x !== originalServer.maps?.x ||
        newMaps.y !== originalServer.maps?.y
      ) {
        patch.maps = newMaps;
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
          !formData.ipAddress.includes(":") &&
          formData.port !== "" &&
          validateCoordinates(formData.coordinates) === undefined,
      )
    : Boolean(
        formData.serverName.trim() &&
          formData.login.trim() &&
          formData.password.trim() &&
          formData.ipAddress.trim() &&
          !formData.ipAddress.includes(":") &&
          formData.port !== "" &&
          validateCoordinates(formData.coordinates) === undefined,
      );

  return (
    <div>
      {isEditMode && (
        <LoadingOverlay visible={isLoadingDetails} zIndex={1000} />
      )}
      <PageHeader title="Сервер" />

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
        <Stack gap="20">
          <div className={classes.formField}>
            <label htmlFor="serverName" className={classes.formFieldLabel}>
              Имя сервера
            </label>
            <div className={classes.formFieldInput}>
              <TextInput
                classNames={{
                  input: errors.serverName ? classes.inputError : "",
                }}
                required
                size="md"
                value={formData.serverName}
                autoComplete="off"
                name="server-name"
                onChange={(e) =>
                  handleInputChange("serverName", e.target.value)
                }
              />
              <div className={classes.errorMessage}>
                {errors.serverName || ""}
              </div>
            </div>
          </div>

          <div className={classes.formField}>
            <label htmlFor="ipAddress" className={classes.formFieldLabel}>
              URL или IP-адрес
            </label>
            <div className={classes.formFieldInput}>
              <TextInput
                value={formData.ipAddress}
                onChange={(e) => handleInputChange("ipAddress", e.target.value)}
                required
                size="md"
                autoComplete="off"
                name="server-ip"
                classNames={{
                  input: errors.ipAddress ? classes.inputError : "",
                }}
              />
              <div className={classes.errorMessage}>
                {errors.ipAddress || ""}
              </div>
            </div>
          </div>

          <div className={classes.formField}>
            <label htmlFor="port" className={classes.formFieldLabel}>
              Порт
            </label>
            <div className={classes.formFieldInput}>
              <NumberInput
                value={formData.port}
                onChange={(value) => handleInputChange("port", value || "")}
                required
                hideControls
                size="md"
                min={1}
                max={65535}
                name="server-port"
                classNames={{
                  input: errors.port ? classes.inputError : "",
                }}
                autoComplete="off"
              />
              <div className={classes.errorMessage}>{errors.port || ""}</div>
            </div>
          </div>

          <div className={classes.formField}>
            <label htmlFor="login" className={classes.formFieldLabel}>
              Логин
            </label>
            <div className={classes.formFieldInput}>
              <TextInput
                value={formData.login}
                onChange={(e) => handleInputChange("login", e.target.value)}
                required
                size="md"
                autoComplete="off"
                name="server-login"
                classNames={{
                  input: errors.login ? classes.inputError : "",
                }}
              />
              <div className={classes.errorMessage}>{errors.login || ""}</div>
            </div>
          </div>

          <div className={classes.formField}>
            <label htmlFor="password" className={classes.formFieldLabel}>
              Пароль
            </label>
            <div className={classes.formFieldInput}>
              <TextInput
                placeholder={
                  isEditMode ? "Оставьте пустым, чтобы не менять" : ""
                }
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required={!isEditMode}
                size="md"
                autoComplete="off"
                name="server-password"
                classNames={{
                  input: errors.password ? classes.inputError : "",
                }}
              />
              <div className={classes.errorMessage}>
                {errors.password || ""}
              </div>
            </div>
          </div>

          <div className={classes.formField}>
            <label htmlFor="coordinates" className={classes.formFieldLabel}>
              Координаты (x, y)
            </label>
            <div className={classes.formFieldInput}>
              <TextInput
                placeholder="Например: 45.036091, 38.974966"
                value={formData.coordinates}
                onChange={(e) =>
                  handleInputChange("coordinates", e.target.value)
                }
                size="md"
                autoComplete="off"
                name="server-coordinates"
                classNames={{
                  input: errors.coordinates ? classes.inputError : "",
                }}
              />
              <div className={classes.errorMessage}>
                {errors.coordinates || ""}
              </div>
            </div>
          </div>
          <div className={classes.formField}>
            <label htmlFor="address" className={classes.formFieldLabel}>
              Адрес
            </label>
            <div className={classes.formFieldInput}>
              <TextInput
                placeholder=""
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                size="md"
                autoComplete="off"
                name="server-address"
                classNames={{
                  input: errors.coordinates ? classes.inputError : "",
                }}
              />
              <div className={classes.errorMessage}>
                {errors.coordinates || ""}
              </div>
            </div>
          </div>
          <div className={classes.formField}>
            {error && (
              <Text c="rgb(250, 82, 82)" size="sm" role="alert">
                {error}
              </Text>
            )}
            <Group className={classes.buttonGroup}>
              <div className={classes.buttons}>
                <Button
                  variant="black"
                  disabled={!isFormValid}
                  size="md"
                  onClick={isEditMode ? handleUpdateServer : handleCreateServer}
                >
                  {isEditMode ? "Сохранить изменения" : "Создать сервер"}
                </Button>

                <Button
                  variant="transparent"
                  onClick={handleCancel}
                  size="md"
                  color="#E22A33"
                >
                  Отменить
                </Button>
              </div>
            </Group>
          </div>
        </Stack>
      </form>
    </div>
  );
};

export default CreateServer;
