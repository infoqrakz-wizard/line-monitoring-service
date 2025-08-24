export interface CameraConfig {
  name: string;
  enabled: boolean;
  audio_streams: {
    audio: {
      enabled: boolean;
    };
  };
  video_streams: {
    video: {
      url: string;
      record_mode: "permanent" | "alarm" | "none";
    };
    video2: {
      url: string;
      enabled: boolean;
      record_mode: "permanent" | "alarm" | "none";
    };
  };
}

export interface GetCameraConfigRequest {
  method: "get_camera_config";
  params: {
    camera: string;
  };
  version: number;
}

export interface GetCameraConfigResponse {
  config: CameraConfig;
}

export interface SetCameraConfigRequest {
  method: "set_camera_config";
  params: {
    camera: string;
    config: Partial<CameraConfig>;
  };
  version: number;
}

export interface SetCameraConfigResponse {
  success: boolean;
}

export const cameraApi = {
  getConfig: async (
    serverUrl: string,
    serverPort: number,
    username: string,
    password: string,
    camera: string,
  ): Promise<CameraConfig> => {
    const url = `https://${serverUrl}:${serverPort}/rpc`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      },
      body: JSON.stringify({
        method: "get_camera_config",
        params: { camera },
        version: 83,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get camera config: ${response.statusText}`);
    }

    const data = await response.json();
    return data.config;
  },

  setConfig: async (
    serverUrl: string,
    serverPort: number,
    username: string,
    password: string,
    camera: string,
    config: Partial<CameraConfig>,
  ): Promise<SetCameraConfigResponse> => {
    const url = `https://${username}:${password}@${serverUrl}:${serverPort}/rpc`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method: "set_camera_config",
        params: {
          camera,
          config,
        },
        version: 81,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to set camera config: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  },
};
