import crypto from 'crypto';

export let servers = {
    "servers": [
        {
            "id": 22,
            "url": "lc48.loc.devline.tv",
            "port": 3916,
            "username": "admin",
            "password": "Cc5OedXH",
            "name": "Фёдора Лузана, 23",
            "enabled": false,
            "maps": {
                "x": 45.069053,
                "y": 38.981431
            },
            "date_update": "2025-06-10T04:52:45.000Z"
        },
        {
            "id": 24,
            "url": "lc48.loc.devline.tv",
            "port": 2776,
            "username": "admin",
            "password": "HLkcCe0C",
            "name": "Северная улица, 275/5",
            "enabled": true,
            "maps": {
                "x": 45.041152,
                "y": 38.972959
            },
            "date_update": "2025-06-10T04:51:25.000Z"
        },
        {
            "id": 25,
            "url": "lc30.loc.devline.tv",
            "port": 2736,
            "username": "admin",
            "password": "RBHwW1yW",
            "name": "улиц",
            "enabled": true,
            "maps": {
                "x": 45.039687,
                "y": 38.956978
            },
            "date_update": "2025-08-10T18:57:13.667Z"
        },
        {
            "id": 27,
            "url": "lc48.loc.devline.tv",
            "port": 3076,
            "username": "admin",
            "password": "RgOLIBjt",
            "name": "Скорняжная улица, 62",
            "enabled": true,
            "maps": {
                "x": 45.039547,
                "y": 38.942767
            },
            "date_update": "2025-06-10T04:50:27.000Z"
        },
        {
            "id": 28,
            "url": "wjt5od5a.devline.tv",
            "port": 443,
            "username": "yarushkin",
            "password": "yarushkin",
            "name": "Головатого 302",
            "enabled": true,
            "maps": {
                "x": 45.038235,
                "y": 38.976634
            },
            "date_update": "2025-06-16T07:07:06.000Z"
        },
        {
            "id": 29,
            "url": "8.devline.ru",
            "port": 443,
            "username": "admin",
            "password": null,
            "name": "Демо-Сервер",
            "enabled": true,
            "maps": null,
            "date_update": "2025-06-18T11:55:33.000Z"
        }
    ],
    "nextCursor": null,
    "total": 6,
    "totalPages": 1,
    "limit": 50
};

export let problems = [
  { id: 'p1', title: 'Disk almost full', severity: 'high', status: 'current', createdAt: new Date().toISOString() },
  { id: 'p2', title: 'CPU throttling', severity: 'medium', status: 'delayed', createdAt: new Date().toISOString() },
];

export function addServer(body: any) {
  const item = { id: crypto.randomUUID(), ...body };
  servers.push(item);
  return item;
}

export function updateServer(id: string, patch: any) {
  const idx = servers.findIndex(s => s.id === id);
  if (idx === -1) return null;
  servers[idx] = { ...servers[idx], ...patch };
  return servers[idx];
}

export function removeServer(id: string) {
  servers = servers.filter(s => s.id !== id);
}
