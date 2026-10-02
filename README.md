# Plataforma de Eventos API

Base arquitectonica inicial para una Plataforma de Eventos e Inscripciones.

## Tematica

API REST para gestionar eventos, sesiones de usuario e inscripciones en futuras entregas.

## Tecnologias

- Node.js
- Express
- MongoDB / Mongoose
- dotenv
- bcrypt
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
│   ├── database.config.js
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
│   └── sessions.service.js
├── repositories/
│   └── users.repository.js
├── dao/
│   └── users.dao.js
├── models/
│   ├── Event.js
│   └── User.js
├── middlewares/
└── utils/
    └── hash.js
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

`POST /api/sessions/register`

Campos esperados:

```json
{
  "first_name": "Ana",
  "last_name": "Perez",
  "email": "Ana@Mail.com ",
  "password": "Secreta123"
}
```

Respuesta exitosa:

```json
{
  "status": "success",
  "payload": {
    "id": "665f2a...",
    "first_name": "Ana",
    "last_name": "Perez",
    "email": "ana@mail.com",
    "role": "user"
  }
}
```

El endpoint valida campos obligatorios, formato de email, longitud minima de password, normaliza el email y rechaza emails ya registrados. La password se guarda hasheada con bcrypt y no se devuelve en la respuesta.

Ejemplo para probar:

```bash
curl -X POST http://localhost:8080/api/sessions/register \
  -H "Content-Type: application/json" \
  -d "{\"first_name\":\"Ana\",\"last_name\":\"Perez\",\"email\":\"Ana@Mail.com \",\"password\":\"Secreta123\"}"
```

Casos recomendados antes de entregar:

- Registro exitoso.
- Campos faltantes.
- Email con formato invalido.
- Email ya registrado.
- Verificar en MongoDB que la password no esta en texto plano.
- Verificar que la respuesta no devuelve password.
