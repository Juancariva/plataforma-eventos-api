import { usersRepository } from '../repositories/users.repository.js';
import UserDTO from '../dto/UserDTO.js';
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

export const usersService = {
  register: async (userData = {}) => {
    const { first_name, last_name, email, password } = userData;

    if ([first_name, last_name, email, password].some(isEmptyString)) {
      throw createError('Faltan campos obligatorios', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      throw createError('Formato de email invalido', 400);
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw createError('La contrasena debe tener al menos 8 caracteres', 400);
    }

    if (await usersRepository.findByEmail(normalizedEmail)) {
      throw createError('El email ya est\u00e1 registrado', 409);
    }

    const hashedPassword = await createHash(password);

    try {
      return await usersRepository.create({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: normalizedEmail,
        password: hashedPassword
      });
    } catch (error) {
      if (error.code === 11000) {
        throw createError('El email ya est\u00e1 registrado', 409);
      }

      throw error;
    }
  },
  authenticate: async (userData = {}) => {
    const { email, password } = userData;

    if (isEmptyString(email) || isEmptyString(password)) {
      throw createError('Credenciales inv\u00e1lidas', 401);
    }

    const credentials = await usersRepository.findCredentialsByEmail(email.trim().toLowerCase());

    if (!credentials || !await isValidPassword(password, credentials.passwordHash)) {
      throw createError('Credenciales inv\u00e1lidas', 401);
    }

    return credentials.user;
  },
  getCurrent: (user) => UserDTO.toAuthenticatedResponse(user),
  getAll: async () => usersRepository.getAll()
};
