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
- jsonwebtoken
- cookie-parser
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
JWT_EXPIRES_IN=1h
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
│   └── auth.middleware.js
└── utils/
    ├── hash.js
    └── jwt.js
```

## Rutas disponibles

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/api/health` | Verifica que el servidor este activo |
| GET | `/api/events` | Devuelve la lista inicial de eventos |
| GET | `/api/sessions` | Ruta base inicial de sessions |
| POST | `/api/sessions/register` | Registra un usuario nuevo |
| POST | `/api/sessions/login` | Inicia sesion y guarda el JWT en cookie HTTP Only |
| GET | `/api/sessions/current` | Devuelve el usuario autenticado desde la cookie |
| POST | `/api/sessions/logout` | Cierra sesion eliminando la cookie |

### GET /api/health

Response 200:

```json
{
  "status": "ok",
  "message": "Servidor activo"
}
```

### GET /api/events

Response 200:

```json
{
  "status": "success",
  "payload": []
}
```

### GET /api/sessions

Response 200:

```json
{
  "status": "success",
  "payload": []
}
```

### POST /api/sessions/register

Request:

```json
{
  "first_name": "Ana",
  "last_name": "Perez",
  "email": "Ana@Mail.com ",
  "password": "Secreta123"
}
```

Response 201:

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

Response 400:

```json
{
  "status": "error",
  "message": "Faltan campos obligatorios"
}
```

Response 409:

```json
{
  "status": "error",
  "message": "El email ya está registrado"
}
```

El endpoint valida campos obligatorios, formato de email, longitud minima de password, normaliza el email y rechaza emails ya registrados. La password se guarda hasheada con bcrypt y no se devuelve en la respuesta.

### POST /api/sessions/login

Request:

```json
{
  "email": "ana@mail.com",
  "password": "Secreta123"
}
```

Response 200:

```json
{
  "status": "success",
  "message": "Login correcto"
}
```

Ademas, la respuesta setea la cookie `currentUser` con `httpOnly: true`, `sameSite: "lax"`, `maxAge: 3600000` y `secure: true` solo en produccion.

Response 401:

```json
{
  "status": "error",
  "message": "Credenciales inválidas"
}
```

### GET /api/sessions/current

Requiere la cookie `currentUser` generada en el login.

Response 200:

```json
{
  "status": "success",
  "payload": {
    "id": "665f2a...",
    "email": "ana@mail.com",
    "role": "user"
  }
}
```

Response 401:

```json
{
  "status": "error",
  "message": "No autenticado"
}
```

### POST /api/sessions/logout

Response 200:

```json
{
  "status": "success",
  "message": "Sesión cerrada"
}
```

## Ejemplos para probar

```bash
curl -X POST http://localhost:8080/api/sessions/register \
  -H "Content-Type: application/json" \
  -d "{\"first_name\":\"Ana\",\"last_name\":\"Perez\",\"email\":\"Ana@Mail.com \",\"password\":\"Secreta123\"}"
```

```bash
curl -X POST http://localhost:8080/api/sessions/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"ana@mail.com\",\"password\":\"Secreta123\"}" \
  -c cookies.txt
```

```bash
curl http://localhost:8080/api/sessions/current -b cookies.txt
```

```bash
curl -X POST http://localhost:8080/api/sessions/logout -b cookies.txt
```

Casos recomendados antes de entregar:

- Registro exitoso, login, current, logout y current con 401.
- Login con email inexistente.
- Login con contraseña incorrecta.
- Current sin cookie.
- Current con token manipulado o expirado.
- Verificar en MongoDB que la password no esta en texto plano.
- Verificar que ninguna respuesta devuelve password.
