# Plataforma de Eventos API

Base arquitectonica inicial para una Plataforma de Eventos e Inscripciones.

## Tematica

API REST para gestionar eventos, sesiones de usuario e inscripciones en futuras entregas.

## Tecnologias

- Node.js
- Express
- MongoDB / Mongoose
- dotenv
- Modulos ESM con import/export

## Instalacion

```bash
npm install
```

## Configuracion de variables

Crear un archivo `.env` a partir de `.env.example`.

```env
PORT=8080
NODE_ENV=development
MONGO_URL=mongodb://127.0.0.1:27017/plataforma_eventos
JWT_SECRET=secret_de_desarrollo
```

## Como ejecutar

Modo desarrollo:

```bash
npm run dev
```

Modo produccion/local:

```bash
npm start
```

## Estructura de carpetas

```text
src/
├── app.js
├── server.js
├── config/
│   └── env.config.js
├── routes/
│   ├── events.router.js
│   ├── health.router.js
│   └── sessions.router.js
├── controllers/
│   ├── events.controller.js
│   ├── health.controller.js
│   └── sessions.controller.js
├── services/
├── repositories/
├── dao/
├── models/
│   ├── Event.js
│   └── User.js
├── middlewares/
└── utils/
```

## Rutas disponibles

### Health

`GET /api/health`

Respuesta:

```json
{
  "status": "ok",
  "message": "Servidor activo"
}
```

### Events

`GET /api/events`

Respuesta:

```json
{
  "status": "success",
  "payload": []
}
```

### Sessions

`GET /api/sessions`

Respuesta inicial:

```json
{
  "status": "success",
  "payload": []
}
```
