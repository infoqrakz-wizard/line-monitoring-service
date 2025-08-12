let ymapPromise: Promise<any> | null = null;

export const loadYMap = (): Promise<any> => {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if ((window as any).ymaps) return Promise.resolve((window as any).ymaps);
  if (ymapPromise) return ymapPromise;

  ymapPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const apiKey = import.meta.env.VITE_YMAPS_API_KEY ?? '';
    const lang = 'ru_RU';
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=${lang}`;
    script.async = true;
    script.onload = () => resolve((window as any).ymaps);
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });

  return ymapPromise;
};
