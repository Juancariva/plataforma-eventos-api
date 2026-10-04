# Plataforma de Eventos API

API para una Plataforma de Eventos e Inscripciones.

## Tematica

API REST para gestionar eventos, sesiones de usuario, tickets e inscripciones con control de cupos.

## Tecnologias

- Node.js
- Express
- MongoDB / Mongoose
- dotenv
- bcrypt
- jsonwebtoken
- cookie-parser
- Passport.js
- Nodemailer
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
MAIL_HOST=
MAIL_PORT=587
MAIL_USER=
MAIL_PASS=
MAIL_FROM=
```

Para recibir confirmaciones, completar las variables `MAIL_*` en el `.env` local con los datos del proveedor SMTP. Nunca subir ese archivo ni sus credenciales.

| Variable    | Uso                                                      |
| ----------- | -------------------------------------------------------- |
| `MAIL_HOST` | Servidor SMTP                                            |
| `MAIL_PORT` | Puerto SMTP, normalmente 587 o 465                       |
| `MAIL_USER` | Usuario del servidor SMTP                                |
| `MAIL_PASS` | Contrasena SMTP o contrasena de aplicacion del proveedor |
| `MAIL_FROM` | Direccion remitente autorizada por el proveedor          |

Si usas GMAIL quedaría:
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=tu_cuenta@gmail.com
MAIL_PASS=CONTRASENA_DE_APLICACION
MAIL_FROM=tu_cuenta@gmail.com

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
│   ├── mailer.config.js
│   └── passport.config.js
├── routes/
│   ├── events.router.js
│   ├── health.router.js
│   ├── sessions.router.js
│   ├── tickets.router.js
│   └── users.router.js
├── controllers/
│   ├── events.controller.js
│   ├── health.controller.js
│   ├── sessions.controller.js
│   ├── tickets.controller.js
│   └── users.controller.js
├── services/
│   ├── events.service.js
│   ├── mail.service.js
│   ├── tickets.service.js
│   └── users.service.js
├── repositories/
│   ├── events.repository.js
│   ├── tickets.repository.js
│   └── users.repository.js
├── dao/
│   ├── events.dao.js
│   ├── tickets.dao.js
│   └── users.dao.js
├── models/
│   ├── Event.js
│   ├── Ticket.js
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

| Estrategia | Uso                           | Responsabilidad                                                                         |
| ---------- | ----------------------------- | --------------------------------------------------------------------------------------- |
| `register` | `POST /api/sessions/register` | Valida campos, normaliza email, rechaza duplicados, hashea password y crea el usuario   |
| `login`    | `POST /api/sessions/login`    | Valida credenciales con bcrypt y deja el usuario autenticado en `req.user`              |
| `current`  | `GET /api/sessions/current`   | Lee la cookie `currentUser`, verifica el JWT y deja `{ id, email, role }` en `req.user` |

`app.js` solo inicializa Passport con `passport.initialize()`. Las estrategias quedan aisladas para poder agregar providers externos como Google o GitHub sin modificar `app.js`.

## Reglas de negocio de eventos

- `organizer` se asigna automaticamente desde `req.user`; no se acepta desde el body.
- No se permite crear eventos con fecha pasada.
- `capacity` debe ser mayor a 0.
- `price` no puede ser negativo.
- No se modifican eventos cancelados.
- Cancelar un evento significa cambiar `status` a `cancelled`; no se elimina fisicamente.
- Las validaciones viven en la capa `services`.

## Roles y permisos

Roles disponibles:

- `user`
- `organizer`
- `admin`

El registro publico siempre crea usuarios con rol `user`. No se puede crear `organizer` ni `admin` desde el body de `POST /api/sessions/register`.

| Accion                                  | user | organizer | admin |
| --------------------------------------- | ---- | --------- | ----- |
| Consultar eventos publicados            | Si   | Si        | Si    |
| Crear eventos                           | No   | Si        | Si    |
| Modificar/cancelar eventos propios      | No   | Si        | Si    |
| Modificar cualquier evento              | No   | No        | Si    |
| Ver todos los usuarios                  | No   | No        | Si    |
| Inscribirse y consultar tickets propios | Si   | Si        | Si    |
| Ver tickets de eventos propios          | No   | Si        | Si    |
| Ver tickets de cualquier evento         | No   | No        | Si    |
| Cancelar ticket propio                  | Si   | Si        | Si    |
| Cancelar ticket ajeno                   | No   | No        | Si    |

Autenticacion y autorizacion:

- `401 No autenticado`: no hay cookie `currentUser` valida.
- `403 No tenés permisos para realizar esta acción`: hay sesion valida, pero el rol no alcanza para la ruta.

## Rutas disponibles

| Metodo | Ruta                       | Descripcion                                                   |
| ------ | -------------------------- | ------------------------------------------------------------- |
| GET    | `/api/health`              | Verifica que el servidor este activo                          |
| GET    | `/api/events`              | Lista eventos con filtros, paginacion y ordenamiento          |
| GET    | `/api/events/:id`          | Consulta un evento por ID                                     |
| POST   | `/api/events`              | Crea evento, solo `organizer` o `admin`                       |
| PUT    | `/api/events/:id`          | Modifica evento, `organizer` solo propio y `admin` cualquiera |
| PATCH  | `/api/events/:id/status`   | Cambia estado del evento, sin eliminarlo fisicamente          |
| GET    | `/api/sessions`            | Ruta base inicial de sessions                                 |
| POST   | `/api/sessions/register`   | Registra un usuario nuevo                                     |
| POST   | `/api/sessions/login`      | Inicia sesion y guarda el JWT en cookie HTTP Only             |
| GET    | `/api/sessions/current`    | Devuelve el usuario autenticado desde la cookie               |
| POST   | `/api/sessions/logout`     | Cierra sesion eliminando la cookie                            |
| GET    | `/api/users`               | Ruta administrativa, solo `admin`                             |
| POST   | `/api/events/:eid/tickets` | Inscripcion, cualquier usuario autenticado                    |
| GET    | `/api/tickets/my-tickets`  | Tickets del usuario autenticado con datos del evento          |
| GET    | `/api/events/:eid/tickets` | Tickets del evento, organizador propietario o `admin`         |
| PATCH  | `/api/tickets/:tid/cancel` | Cancela ticket propio o cualquier ticket como `admin`         |

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

Filtros disponibles:

- `status`
- `category`
- `location`
- `dateFrom`
- `dateTo`
- `page`
- `limit`
- `sort`, por ejemplo `date`, `-date`, `price`, `-price`

Ejemplo:

```text
GET /api/events?status=published&category=workshop&page=2&limit=5&sort=date
```

Response 200:

```json
{
  "status": "success",
  "payload": {
    "data": [],
    "page": 2,
    "limit": 5,
    "total": 0,
    "totalPages": 0
  }
}
```

### GET /api/events/:id

Ruta publica.

Response 200:

```json
{
  "status": "success",
  "payload": {
    "id": "6690...",
    "title": "Congreso Tech 2026",
    "description": "Evento sobre tecnologia y desarrollo",
    "category": "workshop",
    "date": "2026-11-15T00:00:00.000Z",
    "location": "Buenos Aires",
    "capacity": 200,
    "price": 15000,
    "status": "draft",
    "organizer": "665f2a..."
  }
}
```

Response 404:

```json
{
  "status": "error",
  "message": "Evento no encontrado"
}
```

### POST /api/events

Requiere cookie `currentUser` y rol `organizer` o `admin`.

Request:

```json
{
  "title": "Congreso Tech 2026",
  "description": "Evento sobre tecnologia y desarrollo",
  "category": "workshop",
  "date": "2026-11-15",
  "location": "Buenos Aires",
  "capacity": 200,
  "price": 15000
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
    "category": "workshop",
    "date": "2026-11-15T00:00:00.000Z",
    "location": "Buenos Aires",
    "capacity": 200,
    "price": 15000,
    "status": "draft",
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

### PUT /api/events/:id

Requiere cookie `currentUser` y rol `organizer` o `admin`. Un `organizer` solo puede modificar eventos donde sea el organizador. Un `admin` puede modificar cualquier evento.

Request:

```json
{
  "title": "Congreso Tech 2026 actualizado"
}
```

No se puede modificar un evento con `status: "cancelled"`.

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

### PATCH /api/events/:id/status

Requiere cookie `currentUser` y rol `organizer` o `admin`. Cambia el estado sin eliminar el evento.

Request:

```json
{
  "status": "cancelled"
}
```

Response 200:

```json
{
  "status": "success",
  "payload": {
    "id": "6690...",
    "status": "cancelled",
    "organizer": "665f2a..."
  }
}
```

Reglas:

- Estados validos: `draft`, `published`, `cancelled`, `finished`.
- No se puede cambiar el estado de un evento ya cancelado.
- No se puede publicar un evento finalizado.

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

## Tickets e inscripciones

El flujo respeta `ruta -> controller -> service -> repository -> DAO -> Ticket`.

El modelo guarda referencias ObjectId a `User` y `Event`, ademas de `status`, `quantity`, `reservationCode`, `createdAt` y `cancelledAt`. No guarda objetos de usuarios o eventos embebidos.

Estados:

- `confirmed`: inscripcion confirmada; ocupa cupo.
- `pending`: inscripcion pendiente; ocupa cupo.
- `cancelled`: inscripcion cancelada; no ocupa cupo.

El registro de esta entrega crea tickets `confirmed`. El cliente no puede elegir el usuario, el estado ni el codigo de reserva desde el body.

Reglas de inscripcion:

- El usuario sale de `req.user` y el evento del parametro `eid` de la URL.
- El evento debe existir, estar `published` y tener fecha futura.
- `quantity` es obligatorio y debe ser un numero entero mayor a 0; no se aceptan strings como `"2"`.
- Cada usuario puede tener un solo ticket activo (`confirmed` o `pending`) por evento. Puede volver a inscribirse despues de cancelar.
- Los lugares ocupados se calculan sumando `quantity` de los tickets activos. No se cuenta la cantidad de documentos ni los tickets cancelados.
- Cupos disponibles = `event.capacity` menos lugares ocupados.
- Un indice unico parcial refuerza la regla de una inscripcion activa por usuario y evento.
- Las altas se procesan en orden por evento para evitar que dos peticiones reserven el mismo cupo. Esta version se ejecuta en una unica instancia de Node.js.

### POST /api/events/:eid/tickets

Requiere cookie `currentUser`. Se aceptan todos los roles autenticados.

Body JSON:

```json
{
  "quantity": 2
}
```

Response 201:

```json
{
  "status": "success",
  "payload": {
    "id": "ID_DEL_TICKET",
    "user": "ID_DEL_USUARIO",
    "event": "ID_DEL_EVENTO",
    "status": "confirmed",
    "quantity": 2,
    "reservationCode": "CODIGO_GENERADO_POR_EL_SERVIDOR",
    "createdAt": "2026-10-03T12:00:00.000Z",
    "cancelledAt": null
  }
}
```

Luego de guardar el ticket, Nodemailer envia al email del usuario un correo con el evento, su fecha y ubicacion, la cantidad de lugares y el codigo de reserva. Si el correo falla, el ticket sigue confirmado y la API devuelve `201`: la notificacion es posterior a la inscripcion. El servidor registra un aviso sin mostrar credenciales.

Errores: `401` sin sesion, `404` si el evento no existe, `400` por cantidad invalida, estado/fecha no disponibles o falta de cupos, y `409` por inscripcion activa duplicada.

### GET /api/tickets/my-tickets

Requiere cookie `currentUser`. Devuelve un array en `payload` con todos los tickets propios, incluidos los cancelados.

El campo `event` se obtiene con `populate` y contiene solamente `id`, `title`, `date` y `location`:

```json
{
  "id": "ID_DEL_EVENTO",
  "title": "Workshop de Node.js",
  "date": "2027-06-15T18:00:00.000Z",
  "location": "Buenos Aires"
}
```

No se incluyen contrasenas ni datos personales de otros usuarios.

### GET /api/events/:eid/tickets

Requiere cookie `currentUser` y rol `organizer` o `admin`. Un `organizer` solo puede consultar tickets de sus propios eventos; un `admin` puede consultar cualquiera.

Response `200`: array de tickets del evento en `payload`. Un usuario comun o un organizador de otro evento recibe `403`.

### PATCH /api/tickets/:tid/cancel

Requiere cookie `currentUser`. No necesita body.

El propietario del ticket o un `admin` puede cancelarlo. La respuesta `200` devuelve el ticket con `status: "cancelled"` y `cancelledAt` con la fecha de cancelacion.

No se elimina el documento. El cupo queda disponible porque el ticket deja de formar parte de la suma de reservas activas. Ticket inexistente: `404`; ticket ajeno: `403`; ticket ya cancelado: `400`.
