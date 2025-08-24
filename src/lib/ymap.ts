let ymapPromise: Promise<any> | null = null;

export const loadYMap = (): Promise<any> => {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }
  if ((window as any).ymaps) {
    return Promise.resolve((window as any).ymaps);
  }
  if (ymapPromise) {
    return ymapPromise;
  }

  ymapPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const apiKey = import.meta.env.VITE_YMAPS_API_KEY ?? "";
    const lang = "ru_RU";

    console.log(
      "YandexMap: Loading with API key:",
      apiKey ? `${apiKey.substring(0, 8)}...` : "NOT SET",
    );
    console.log(
      "YandexMap: Script URL:",
      `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=${lang}`,
    );

    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=${lang}`;
    script.async = true;
    script.onload = () => {
      console.log("YandexMap: Script loaded successfully");
      resolve((window as any).ymaps);
    };
    script.onerror = (err) => {
      console.error("YandexMap: Script loading failed:", err);
      reject(err);
    };
    document.head.appendChild(script);
  });

  return ymapPromise;
};
