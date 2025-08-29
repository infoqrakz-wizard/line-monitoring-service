# Переменные окружения (Environment Variables)

Этот документ описывает все переменные окружения, используемые в проекте Line Monitoring Service, и что необходимо указать в файле `.env`.

## Обзор

Проект использует Vite для сборки и поддерживает два режима работы:
- **development** - режим разработки (по умолчанию)
- **production** - продакшн режим

## Основные переменные окружения

### VITE_APP_ENV
**Описание**: Определяет режим работы приложения
**Тип**: string
**Значения**:
- `development` - режим разработки
- `production` - продакшн режим

**Пример**:
```bash
VITE_APP_ENV=development
```

**Примечание**: Если переменная не указана, по умолчанию используется режим `development`

### VITE_API_URL
**Описание**: URL для API сервера
**Тип**: string
**Значения по умолчанию**:
- Для `production` режима: `https://your-production-api.com/`
- Для `development` режима: `http://localhost:4000/`

**Пример**:
```bash
VITE_API_URL=http://localhost:4000
```

### VITE_WS_URL
**Описание**: URL для WebSocket соединения
**Тип**: string
**Значения по умолчанию**:
- Для `production` режима: `wss://your-production-ws.com/`
- Для `development` режима: `ws://localhost:4000`

**Пример**:
```bash
VITE_WS_URL=ws://localhost:4000
```

## Файл .env

Создайте файл `.env` в корневой директории проекта со следующим содержимым:

### Для разработки (development)
```bash
# Режим приложения
VITE_APP_ENV=development

# API URL
VITE_API_URL=http://localhost:4000

# WebSocket URL
VITE_WS_URL=ws://localhost:4000
```



### Для production
```bash
# Режим приложения
VITE_APP_ENV=production

# API URL
VITE_API_URL=https://your-production-api.com

# WebSocket URL
VITE_WS_URL=wss://your-production-ws.com
```
