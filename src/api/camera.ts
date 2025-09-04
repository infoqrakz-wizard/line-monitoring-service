import { request } from "@/lib/request";
import { DeepPartial } from "@/types";

export interface CameraConfig {
  id: string;
  osd: {
    enabled: boolean;
  };
  url: string;
  flip: boolean;
  name: string;
  enabled: boolean;
  imaging: {
    contrast: number;
    brightness: number;
    saturation: number;
  };
  revision: number;
  source_num: number;
  client_data: Record<string, unknown>;
  audio_streams: {
    audio: {
      url: string;
      name: string;
      camera: string;
      enabled: boolean;
      record_mode: "permanent" | "alarm" | "none";
    };
  };
  video_streams: {
    video: {
      url: string;
      auto: boolean;
      codec: string;
      enabled: boolean;
      quality: number;
      framerate: number;
      transport: string;
      resolution: [number, number];
      record_mode: "permanent" | "alarm" | "none";
    };
    video2: {
      url: string;
      auto: boolean;
      codec: string;
      enabled: boolean;
      quality: number;
      framerate: number;
      transport: string;
      record_mode: "permanent" | "alarm" | "none";
    };
    video3: {
      enabled: boolean;
    };
  };
}

export interface GetCameraConfigRequest {
  method: "get_camera_config";
  url: string;
  port: number;
  login: string;
  pass: string;
  params: {
    camera: string;
  };
  version: number;
}

export interface GetCameraConfigResponse {
  result: {
    config: CameraConfig;
  };
}

export interface SetCameraConfigRequest {
  method: "set_camera_config";
  url: string;
  port: number;
  login: string;
  pass: string;
  params: {
    camera: string;
    config: Partial<CameraConfig>;
  };
  version: number;
}

export interface SetCameraConfigResponse {
  upstream: {
    status: number;
    data: {
      result: Record<string, unknown>;
    };
  };
  accept: {
    status: number;
    data: {
      result: Record<string, unknown>;
    };
  };
}

export const cameraApi = {
  getConfig: async (
    serverUrl: string,
    serverPort: number,
    username: string,
    password: string,
    camera: string,
  ): Promise<CameraConfig> => {
    const response = await request.post<GetCameraConfigResponse>(
      "/api/rpc-proxy",
      {
        method: "get_camera_config",
        url: serverUrl,
        port: serverPort,
        login: username,
        pass: password,
        params: { camera },
        version: 83,
      },
    );

    // Проверяем структуру ответа
    if (!response.result?.config) {
      throw new Error("Неверная структура ответа API: отсутствует config");
    }

    return response.result.config;
  },

  setConfig: async (
    serverUrl: string,
    serverPort: number,
    username: string,
    password: string,
    camera: string,
    config: DeepPartial<CameraConfig>,
  ): Promise<SetCameraConfigResponse> => {
    config.url = "";

    if (config.video_streams?.video?.auto) {
      config.video_streams.video.auto = false;
    }

    if (config.video_streams?.video2?.auto) {
      config.video_streams.video2.auto = false;
    }

    const response = await request.post<SetCameraConfigResponse>(
      "/api/rpc-proxy",
      {
        method: "set_camera_config",
        url: serverUrl,
        port: serverPort,
        login: username,
        pass: password,
        params: {
          camera,
          config,
        },
        version: 83,
      },
    );

    // Проверяем успешность операции
    if (response.upstream?.status !== 200 || response.accept?.status !== 200) {
      throw new Error(
        `Ошибка сохранения конфигурации: upstream=${response.upstream?.status}, accept=${response.accept?.status}`,
      );
    }

    return response;
  },
};
