import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { after, before, beforeEach, describe, it } from 'node:test';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy } from 'passport-jwt';

const databaseName = `test_auth_${randomUUID().replaceAll('-', '')}`;
const jwtSecret = randomBytes(32).toString('hex');
const invalidCredentials = 'Credenciales inv\u00e1lidas';
const duplicateEmail = 'El email ya est\u00e1 registrado';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = jwtSecret;
process.env.JWT_EXPIRES_IN = '1h';

const { default: app } = await import('../src/app.js');
const { env } = await import('../src/config/env.config.js');
const { default: User } = await import('../src/models/User.js');

let server;
let baseUrl;

const userData = {
  first_name: 'Ana',
  last_name: 'Perez',
  email: 'ana@mail.com',
  password: 'Secreta123'
};

const request = async (method, path, { body, cookie } = {}) => {
  const headers = {};

  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (cookie) headers.Cookie = cookie;

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  return {
    status: response.status,
    body: await response.json(),
    setCookie: response.headers.get('set-cookie')
  };
};

const register = (overrides = {}) => request('POST', '/api/sessions/register', {
  body: { ...userData, ...overrides }
});

const login = (overrides = {}) => request('POST', '/api/sessions/login', {
  body: { email: userData.email, password: userData.password, ...overrides }
});

const createSession = async (role = 'user') => {
  const registration = await register();
  assert.equal(registration.status, 201);

  if (role !== 'user') {
    await User.findByIdAndUpdate(registration.body.payload.id, { role });
  }

  const response = await login();
  assert.equal(response.status, 200);

  return {
    user: { ...registration.body.payload, role },
    cookie: response.setCookie.split(';')[0]
  };
};

const assertError = (response, status, message) => {
  assert.equal(response.status, status);
  assert.deepEqual(response.body, { status: 'error', message });
};

