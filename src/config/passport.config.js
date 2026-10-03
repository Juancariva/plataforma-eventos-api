import passport from 'passport';
import { usersRepository } from '../repositories/users.repository.js';
import { createHash, isValidPassword } from '../utils/hash.js';
import { verifyToken } from '../utils/jwt.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isEmptyString = (value) => (
  typeof value !== 'string' || value.trim().length === 0
);

const userResponse = (user) => ({
  id: user._id.toString(),
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  role: user.role
});

class RequestStrategy {
  constructor(name, verify) {
    this.name = name;
    this.verify = verify;
  }

  async authenticate(req) {
    try {
      const user = await this.verify(req);
      this.success(user);
    } catch (error) {
      if (error.statusCode && error.statusCode < 500) {
        this.fail({
          message: error.message,
          statusCode: error.statusCode
        }, error.statusCode);
        return;
      }

      this.error(error);
    }
  }
}

const registerStrategy = new RequestStrategy('register', async (req) => {
  const {
    first_name,
    last_name,
    email,
    password
  } = req.body || {};

  if (
    isEmptyString(first_name)
    || isEmptyString(last_name)
    || isEmptyString(email)
    || isEmptyString(password)
  ) {
    throw createError('Faltan campos obligatorios', 400);
  }

  const normalizedFirstName = first_name.trim();
  const normalizedLastName = last_name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!emailRegex.test(normalizedEmail)) {
    throw createError('Formato de email invalido', 400);
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw createError('La contrasena debe tener al menos 8 caracteres', 400);
  }

  const existingUser = await usersRepository.findByEmail(normalizedEmail);

  if (existingUser) {
    throw createError('El email ya está registrado', 409);
  }

  const hashedPassword = await createHash(password);

  try {
    const user = await usersRepository.create({
      first_name: normalizedFirstName,
      last_name: normalizedLastName,
      email: normalizedEmail,
      password: hashedPassword
    });

    return userResponse(user);
  } catch (error) {
    if (error.code === 11000) {
      throw createError('El email ya está registrado', 409);
    }

    throw error;
  }
});

const loginStrategy = new RequestStrategy('login', async (req) => {
  const { email, password } = req.body || {};

  if (isEmptyString(email) || isEmptyString(password)) {
    throw createError('Credenciales inválidas', 401);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await usersRepository.findByEmail(normalizedEmail);

  if (!user) {
    throw createError('Credenciales inválidas', 401);
  }

  const validPassword = await isValidPassword(password, user.password);

  if (!validPassword) {
    throw createError('Credenciales inválidas', 401);
  }

  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role
  };
});

const currentStrategy = new RequestStrategy('current', async (req) => {
  const token = req.cookies.currentUser;

  if (!token) {
    throw createError('No autenticado', 401);
  }

  try {
    const payload = verifyToken(token);

    return {
      id: payload.id,
      email: payload.email,
      role: payload.role
    };
  } catch (error) {
    throw createError('No autenticado', 401);
  }
});

export const initializePassport = () => {
  passport.use('register', registerStrategy);
  passport.use('login', loginStrategy);
  passport.use('current', currentStrategy);
};
