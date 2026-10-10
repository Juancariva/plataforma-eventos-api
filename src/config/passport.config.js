import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { env } from './env.config.js';
import { usersService } from '../services/users.service.js';
import { createHash, isValidPassword } from '../utils/hash.js';

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

const handleStrategyError = (error, done) => {
  if (error.statusCode && error.statusCode < 500) {
    return done(null, false, {
      message: error.message,
      statusCode: error.statusCode
    });
  }

  return done(error);
};

const localOptions = {
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
};

const registerStrategy = new LocalStrategy(localOptions, async (req, email, password, done) => {
  try {
    const {
      first_name,
      last_name
    } = req.body || {};

    if (
      isEmptyString(first_name)
      || isEmptyString(last_name)
      || isEmptyString(req.body?.email)
      || isEmptyString(req.body?.password)
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

    const existingUser = await usersService.findByEmail(normalizedEmail);

    if (existingUser) {
      throw createError('El email ya está registrado', 409);
    }

    const hashedPassword = await createHash(password);

    const user = await usersService.create({
      first_name: normalizedFirstName,
      last_name: normalizedLastName,
      email: normalizedEmail,
      password: hashedPassword
    });

    return done(null, userResponse(user));
  } catch (error) {
    if (error.code === 11000) {
      return handleStrategyError(createError('El email ya está registrado', 409), done);
    }

    return handleStrategyError(error, done);
  }
});

const loginStrategy = new LocalStrategy(localOptions, async (req, email, password, done) => {
  try {
    // passport-local also reads the query string; credentials must stay in the body.
    if (isEmptyString(req.body?.email) || isEmptyString(req.body?.password)) {
      throw createError('Credenciales inválidas', 401);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await usersService.findByEmail(normalizedEmail);

    if (!user) {
      throw createError('Credenciales inválidas', 401);
    }

    const validPassword = await isValidPassword(password, user.password);

    if (!validPassword) {
      throw createError('Credenciales inválidas', 401);
    }

    return done(null, {
      id: user._id.toString(),
      email: user.email,
      role: user.role
    });
  } catch (error) {
    return handleStrategyError(error, done);
  }
});

const currentStrategy = new JwtStrategy({
  jwtFromRequest: (req) => req.cookies?.currentUser || null,
  secretOrKey: env.jwtSecret
}, (payload, done) => (
  done(null, {
    id: payload.id,
    email: payload.email,
    role: payload.role
  })
));

export const initializePassport = () => {
  passport.use('register', registerStrategy);
  passport.use('login', loginStrategy);
  passport.use('current', currentStrategy);
};