describe('Autenticacion con Passport', () => {
  before(async () => {
    // Override the database name so tests never use the application's database.
    await mongoose.connect(process.env.TEST_MONGO_URL || env.mongoUrl, {
      dbName: databaseName,
      serverSelectionTimeoutMS: 10000
    });
    await User.init();

    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  beforeEach(async () => {
    assert.equal(mongoose.connection.name, databaseName);
    await User.deleteMany({});
  });

  after(async () => {
    try {
      if (server) {
        await new Promise((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        });
      }

      if (mongoose.connection.readyState === 1) {
        assert.match(databaseName, /^test_auth_[a-f0-9]{32}$/);
        assert.equal(mongoose.connection.name, databaseName);
        await mongoose.connection.dropDatabase();
      }
    } finally {
      await mongoose.disconnect();
    }
  });

  it('usa LocalStrategy para register/login y JwtStrategy para current', () => {
    assert.ok(passport._strategy('register') instanceof LocalStrategy);
    assert.ok(passport._strategy('login') instanceof LocalStrategy);
    assert.ok(passport._strategy('current') instanceof JwtStrategy);
  });

  it('registra, normaliza el email y guarda un hash sin devolver password', async () => {
    const response = await register({
      first_name: ' Ana ',
      last_name: ' Perez ',
      email: ' Ana@Mail.com '
    });

    assert.equal(response.status, 201);
    assert.deepEqual(response.body, {
      status: 'success',
      payload: {
        id: response.body.payload.id,
        first_name: 'Ana',
        last_name: 'Perez',
        email: 'ana@mail.com',
        role: 'user'
      }
    });

    const storedUser = await User.findById(response.body.payload.id);
    assert.equal(storedUser.email, 'ana@mail.com');
    assert.notEqual(storedUser.password, userData.password);
    assert.equal(await bcrypt.compare(userData.password, storedUser.password), true);
  });

  it('ignora admin y organizer enviados desde el registro publico', async () => {
    for (const role of ['admin', 'organizer']) {
      const response = await register({ email: `${role}@mail.com`, role });
      assert.equal(response.status, 201);
      assert.equal(response.body.payload.role, 'user');
      assert.equal((await User.findById(response.body.payload.id)).role, 'user');
    }
  });

  it('mantiene 400 y el mensaje original para campos faltantes o vacios', async () => {
    for (const field of Object.keys(userData)) {
      for (const value of [undefined, '   ', 123]) {
        const response = await register({ [field]: value });
        assertError(response, 400, 'Faltan campos obligatorios');
      }
    }
    assert.equal(await User.countDocuments(), 0);
  });

  it('rechaza un email invalido y una contrasena corta', async () => {
    assertError(await register({ email: 'correo-invalido' }), 400, 'Formato de email invalido');
    assertError(
      await register({ password: '1234567' }),
      400,
      'La contrasena debe tener al menos 8 caracteres'
    );
    assert.equal(await User.countDocuments(), 0);
  });

  it('rechaza emails duplicados despues de normalizarlos', async () => {
    assert.equal((await register()).status, 201);
    assertError(await register({ email: ' ANA@MAIL.COM ' }), 409, duplicateEmail);
    assert.equal(await User.countDocuments(), 1);
  });

  it('evita duplicados incluso con dos registros simultaneos', async () => {
    const responses = await Promise.all([register(), register()]);
    assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
    assertError(responses.find((response) => response.status === 409), 409, duplicateEmail);
    assert.equal(await User.countDocuments(), 1);
  });

  it('mantiene el login, la cookie HttpOnly y un JWT sin password', async () => {
    const registration = await register();
    const response = await login({ email: ' ANA@MAIL.COM ' });
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: 'success', message: 'Login correcto' });
    assert.match(response.setCookie, /^currentUser=/);
    assert.match(response.setCookie, /; HttpOnly/i);

    const token = response.setCookie.split(';')[0].slice('currentUser='.length);
    const payload = jwt.verify(token, jwtSecret);
    assert.deepEqual(Object.keys(payload).sort(), ['email', 'exp', 'iat', 'id', 'role']);
    assert.equal(payload.id, registration.body.payload.id);
    assert.equal(payload.email, userData.email);
    assert.equal(payload.role, 'user');
  });

  it('responde 401 generico para credenciales incorrectas o faltantes', async () => {
    await register();

    for (const overrides of [
      { email: 'otro@mail.com' },
      { password: 'Incorrecta123' },
      { email: undefined },
      { password: undefined },
      { email: '   ' },
      { password: '   ' },
      { email: 123 },
      { password: 123 }
    ]) {
      assertError(await login(overrides), 401, invalidCredentials);
    }
  });

  it('no acepta credenciales de la URL en lugar del body', async () => {
    await register();
    const query = new URLSearchParams({ email: userData.email, password: userData.password });

    assertError(
      await request('POST', `/api/sessions/login?${query}`, { body: {} }),
      401,
      invalidCredentials
    );
    assertError(
      await request('POST', `/api/sessions/register?${query}`, {
        body: { first_name: 'Ana', last_name: 'Perez' }
      }),
      400,
      'Faltan campos obligatorios'
    );
  });

  it('current devuelve solamente id, email y role con una cookie valida', async () => {
    const session = await createSession();
    const response = await request('GET', '/api/sessions/current', session);
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      status: 'success',
      payload: { id: session.user.id, email: userData.email, role: 'user' }
    });
  });

  it('current responde 401 sin cookie, con cookie vacia o con otro nombre', async () => {
    for (const cookie of [undefined, 'currentUser=', 'otraCookie=valor']) {
      assertError(await request('GET', '/api/sessions/current', { cookie }), 401, 'No autenticado');
    }
  });

  it('current rechaza un token vencido sin exponer errores de JWT', async () => {
    const session = await createSession();
    const token = jwt.sign({ id: session.user.id, email: userData.email, role: 'user' }, jwtSecret, {
      expiresIn: -1
    });
    assertError(
      await request('GET', '/api/sessions/current', { cookie: `currentUser=${token}` }),
      401,
      'No autenticado'
    );
  });

  it('current rechaza tokens manipulados, malformados o firmados con otra clave', async () => {
    const session = await createSession();
    const originalToken = session.cookie.slice('currentUser='.length);
    const parts = originalToken.split('.');
    parts[1] = Buffer.from(JSON.stringify({
      ...jwt.decode(originalToken),
      role: 'admin'
    })).toString('base64url');

    const wrongSignature = jwt.sign({ id: session.user.id, role: 'admin' }, 'otra-clave');

    for (const token of [parts.join('.'), 'no-es-un-jwt', wrongSignature]) {
      assertError(
        await request('GET', '/api/sessions/current', { cookie: `currentUser=${token}` }),
        401,
        'No autenticado'
      );
    }
  });

  it('logout elimina la cookie y current pasa a responder 401', async () => {
    const session = await createSession();
    const response = await request('POST', '/api/sessions/logout', session);
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: 'success', message: 'Sesi\u00f3n cerrada' });
    assert.match(response.setCookie, /^currentUser=;/);
    assert.match(response.setCookie, /Expires=Thu, 01 Jan 1970/i);

    assertError(
      await request('GET', '/api/sessions/current', { cookie: response.setCookie.split(';')[0] }),
      401,
      'No autenticado'
    );
  });

  it('logout sigue siendo publico y no requiere Passport', async () => {
    assert.equal((await request('POST', '/api/sessions/logout')).status, 200);
  });

  it('las rutas privadas siguen respondiendo 401 sin sesion', async () => {
    for (const [method, path] of [
      ['POST', '/api/events'],
      ['GET', '/api/users'],
      ['GET', '/api/tickets/my-tickets']
    ]) {
      assertError(await request(method, path), 401, 'No autenticado');
    }
  });

  it('conserva 403 para user/organizer y permite la ruta administrativa a admin', async () => {
    const session = await createSession();
    const forbidden = 'No ten\u00e9s permisos para realizar esta acci\u00f3n';
    assertError(await request('POST', '/api/events', session), 403, forbidden);
    assertError(await request('GET', '/api/users', session), 403, forbidden);

    for (const role of ['organizer', 'admin']) {
      await User.findByIdAndUpdate(session.user.id, { role });
      const response = await login();
      const cookie = response.setCookie.split(';')[0];
      const users = await request('GET', '/api/users', { cookie });

      if (role === 'organizer') {
        assertError(users, 403, forbidden);
      } else {
        assert.equal(users.status, 200);
        assert.equal(users.body.payload[0].role, 'admin');
        assert.equal('password' in users.body.payload[0], false);
      }
    }
  });

  it('la estrategia current tambien autentica la consulta de tickets propios', async () => {
    const session = await createSession();
    const response = await request('GET', '/api/tickets/my-tickets', session);
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: 'success', payload: [] });
  });
});
