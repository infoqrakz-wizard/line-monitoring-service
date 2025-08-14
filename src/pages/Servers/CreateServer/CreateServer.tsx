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
import { getServer as apiGetServer } from "@/api/servers";
import type { ServerItem } from "@/types";
import PageHeader from "@/components/PageHeader";

export type CreateServerFormData = {
  serverName: string;
  login: string;
  password: string;
  ipAddress: string;
  port: number | "";
  maps?: {
    x: number;
    y: number;
  };
};

export type FormErrors = {
  serverName?: string;
  login?: string;
  password?: string;
  ipAddress?: string;
  port?: string;
  mapsX?: string;
  mapsY?: string;
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
    maps: {
      x: 0,
      y: 0,
    },
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string | null>(null);
  // simple loading flag to guard fetch; currently unused in UI
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  // Validation functions
  const validateServerName = (value: string): string | undefined => {
    if (!value.trim()) {
      return "Имя сервера обязательно для заполнения";
    }
    if (value.includes(":")) {
      return "Имя сервера не может содержать символ ':'";
    }
    return undefined;
  };

  const validateIpAddress = (value: string): string | undefined => {
    if (!value.trim()) {
      return "IP-адрес обязателен для заполнения";
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

  const validateMapsCoordinate = (
    value: number | "",
    field: "x" | "y",
  ): string | undefined => {
    if (value === 0 || value === "") {
      return `Координата ${field.toUpperCase()} обязательна для заполнения`;
    }
    return undefined;
  };

  // Handle field blur validation
  const handleFieldBlur = (
    field: keyof CreateServerFormData,
    value: string | number,
  ) => {
    let fieldError: string | undefined;

    switch (field) {
      case "serverName":
        fieldError = validateServerName(value as string);
        break;
      case "ipAddress":
        fieldError = validateIpAddress(value as string);
        break;
      case "port":
        fieldError = validatePort(value as number | "");
        break;
      case "login":
        fieldError = validateLogin(value as string);
        break;
      case "password":
        fieldError = validatePassword(value as string);
        break;
    }

    setErrors((prev) => ({
      ...prev,
      [field]: fieldError,
    }));
  };

  // Handle maps coordinate blur validation
  const handleMapsBlur = (field: "x" | "y", value: number | "") => {
    const fieldError = validateMapsCoordinate(value, field);
    setErrors((prev) => ({
      ...prev,
      [`maps${field.toUpperCase()}`]: fieldError,
    }));
  };

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
        maps: fromStore.maps,
      });
      return;
    }
    setIsLoadingDetails(true);
    apiGetServer(urlParam, portNum)
      .then((data) => {
        const server = data.servers[0];
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
          maps: server.maps,
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

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields before submit
    const newErrors: FormErrors = {};

    newErrors.serverName = validateServerName(formData.serverName);
    newErrors.ipAddress = validateIpAddress(formData.ipAddress);
    newErrors.port = validatePort(formData.port);
    newErrors.login = validateLogin(formData.login);
    newErrors.password = validatePassword(formData.password);
    newErrors.mapsX = validateMapsCoordinate(formData.maps?.x || 0, "x");
    newErrors.mapsY = validateMapsCoordinate(formData.maps?.y || 0, "y");

    setErrors(newErrors);

    // Check if there are any errors
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
        maps: formData.maps,
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

  const handleMapsChange = (field: "x" | "y", value: string | number) => {
    setFormData((prev) => {
      const updatedMaps = prev.maps
        ? { ...prev.maps }
        : {
            x: 0,
            y: 0,
          };
      return {
        ...prev,
        maps: {
          ...updatedMaps,
          [field]: value,
        },
      };
    });

    // Clear error when user starts typing
    const errorKey = `maps${field.toUpperCase()}` as keyof FormErrors;
    if (errors[errorKey]) {
      setErrors((prev) => ({
        ...prev,
        [errorKey]: undefined,
      }));
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
          !formData.serverName.includes(":") &&
          formData.login.trim() &&
          formData.ipAddress.trim() &&
          formData.port !== "" &&
          formData.maps?.x &&
          formData.maps?.y &&
          formData.maps?.x !== 0 &&
          formData.maps?.y !== 0,
      )
    : Boolean(
        formData.serverName.trim() &&
          !formData.serverName.includes(":") &&
          formData.login.trim() &&
          formData.password.trim() &&
          formData.ipAddress.trim() &&
          formData.port !== "" &&
          formData.maps?.x &&
          formData.maps?.y &&
          formData.maps?.x !== 0 &&
          formData.maps?.y !== 0,
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
                value={formData.serverName}
                onChange={(e) =>
                  handleInputChange("serverName", e.target.value)
                }
                onBlur={(e) => handleFieldBlur("serverName", e.target.value)}
                required
                size="md"
                classNames={{
                  input: errors.serverName ? classes.inputError : "",
                }}
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
                onBlur={(e) => handleFieldBlur("ipAddress", e.target.value)}
                required
                size="md"
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
                onBlur={() => handleFieldBlur("port", formData.port)}
                required
                hideControls
                size="md"
                min={1}
                max={65535}
                classNames={{
                  input: errors.port ? classes.inputError : "",
                }}
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
                onBlur={(e) => handleFieldBlur("login", e.target.value)}
                required
                size="md"
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
                onBlur={(e) => handleFieldBlur("password", e.target.value)}
                required={!isEditMode}
                size="md"
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
            <label htmlFor="mapsX" className={classes.formFieldLabel}>
              Координаты (x)
            </label>
            <div className={classes.formFieldInput}>
              <NumberInput
                value={formData.maps?.x}
                onChange={(value) => handleMapsChange("x", value || "")}
                onBlur={() => handleMapsBlur("x", formData.maps?.x || 0)}
                required
                hideControls
                size="md"
                min={1}
                classNames={{
                  input: errors.mapsX ? classes.inputError : "",
                }}
              />
              <div className={classes.errorMessage}>{errors.mapsX || ""}</div>
            </div>
          </div>

          <div className={classes.formField}>
            <label htmlFor="mapsY" className={classes.formFieldLabel}>
              Координаты (y)
            </label>
            <div className={classes.formFieldInput} id="mapsY">
              <NumberInput
                value={formData.maps?.y}
                onChange={(value) => handleMapsChange("y", value || "")}
                onBlur={() => handleMapsBlur("y", formData.maps?.y || 0)}
                required
                hideControls
                size="md"
                min={1}
                classNames={{
                  input: errors.mapsY ? classes.inputError : "",
                }}
              />
              <div className={classes.errorMessage}>{errors.mapsY || ""}</div>
            </div>
          </div>

          <div className={classes.formField}>
            {error && (
              <Text c="red" size="sm" role="alert">
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
