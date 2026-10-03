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
- Passport.js
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
│   ├── env.config.js
│   └── passport.config.js
├── routes/
│   ├── events.router.js
│   ├── health.router.js
│   ├── sessions.router.js
│   └── users.router.js
├── controllers/
│   ├── events.controller.js
│   ├── health.controller.js
│   ├── sessions.controller.js
│   └── users.controller.js
├── services/
│   ├── events.service.js
│   └── users.service.js
├── repositories/
│   ├── events.repository.js
│   └── users.repository.js
├── dao/
│   ├── events.dao.js
│   └── users.dao.js
├── models/
│   ├── Event.js
│   └── User.js
├── middlewares/
│   ├── auth.middleware.js
│   ├── authorize.middleware.js
│   └── error.middleware.js
└── utils/
    ├── hash.js
    └── jwt.js
```

## Estrategias Passport

Las estrategias estan centralizadas en `src/config/passport.config.js`.

| Estrategia | Uso | Responsabilidad |
| --- | --- | --- |
| `register` | `POST /api/sessions/register` | Valida campos, normaliza email, rechaza duplicados, hashea password y crea el usuario |
| `login` | `POST /api/sessions/login` | Valida credenciales con bcrypt y deja el usuario autenticado en `req.user` |
| `current` | `GET /api/sessions/current` | Lee la cookie `currentUser`, verifica el JWT y deja `{ id, email, role }` en `req.user` |

`app.js` solo inicializa Passport con `passport.initialize()`. Las estrategias quedan aisladas para poder agregar providers externos como Google o GitHub sin modificar `app.js`.

## Roles y permisos

Roles disponibles:

- `user`
- `organizer`
- `admin`

El registro publico siempre crea usuarios con rol `user`. No se puede crear `organizer` ni `admin` desde el body de `POST /api/sessions/register`.

| Accion | user | organizer | admin |
| --- | --- | --- | --- |
| Consultar eventos publicados | Si | Si | Si |
| Crear eventos | No | Si | Si |
| Modificar/cancelar eventos propios | No | Si | Si |
| Modificar cualquier evento | No | No | Si |
| Ver todos los usuarios | No | No | Si |

Autenticacion y autorizacion:

- `401 No autenticado`: no hay cookie `currentUser` valida.
- `403 No tenés permisos para realizar esta acción`: hay sesion valida, pero el rol no alcanza para la ruta.

## Rutas disponibles

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/api/health` | Verifica que el servidor este activo |
| GET | `/api/events` | Devuelve la lista inicial de eventos |
| POST | `/api/events` | Crea evento, solo `organizer` o `admin` |
| PUT | `/api/events/:eid` | Modifica evento, `organizer` solo propio y `admin` cualquiera |
| GET | `/api/sessions` | Ruta base inicial de sessions |
| POST | `/api/sessions/register` | Registra un usuario nuevo |
| POST | `/api/sessions/login` | Inicia sesion y guarda el JWT en cookie HTTP Only |
| GET | `/api/sessions/current` | Devuelve el usuario autenticado desde la cookie |
| POST | `/api/sessions/logout` | Cierra sesion eliminando la cookie |
| GET | `/api/users` | Ruta administrativa, solo `admin` |

### GET /api/health

Response 200:

```json
{
  "status": "ok",
  "message": "Servidor activo"
}
```

### GET /api/events

Esta ruta usa la capa `events.service -> events.repository -> events.dao -> Event`.

Response 200:

```json
{
  "status": "success",
  "payload": []
}
```

### POST /api/events

Requiere cookie `currentUser` y rol `organizer` o `admin`.

Request:

```json
{
  "title": "Congreso Tech 2026",
  "description": "Evento sobre tecnologia y desarrollo",
  "date": "2026-11-15",
  "location": "Buenos Aires",
  "capacity": 200
}
```

Response 201:

```json
{
  "status": "success",
  "payload": {
    "id": "6690...",
    "title": "Congreso Tech 2026",
    "description": "Evento sobre tecnologia y desarrollo",
    "date": "2026-11-15T00:00:00.000Z",
    "location": "Buenos Aires",
    "capacity": 200,
    "organizer": "665f2a..."
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

Response 403:

```json
{
  "status": "error",
  "message": "No tenés permisos para realizar esta acción"
}
```

### PUT /api/events/:eid

Requiere cookie `currentUser` y rol `organizer` o `admin`. Un `organizer` solo puede modificar eventos donde sea el organizador. Un `admin` puede modificar cualquier evento.

Request:

```json
{
  "title": "Congreso Tech 2026 actualizado"
}
```

Response 200:

```json
{
  "status": "success",
  "payload": {
    "id": "6690...",
    "title": "Congreso Tech 2026 actualizado",
    "organizer": "665f2a..."
  }
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

### GET /api/users

Ruta administrativa. Requiere cookie `currentUser` y rol `admin`.

Response 200:

```json
{
  "status": "success",
  "payload": [
    {
      "id": "665f2a...",
      "first_name": "Ana",
      "last_name": "Perez",
      "email": "ana@mail.com",
      "role": "user"
    }
  ]
}
```

Response 403:

```json
{
  "status": "error",
  "message": "No tenés permisos para realizar esta acción"
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
- POST `/api/events` con rol `user` devuelve 403.
- POST `/api/events` con rol `organizer` devuelve 201.
- GET `/api/users` con rol `organizer` devuelve 403.
- GET `/api/users` con rol `admin` devuelve 200.
- Ruta privada sin cookie devuelve 401.
- Organizer intentando modificar evento ajeno devuelve 403.
- Login con email inexistente.
- Login con contraseña incorrecta.
- Current sin cookie.
- Current con token manipulado o expirado.
- Verificar en MongoDB que la password no esta en texto plano.
- Verificar que ninguna respuesta devuelve password.
